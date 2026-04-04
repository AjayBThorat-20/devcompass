// src/analyzers/license-risk.js
const fs = require('fs');
const path = require('path');

/**
 * License risk levels and compatibility
 */
const LICENSE_RISKS = {
  // High Risk - Restrictive/Copyleft
  'GPL-1.0': { risk: 'high', type: 'copyleft', business: 'Requires source disclosure' },
  'GPL-2.0': { risk: 'high', type: 'copyleft', business: 'Requires source disclosure' },
  'GPL-3.0': { risk: 'high', type: 'copyleft', business: 'Requires source disclosure' },
  'AGPL-1.0': { risk: 'critical', type: 'copyleft', business: 'Network copyleft - very restrictive' },
  'AGPL-3.0': { risk: 'critical', type: 'copyleft', business: 'Network copyleft - very restrictive' },
  'LGPL-2.0': { risk: 'medium', type: 'weak-copyleft', business: 'Limited copyleft obligations' },
  'LGPL-2.1': { risk: 'medium', type: 'weak-copyleft', business: 'Limited copyleft obligations' },
  'LGPL-3.0': { risk: 'medium', type: 'weak-copyleft', business: 'Limited copyleft obligations' },
  
  // Medium Risk
  'MPL-1.0': { risk: 'medium', type: 'weak-copyleft', business: 'File-level copyleft' },
  'MPL-1.1': { risk: 'medium', type: 'weak-copyleft', business: 'File-level copyleft' },
  'MPL-2.0': { risk: 'medium', type: 'weak-copyleft', business: 'File-level copyleft' },
  'EPL-1.0': { risk: 'medium', type: 'weak-copyleft', business: 'Module-level copyleft' },
  'EPL-2.0': { risk: 'medium', type: 'weak-copyleft', business: 'Module-level copyleft' },
  'CDDL-1.0': { risk: 'medium', type: 'weak-copyleft', business: 'File-level copyleft' },
  
  // Low Risk - Permissive
  'MIT': { risk: 'low', type: 'permissive', business: 'Very permissive' },
  'Apache-2.0': { risk: 'low', type: 'permissive', business: 'Permissive with patent grant' },
  'BSD-2-Clause': { risk: 'low', type: 'permissive', business: 'Very permissive' },
  'BSD-3-Clause': { risk: 'low', type: 'permissive', business: 'Very permissive' },
  'ISC': { risk: 'low', type: 'permissive', business: 'Very permissive' },
  'CC0-1.0': { risk: 'low', type: 'public-domain', business: 'Public domain' },
  'Unlicense': { risk: 'low', type: 'public-domain', business: 'Public domain' },
  '0BSD': { risk: 'low', type: 'permissive', business: 'Very permissive' },
  
  // Unknown/Special
  'UNLICENSED': { risk: 'critical', type: 'unknown', business: 'No license - all rights reserved' },
  'SEE LICENSE IN': { risk: 'high', type: 'unknown', business: 'Custom license - review required' },
  'CUSTOM': { risk: 'high', type: 'unknown', business: 'Custom license - review required' }
};

/**
 * License compatibility matrix
 * Can license A be combined with license B?
 */
