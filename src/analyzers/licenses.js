// src/analyzers/licenses.js
const path = require('path');
const fs = require('fs');

// Restrictive licenses that might cause issues
const RESTRICTIVE_LICENSES = [
  'GPL',
  'GPL-2.0',
  'GPL-3.0',
  'AGPL',
  'AGPL-3.0',
  'LGPL',
  'LGPL-2.1',
  'LGPL-3.0'
];

// Permissive licenses (usually safe)
const PERMISSIVE_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'CC0-1.0',
  'Unlicense'
];

/**
 * Check licenses of all dependencies
 */
async function checkLicenses(projectPath, dependencies) {
  const licenses = [];
  
  for (const [packageName, version] of Object.entries(dependencies)) {
    try {
      const packageJsonPath = path.join(
        projectPath,
        'node_modules',
        packageName,
        'package.json'
      );
      
      if (!fs.existsSync(packageJsonPath)) {
        continue;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const license = packageJson.license || 'UNKNOWN';
      
      licenses.push({
        package: packageName,
        license: license,
        type: getLicenseType(license)
      });
      
    } catch (error) {
      // Skip packages we can't read
      continue;
    }
  }
  
  return licenses;
}

/**
 * Determine license type
 */
function getLicenseType(license) {
  const licenseStr = String(license).toUpperCase();
  
  // Check for restrictive licenses
  for (const restrictive of RESTRICTIVE_LICENSES) {
    if (licenseStr.includes(restrictive)) {
      return 'restrictive';
    }
  }
  
  // Check for permissive licenses
  for (const permissive of PERMISSIVE_LICENSES) {
    if (licenseStr.includes(permissive)) {
      return 'permissive';
    }
  }
  
  // Unknown or custom license
  if (licenseStr === 'UNKNOWN' || licenseStr === 'UNLICENSED') {
    return 'unknown';
  }
  
  return 'other';
}

/**
 * Find problematic licenses
 */
function findProblematicLicenses(licenses) {
  return licenses.filter(pkg => 
    pkg.type === 'restrictive' || pkg.type === 'unknown'
  );
}

module.exports = {
  checkLicenses,
  findProblematicLicenses,
  RESTRICTIVE_LICENSES,
  PERMISSIVE_LICENSES
};