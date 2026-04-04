// src/analyzers/security-recommendations.js

/**
 * Priority levels for recommendations
 */
const PRIORITY = {
  CRITICAL: { level: 1, label: 'CRITICAL', color: 'red', emoji: '🔴' },
  HIGH: { level: 2, label: 'HIGH', color: 'orange', emoji: '🟠' },
  MEDIUM: { level: 3, label: 'MEDIUM', color: 'yellow', emoji: '🟡' },
  LOW: { level: 4, label: 'LOW', color: 'gray', emoji: '⚪' }
};

/**
 * Generate actionable recommendations from all security findings
 */
function generateSecurityRecommendations(analysisResults) {
  const recommendations = [];
  
  const {
    supplyChainWarnings = [],
    licenseWarnings = [],
    qualityResults = [],
    securityVulnerabilities = [],
    ecosystemAlerts = [],
    unusedDeps = [],
    outdatedPackages = []
  } = analysisResults;
  
  // 1. Supply Chain Issues (CRITICAL/HIGH)
  for (const warning of supplyChainWarnings) {
    if (warning.type === 'malicious' || warning.severity === 'critical') {
      recommendations.push({
        priority: PRIORITY.CRITICAL,
        category: 'supply_chain',
        package: warning.package,
        issue: warning.message,
        action: `Remove ${warning.package} immediately`,
        command: `npm uninstall ${warning.package}`,
        impact: 'Eliminates critical security risk',
        reason: 'Known malicious package detected'
      });
    } else if (warning.type === 'typosquatting') {
      recommendations.push({
        priority: PRIORITY.HIGH,
        category: 'supply_chain',
        package: warning.package,
        issue: warning.message,
        action: warning.recommendation,
        command: `npm uninstall ${warning.package} && npm install ${warning.official}`,
        impact: 'Prevents potential supply chain attack',
        reason: 'Typosquatting attempt detected'
      });
    } else if (warning.type === 'install_script' && warning.severity === 'high') {
      recommendations.push({
        priority: PRIORITY.HIGH,
        category: 'supply_chain',
        package: warning.package,
        issue: warning.message,
        action: 'Review install script before deployment',
        command: `cat node_modules/${warning.package.split('@')[0]}/package.json`,
        impact: 'Prevents malicious code execution',
        reason: 'Suspicious install script detected'
      });
    }
  }
  
  // 2. License Compliance (HIGH/MEDIUM)
  for (const warning of licenseWarnings) {
    if (warning.severity === 'critical' || warning.severity === 'high') {
      recommendations.push({
        priority: warning.severity === 'critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH,
        category: 'license',
        package: warning.package,
        issue: `${warning.license}: ${warning.message}`,
        action: 'Replace with permissive alternative',
        command: `npm uninstall ${warning.package}`,
        impact: 'Ensures license compliance',
        reason: 'High-risk license detected',
        alternative: 'Search npm for MIT/Apache alternatives'
      });
    }
  }
  
  // 3. Security Vulnerabilities (CRITICAL/HIGH)
  if (securityVulnerabilities.critical > 0 || securityVulnerabilities.high > 0) {
    recommendations.push({
      priority: securityVulnerabilities.critical > 0 ? PRIORITY.CRITICAL : PRIORITY.HIGH,
      category: 'security',
      issue: `${securityVulnerabilities.total} security vulnerabilities detected`,
      action: 'Run npm audit fix to resolve vulnerabilities',
      command: 'npm audit fix',
      impact: `Resolves ${securityVulnerabilities.total} known vulnerabilities`,
      reason: 'Security vulnerabilities in dependencies'
    });
  }
  
  // 4. Ecosystem Alerts (varies by severity)
  for (const alert of ecosystemAlerts) {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      const priority = alert.severity === 'critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH;
      
      recommendations.push({
        priority: priority,
        category: 'ecosystem',
        package: `${alert.package}@${alert.version}`,
        issue: alert.title,
        action: `Upgrade to ${alert.fix}`,
        command: `npm install ${alert.package}@${alert.fix}`,
        impact: 'Resolves known stability/security issue',
        reason: alert.source
      });
    }
  }
  
  // 5. Package Quality Issues (MEDIUM/LOW)
  for (const pkg of qualityResults) {
    if (pkg.status === 'deprecated') {
      recommendations.push({
        priority: PRIORITY.CRITICAL,
        category: 'quality',
        package: pkg.package,
        issue: 'Package is deprecated',
        action: 'Find actively maintained alternative',
        command: `npm uninstall ${pkg.package}`,
        impact: 'Prevents future breaking changes',
        reason: 'Package is no longer maintained',
        healthScore: pkg.healthScore
      });
    } else if (pkg.status === 'abandoned') {
      recommendations.push({
        priority: PRIORITY.HIGH,
        category: 'quality',
        package: pkg.package,
        issue: `Last updated ${Math.floor(pkg.daysSincePublish / 365)} years ago`,
        action: 'Migrate to actively maintained alternative',
        command: `npm uninstall ${pkg.package}`,
        impact: 'Improves long-term stability',
        reason: 'Package appears abandoned',
        healthScore: pkg.healthScore
      });
    } else if (pkg.status === 'stale' && pkg.healthScore < 5) {
      recommendations.push({
        priority: PRIORITY.MEDIUM,
        category: 'quality',
        package: pkg.package,
        issue: `Health score: ${pkg.healthScore}/10`,
        action: 'Consider more actively maintained alternative',
        impact: 'Improves package quality',
        reason: 'Low health score',
        healthScore: pkg.healthScore
      });
    }
  }
  
  // 6. Unused Dependencies (MEDIUM)
  if (unusedDeps.length > 0) {
    const packageList = unusedDeps.map(d => d.name).join(' ');
    recommendations.push({
      priority: PRIORITY.MEDIUM,
      category: 'cleanup',
      issue: `${unusedDeps.length} unused dependencies detected`,
      action: 'Remove unused packages',
      command: `npm uninstall ${packageList}`,
      impact: `Reduces node_modules size, improves security surface`,
      reason: 'Unused dependencies increase attack surface'
    });
  }
  
  // 7. Outdated Packages (LOW)
  const criticalOutdated = outdatedPackages.filter(p => 
    p.updateType === 'major update' && p.current.startsWith('0.')
  );
  
  if (criticalOutdated.length > 0) {
    for (const pkg of criticalOutdated.slice(0, 3)) { // Top 3
      recommendations.push({
        priority: PRIORITY.MEDIUM,
        category: 'updates',
        package: pkg.name,
        issue: `Version ${pkg.current} is pre-1.0 and outdated`,
        action: `Update to ${pkg.latest}`,
        command: `npm install ${pkg.name}@latest`,
        impact: 'Gets bug fixes and improvements',
        reason: 'Pre-1.0 packages change rapidly'
      });
    }
  }
  
  // Sort by priority
  recommendations.sort((a, b) => a.priority.level - b.priority.level);
  
  return recommendations;
}