const LICENSE_COMPATIBILITY = {
  'MIT': ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0'],
  'Apache-2.0': ['Apache-2.0', 'GPL-3.0', 'LGPL-3.0'],
  'GPL-2.0': ['GPL-2.0', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
  'GPL-3.0': ['GPL-3.0', 'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
  'LGPL-2.1': ['LGPL-2.1', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'GPL-2.0'],
  'LGPL-3.0': ['LGPL-3.0', 'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'GPL-3.0']
};

/**
 * Normalize license name
 */
function normalizeLicense(license) {
  if (!license) return 'UNLICENSED';
  
  const normalized = license
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .toUpperCase();
  
  // Handle common variations
  if (normalized.includes('MIT')) return 'MIT';
  if (normalized.includes('APACHE-2')) return 'Apache-2.0';
  if (normalized.includes('BSD-2')) return 'BSD-2-Clause';
  if (normalized.includes('BSD-3')) return 'BSD-3-Clause';
  if (normalized.includes('ISC')) return 'ISC';
  if (normalized.includes('GPL-2')) return 'GPL-2.0';
  if (normalized.includes('GPL-3')) return 'GPL-3.0';
  if (normalized.includes('LGPL-2')) return 'LGPL-2.1';
  if (normalized.includes('LGPL-3')) return 'LGPL-3.0';
  if (normalized.includes('AGPL')) return 'AGPL-3.0';
  if (normalized.includes('MPL')) return 'MPL-2.0';
  if (normalized.includes('SEE LICENSE')) return 'SEE LICENSE IN';
  if (normalized === 'UNLICENSED') return 'UNLICENSED';
  
  return license;
}

/**
 * Get license risk information
 */
function getLicenseRisk(license) {
  const normalized = normalizeLicense(license);
  return LICENSE_RISKS[normalized] || {
    risk: 'high',
    type: 'unknown',
    business: 'Unknown license - review required'
  };
}

/**
 * Check license compatibility
 */
function checkLicenseCompatibility(projectLicense, dependencyLicenses) {
  const conflicts = [];
  const normalized = normalizeLicense(projectLicense);
  const compatible = LICENSE_COMPATIBILITY[normalized] || [];
  
  for (const [pkg, license] of Object.entries(dependencyLicenses)) {
    const depNormalized = normalizeLicense(license);
    const depRisk = getLicenseRisk(license);
    
    // Check if copyleft license conflicts with permissive project
    if (depRisk.type === 'copyleft' && !compatible.includes(depNormalized)) {
      conflicts.push({
        package: pkg,
        license: license,
        projectLicense: projectLicense,
        severity: 'high',
        issue: 'License incompatibility',
        message: `${license} dependency may conflict with ${projectLicense} project license`,
        recommendation: 'Review license compatibility with legal team'
      });
    }
  }
  
  return conflicts;
}

/**
 * Analyze license risks for all dependencies
 */
async function analyzeLicenseRisks(projectPath, licenses) {
  const warnings = [];
  const stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    copyleft: 0,
    permissive: 0,
    unknown: 0
  };
  
  // Get project license
  let projectLicense = 'MIT'; // Default
  try {
    const projectPkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(projectPkgPath)) {
      const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf8'));
      projectLicense = projectPkg.license || 'MIT';
    }
  } catch (error) {
    // Use default
  }
  
  const dependencyLicenses = {};
  
  // Analyze each license
  for (const pkg of licenses) {
    stats.total++;
    
    const risk = getLicenseRisk(pkg.license);
    dependencyLicenses[pkg.package] = pkg.license;
    
    // Count by type
    if (risk.type === 'copyleft' || risk.type === 'weak-copyleft') {
      stats.copyleft++;
    } else if (risk.type === 'permissive' || risk.type === 'public-domain') {
      stats.permissive++;
    } else {
      stats.unknown++;
    }
    
    // Add warnings for high-risk licenses
    if (risk.risk === 'critical' || risk.risk === 'high') {
      stats[risk.risk]++;
      
      warnings.push({
        package: pkg.package,
        license: pkg.license,
        severity: risk.risk,
        type: risk.type,
        issue: 'High-risk license',
        message: `${pkg.license}: ${risk.business}`,
        recommendation: risk.risk === 'critical' 
          ? 'Replace with permissive alternative immediately'
          : 'Consider replacing with MIT/Apache alternative'
      });
    } else if (risk.risk === 'medium') {
      stats.medium++;
    } else {
      stats.low++;
    }
  }
  
  // Check license compatibility
  const conflicts = checkLicenseCompatibility(projectLicense, dependencyLicenses);
  warnings.push(...conflicts);
  
  return {
    warnings,
    stats,
    projectLicense
  };
}

/**
 * Get license risk score (0-10)
 */
function getLicenseRiskScore(stats) {
  let score = 10;
  
  score -= stats.critical * 3;
  score -= stats.high * 2;
  score -= stats.medium * 0.5;
  
  return Math.max(0, score);
}

module.exports = {
  analyzeLicenseRisks,
  getLicenseRisk,
  checkLicenseCompatibility,
  normalizeLicense,
  getLicenseRiskScore,
  LICENSE_RISKS
};