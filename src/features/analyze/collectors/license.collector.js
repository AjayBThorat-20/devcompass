// src/features/analyze/collectors/license.collector.js

const fs = require('fs');
const path = require('path');
const dynamicLicense = require('../../quality/dynamic-license.service');

async function collectLicenseData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    const packages = Object.entries(dependencies).map(([name, version]) => ({
      name,
      version: resolveInstalledVersion(projectPath, name, version)
    }));

    if (packages.length === 0) return [];

    const projectLicense = packageJson.license || 'MIT';
    const analyses = await dynamicLicense.analyzeBatch(packages);

    return analyses
      .filter(a => a && a.riskLevel !== 'low' && a.riskLevel !== 'unknown')
      .map(a => ({
        package: a.package,
        version: a.version,
        license: a.license,
        riskLevel: a.riskLevel,
        risk: a.risk,
        projectLicense,
        alternative: a.alternative ? { replacement: a.alternative.replacement, reason: a.alternative.reason } : null
      }));
  } catch (error) {
    if (process.env.DEBUG) console.error('License collection failed:', error.message);
    return [];
  }
}

function resolveInstalledVersion(projectPath, packageName, declaredVersion) {
  try {
    const installedPackageJsonPath = path.join(projectPath, 'node_modules', packageName, 'package.json');
    if (fs.existsSync(installedPackageJsonPath)) {
      const installedPackageJson = JSON.parse(fs.readFileSync(installedPackageJsonPath, 'utf8'));
      if (installedPackageJson.version) return installedPackageJson.version;
    }
  } catch (error) {
    if (process.env.DEBUG) console.error(`Could not resolve installed version for ${packageName}:`, error.message);
  }

  if (typeof declaredVersion === 'string') {
    return declaredVersion.replace(/^[\^~>=<\s]+/, '');
  }

  return 'unknown';
}

module.exports = { collectLicenseData };