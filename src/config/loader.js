// src/config/loader.js
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
    ignoreSeverity: [], // e.g., ["low", "medium"]
    minSeverity: null,  // e.g., "medium" - only show medium+ alerts
    minScore: 0,
    cache: true,
    outputMode: 'normal' // normal, json, silent, ci
  };
}

/**
 * Check if alert should be ignored based on config
 */
function shouldIgnoreAlert(alert, config) {
  // Check if package is in ignore list
  if (config.ignore.includes(alert.package)) {
    return true;
  }
  
  // Check if severity is ignored
  if (config.ignoreSeverity.includes(alert.severity)) {
    return true;
  }
  
  // Check minimum severity level
  if (config.minSeverity) {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const minLevel = severityOrder[config.minSeverity];
    const alertLevel = severityOrder[alert.severity];
    
    if (alertLevel > minLevel) {
      return true; // Alert is below minimum severity
    }
  }
  
  return false;
}

/**
 * Filter alerts based on config
 */
function filterAlerts(alerts, config) {
  return alerts.filter(alert => !shouldIgnoreAlert(alert, config));
}

module.exports = { 
  loadConfig,
  getDefaultConfig,
  shouldIgnoreAlert,
  filterAlerts
};