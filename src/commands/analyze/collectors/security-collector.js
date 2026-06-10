const { analyzeSupplyChain } = require('../../../analyzers/supply-chain');
const fs = require('fs');
const path = require('path');

async function collectSecurityData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return [];
      }

      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    const result = await analyzeSupplyChain(projectPath, dependencies);

    return result.warnings || [];
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Security collection failed:', error.message);
    }
    return [];
  }
}

module.exports = { collectSecurityData };