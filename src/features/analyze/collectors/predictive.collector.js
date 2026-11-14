// src/features/analyze/collectors/predictive.collector.js

const fs = require('fs');
const path = require('path');
const { generatePredictiveWarnings } = require('../../alerts/predictive.service');
const logger = require('../../../shared/utils/logger').default;

async function collectPredictiveData(projectPath, packageJson = null) {
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

    if (Object.keys(dependencies).length === 0) return [];

    return await generatePredictiveWarnings(dependencies);
  } catch (error) {
    logger.debug('Predictive collection failed:', error.message);
    const warnings = [];
    warnings.incomplete = true;
    warnings.incompleteReason = error.message;
    return warnings;
  }
}

module.exports = { collectPredictiveData };