const dynamicQuality = require('../../../services/dynamic-quality');
const path = require('path');

async function collectQualityData(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = require(packageJsonPath);
    
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const packages = Object.entries(dependencies).map(([name, version]) => ({
      name,
      version
    }));

    const analyses = await dynamicQuality.analyzeBatch(packages);

    return analyses
      .filter(pkg => pkg.status !== 'healthy')
      .map(pkg => ({
        package: pkg.package,
        version: pkg.version,
        status: pkg.status,
        healthScore: pkg.healthScore,
        lastUpdate: pkg.lastUpdate,
        ageMonths: pkg.ageMonths,
        deprecated: pkg.deprecated,
        alternative: pkg.alternative ? {
          replacement: pkg.alternative.replacement || pkg.alternative,
          reason: pkg.alternative.reason
        } : null
      }));
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Quality collection failed:', error.message);
    }
    return [];
  }
}

module.exports = { collectQualityData };