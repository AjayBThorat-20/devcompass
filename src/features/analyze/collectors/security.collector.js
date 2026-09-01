// src/features/analyze/collectors/security.collector.js

const { analyzeSupplyChain } = require('../../security/supply-chain.analyzer');
const fs = require('fs');
const path = require('path');

async function collectSecurityData(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    const result = await analyzeSupplyChain(projectPath, dependencies);
    const warnings = result.warnings || [];
    if (result.incomplete) {
      warnings.incomplete = true;
      warnings.incompleteReason = result.incompleteReason || 'Security scan could not complete';
    }
    return warnings;
  } catch (error) {
    if (process.env.DEBUG) console.error('Security collection failed:', error.message);
    const warnings = [];
    warnings.incomplete = true;
    warnings.incompleteReason = error.message;
    return warnings;
  }
}

module.exports = { collectSecurityData };