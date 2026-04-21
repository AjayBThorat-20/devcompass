// src/services/dynamic-license.js

const registryClient = require('./registry-client');

// License risk levels
const LICENSE_RISKS = {
  // Critical - Viral copyleft, requires entire codebase to be open source
  'AGPL-3.0': { level: 'critical', risk: 'Requires disclosing source code of network services' },
  'AGPL-3.0-only': { level: 'critical', risk: 'Requires disclosing source code of network services' },
  'AGPL-3.0-or-later': { level: 'critical', risk: 'Requires disclosing source code of network services' },
  
  // High - Strong copyleft
  'GPL-3.0': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  'GPL-3.0-only': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  'GPL-3.0-or-later': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  'GPL-2.0': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  'GPL-2.0-only': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  'GPL-2.0-or-later': { level: 'high', risk: 'Requires derivative works to be GPL licensed' },
  
  // Medium - Weak copyleft
  'LGPL-3.0': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'LGPL-3.0-only': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'LGPL-3.0-or-later': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'LGPL-2.1': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'LGPL-2.1-only': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'LGPL-2.1-or-later': { level: 'medium', risk: 'Modifications to the library must be shared' },
  'MPL-2.0': { level: 'medium', risk: 'File-level copyleft, changes to MPL files must be shared' },
  'EPL-1.0': { level: 'medium', risk: 'Weak copyleft, modifications must be shared' },
  'EPL-2.0': { level: 'medium', risk: 'Weak copyleft, modifications must be shared' },
  'CDDL-1.0': { level: 'medium', risk: 'File-level copyleft' },
  
  // Low - Permissive licenses (safe for commercial use)
  'MIT': { level: 'low', risk: 'Permissive - commercial friendly' },
  'ISC': { level: 'low', risk: 'Permissive - commercial friendly' },
  'BSD-2-Clause': { level: 'low', risk: 'Permissive - commercial friendly' },
  'BSD-3-Clause': { level: 'low', risk: 'Permissive - commercial friendly' },
  'Apache-2.0': { level: 'low', risk: 'Permissive with patent grant' },
  '0BSD': { level: 'low', risk: 'Public domain equivalent' },
  'Unlicense': { level: 'low', risk: 'Public domain' },
  'CC0-1.0': { level: 'low', risk: 'Public domain' },
  'WTFPL': { level: 'low', risk: 'Permissive' }
};

// Known alternatives for GPL packages
const GPL_ALTERNATIVES = {
  'readline-sync': { replacement: 'prompts', reason: 'MIT licensed alternative' },
  'gnu-which': { replacement: 'which', reason: 'ISC licensed alternative' },
  'node-forge': { replacement: 'forge', reason: 'BSD-3-Clause licensed' },
  'gpl-package': { replacement: 'mit-alternative', reason: 'MIT licensed alternative' }
};


function normalizeLicense(license) {
  if (!license) return 'UNKNOWN';
  
  // Handle common variations
  const normalized = license
    .replace(/\s+/g, '-')
    .replace(/^Apache 2\.0$/i, 'Apache-2.0')
    .replace(/^Apache-2$/i, 'Apache-2.0')
    .replace(/^MIT$/i, 'MIT')
    .replace(/^ISC$/i, 'ISC')
    .replace(/^BSD$/i, 'BSD-3-Clause')
    .replace(/^GPLv3$/i, 'GPL-3.0')
    .replace(/^GPLv2$/i, 'GPL-2.0')
    .replace(/^LGPLv3$/i, 'LGPL-3.0')
    .replace(/^LGPLv2\.1$/i, 'LGPL-2.1')
    .replace(/^AGPLv3$/i, 'AGPL-3.0');
  
  return normalized;
}


function getLicenseRisk(license) {
  const normalized = normalizeLicense(license);
  
  if (LICENSE_RISKS[normalized]) {
    return {
      license: normalized,
      ...LICENSE_RISKS[normalized]
    };
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(LICENSE_RISKS)) {
    if (normalized.toUpperCase().includes(key.toUpperCase())) {
      return { license: normalized, ...value };
    }
  }
  
  // Unknown license
  return {
    license: normalized,
    level: 'unknown',
    risk: 'Unknown license - manual review recommended'
  };
}

