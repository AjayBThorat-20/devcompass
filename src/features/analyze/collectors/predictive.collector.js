// src/features/analyze/collectors/predictive.collector.js

const fs = require('fs');
const path = require('path');
const { generatePredictiveWarnings } = require('../../alerts/predictive.service');

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
    if (process.env.DEBUG) console.error('Predictive collection failed:', error.message);
    return [];
  }
}

module.exports = { collectPredictiveData };