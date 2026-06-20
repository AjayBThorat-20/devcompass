// src/features/analyze/collectors/quality.collector.js

const fs = require('fs');
const path = require('path');
const dynamicQuality = require('../../quality/dynamic-quality.service');

async function collectQualityData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    }
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    const packages = Object.entries(dependencies).map(([name, version]) => ({ name, version }));
    if (packages.length === 0) return [];

    const analyses = await dynamicQuality.analyzeBatch(packages);
    return analyses.filter(pkg => pkg.status !== 'healthy').map(pkg => ({
      package: pkg.package,
      version: pkg.version,
      status: pkg.status,
      healthScore: pkg.healthScore,
      lastUpdate: pkg.lastUpdate,
      ageMonths: pkg.ageMonths,
      deprecated: pkg.deprecated,
      alternative: pkg.alternative ? { replacement: pkg.alternative.replacement || pkg.alternative, reason: pkg.alternative.reason } : null
    }));
  } catch (error) {
    if (process.env.DEBUG) console.error('Quality collection failed:', error.message);
    return [];
  }
}

module.exports = { collectQualityData };