async function analyzePackage(packageName) {
  const result = {
    name: packageName,
    license: null,
    riskLevel: 'unknown',
    riskMessage: null,
    hasIssue: false,
    alternative: null,
    source: 'live'
  };
  
  try {
    const data = await registryClient.fetchPackage(packageName);
    
    if (!data) {
      result.license = 'UNKNOWN';
      result.riskMessage = 'Package not found';
      return result;
    }
    
    // Get license from latest version
    const latestVersion = data['dist-tags']?.latest;
    const latestData = latestVersion ? data.versions?.[latestVersion] : null;
    const license = latestData?.license || data.license;
    
    if (!license) {
      result.license = 'UNLICENSED';
      result.riskLevel = 'high';
      result.riskMessage = 'No license specified';
      result.hasIssue = true;
      return result;
    }
    
    // Analyze the license
    const riskInfo = getLicenseRisk(license);
    result.license = riskInfo.license;
    result.riskLevel = riskInfo.level;
    result.riskMessage = riskInfo.risk;
    result.hasIssue = ['critical', 'high', 'medium'].includes(riskInfo.level);
    
    // Check for known alternatives
    if (GPL_ALTERNATIVES[packageName]) {
      result.alternative = GPL_ALTERNATIVES[packageName].replacement;
    }
    
    return result;
  } catch (error) {
    result.license = 'UNKNOWN';
    result.riskMessage = 'Failed to fetch license info';
    return result;
  }
}


async function analyzeBatch(packageNames) {
  if (!Array.isArray(packageNames)) {
    return new Map();
  }
  
  const results = new Map();
  const packageData = await registryClient.fetchBatch(packageNames);
  
  for (const name of packageNames) {
    if (!name || typeof name !== 'string') continue;
    
    const data = packageData.get(name);
    const result = {
      name,
      license: null,
      riskLevel: 'unknown',
      riskMessage: null,
      hasIssue: false,
      alternative: GPL_ALTERNATIVES[name]?.replacement || null,
      source: data ? 'live' : 'none'
    };
    
    if (data) {
      const latestVersion = data['dist-tags']?.latest;
      const latestData = latestVersion ? data.versions?.[latestVersion] : null;
      const license = latestData?.license || data.license;
      
      if (!license) {
        result.license = 'UNLICENSED';
        result.riskLevel = 'high';
        result.riskMessage = 'No license specified';
        result.hasIssue = true;
      } else {
        const riskInfo = getLicenseRisk(license);
        result.license = riskInfo.license;
        result.riskLevel = riskInfo.level;
        result.riskMessage = riskInfo.risk;
        result.hasIssue = ['critical', 'high', 'medium'].includes(riskInfo.level);
      }
    } else {
      result.license = 'UNKNOWN';
      result.riskMessage = 'Package not found';
    }
    
    results.set(name, result);
  }
  
  return results;
}

async function getLicenseConflicts(packageNames, projectLicense = 'MIT') {
  const results = await analyzeBatch(packageNames);
  
  const conflicts = {
    total: packageNames.length,
    clean: 0,
    critical: [],
    high: [],
    medium: [],
    unknown: []
  };
  
  for (const [name, data] of results) {
    switch (data.riskLevel) {
      case 'critical':
        conflicts.critical.push({
          package: name,
          license: data.license,
          message: data.riskMessage,
          alternative: data.alternative
        });
        break;
      case 'high':
        conflicts.high.push({
          package: name,
          license: data.license,
          message: data.riskMessage,
          alternative: data.alternative
        });
        break;
      case 'medium':
        conflicts.medium.push({
          package: name,
          license: data.license,
          message: data.riskMessage,
          alternative: data.alternative
        });
        break;
      case 'unknown':
        conflicts.unknown.push({
          package: name,
          license: data.license,
          message: data.riskMessage
        });
        break;
      default:
        conflicts.clean++;
    }
  }
  
  return conflicts;
}

function isCommercialCompatible(license) {
  const risk = getLicenseRisk(license);
  return risk.level === 'low';
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