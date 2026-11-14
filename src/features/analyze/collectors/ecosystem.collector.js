// src/features/analyze/collectors/ecosystem.collector.js

const fs = require('fs');
const path = require('path');
const { checkEcosystemAlerts } = require('../../alerts');
const logger = require('../../../shared/utils/logger').default;

async function collectEcosystemData(projectPath, packageJson = null) {
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

    return await checkEcosystemAlerts(projectPath, dependencies);
  } catch (error) {
    logger.debug('Ecosystem collection failed:', error.message);
    const alerts = [];
    alerts.incomplete = true;
    alerts.incompleteReason = error.message;
    return alerts;
  }
}

module.exports = { collectEcosystemData };