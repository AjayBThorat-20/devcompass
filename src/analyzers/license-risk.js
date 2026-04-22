// src/analyzers/license-risk.js
// v3.1.4 - Dynamic license risk analysis using npm registry

const { analyzer } = require('../services');

async function analyzeLicenseRisks(projectPath, licenses = []) {
  try {
    // Extract package names from licenses
const licensesArray = Array.isArray(licenses) ? licenses : (licenses.warnings || []);
const packageNames = licensesArray.map(l => l.package);
    
    if (packageNames.length === 0) {
      return {
        warnings: [],
        stats: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          clean: 0
        },
        projectLicense: getProjectLicense(projectPath)
      };
    }
    
    // Get project license
    const projectLicense = getProjectLicense(projectPath);
    
    // Analyze license conflicts dynamically
    const conflicts = await analyzer.license.getLicenseConflicts(
      packageNames,
      projectLicense
    );
    
    const warnings = [];
    
    // Process critical conflicts (AGPL, etc.)
    for (const conflict of conflicts.critical) {
      warnings.push({
        package: conflict.package,
        license: conflict.license,
        severity: 'critical',
        message: conflict.message,
        risk: 'Viral copyleft - requires entire codebase to be open source',
        recommendation: conflict.alternative 
          ? `Replace with ${conflict.alternative}` 
          : 'Find permissive alternative',
        suggestedAlternative: conflict.alternative ? {
          name: conflict.alternative,
          license: 'MIT' // Most alternatives are MIT
        } : null,
        autoFixable: conflict.alternative ? true : false
      });
    }
    
    // Process high-risk conflicts (GPL, etc.)
    for (const conflict of conflicts.high) {
      warnings.push({
        package: conflict.package,
        license: conflict.license,
        severity: 'high',
        message: conflict.message,
        risk: 'Strong copyleft - derivative works must be GPL licensed',
        recommendation: conflict.alternative
          ? `Replace with ${conflict.alternative}`
          : 'Consider permissive alternative',
        suggestedAlternative: conflict.alternative ? {
          name: conflict.alternative,
          license: 'MIT'
        } : null,
        autoFixable: conflict.alternative ? true : false
      });
    }
    
    // Process medium-risk conflicts (LGPL, MPL, etc.)
    for (const conflict of conflicts.medium) {
      warnings.push({
        package: conflict.package,
        license: conflict.license,
        severity: 'medium',
        message: conflict.message,
        risk: 'Weak copyleft - modifications must be shared',
        recommendation: conflict.alternative
          ? `Consider replacing with ${conflict.alternative}`
          : 'Review license compatibility',
        suggestedAlternative: conflict.alternative ? {
          name: conflict.alternative,
          license: 'MIT'
        } : null,
        autoFixable: false // Medium risk - manual review needed
      });
    }
    
    // Process unknown licenses
    for (const conflict of conflicts.unknown) {
      warnings.push({
        package: conflict.package,
        license: conflict.license,
        severity: 'medium',
        message: conflict.message,
        risk: 'Unknown license - cannot determine compatibility',
        recommendation: 'Review license manually',
        suggestedAlternative: null,
        autoFixable: false
      });
    }
    
    return {
      warnings,
      stats: {
        total: packageNames.length,
        critical: conflicts.critical.length,
        high: conflicts.high.length,
        medium: conflicts.medium.length,
        low: 0,
        clean: conflicts.clean
      },
      projectLicense,
      conflicts: {
        critical: conflicts.critical,
        high: conflicts.high,
        medium: conflicts.medium,
        unknown: conflicts.unknown
      }
    };
    
  } catch (error) {
    console.error('[license-risk] Analysis failed:', error.message);
    return {
      warnings: [],
      stats: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        clean: 0
      },
      projectLicense: 'MIT'
    };
  }
}

function getProjectLicense(projectPath) {
  try {
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.license || 'MIT';
    }
  } catch (error) {
    // Ignore errors
  }
  
  return 'MIT'; // Default assumption
}

function getLicenseRiskScore(licenseRiskData) {
  if (!licenseRiskData || !licenseRiskData.stats) {
    return 0;
  }
  
  const { critical, high, medium } = licenseRiskData.stats;
  
  // Penalty calculation
  let penalty = 0;
  penalty += critical * 3; // Critical = -3 points each
  penalty += high * 2;     // High = -2 points each
  penalty += medium * 1;   // Medium = -1 point each
  
  return Math.min(10, penalty); // Cap at 10 points penalty
}

module.exports = {
  analyzeLicenseRisks,
  getLicenseRiskScore
};