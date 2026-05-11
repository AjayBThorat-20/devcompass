const dynamicLicense = require('../../../services/dynamic-license');
const path = require('path');

async function collectLicenseData(projectPath) {
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

    const analyses = await dynamicLicense.analyzeBatch(packages);
    
    const projectLicense = packageJson.license || 'UNLICENSED';
    const conflicts = dynamicLicense.getLicenseConflicts(analyses, projectLicense);

    return conflicts.map(conflict => ({
      package: conflict.package,
      version: conflict.version || 'unknown',
      license: conflict.license,
      riskLevel: conflict.severity,
      risk: conflict.reason,
      alternative: conflict.suggestedAlternative ? {
        replacement: conflict.suggestedAlternative
      } : null
    }));
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('License collection failed:', error.message);
    }
    return [];
  }
}

module.exports = { collectLicenseData };