// src/features/analyze/issues-analyzer.service.js

const { execSync } = require('child_process');
const https = require('https');

class IssuesAnalyzer {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 3600000;
    this.timeout = options.timeout || 10000;
  }

  async getIssues(packageName, version = 'latest') {
    const cacheKey = `${packageName}@${version}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) return cached.issues;
    }

    const issues = [];

    try {
      issues.push(...(await this.getNpmVulnerabilities(packageName, version)));
      const deprecation = await this.getDeprecationStatus(packageName);
      if (deprecation) issues.push(deprecation);
      const maintenance = await this.getMaintenanceStatus(packageName);
      if (maintenance) issues.push(maintenance);
    } catch (error) {
      if (process.env.DEBUG) console.error(`[IssuesAnalyzer] Error fetching issues for ${packageName}:`, error.message);
    }

    this.cache.set(cacheKey, { timestamp: Date.now(), issues });
    return issues;
  }

  async getNpmVulnerabilities(packageName, version) {
    const issues = [];

    try {
      const auditResult = execSync('npm audit --json 2>/dev/null', {
        encoding: 'utf-8',
        timeout: this.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const audit = JSON.parse(auditResult);
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
    } catch (error) {
      // npm audit fails without package-lock.json, that's fine
    }

    return issues;
  }

  async getDeprecationStatus(packageName) {
    return new Promise((resolve) => {
      const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

      const req = https.get(url, { timeout: this.timeout }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const pkg = JSON.parse(data);
            const latest = pkg['dist-tags']?.latest;
            const latestVersion = pkg.versions?.[latest];

            if (latestVersion?.deprecated) {
              resolve({
                title: `Package deprecated: ${latestVersion.deprecated}`,
                severity: 'high',
                affected: '*',
                fix: this.extractAlternative(latestVersion.deprecated),
                source: 'npm registry',
                reported: pkg.time?.[latest] || new Date().toISOString().split('T')[0]
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });
  }

  async getMaintenanceStatus(packageName) {
    return new Promise((resolve) => {
      const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

      const req = https.get(url, { timeout: this.timeout }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const pkg = JSON.parse(data);
            const latest = pkg['dist-tags']?.latest;
            const lastPublish = pkg.time?.[latest];

            if (lastPublish) {
              const daysSinceUpdate = Math.floor((Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24));

              if (daysSinceUpdate > 730) {
                resolve({
                  title: `Package may be unmaintained (${Math.floor(daysSinceUpdate / 365)} years since last update)`,
                  severity: 'low',
                  affected: '*',
                  fix: 'Consider alternatives if actively maintained options exist',
                  source: 'npm registry',
                  lastUpdate: lastPublish,
                  daysSinceUpdate
                });
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });
  }

  async getBatchIssues(packages) {
    const results = new Map();
    if (!Array.isArray(packages)) return results;

    const concurrency = 5;
    const chunks = [];
    for (let i = 0; i < packages.length; i += concurrency) {
      chunks.push(packages.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (pkg) => ({ name: pkg.name, issues: await this.getIssues(pkg.name, pkg.version) }))
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

  clearCache() { this.cache.clear(); }
}

let instance = null;
function getIssuesAnalyzer(options) {
  if (!instance) instance = new IssuesAnalyzer(options);
  return instance;
}

module.exports = { IssuesAnalyzer, getIssuesAnalyzer };