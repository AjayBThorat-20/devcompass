// src/shared/utils/json-formatter.js

function formatAsJson(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses, predictiveWarnings = [], supplyChainData = { warnings: [], total: 0 }, licenseRiskData = {}, qualityData = {}, recommendations = []) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeUnused = Array.isArray(unusedDeps) ? unusedDeps : [];
  const safeOutdated = Array.isArray(outdatedDeps) ? outdatedDeps : [];
  const safeBundleSizes = Array.isArray(bundleSizes) ? bundleSizes : [];
  const safeLicenses = Array.isArray(licenses) ? licenses : [];
  const safePredictive = Array.isArray(predictiveWarnings) ? predictiveWarnings : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const supplyChainWarnings = Array.isArray(supplyChainData?.warnings) ? supplyChainData.warnings : [];

  let depvoraVersion = '0.0.0';
  try {
    depvoraVersion = require('../../../package.json').version;
  } catch (error) { /* fallback stays */ }

  const output = {
    version: depvoraVersion,
    timestamp: new Date().toISOString(),
    summary: {
      healthScore: score?.total ?? 0,
      totalDependencies: totalDeps || 0,
      securityVulnerabilities: securityData?.metadata?.total || 0,
      supplyChainWarnings: supplyChainWarnings.length,
      ecosystemAlerts: safeAlerts.length,
      predictiveWarnings: safePredictive.length,
      licenseRisks: licenseRiskData?.warnings ? licenseRiskData.warnings.length : 0,
      qualityIssues: qualityData?.stats ? (qualityData.stats.abandoned || 0) + (qualityData.stats.deprecated || 0) + (qualityData.stats.stale || 0) : 0,
      unusedDependencies: safeUnused.length,
      outdatedPackages: safeOutdated.length,
      heavyPackages: safeBundleSizes.filter(p => p.size > 1024).length,
      licenseWarnings: safeLicenses.filter(l => l.type === 'restrictive' || l.type === 'unknown').length
    },
    security: {
      total: securityData?.metadata?.total || 0,
      critical: securityData?.metadata?.critical || 0,
      high: securityData?.metadata?.high || 0,
      moderate: securityData?.metadata?.moderate || 0,
      low: securityData?.metadata?.low || 0,
      vulnerabilities: (securityData?.vulnerabilities || []).map(v => ({ package: v.name, severity: v.severity, title: v.title, cve: v.cve || null, fixAvailable: v.fixAvailable }))
    },
    supplyChain: {
      total: supplyChainWarnings.length,
      critical: supplyChainWarnings.filter(w => w.severity === 'critical').length,
      high: supplyChainWarnings.filter(w => w.severity === 'high').length,
      medium: supplyChainWarnings.filter(w => w.severity === 'medium').length,
      warnings: supplyChainWarnings.map(w => ({ package: w.package, type: w.type, severity: w.severity, message: w.message || w.description, recommendation: w.recommendation, official: w.official || w.correctPackage || null }))
    },
    licenseRisk: {
      total: licenseRiskData?.warnings ? licenseRiskData.warnings.length : 0,
      projectLicense: licenseRiskData?.projectLicense || 'MIT',
      critical: licenseRiskData?.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'critical').length : 0,
      high: licenseRiskData?.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'high').length : 0,
      medium: licenseRiskData?.warnings ? licenseRiskData.warnings.filter(w => w.severity === 'medium').length : 0,
      warnings: licenseRiskData?.warnings ? licenseRiskData.warnings.map(w => ({ package: w.package, license: w.license, severity: w.severity, type: w.type, message: w.message, recommendation: w.recommendation })) : []
    },
    packageQuality: {
      total: qualityData?.results ? qualityData.results.length : 0,
      healthy: qualityData?.stats?.healthy || 0,
      needsAttention: qualityData?.stats?.needsAttention || 0,
      stale: qualityData?.stats?.stale || 0,
      abandoned: qualityData?.stats?.abandoned || 0,
      deprecated: qualityData?.stats?.deprecated || 0,
      packages: qualityData?.results ? qualityData.results.map(r => ({ package: r.package, version: r.version, healthScore: r.healthScore, status: r.status, lastPublish: r.lastPublish, deprecated: r.deprecated })) : []
    },
    ecosystemAlerts: safeAlerts.map(alert => ({ package: alert.package, version: alert.version, severity: alert.severity, title: alert.title, affected: alert.affected, fix: alert.fix, source: alert.source, reported: alert.reported })),
    predictiveWarnings: safePredictive.map(warning => ({
      package: warning.package,
      severity: warning.severity,
      title: warning.title,
      description: warning.description,
      recommendation: warning.recommendation,
      githubData: warning.data ? { totalIssues: warning.data.totalIssues, recentIssues: warning.data.recentIssues, criticalIssues: warning.data.criticalIssues, trend: warning.data.trend, repoUrl: warning.data.repoUrl } : null
    })),
    recommendations: {
      total: safeRecommendations.length,
      items: safeRecommendations.map(r => ({ priority: r.priority?.label, category: r.category, package: r.package || null, action: r.action, impact: r.impact, reason: r.reason }))
    },
    unusedDependencies: safeUnused.map(dep => ({ name: typeof dep === 'string' ? dep : dep.name })),
    outdatedPackages: safeOutdated.map(dep => ({ name: dep.name, current: dep.current, latest: dep.latest, updateType: dep.updateType || dep.versionsBehind })),
    bundleAnalysis: { heavyPackages: safeBundleSizes.filter(pkg => pkg.size > 1024).map(pkg => ({ name: pkg.name, size: pkg.sizeFormatted })) },
    licenses: { warnings: safeLicenses.filter(l => l.type === 'restrictive' || l.type === 'unknown').map(l => ({ package: l.package, license: l.license, type: l.type })) },
    scoreBreakdown: score?.breakdown || {}
  };

  return JSON.stringify(output, null, 2);
}

module.exports = { formatAsJson };