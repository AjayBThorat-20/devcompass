const chalk = require('chalk');

/**
 * Format alerts for terminal output
 */
function formatAlerts(alerts) {
  if (alerts.length === 0) {
    return null;
  }
  
  // Group alerts by package
  const grouped = {};
  
  alerts.forEach(alert => {
    if (!grouped[alert.package]) {
      grouped[alert.package] = [];
    }
    grouped[alert.package].push(alert);
  });
  
  return grouped;
}

/**
 * Get severity emoji and color
 */
function getSeverityDisplay(severity) {
  const displays = {
    critical: { emoji: '🔴', color: chalk.red.bold, label: 'CRITICAL' },
    high: { emoji: '🟠', color: chalk.red, label: 'HIGH' },
    medium: { emoji: '🟡', color: chalk.yellow, label: 'MEDIUM' },
    low: { emoji: '⚪', color: chalk.gray, label: 'LOW' }
  };
  
  return displays[severity] || displays.medium;
}

/**
 * Calculate alert impact on health score
 */
function calculateAlertPenalty(alerts) {
  let penalty = 0;
  
  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'critical':
        penalty += 2.0;
        break;
      case 'high':
        penalty += 1.5;
        break;
      case 'medium':
        penalty += 0.5;
        break;
      case 'low':
        penalty += 0.2;
        break;
    }
  });
  
  return Math.min(penalty, 5.0); // Cap at 5 points max
}

module.exports = { 
  formatAlerts, 
  getSeverityDisplay, 
  calculateAlertPenalty 
};
