// src/analyzers/security-recommendations.js
const path = require('path');
const fs = require('fs');

// Load priorities from JSON
const PRIORITY = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/priorities.json'), 'utf8')
);

/**
 * Generate prioritized security recommendations based on analysis results
 */
function generateSecurityRecommendations(analysisResults) {
  const recommendations = [];

  const {
    supplyChain,
    licenseRisk,
    quality,
    security,
    ecosystem,
    unused,
    outdated
  } = analysisResults;

  // 1. CRITICAL: Supply chain threats
  if (supplyChain && supplyChain.warnings) {
    supplyChain.warnings.forEach(warning => {
      if (warning.type === 'malicious') {
        recommendations.push({
          priority: PRIORITY.CRITICAL,
          category: 'supply_chain',
          title: 'Remove malicious package',
          package: warning.package,
          action: `npm uninstall ${warning.package}`,
          reason: warning.description,
          impact: 'Critical security risk eliminated'
        });
      } else if (warning.type === 'typosquat') {
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'supply_chain',
          title: 'Replace typosquatting attempt',
          package: warning.package,
          action: `npm uninstall ${warning.package} && npm install ${warning.official}`,
          reason: `Similar to legitimate package: ${warning.official}`,
          impact: 'Prevent potential security breach'
        });
      }
    });
  }

  // 2. HIGH: License conflicts
  if (licenseRisk && licenseRisk.warnings) {
    licenseRisk.warnings.forEach(warning => {
      if (warning.autoFixable) {
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'license',
          title: 'Resolve license conflict',
          package: warning.package,
          action: warning.suggestedAlternative
            ? `npm uninstall ${warning.package} && npm install ${warning.suggestedAlternative}`
            : `Review license compatibility for ${warning.package}`,
          reason: `${warning.license} license may conflict with commercial use`,
          impact: 'Legal compliance ensured'
        });
      }
    });
  }

  // 3. HIGH: Abandoned/deprecated packages
  if (quality && quality.packages) {
    quality.packages.forEach(pkg => {
      if (pkg.status === 'deprecated' || pkg.status === 'abandoned') {
        const alternative = pkg.alternative || 'Find actively maintained alternative';
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'quality',
          title: `Replace ${pkg.status} package`,
          package: pkg.name,
          action: typeof alternative === 'string'
            ? alternative
            : `npm uninstall ${pkg.name} && npm install ${alternative}`,
          reason: `Package is ${pkg.status}`,
          impact: 'Improved stability and security'
        });
      }
    });
  }

  // 4. MEDIUM: Security vulnerabilities
  if (security && security.vulnerabilities && security.vulnerabilities.length > 0) {
    const criticalVulns = security.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = security.vulnerabilities.filter(v => v.severity === 'high').length;

    if (criticalVulns > 0 || highVulns > 0) {
      recommendations.push({
        priority: PRIORITY.CRITICAL,
        category: 'security',
        title: 'Fix security vulnerabilities',
        package: 'multiple',
        action: 'npm audit fix',
        reason: `${criticalVulns} critical, ${highVulns} high severity vulnerabilities`,
        impact: 'Security vulnerabilities resolved'
      });
    }
  }

  // 5. MEDIUM: Ecosystem alerts
  if (ecosystem && ecosystem.alerts && ecosystem.alerts.length > 0) {
    ecosystem.alerts.forEach(alert => {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        recommendations.push({
          priority: alert.severity === 'critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH,
          category: 'ecosystem',
          title: 'Address known package issue',
          package: alert.package,
          action: alert.fix ? `npm install ${alert.package}@${alert.fix}` : `Review ${alert.package}`,
          reason: alert.issue,
          impact: 'Known issues resolved'
        });
      }
    });
  }

  // 6. LOW: Unused dependencies
  if (unused && unused.length > 0) {
    recommendations.push({
      priority: PRIORITY.MEDIUM,
      category: 'cleanup',
      title: 'Clean up unused dependencies',
      package: 'multiple',
      action: `npm uninstall ${unused.join(' ')}`,
      reason: `${unused.length} unused dependencies detected`,
      impact: 'Reduced bundle size and maintenance burden'
    });
  }

  // 7. LOW: Outdated packages
  if (outdated && outdated.length > 0) {
    const safeUpdates = outdated.filter(pkg => pkg.updateType === 'patch' || pkg.updateType === 'minor');
    if (safeUpdates.length > 0) {
      recommendations.push({
        priority: PRIORITY.LOW,
        category: 'updates',
        title: 'Apply safe updates',
        package: 'multiple',
        action: 'npm update',
        reason: `${safeUpdates.length} packages have safe updates available`,
        impact: 'Bug fixes and minor improvements'
      });
    }
  }

  // Sort by priority level
  recommendations.sort((a, b) => a.priority.level - b.priority.level);

  return recommendations;
}

/**
 * Calculate expected health score improvement
 */
function calculateExpectedImprovement(currentScore, recommendations) {
  let improvement = 0;

  recommendations.forEach(rec => {
    switch (rec.priority.level) {
      case 1: improvement += 2.0; break; // CRITICAL
      case 2: improvement += 1.5; break; // HIGH
      case 3: improvement += 0.5; break; // MEDIUM
      case 4: improvement += 0.2; break; // LOW
    }
  });

  const expectedScore = Math.min(currentScore + improvement, 10);
  return {
    current: currentScore,
    expected: expectedScore,
    improvement: improvement,
    improvementPercent: Math.round((improvement / 10) * 100)
  };
}

module.exports = {
  generateSecurityRecommendations,
  calculateExpectedImprovement,
  PRIORITY
};