// src/features/alerts/predictive.service.js

const { checkGitHubIssues } = require('./github-tracker.service');

async function generatePredictiveWarnings(packages, options = {}) {
  const { onProgress } = options;
  const warnings = [];

  try {
    if (!packages || Object.keys(packages).length === 0) return warnings;

    const githubData = await checkGitHubIssues(packages, { concurrency: 5, onProgress });
    const failed = [];

    for (const data of githubData) {
      if (!data) continue;

      if (data.failed) {
        failed.push(data.package);
        continue;
      }

      if (data.riskScore >= 3) {
        warnings.push({
          package: data.package,
          severity: 'high',
          type: 'predictive',
          title: 'High bug activity detected',
          description: `${data.last7Days} new issues in last 7 days`,
          recommendation: 'Consider delaying upgrade or monitoring closely',
          data: { totalIssues: data.totalIssues, recentIssues: data.last7Days, criticalIssues: data.criticalIssues, trend: data.trend, repoUrl: data.repoUrl }
        });
      } else if (data.riskScore >= 2 || data.trend === 'increasing') {
        warnings.push({
          package: data.package,
          severity: 'medium',
          type: 'predictive',
          title: 'Increased issue activity',
          description: `${data.last7Days} issues opened recently`,
          recommendation: 'Monitor for stability',
          data: { totalIssues: data.totalIssues, recentIssues: data.last7Days, criticalIssues: data.criticalIssues, trend: data.trend, repoUrl: data.repoUrl }
        });
      } else if (data.riskScore >= 1) {
        warnings.push({
          package: data.package,
          severity: 'low',
          type: 'predictive',
          title: 'Minor issue activity',
          description: `${data.last7Days} issues in last week`,
          recommendation: 'No immediate action needed',
          data: { totalIssues: data.totalIssues, recentIssues: data.last7Days, trend: data.trend, repoUrl: data.repoUrl }
        });
      }
    }

    if (failed.length > 0) {
      warnings.incomplete = true;
      warnings.incompleteReason = `Could not fetch GitHub issue data for ${failed.length} package(s): ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? ', …' : ''}`;
    }

    return warnings;
  } catch (error) {
    if (process.env.DEBUG) console.error('Error generating predictive warnings:', error.message);
    warnings.incomplete = true;
    warnings.incompleteReason = error.message;
    return warnings;
  }
}

function getPredictiveStats(warnings) {
  if (!Array.isArray(warnings)) return { total: 0, high: 0, medium: 0, low: 0, packages: [] };
  return {
    total: warnings.length,
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    low: warnings.filter(w => w.severity === 'low').length,
    packages: warnings.map(w => w.package)
  };
}

module.exports = { generatePredictiveWarnings, getPredictiveStats };