/**
 * Group recommendations by priority
 */
function groupByPriority(recommendations) {
  return {
    critical: recommendations.filter(r => r.priority.level === 1),
    high: recommendations.filter(r => r.priority.level === 2),
    medium: recommendations.filter(r => r.priority.level === 3),
    low: recommendations.filter(r => r.priority.level === 4)
  };
}

/**
 * Calculate expected impact of following recommendations
 */
function calculateExpectedImpact(recommendations, currentScore) {
  let improvement = 0;
  
  for (const rec of recommendations) {
    switch (rec.priority.level) {
      case 1: // CRITICAL
        improvement += 2.0;
        break;
      case 2: // HIGH
        improvement += 1.5;
        break;
      case 3: // MEDIUM
        improvement += 0.5;
        break;
      case 4: // LOW
        improvement += 0.2;
        break;
    }
  }
  
  const newScore = Math.min(10, currentScore + improvement);
  const percentageIncrease = ((newScore - currentScore) / 10) * 100;
  
  return {
    currentScore,
    expectedScore: Number(newScore.toFixed(1)),
    improvement: Number(improvement.toFixed(1)),
    percentageIncrease: Number(percentageIncrease.toFixed(1)),
    critical: recommendations.filter(r => r.priority.level === 1).length,
    high: recommendations.filter(r => r.priority.level === 2).length,
    medium: recommendations.filter(r => r.priority.level === 3).length,
    low: recommendations.filter(r => r.priority.level === 4).length
  };
}

/**
 * Get top N recommendations
 */
function getTopRecommendations(recommendations, n = 5) {
  return recommendations.slice(0, n);
}

/**
 * Get recommendations by category
 */
function getRecommendationsByCategory(recommendations) {
  return {
    supply_chain: recommendations.filter(r => r.category === 'supply_chain'),
    license: recommendations.filter(r => r.category === 'license'),
    security: recommendations.filter(r => r.category === 'security'),
    ecosystem: recommendations.filter(r => r.category === 'ecosystem'),
    quality: recommendations.filter(r => r.category === 'quality'),
    cleanup: recommendations.filter(r => r.category === 'cleanup'),
    updates: recommendations.filter(r => r.category === 'updates')
  };
}

module.exports = {
  generateSecurityRecommendations,
  groupByPriority,
  calculateExpectedImpact,
  getTopRecommendations,
  getRecommendationsByCategory,
  PRIORITY
};