const fs = require('fs');
const path = require('path');

const RISKY_LICENSES = ['GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0', 'LGPL-2.1'];

async function collectLicenseData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    const issues = [];

    for (const [name, version] of Object.entries(dependencies)) {
      const nodeModulesPath = path.join(projectPath, 'node_modules', name, 'package.json');

      if (!fs.existsSync(nodeModulesPath)) {
        continue;
      }

      try {
        const depPackageJson = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf8'));
        const license = depPackageJson.license;

        if (license && RISKY_LICENSES.includes(license)) {
          issues.push({
            package: name,
            version: depPackageJson.version,
            license,
            severity: 'medium',
            message: `Package uses ${license} license which may have restrictions`
          });
        }
      } catch (error) {
        // Skip if can't read package.json
      }
    }

    return issues;
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('License collection failed:', error.message);
    }
    return [];
  }
}

module.exports = { collectLicenseData };