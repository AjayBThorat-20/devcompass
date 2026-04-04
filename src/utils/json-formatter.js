// src/utils/json-formatter.js
function formatAsJson(
  alerts, 
  unusedDeps, 
  outdatedDeps, 
  score, 
  totalDeps, 
  securityData, 
  bundleSizes, 
  licenses, 
  predictiveWarnings = [],
  supplyChainWarnings = [],
  licenseRiskData = {},
  qualityData = {},
  recommendations = []
) {
  const output = {
    version: require('../../package.json').version,
    timestamp: new Date().toISOString(),
    summary: {
      healthScore: score.total,
      totalDependencies: totalDeps,
      securityVulnerabilities: securityData.metadata.total,
      supplyChainWarnings: supplyChainWarnings.length,
      ecosystemAlerts: alerts.length,
      predictiveWarnings: predictiveWarnings.length,
      licenseRisks: licenseRiskData.warnings ? licenseRiskData.warnings.length : 0,
      qualityIssues: qualityData.stats ? 
        (qualityData.stats.abandoned || 0) + (qualityData.stats.deprecated || 0) + (qualityData.stats.stale || 0) : 0,
      unusedDependencies: unusedDeps.length,
      outdatedPackages: outdatedDeps.length,
      heavyPackages: bundleSizes.filter(p => p.size > 1024).length,
      licenseWarnings: licenses.filter(l => l.type === 'restrictive' || l.type === 'unknown').length
    },
    security: {
      total: securityData.metadata.total,
      critical: securityData.metadata.critical,
      high: securityData.metadata.high,
      moderate: securityData.metadata.moderate,
      low: securityData.metadata.low,
      vulnerabilities: securityData.vulnerabilities.map(v => ({
        package: v.name,
        severity: v.severity,
        title: v.title,
        cve: v.cve || null,
        fixAvailable: v.fixAvailable
      }))
    },
    supplyChain: {
      total: supplyChainWarnings.length,
      critical: supplyChainWarnings.filter(w => w.severity === 'critical').length,
      high: supplyChainWarnings.filter(w => w.severity === 'high').length,
      medium: supplyChainWarnings.filter(w => w.severity === 'medium').length,
      warnings: supplyChainWarnings.map(w => ({
        package: w.package,
        type: w.type,
        severity: w.severity,
        message: w.message,
        recommendation: w.recommendation,
        official: w.official || null
      }))
    },
    licenseRisk: {
      total: licenseRiskData.warnings ? licenseRiskData.warnings.length : 0,
      projectLicense: licenseRiskData.projectLicense || 'MIT',
      critical: licenseRiskData.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'critical').length : 0,
      high: licenseRiskData.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'high').length : 0,
      medium: licenseRiskData.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'medium').length : 0,
      warnings: licenseRiskData.warnings ? licenseRiskData.warnings.map(w => ({
        package: w.package,
        license: w.license,
        severity: w.severity,
        type: w.type,
        issue: w.issue,
        message: w.message,
        recommendation: w.recommendation
      })) : []
    },
    packageQuality: {
      total: qualityData.results ? qualityData.results.length : 0,
      healthy: qualityData.stats ? qualityData.stats.healthy : 0,
      needsAttention: qualityData.stats ? qualityData.stats.needsAttention : 0,
      stale: qualityData.stats ? qualityData.stats.stale : 0,
      abandoned: qualityData.stats ? qualityData.stats.abandoned : 0,
      deprecated: qualityData.stats ? qualityData.stats.deprecated : 0,
      packages: qualityData.results ? qualityData.results.map(r => ({
        package: r.package,
        version: r.version,
        healthScore: r.healthScore,
        status: r.status,
        severity: r.severity,
        lastPublish: r.lastPublish,
        daysSincePublish: r.daysSincePublish,
        maintainerStatus: r.maintainerStatus,
        deprecated: r.deprecated
      })) : []
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
    predictiveWarnings: predictiveWarnings.map(warning => ({
      package: warning.package,
      severity: warning.severity,
      title: warning.title,
      description: warning.description,
      recommendation: warning.recommendation,
      githubData: warning.data ? {
        totalIssues: warning.data.totalIssues,
        recentIssues: warning.data.recentIssues,
        criticalIssues: warning.data.criticalIssues,
        trend: warning.data.trend,
        repoUrl: warning.data.repoUrl
      } : null
    })),
    recommendations: {
      total: recommendations.length,
      critical: recommendations.filter(r => r.priority.level === 1).length,
      high: recommendations.filter(r => r.priority.level === 2).length,
      medium: recommendations.filter(r => r.priority.level === 3).length,
      low: recommendations.filter(r => r.priority.level === 4).length,
      items: recommendations.map(r => ({
        priority: r.priority.label,
        category: r.category,
        package: r.package || null,
        issue: r.issue,
        action: r.action,
        command: r.command || null,
        impact: r.impact,
        reason: r.reason,
        alternative: r.alternative || null
      }))
    },
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
      heavyPackages: bundleSizes
        .filter(pkg => pkg.size > 1024)
        .map(pkg => ({
          name: pkg.name,
          size: pkg.sizeFormatted
        }))
    },
    licenses: {
      warnings: licenses
        .filter(l => l.type === 'restrictive' || l.type === 'unknown')
        .map(l => ({
          package: l.package,
          license: l.license,
          type: l.type
        }))
    },
    scoreBreakdown: {
      unusedPenalty: score.unusedPenalty,
      outdatedPenalty: score.outdatedPenalty,
      alertsPenalty: score.alertsPenalty,
      securityPenalty: score.securityPenalty
    }
  };
  
  return JSON.stringify(output, null, 2);
}

module.exports = { formatAsJson };