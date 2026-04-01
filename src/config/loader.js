const fs = require('fs');
const path = require('path');

function loadConfig(projectPath) {
  const configPath = path.join(projectPath, 'devcompass.config.json');
  
  if (!fs.existsSync(configPath)) {
    return getDefaultConfig();
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { ...getDefaultConfig(), ...config };
  } catch (error) {
    console.warn('Warning: Could not parse devcompass.config.json, using defaults');
    return getDefaultConfig();
  }
}

function getDefaultConfig() {
  return {
    ignore: [],
    ignoreSeverity: [],
    minScore: 0,
    cache: true
  };
}

module.exports = { loadConfig };
