// src/features/alerts/index.js

const { resolveInstalledVersions } = require('./version-resolver.service');

let issuesAnalyzer = null;
try {
  issuesAnalyzer = require('../analyze/issues-analyzer.service').getIssuesAnalyzer();
} catch (error) {
  if (process.env.DEBUG) console.error('Issues analyzer not available:', error.message);
}

async function checkEcosystemAlerts(projectPath, dependencies) {
  try {
    const installedVersions = await resolveInstalledVersions(projectPath, dependencies);
    if (!issuesAnalyzer) return [];
    return await fetchDynamicAlerts(installedVersions, projectPath);
  } catch (error) {
    if (process.env.DEBUG) console.error('Error in checkEcosystemAlerts:', error.message);
    const alerts = [];
    alerts.incomplete = true;
    alerts.incompleteReason = error.message;
    return alerts;
  }
}

async function fetchDynamicAlerts(installedVersions, projectPath = process.cwd()) {
  const alerts = [];
  if (!issuesAnalyzer) return alerts;

  const packages = [];
  if (installedVersions instanceof Map) {
    installedVersions.forEach((version, name) => packages.push({ name, version }));
  } else if (typeof installedVersions === 'object' && installedVersions !== null) {
    Object.entries(installedVersions).forEach(([name, version]) => {
      packages.push({ name, version: typeof version === 'object' ? version.version : version });
    });
  }

  try {
    const issuesMap = await issuesAnalyzer.getBatchIssues(packages, projectPath);

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

    if (issuesMap.failedPackages?.length > 0) {
      alerts.incomplete = true;
      const failed = issuesMap.failedPackages;
      alerts.incompleteReason = `Could not check ${failed.length} package(s) for ecosystem issues: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? ', …' : ''}`;
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('Error fetching dynamic alerts:', error.message);
    alerts.incomplete = true;
    alerts.incompleteReason = error.message;
  }

  return alerts;
}

function mapSeverityToLevel(severity) {
  const map = { critical: 'critical', high: 'high', medium: 'medium', moderate: 'medium', low: 'low', info: 'info' };
  return map[severity?.toLowerCase()] || 'medium';
}

function categorizeIssue(issue) {
  const title = (issue.title || '').toLowerCase();
  const source = (issue.source || '').toLowerCase();

  if (source.includes('audit') || source.includes('advisory')) return 'vulnerability';
  if (title.includes('deprecated')) return 'deprecation';
  if (title.includes('unmaintained') || title.includes('abandoned')) return 'maintenance';
  if (title.includes('breaking')) return 'breaking-change';
  return 'general';
}

function getAlertsSummary(alerts) {
  if (!Array.isArray(alerts)) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  return {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    total: alerts.length
  };
}

module.exports = { checkEcosystemAlerts, getAlertsSummary, fetchDynamicAlerts };