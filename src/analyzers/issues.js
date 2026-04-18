// src/analyzers/issues.js
// Dynamic issues analyzer - fetches real vulnerability/issue data for ANY package

const { execSync } = require('child_process');
const https = require('https');

/**
 * Fetch issues dynamically for any package
 * Sources: npm audit, GitHub advisories, deprecation warnings
 */
class IssuesAnalyzer {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 3600000; // 1 hour default
    this.timeout = options.timeout || 10000;
  }


  async getIssues(packageName, version = 'latest') {
    const cacheKey = `${packageName}@${version}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.issues;
      }
    }

    const issues = [];

    try {
      // 1. Check npm audit vulnerabilities
      const vulns = await this.getNpmVulnerabilities(packageName, version);
      issues.push(...vulns);

      // 2. Check deprecation status
      const deprecation = await this.getDeprecationStatus(packageName);
      if (deprecation) {
        issues.push(deprecation);
      }

      // 3. Check package age/maintenance status
      const maintenance = await this.getMaintenanceStatus(packageName);
      if (maintenance) {
        issues.push(maintenance);
      }

    } catch (error) {
      // Silently handle errors - don't break analysis
      console.error(`[IssuesAnalyzer] Error fetching issues for ${packageName}:`, error.message);
    }

    // Cache results
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      issues
    });

    return issues;
  }


  async getNpmVulnerabilities(packageName, version) {
    const issues = [];

    try {
      // Use npm audit to check for vulnerabilities
      const auditResult = execSync('npm audit --json 2>/dev/null', {
        encoding: 'utf-8',
        timeout: this.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.vulnerabilities || {};

      // Check if this package has vulnerabilities
      if (vulnerabilities[packageName]) {
        const vuln = vulnerabilities[packageName];
        
        issues.push({
          title: `Security vulnerability: ${vuln.severity}`,
          severity: this.mapSeverity(vuln.severity),
          affected: vuln.range || version,
          fix: vuln.fixAvailable ? 
            (typeof vuln.fixAvailable === 'object' ? vuln.fixAvailable.version : 'Update available') : 
            'No fix available',
          source: 'npm audit',
          via: Array.isArray(vuln.via) ? 
            vuln.via.filter(v => typeof v === 'string').join(', ') : 
            (typeof vuln.via === 'string' ? vuln.via : 'Direct'),
          reported: new Date().toISOString().split('T')[0]
        });
      }

      // Also check advisories in the audit result
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
      // npm audit might fail if no package-lock.json, that's ok
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
            
            // Check for deprecation message
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
              const daysSinceUpdate = Math.floor(
                (Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              // Warn if no updates in 2+ years
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
    
    // Process in parallel with concurrency limit
    const concurrency = 5;
    const chunks = [];
    
    for (let i = 0; i < packages.length; i += concurrency) {
      chunks.push(packages.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (pkg) => {
        const issues = await this.getIssues(pkg.name, pkg.version);
        return { name: pkg.name, issues };
      });

      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ name, issues }) => {
        if (issues.length > 0) {
          results.set(name, issues);
        }
      });
    }

    return results;
  }


  async getIssueSummary(packageName, version) {
    const issues = await this.getIssues(packageName, version);
    
    return {
      hasIssues: issues.length > 0,
      issueCount: issues.length,
      maxSeverity: this.getMaxSeverity(issues),
      isDeprecated: issues.some(i => i.title?.toLowerCase().includes('deprecated')),
      isVulnerable: issues.some(i => i.source?.includes('audit') || i.source?.includes('advisory')),
      isUnmaintained: issues.some(i => i.title?.toLowerCase().includes('unmaintained')),
      issues
    };
  }

  /**
   * Map npm severity to our severity levels
   */
  mapSeverity(npmSeverity) {
    const map = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'medium': 'medium',
      'low': 'low',
      'info': 'info'
    };
    return map[npmSeverity?.toLowerCase()] || 'medium';
  }

  /**
   * Get highest severity from issues list
   */
  getMaxSeverity(issues) {
    const order = ['critical', 'high', 'medium', 'low', 'info'];
    let maxIndex = order.length;
    
    issues.forEach(issue => {
      const index = order.indexOf(issue.severity);
      if (index !== -1 && index < maxIndex) {
        maxIndex = index;
      }
    });
    
    return maxIndex < order.length ? order[maxIndex] : null;
  }

  /**
   * Extract alternative package suggestion from deprecation message
   */
  extractAlternative(message) {
    if (!message) return 'Find an alternative';
    
    // Common patterns: "use X instead", "switch to X", "replaced by X"
    const patterns = [
      /use\s+([a-z0-9-_@/]+)\s+instead/i,
      /switch\s+to\s+([a-z0-9-_@/]+)/i,
      /replaced\s+by\s+([a-z0-9-_@/]+)/i,
      /migrate\s+to\s+([a-z0-9-_@/]+)/i,
      /try\s+([a-z0-9-_@/]+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return `Use ${match[1]} instead`;
      }
    }

    return message.length > 100 ? message.substring(0, 100) + '...' : message;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create IssuesAnalyzer instance
 */
function getIssuesAnalyzer(options) {
  if (!instance) {
    instance = new IssuesAnalyzer(options);
  }
  return instance;
}

/**
 * Quick helper to get issues for a single package
 */
async function getPackageIssues(packageName, version) {
  const analyzer = getIssuesAnalyzer();
  return analyzer.getIssues(packageName, version);
}

/**
 * Quick helper to get issues for multiple packages
 */
async function getBatchPackageIssues(packages) {
  const analyzer = getIssuesAnalyzer();
  return analyzer.getBatchIssues(packages);
}

module.exports = {
  IssuesAnalyzer,
  getIssuesAnalyzer,
  getPackageIssues,
  getBatchPackageIssues
};