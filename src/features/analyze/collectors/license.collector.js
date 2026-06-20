// src/features/analyze/collectors/license.collector.js

const fs = require('fs');
const path = require('path');

const RISKY_LICENSES = ['GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0', 'LGPL-2.1'];

async function collectLicenseData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    }
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    const issues = [];

    for (const [name] of Object.entries(dependencies)) {
      const nodeModulesPath = path.join(projectPath, 'node_modules', name, 'package.json');
      if (!fs.existsSync(nodeModulesPath)) continue;
      try {
        const depPkg = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'));
        const license = depPkg.license;
        if (license && RISKY_LICENSES.includes(license)) {
          issues.push({ package: name, version: depPkg.version, license, severity: 'medium', message: `Package uses ${license} license` });
        }
      } catch (e) { /* skip */ }
    }
    return issues;
  } catch (error) {
    if (process.env.DEBUG) console.error('License collection failed:', error.message);
    return [];
  }
}

module.exports = { collectLicenseData };