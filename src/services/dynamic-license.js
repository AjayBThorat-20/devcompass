// src/services/dynamic-license.js
const path = require('path');
const fs = require('fs');
const registryClient = require('./registry-client');

// Load license risk data from JSON
const LICENSE_RISKS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/license-risks.json'), 'utf8')
);

const GPL_ALTERNATIVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/gpl-alternatives.json'), 'utf8')
);

/**
 * Analyze a package's license
 */
async function analyzePackage(packageName, version) {
  try {
    const packageData = await registryClient.getPackageData(packageName, version);
    
    if (!packageData) {
      return null;
    }

    const license = packageData.license || 'Unknown';
    const normalizedLicense = normalizeLicense(license);
    
    const riskInfo = LICENSE_RISKS[normalizedLicense] || {
      level: 'unknown',
      risk: 'License terms unclear'
    };

    return {
      package: packageName,
      version: version,
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

/**
 * Analyze licenses for multiple packages
 */
async function analyzeBatch(packages) {
  // FIXED: Handle both array and object inputs
  const packageArray = Array.isArray(packages) 
    ? packages 
    : Object.entries(packages).map(([name, version]) => ({ name, version }));
  
  const results = [];
  
  for (const pkg of packageArray) {
    const analysis = await analyzePackage(pkg.name, pkg.version);
    if (analysis) {
      results.push(analysis);
    }
  }

  return results;
}

/**
 * Get license conflicts
 */
function getLicenseConflicts(analyses, projectLicense = 'MIT') {
  const conflicts = [];

  // FIXED: Ensure analyses is an array
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

/**
 * Get license risk level
 */
function getLicenseRisk(license) {
  const normalizedLicense = normalizeLicense(license);
  const riskInfo = LICENSE_RISKS[normalizedLicense];
  return riskInfo ? riskInfo.level : 'unknown';
}

/**
 * Check if license is commercial-compatible
 */
function isCommercialCompatible(license) {
  const risk = getLicenseRisk(license);
  return risk === 'low' || risk === 'unknown';
}

/**
 * Normalize license string
 */
function normalizeLicense(license) {
  if (!license || typeof license !== 'string') {
    return 'Unknown';
  }

  // Handle SPDX expressions
  if (license.includes('OR') || license.includes('AND')) {
    const licenses = license.split(/\s+(OR|AND)\s+/);
    return licenses[0].trim();
  }

  return license.trim();
}

module.exports = {
  analyzePackage,
  analyzeBatch,
  getLicenseConflicts,
  getLicenseRisk,
  isCommercialCompatible,
  LICENSE_RISKS,
  GPL_ALTERNATIVES
};