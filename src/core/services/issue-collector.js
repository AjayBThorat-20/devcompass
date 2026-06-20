// src/core/services/issue-collector.js

const { createIssue } = require('../models/issue.model');

class IssueCollector {
  constructor() { this.issues = []; }

  addCVEIssues(cveData) {
    if (!Array.isArray(cveData)) return;
    cveData.forEach(vuln => {
      this.issues.push(createIssue({
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
      }));
    });
  }

  addLicenseIssues(licenseData) {
    if (!Array.isArray(licenseData)) return;
    licenseData.forEach(license => {
      if (license.riskLevel === 'low') return;
      this.issues.push(createIssue({
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
      }));
    });
  }

  addQualityIssues(qualityData) {
    if (!Array.isArray(qualityData)) return;
    qualityData.forEach(pkg => {
      if (pkg.status === 'healthy') return;
      this.issues.push(createIssue({
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
      }));
    });
  }

  addSecurityIssues(securityData) {
    if (!securityData) return;
    const warnings = Array.isArray(securityData) ? securityData : (securityData.warnings || []);
    warnings.filter(w => w.type === 'typosquatting').forEach(typo => {
      this.issues.push(createIssue({
        name: typo.package,
        version: typo.version || 'unknown',
        type: 'security',
        severity: 'HIGH',
        score: 8,
        message: 'Possible typosquatting',
        risk: typo.warning || `Similar to ${typo.similarTo || typo.correctPackage}`,
        fix: (typo.similarTo || typo.correctPackage) ? `Replace with ${typo.similarTo || typo.correctPackage}` : 'Remove package',
        safeFix: false,
        source: 'Typosquat',
        metadata: { similarTo: typo.similarTo || typo.correctPackage, distance: typo.distance }
      }));
    });
  }

  addOutdatedIssues(outdatedData) {
    if (!Array.isArray(outdatedData)) return;
    outdatedData.forEach(pkg => {
      this.issues.push(createIssue({
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
      }));
    });
  }

  addUnusedIssues(unusedData) {
    if (!Array.isArray(unusedData)) return;
    unusedData.forEach(pkg => {
      const name = typeof pkg === 'string' ? pkg : pkg.name;
      if (!name) return;
      this.issues.push(createIssue({
        name,
        version: 'unknown',
        type: 'unused',
        severity: 'LOW',
        score: 2,
        message: 'Unused dependency',
        risk: 'Package is not being used',
        fix: 'Remove package',
        safeFix: true,
        source: 'Unused',
        metadata: {}
      }));
    });
  }

  getAll() { return this.issues; }
  getByType(type) { return this.issues.filter(issue => issue.type === type); }
  getBySeverity(severity) { return this.issues.filter(issue => issue.severity === severity); }

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

  getLicenseScore(risk) { return risk === 'critical' ? 9 : risk === 'high' ? 7 : 5; }

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
    const currMajor = parseInt((pkg.current || '0').split('.')[0]);
    const latestMajor = parseInt((pkg.latest || '0').split('.')[0]);
    if (latestMajor > currMajor + 1) return 'HIGH';
    if (latestMajor > currMajor) return 'MEDIUM';
    return 'LOW';
  }

  getOutdatedScore(pkg) { const s = this.mapOutdatedSeverity(pkg); return s === 'HIGH' ? 7 : s === 'MEDIUM' ? 5 : 3; }

  getOutdatedRisk(pkg) {
    const currMajor = parseInt((pkg.current || '0').split('.')[0]);
    const latestMajor = parseInt((pkg.latest || '0').split('.')[0]);
    return latestMajor > currMajor ? `Major version behind (${currMajor} → ${latestMajor})` : 'Minor updates available';
  }

  isSafeUpdate(pkg) {
    const current = pkg.current || pkg.version;
    const target = pkg.fixVersion || pkg.latest;
    if (!current || !target) return false;
    const currMajor = parseInt((current || '0').split('.')[0]);
    const targetMajor = parseInt((target || '0').split('.')[0]);
    return currMajor === targetMajor;
  }
}

function createIssueCollector() { return new IssueCollector(); }

module.exports = { IssueCollector, createIssueCollector };