// src/utils/json-formatter.js

/**
 * Format analysis results as JSON
 */
function formatAsJson(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses) {
  const problematicLicenses = licenses.filter(l => l.type === 'restrictive' || l.type === 'unknown');
  const heavyPackages = bundleSizes.filter(p => p.size > 1024);
  
  return JSON.stringify({
    version: require('../../package.json').version,
    timestamp: new Date().toISOString(),
    summary: {
      healthScore: score.total,
      totalDependencies: totalDeps,
      securityVulnerabilities: securityData.metadata.total,
      ecosystemAlerts: alerts.length,
      unusedDependencies: unusedDeps.length,
      outdatedPackages: outdatedDeps.length,
      heavyPackages: heavyPackages.length,
      licenseWarnings: problematicLicenses.length
    },
    security: {
      total: securityData.metadata.total,
      critical: securityData.metadata.critical,
      high: securityData.metadata.high,
      moderate: securityData.metadata.moderate,
      low: securityData.metadata.low,
      vulnerabilities: securityData.vulnerabilities.map(v => ({
        package: v.package,
        severity: v.severity,
        title: v.title,
        cve: v.cve,
        fixAvailable: v.fixAvailable
      }))
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
    bundleAnalysis: {
      heavyPackages: heavyPackages.map(pkg => ({
        name: pkg.name,
        size: pkg.sizeFormatted
      }))
    },
    licenses: {
      warnings: problematicLicenses.map(pkg => ({
        package: pkg.package,
        license: pkg.license,
        type: pkg.type
      }))
    },
    scoreBreakdown: {
      unusedPenalty: score.breakdown.unusedPenalty,
      outdatedPenalty: score.breakdown.outdatedPenalty,
      alertsPenalty: score.breakdown.alertsPenalty,
      securityPenalty: score.breakdown.securityPenalty
    }
  }, null, 2);
}

module.exports = { formatAsJson };