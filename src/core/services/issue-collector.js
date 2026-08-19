// src/core/services/issue-collector.js

const { createIssue } = require('../models/issue.model');

const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

class IssueCollector {
  constructor() {
    this.pending = [];
  }

  addCVEIssues(cveData) {
    if (!Array.isArray(cveData)) return;
    cveData.forEach(vuln => {
      this.pending.push({
        name: vuln.package || vuln.name,
        version: vuln.version,
        type: 'security',
        severity: this.mapCVESeverity(vuln.severity),
        score: vuln.cvss || vuln.score || 0,
        message: vuln.summary || vuln.title || 'Security vulnerability',
        risk: vuln.risk || vuln.description,
        fix: vuln.fixVersion ? `Update to ${vuln.fixVersion}` : 'Update to latest',
        safeFix: this.isSafeUpdate(vuln),
        source: vuln.source || 'CVE',
        metadata: { cve: vuln.id || vuln.cve, cvss: vuln.cvss, references: vuln.references }
      });
    });
  }

  addLicenseIssues(licenseData) {
    if (!Array.isArray(licenseData)) return;
    licenseData.forEach(license => {
      if (license.riskLevel === 'low' || license.riskLevel === 'unknown') return;
      this.pending.push({
        name: license.package,
        version: license.version,
        type: 'license',
        severity: this.mapLicenseRisk(license.riskLevel),
        score: this.getLicenseScore(license.riskLevel),
        message: `${license.license} license`,
        risk: license.risk,
        fix: license.alternative ? `Replace with ${license.alternative.replacement}` : 'Review license',
        safeFix: !!license.alternative,
        source: 'License',
        metadata: { license: license.license, alternative: license.alternative }
      });
    });
  }

  addQualityIssues(qualityData) {
    if (!Array.isArray(qualityData)) return;
    qualityData.forEach(pkg => {
      if (pkg.status === 'healthy') return;
      this.pending.push({
        name: pkg.package,
        version: pkg.version,
        type: 'quality',
        severity: this.mapQualitySeverity(pkg.status),
        score: 10 - (pkg.healthScore || 5),
        message: this.getQualityMessage(pkg.status),
        risk: pkg.deprecated ? 'Package is deprecated' : `Last updated ${pkg.ageMonths} months ago`,
        fix: pkg.alternative ? `Replace with ${pkg.alternative.replacement}` : 'Find alternative',
        safeFix: false,
        source: 'Quality',
        metadata: { status: pkg.status, lastUpdate: pkg.lastUpdate, ageMonths: pkg.ageMonths, alternative: pkg.alternative }
      });
    });
  }

  addSecurityIssues(securityData) {
    if (!securityData) return;
    const warnings = Array.isArray(securityData) ? securityData : (securityData.warnings || []);

    warnings.forEach(w => {
      if (w.type === 'typosquatting') {
        this.pending.push({
          name: w.package,
          version: w.version,
          type: 'security',
          severity: 'HIGH',
          score: 8,
          message: 'Possible typosquatting',
          risk: w.warning || w.description || `Similar to ${w.similarTo || w.correctPackage}`,
          fix: (w.similarTo || w.correctPackage) ? `Replace with ${w.similarTo || w.correctPackage}` : 'Remove package',
          safeFix: false,
          source: 'Typosquat',
          metadata: { similarTo: w.similarTo || w.correctPackage, distance: w.distance }
        });
      } else if (w.type === 'install_script') {
        this.pending.push({
          name: w.package,
          version: w.version,
          type: 'security',
          severity: this.mapCVESeverity(w.severity),
          score: 6,
          message: 'Suspicious install script detected',
          risk: w.description || w.reason,
          fix: 'Review the script manually before installing',
          safeFix: false,
          source: 'InstallScript',
          metadata: {}
        });
      } else if (w.type === 'vulnerability') {
        this.pending.push({
          name: w.package,
          version: w.version,
          type: 'security',
          severity: this.mapCVESeverity(w.severity),
          score: 7,
          message: w.description || 'Security vulnerability',
          risk: w.risk,
          fix: 'Run npm audit fix',
          safeFix: !!w.autoFixable,
          source: 'NpmAudit',
          metadata: { url: w.url, range: w.range }
        });
      }
    });
  }

