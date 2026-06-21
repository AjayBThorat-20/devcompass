// src/features/quality/dynamic-license.service.js

const path = require('path');
const fs = require('fs');
const registryClient = require('../../shared/services/registry-client');

const LICENSE_RISKS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/license-risks.json'), 'utf8')
);

const GPL_ALTERNATIVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/gpl-alternatives.json'), 'utf8')
);

async function analyzePackage(packageName, installedVersion = null) {
  const packageData = await registryClient.fetchPackage(packageName);
  if (!packageData) return null;
  return analyzePackageData(packageData, installedVersion);
}

function analyzePackageData(packageData, installedVersion = null) {
  try {
    if (!packageData || !packageData.name) return null;

    const packageName = packageData.name;
    const license = packageData.license || 'Unknown';
    const normalizedLicense = normalizeLicense(license);
    const riskInfo = LICENSE_RISKS[normalizedLicense] || {
      level: 'unknown',
      risk: 'License terms unclear'
    };

    const resolvedVersion = installedVersion && installedVersion !== 'unknown'
      ? installedVersion
      : (packageData.version || 'unknown');

    return {
      package: packageName,
      version: resolvedVersion,
      license: normalizedLicense,
      riskLevel: riskInfo.level,
      risk: riskInfo.risk,
      isGPL: normalizedLicense.includes('GPL'),
      isPermissive: riskInfo.level === 'low',
      alternative: riskInfo.level === 'low' || riskInfo.level === 'unknown' ? null : (GPL_ALTERNATIVES[packageName] || null)
    };
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-license] analyzePackageData failed:', error.message);
    return null;
  }
}

async function analyzeBatch(packages) {
  if (!Array.isArray(packages)) return [];

  const packageArray = packages.map(p => (typeof p === 'string' ? { name: p } : p)).filter(p => p && p.name);
  const packageNames = packageArray.map(p => p.name);

  if (packageNames.length === 0) return [];

  const packageDataMap = await registryClient.fetchBatch(packageNames);
  const results = [];

  for (const pkg of packageArray) {
    const data = packageDataMap.get(pkg.name);
    if (!data) continue;
    const analysis = analyzePackageData(data, pkg.version);
    if (analysis) results.push(analysis);
  }

  return results;
}

function getLicenseConflicts(analyses, projectLicense = 'MIT') {
  const conflicts = { critical: [], high: [], medium: [], unknown: [], clean: 0 };
  const analysesArray = Array.isArray(analyses) ? analyses : [];

  analysesArray.forEach(analysis => {
    if (!analysis) return;

    const entry = {
      package: analysis.package,
      license: analysis.license,
      projectLicense,
      message: `${analysis.license} license: ${analysis.risk}`,
      alternative: analysis.alternative ? analysis.alternative.replacement : null
    };

    if (analysis.riskLevel === 'critical') conflicts.critical.push(entry);
    else if (analysis.riskLevel === 'high') conflicts.high.push(entry);
    else if (analysis.riskLevel === 'medium') conflicts.medium.push(entry);
    else if (analysis.riskLevel === 'unknown') conflicts.unknown.push(entry);
    else conflicts.clean++;
  });

  return conflicts;
}

function getLicenseRisk(license) {
  const normalizedLicense = normalizeLicense(license);
  const riskInfo = LICENSE_RISKS[normalizedLicense];
  return riskInfo ? riskInfo.level : 'unknown';
}

function isCommercialCompatible(license) {
  const risk = getLicenseRisk(license);
  return risk === 'low' || risk === 'unknown';
}

function normalizeLicense(license) {
  if (!license || typeof license !== 'string') return 'Unknown';
  if (license.includes('OR') || license.includes('AND')) {
    const licenses = license.split(/\s+(OR|AND)\s+/);
    return licenses[0].trim();
  }
  return license.trim();
}

module.exports = {
  analyzePackage,
  analyzePackageData,
  analyzeBatch,
  getLicenseConflicts,
  getLicenseRisk,
  isCommercialCompatible,
  LICENSE_RISKS,
  GPL_ALTERNATIVES
};