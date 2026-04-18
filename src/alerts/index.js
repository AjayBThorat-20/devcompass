// src/alerts/index.js
// v3.1.3 - Dynamic alerts using issues analyzer (no hardcoded issues-db.json)
const { resolveInstalledVersions } = require('./resolver');

// Try to load dynamic issues analyzer
let getIssuesAnalyzer = null;
try {
  const issuesModule = require('../analyzers/issues');
  getIssuesAnalyzer = issuesModule.getIssuesAnalyzer;
} catch (e) {
  // Issues analyzer not available
}


async function checkEcosystemAlerts(projectPath, dependencies) {
  try {
    // Resolve installed versions from node_modules
    const installedVersions = await resolveInstalledVersions(projectPath, dependencies);
    
    // If dynamic issues analyzer is available, use it
    if (getIssuesAnalyzer) {
      return await fetchDynamicAlerts(installedVersions);
    }
    
    // Fallback: return empty if no analyzer available
    return [];
  } catch (error) {
    console.error('Error in checkEcosystemAlerts:', error.message);
    return []; // Return empty array on error, don't break analysis
  }
}


async function fetchDynamicAlerts(installedVersions) {
  const alerts = [];
  const analyzer = getIssuesAnalyzer();

  // Convert to array format for batch processing
  const packages = [];
  
  if (installedVersions instanceof Map) {
    installedVersions.forEach((version, name) => {
      packages.push({ name, version });
    });
  } else if (typeof installedVersions === 'object') {
    Object.entries(installedVersions).forEach(([name, version]) => {
      packages.push({ name, version: typeof version === 'object' ? version.version : version });
    });
  }

  try {
    // Batch fetch issues for all packages
    const issuesMap = await analyzer.getBatchIssues(packages);

    // Convert issues to alerts format
    issuesMap.forEach((issues, packageName) => {
      issues.forEach(issue => {
        alerts.push({
          package: packageName,
          title: issue.title,
          severity: mapSeverityToLevel(issue.severity),
          affected: issue.affected || '*',
          fix: issue.fix || 'No fix available',
          source: issue.source || 'Dynamic analysis',
          reported: issue.reported || new Date().toISOString().split('T')[0],
          type: categorizeIssue(issue)
        });
      });
    });

  } catch (error) {
    console.error('Error fetching dynamic alerts:', error.message);
  }

  return alerts;
}

/**
 * Map severity string to consistent level
 */
function mapSeverityToLevel(severity) {
  const map = {
    'critical': 'critical',
    'high': 'high',
    'medium': 'medium',
    'moderate': 'medium',
    'low': 'low',
    'info': 'info'
  };
  return map[severity?.toLowerCase()] || 'medium';
}

/**
 * Categorize issue type
 */
function categorizeIssue(issue) {
  const title = issue.title?.toLowerCase() || '';
  const source = issue.source?.toLowerCase() || '';
  
  if (source.includes('audit') || source.includes('advisory')) {
    return 'vulnerability';
  }
  if (title.includes('deprecated')) {
    return 'deprecation';
  }
  if (title.includes('unmaintained') || title.includes('abandoned')) {
    return 'maintenance';
  }
  if (title.includes('breaking')) {
    return 'breaking-change';
  }
  return 'general';
}

function formatAlerts(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  return alerts.map(alert => ({
    ...alert,
    icon: getAlertIcon(alert.severity),
    color: getAlertColor(alert.severity)
  }));
}

/**
 * Get icon for severity level
 */
function getAlertIcon(severity) {
  const icons = {
    'critical': '🔴',
    'high': '🟠',
    'medium': '🟡',
    'low': '🔵',
    'info': 'ℹ️'
  };
  return icons[severity] || '⚪';
}

/**
 * Get color for severity level (for chalk)
 */
function getAlertColor(severity) {
  const colors = {
    'critical': 'red',
    'high': 'yellow',
    'medium': 'yellow',
    'low': 'blue',
    'info': 'gray'
  };
  return colors[severity] || 'white';
}


function getAlertsSummary(alerts) {
  if (!Array.isArray(alerts)) {
    return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }

  return {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    total: alerts.length
  };
}

module.exports = { 
  checkEcosystemAlerts,
  formatAlerts,
  getAlertsSummary,
  fetchDynamicAlerts
};