  addOutdatedIssues(outdatedData) {
    if (!Array.isArray(outdatedData)) return;
    outdatedData.forEach(pkg => {
      this.pending.push({
        name: pkg.name,
        version: pkg.current,
        type: 'outdated',
        severity: this.mapOutdatedSeverity(pkg),
        score: this.getOutdatedScore(pkg),
        message: `Outdated: ${pkg.current} → ${pkg.latest}`,
        risk: this.getOutdatedRisk(pkg),
        fix: `Update to ${pkg.latest}`,
        safeFix: this.isSafeUpdate(pkg),
        source: 'NPM',
        metadata: { current: pkg.current, latest: pkg.latest, wanted: pkg.wanted, updateType: pkg.updateType }
      });
    });
  }

  addUnusedIssues(unusedData) {
    if (!Array.isArray(unusedData)) return;
    unusedData.forEach(pkg => {
      const name = typeof pkg === 'string' ? pkg : pkg.name;
      if (!name) return;
      this.pending.push({
        name,
        version: null,
        type: 'unused',
        severity: 'LOW',
        score: 2,
        message: 'Unused dependency',
        risk: 'Package is not being used',
        fix: 'Remove package',
        safeFix: true,
        source: 'Unused',
        metadata: {}
      });
    });
  }

  addEcosystemIssues(ecosystemData) {
    if (!Array.isArray(ecosystemData)) return;
    ecosystemData.forEach(alert => {
      this.pending.push({
        name: alert.package,
        version: alert.affected !== '*' ? alert.affected : null,
        type: 'quality',
        severity: this.mapCVESeverity(alert.severity),
        score: 6,
        message: alert.title || 'Known package issue',
        risk: alert.title,
        fix: alert.fix && alert.fix !== 'No fix available' ? `Update to ${alert.fix}` : 'Review manually',
        safeFix: !!(alert.fix && alert.fix !== 'No fix available'),
        source: alert.source || 'Ecosystem',
        metadata: { type: alert.type }
      });
    });
  }

  addPredictiveIssues(predictiveData) {
    if (!Array.isArray(predictiveData)) return;
    predictiveData.forEach(warning => {
      this.pending.push({
        name: warning.package,
        version: null,
        type: 'quality',
        severity: this.mapCVESeverity(warning.severity),
        score: 3,
        message: warning.title || 'Predictive warning',
        risk: warning.description,
        fix: warning.recommendation || 'Monitor for stability',
        safeFix: false,
        source: 'Predictive',
        metadata: { repoUrl: warning.data?.repoUrl, trend: warning.data?.trend }
      });
    });
  }

  getAll() {
    return this.mergeByPackage(this.pending).map(entry => createIssue(entry));
  }

  getByType(type) {
    return this.getAll().filter(issue => issue.type === type);
  }

  getBySeverity(severity) {
    return this.getAll().filter(issue => issue.severity === severity);
  }

  mergeByPackage(entries) {
    const groups = new Map();

    for (const entry of entries) {
      if (!entry || !entry.name) continue;

      const key = entry.name;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(entry);
    }

    const merged = [];

    for (const [name, group] of groups.entries()) {
      if (group.length === 1) {
        merged.push(this.finalizeEntry(group[0]));
        continue;
      }

      const groupResults = this.mergeGroup(name, group);
      for (const result of groupResults) {
        merged.push(result);
      }
    }

    return merged;
  }

  mergeGroup(name, group) {
    const resolvedVersion = this.resolveVersion(group);

    const byType = new Map();
    for (const entry of group) {
      if (!byType.has(entry.type)) byType.set(entry.type, []);
      byType.get(entry.type).push(entry);
    }

    const results = [];

    for (const [type, entries] of byType.entries()) {
      if (entries.length === 1) {
        results.push(this.finalizeEntry({ ...entries[0], version: entries[0].version || resolvedVersion }));
      } else if (type === 'security') {
        results.push(this.mergeSecurityEntries(name, resolvedVersion, entries));
      } else {
        results.push(this.mergeDuplicateEntries(name, resolvedVersion, entries));
      }
    }

    return results;
  }

