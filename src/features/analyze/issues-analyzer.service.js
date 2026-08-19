// src/features/analyze/issues-analyzer.service.js

const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');

const execAsync = promisify(exec);

class IssuesAnalyzer {
  constructor(options = {}) {
    this.cache = new Map();
    this.auditCache = new Map(); // projectPath -> { timestamp, audit }
    this.cacheTTL = options.cacheTTL || 3600000;
    this.timeout = options.timeout || 10000;
  }

  async getIssues(packageName, version = 'latest', projectPath = process.cwd()) {
    const cacheKey = `${packageName}@${version}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) return cached.issues;
    }

    const issues = [];

    try {
      issues.push(...(await this.getNpmVulnerabilities(packageName, version, projectPath)));
      const registryData = await this.getRegistryMetadata(packageName);
      const deprecation = this.getDeprecationStatus(packageName, registryData);
      if (deprecation) issues.push(deprecation);
      const maintenance = this.getMaintenanceStatus(packageName, registryData);
      if (maintenance) issues.push(maintenance);
    } catch (error) {
      if (process.env.DEBUG) console.error(`[IssuesAnalyzer] Error fetching issues for ${packageName}:`, error.message);
    }

    this.cache.set(cacheKey, { timestamp: Date.now(), issues });
    return issues;
  }

  // `npm audit` reports on the whole project, not a single package — running it
  // once per dependency (this used to happen inside getNpmVulnerabilities) meant
  // a project with N deps ran the exact same expensive, network-touching command
  // N times over. It's now run once per project per cache TTL and looked up by
  // package name from the shared result.
  async getProjectAudit(projectPath) {
    const cached = this.auditCache.get(projectPath);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached.audit;

    let audit = { vulnerabilities: {}, advisories: {} };
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024
      });
      audit = JSON.parse(stdout);
    } catch (error) {
      // npm audit exits non-zero when it finds vulnerabilities — the JSON is still on stdout
      if (typeof error.stdout === 'string' && error.stdout.trim()) {
        try {
          audit = JSON.parse(error.stdout);
        } catch (parseError) {
          // npm audit fails without package-lock.json, that's fine
        }
      }
    }

    this.auditCache.set(projectPath, { timestamp: Date.now(), audit });
    return audit;
  }

  async getNpmVulnerabilities(packageName, version, projectPath = process.cwd()) {
    const issues = [];
    const audit = await this.getProjectAudit(projectPath);

    const vulnerabilities = audit.vulnerabilities || {};
    if (vulnerabilities[packageName]) {
      const vuln = vulnerabilities[packageName];
      issues.push({
        title: `Security vulnerability: ${vuln.severity}`,
        severity: this.mapSeverity(vuln.severity),
        affected: vuln.range || version,
        fix: vuln.fixAvailable ? (typeof vuln.fixAvailable === 'object' ? vuln.fixAvailable.version : 'Update available') : 'No fix available',
        source: 'npm audit',
        via: Array.isArray(vuln.via) ? vuln.via.filter(v => typeof v === 'string').join(', ') : (typeof vuln.via === 'string' ? vuln.via : 'Direct'),
        reported: new Date().toISOString().split('T')[0]
      });
    }

    if (audit.advisories) {
      Object.values(audit.advisories).forEach(advisory => {
        if (advisory.module_name === packageName) {
          issues.push({
            title: advisory.title || 'Security advisory',
            severity: this.mapSeverity(advisory.severity),
            affected: advisory.vulnerable_versions || '*',
            fix: advisory.patched_versions || 'No patch available',
            source: `npm advisory ${advisory.id}`,
            cwe: advisory.cwe,
            url: advisory.url,
            reported: advisory.created || new Date().toISOString().split('T')[0]
          });
        }
      });
    }

    return issues;
  }

  // Deprecation and maintenance status both come from the same npm registry
  // package document — fetched once here and reused, instead of each status
  // check independently re-requesting the identical URL.
  async getRegistryMetadata(packageName) {
    return new Promise((resolve) => {
      const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

      // Node's `timeout` request option only aborts on socket *idle* time; a
      // connection that never establishes (dropped SYN, slow/filtered network)
      // can sit well past it with no error/timeout event ever firing. An
      // explicit hard-deadline abort guarantees the request is actually torn
      // down — not just ignored — so no dangling socket keeps the process
      // alive after the caller has moved on.
      const hardDeadline = setTimeout(() => req.destroy(new Error('hard timeout')), this.timeout);
      const finish = (result) => { clearTimeout(hardDeadline); resolve(result); };

      const req = https.get(url, { timeout: this.timeout }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            finish(JSON.parse(data));
          } catch (e) {
            finish(null);
          }
        });
      });

      req.on('error', () => finish(null));
      req.on('timeout', () => { req.destroy(); finish(null); });
    });
  }

  getDeprecationStatus(packageName, pkg) {
    if (!pkg) return null;
    const latest = pkg['dist-tags']?.latest;
    const latestVersion = pkg.versions?.[latest];

    if (!latestVersion?.deprecated) return null;

    return {
      title: `Package deprecated: ${latestVersion.deprecated}`,
      severity: 'high',
      affected: '*',
      fix: this.extractAlternative(latestVersion.deprecated),
      source: 'npm registry',
      reported: pkg.time?.[latest] || new Date().toISOString().split('T')[0]
    };
  }

  getMaintenanceStatus(packageName, pkg) {
    if (!pkg) return null;
    const latest = pkg['dist-tags']?.latest;
    const lastPublish = pkg.time?.[latest];
    if (!lastPublish) return null;

    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate <= 730) return null;

    return {
      title: `Package may be unmaintained (${Math.floor(daysSinceUpdate / 365)} years since last update)`,
      severity: 'low',
      affected: '*',
      fix: 'Consider alternatives if actively maintained options exist',
      source: 'npm registry',
      lastUpdate: lastPublish,
      daysSinceUpdate
    };
  }

  async getBatchIssues(packages, projectPath = process.cwd()) {
    const results = new Map();
    if (!Array.isArray(packages)) return results;

    // Warm the shared project-wide audit cache before fanning out, so the
    // first chunk's concurrent packages don't all race to run `npm audit` themselves.
    await this.getProjectAudit(projectPath);

    const concurrency = 5;
    const chunks = [];
    for (let i = 0; i < packages.length; i += concurrency) {
      chunks.push(packages.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (pkg) => ({ name: pkg.name, issues: await this.getIssues(pkg.name, pkg.version, projectPath) }))
      );
      chunkResults.forEach(({ name, issues }) => { if (issues.length > 0) results.set(name, issues); });
    }

    return results;
  }

  mapSeverity(npmSeverity) {
    const map = { critical: 'critical', high: 'high', moderate: 'medium', medium: 'medium', low: 'low', info: 'info' };
    return map[npmSeverity?.toLowerCase()] || 'medium';
  }

  extractAlternative(message) {
    if (!message) return 'Find an alternative';

    const patterns = [
      /use\s+([a-z0-9-_@/]+)\s+instead/i,
      /switch\s+to\s+([a-z0-9-_@/]+)/i,
      /replaced\s+by\s+([a-z0-9-_@/]+)/i,
      /migrate\s+to\s+([a-z0-9-_@/]+)/i,
      /try\s+([a-z0-9-_@/]+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return `Use ${match[1]} instead`;
    }

    return message.length > 100 ? message.substring(0, 100) + '...' : message;
  }

  clearCache() { this.cache.clear(); this.auditCache.clear(); }
}

let instance = null;
function getIssuesAnalyzer(options) {
  if (!instance) instance = new IssuesAnalyzer(options);
  return instance;
}

module.exports = { IssuesAnalyzer, getIssuesAnalyzer };