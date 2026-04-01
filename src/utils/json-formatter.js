// src/utils/json-formatter.js

/**
 * Format analysis results as JSON
 */
function formatAsJson(alerts, unusedDeps, outdatedDeps, score, totalDeps) {
  return JSON.stringify({
    version: require('../../package.json').version,
    timestamp: new Date().toISOString(),
    summary: {
      healthScore: score.total,
      totalDependencies: totalDeps,
      ecosystemAlerts: alerts.length,
      unusedDependencies: unusedDeps.length,
      outdatedPackages: outdatedDeps.length
    },
    ecosystemAlerts: alerts.map(alert => ({
      package: alert.package,
      version: alert.version,
      severity: alert.severity,
      title: alert.title,
      affected: alert.affected,
      fix: alert.fix,
      source: alert.source,
      reported: alert.reported
    })),
    unusedDependencies: unusedDeps.map(dep => ({
      name: dep.name
    })),
    outdatedPackages: outdatedDeps.map(dep => ({
      name: dep.name,
      current: dep.current,
      latest: dep.latest,
      updateType: dep.versionsBehind
    })),
    scoreBreakdown: {
      unusedPenalty: score.breakdown.unusedPenalty,
      outdatedPenalty: score.breakdown.outdatedPenalty,
      alertsPenalty: score.breakdown.alertsPenalty
    }
  }, null, 2);
}

module.exports = { formatAsJson };