  mergeSecurityEntries(name, version, entries) {
    let best = entries[0];
    let bestRank = SEVERITY_RANK[best.severity] || 0;
    const sources = new Set();
    const fixes = new Set();
    let advisoryCount = 0;

    for (const entry of entries) {
      if (entry.source) sources.add(entry.source);
      if (entry.fix) fixes.add(entry.fix);
      if (entry.metadata && entry.metadata.cve) advisoryCount++;

      const rank = SEVERITY_RANK[entry.severity] || 0;
      if (rank > bestRank) {
        best = entry;
        bestRank = rank;
      }
    }

    const fixList = Array.from(fixes);
    const preferredFix = fixList.find(f => f.toLowerCase().startsWith('update to') && f.toLowerCase() !== 'update to latest')
      || fixList.find(f => f.toLowerCase().startsWith('replace with'))
      || best.fix
      || 'Run npm audit fix';

    const sourceList = Array.from(sources);
    const message = entries.length > 1
      ? `Security vulnerability detected (confirmed by ${sourceList.join(' + ')})`
      : (best.message || 'Security vulnerability detected');

    return this.finalizeEntry({
      name,
      version,
      type: 'security',
      severity: best.severity,
      score: best.score,
      message,
      risk: best.risk || `${best.severity} security vulnerability`,
      fix: preferredFix,
      safeFix: entries.some(e => e.safeFix),
      source: sourceList.join('+') || 'Security',
      metadata: best.metadata || {}
    });
  }

  mergeDuplicateEntries(name, version, entries) {
    let best = entries[0];
    let bestRank = SEVERITY_RANK[best.severity] || 0;
    const sources = new Set();

    for (const entry of entries) {
      if (entry.source) sources.add(entry.source);
      const rank = SEVERITY_RANK[entry.severity] || 0;
      if (rank > bestRank) {
        best = entry;
        bestRank = rank;
      }
    }

    return this.finalizeEntry({
      ...best,
      name,
      version,
      source: Array.from(sources).join('+') || best.source
    });
  }

  resolveVersion(group) {
    for (const entry of group) {
      if (entry.version && entry.version !== 'unknown' && entry.version !== '*') {
        return entry.version;
      }
    }
    return 'unknown';
  }

  finalizeEntry(entry) {
    return {
      ...entry,
      version: entry.version || 'unknown'
    };
  }

  mapCVESeverity(severity) {
    if (!severity) return 'MEDIUM';
    const s = severity.toLowerCase();
    if (s === 'critical') return 'CRITICAL';
    if (s === 'high') return 'HIGH';
    if (s === 'medium' || s === 'moderate') return 'MEDIUM';
    return 'LOW';
  }

  mapLicenseRisk(risk) {
    if (risk === 'critical') return 'CRITICAL';
    if (risk === 'high') return 'HIGH';
    return 'MEDIUM';
  }

  getLicenseScore(risk) {
    return risk === 'critical' ? 9 : risk === 'high' ? 7 : 5;
  }

  mapQualitySeverity(status) {
    if (status === 'deprecated' || status === 'abandoned') return 'HIGH';
    if (status === 'stale') return 'MEDIUM';
    return 'LOW';
  }

  getQualityMessage(status) {
    return { deprecated: 'Package is deprecated', abandoned: 'Package is abandoned', stale: 'Package is stale' }[status] || 'Quality issue';
  }

  mapOutdatedSeverity(pkg) {
    if (!pkg.current || !pkg.latest) return 'LOW';
    const currMajor = parseInt(String(pkg.current).split('.')[0], 10);
    const latestMajor = parseInt(String(pkg.latest).split('.')[0], 10);
    if (isNaN(currMajor) || isNaN(latestMajor)) return 'LOW';
    if (latestMajor > currMajor + 1) return 'HIGH';
    if (latestMajor > currMajor) return 'MEDIUM';
    return 'LOW';
  }

  getOutdatedScore(pkg) {
    const s = this.mapOutdatedSeverity(pkg);
    return s === 'HIGH' ? 7 : s === 'MEDIUM' ? 5 : 3;
  }

  getOutdatedRisk(pkg) {
    const currMajor = parseInt(String(pkg.current || '0').split('.')[0], 10);
    const latestMajor = parseInt(String(pkg.latest || '0').split('.')[0], 10);
    if (isNaN(currMajor) || isNaN(latestMajor)) return 'Version comparison unavailable';
    return latestMajor > currMajor ? `Major version behind (${currMajor} → ${latestMajor})` : 'Minor updates available';
  }

  isSafeUpdate(pkg) {
    const current = pkg.current || pkg.version;
    const target = pkg.fixVersion || pkg.latest;
    if (!current || !target) return false;
    const currMajor = parseInt(String(current).split('.')[0], 10);
    const targetMajor = parseInt(String(target).split('.')[0], 10);
    if (isNaN(currMajor) || isNaN(targetMajor)) return false;
    return currMajor === targetMajor;
  }
}

function createIssueCollector() {
  return new IssueCollector();
}

module.exports = { IssueCollector, createIssueCollector };