// src/analyzers/licenses.js
const path = require('path');
const fs = require('fs');

// Load license data from JSON
const licensesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/licenses.json'), 'utf8')
);

const RESTRICTIVE_LICENSES = licensesData.restrictive;
const PERMISSIVE_LICENSES = licensesData.permissive;

async function analyzeLicenses(dependencies) {
  const warnings = [];

  for (const [name, version] of Object.entries(dependencies)) {
    try {
      const packagePath = path.join(process.cwd(), 'node_modules', name, 'package.json');
      
      if (!fs.existsSync(packagePath)) {
        continue;
      }

      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const license = packageData.license || 'Unknown';

      // Check for restrictive licenses
      const isRestrictive = RESTRICTIVE_LICENSES.some(restrictive =>
        license.toString().toUpperCase().includes(restrictive)
      );

      if (isRestrictive) {
        warnings.push({
          package: name,
          license: license,
          type: 'Restrictive',
          severity: 'medium'
        });
      }

      // Check for unknown licenses
      if (license === 'Unknown' || license === 'UNLICENSED' || !license) {
        warnings.push({
          package: name,
          license: license || 'Unknown',
          type: 'Unknown',
          severity: 'low'
        });
      }
    } catch (error) {
      // Skip packages we can't read
      continue;
    }
  }

  return { warnings };
}

/**
 * ADDED: Find problematic licenses from license array
 * Used by analyze.js for displaying legacy license warnings
 */
function findProblematicLicenses(licenses) {
  // Handle both array and object with warnings property
  const licensesArray = Array.isArray(licenses) 
    ? licenses 
    : (licenses.warnings || []);
  
  return licensesArray.filter(l => 
    l.type === 'Restrictive' || l.type === 'Unknown'
  );
}

// FIXED: Export all expected functions
module.exports = { 
  analyzeLicenses,
  checkLicenses: analyzeLicenses,  // Alias for backward compatibility
  findProblematicLicenses,         // NEW: Export this function
  RESTRICTIVE_LICENSES, 
  PERMISSIVE_LICENSES 
};