// src/services/dynamic-license.js
const path = require('path');
const fs = require('fs');
const registryClient = require('./registry-client');

const LICENSE_RISKS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/license-risks.json'), 'utf8')
);

const GPL_ALTERNATIVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/gpl-alternatives.json'), 'utf8')
);

async function analyzePackage(packageName, version) {
  const packageData = await registryClient.fetchPackage(packageName);
  if (!packageData) return null;
  return analyzePackageData(packageData);
}

function analyzePackageData(packageData) {
  try {
    const packageName = packageData.name;
    const license = packageData.license || 'Unknown';
    const normalizedLicense = normalizeLicense(license);
    const riskInfo = LICENSE_RISKS[normalizedLicense] || {
      level: 'unknown',
      risk: 'License terms unclear'
    };
    
    return {
      package: packageName,
      version: packageData.version,
      license: normalizedLicense,
      riskLevel: riskInfo.level,
      risk: riskInfo.risk,
      isGPL: normalizedLicense.includes('GPL'),
      isPermissive: riskInfo.level === 'low',
      alternative: GPL_ALTERNATIVES[packageName] || null
    };
  } catch (error) {
    return null;
  }
}

async function analyzeBatch(packages) {
  const packageArray = Array.isArray(packages)
    ? packages
    : Object.entries(packages).map(([name, version]) => ({ name, version }));
  
  const packageNames = packageArray.map(p => p.name);
  const packageDataMap = await registryClient.fetchBatch(packageNames);
  
  const results = [];
  for (const [name, data] of packageDataMap.entries()) {
    if (data) {
      const analysis = analyzePackageData(data);
      if (analysis) {
        results.push(analysis);
      }
    }
  }
  
  return results;
}

function getLicenseConflicts(analyses, projectLicense = 'MIT') {
  const conflicts = [];
  const analysesArray = Array.isArray(analyses) ? analyses : [];
  
  analysesArray.forEach(analysis => {
    if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
      conflicts.push({
        package: analysis.package,
        license: analysis.license,
        projectLicense: projectLicense,
        severity: analysis.riskLevel,
        reason: analysis.risk,
        autoFixable: !!analysis.alternative,
        suggestedAlternative: analysis.alternative?.replacement
      });
    }
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
  if (!license || typeof license !== 'string') {
    return 'Unknown';
  }
  
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

