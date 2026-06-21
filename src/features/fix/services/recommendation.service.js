// src/features/fix/services/recommendation.service.js

const path = require('path');
const fs = require('fs');

const PRIORITY = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../../data/priorities.json'), 'utf8')
);

function generateSecurityRecommendations(analysisResults = {}) {
  const recommendations = [];
  const { supplyChain, licenseRisk, quality, security, ecosystem, unused, outdated } = analysisResults;

  if (supplyChain?.warnings) {
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
      } else if (warning.type === 'typosquatting' || warning.type === 'typosquat') {
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'supply_chain',
          title: 'Replace typosquatting attempt',
          package: warning.package,
          action: warning.correctPackage || warning.official
            ? `npm uninstall ${warning.package} && npm install ${warning.correctPackage || warning.official}`
            : `npm uninstall ${warning.package}`,
          reason: `Similar to legitimate package: ${warning.correctPackage || warning.official}`,
          impact: 'Prevent potential security breach'
        });
      } else if (warning.type === 'install_script') {
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'supply_chain',
          title: 'Review suspicious install script',
          package: warning.package,
          action: `Review the "${warning.package}" script manually before allowing install`,
          reason: warning.description,
          impact: 'Prevent potentially malicious code execution'
        });
      }
    });
  }

  if (licenseRisk?.warnings) {
    licenseRisk.warnings.forEach(warning => {
      if (warning.alternative) {
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'license',
          title: 'Resolve license conflict',
          package: warning.package,
          action: `npm uninstall ${warning.package} && npm install ${warning.alternative.replacement || warning.alternative}`,
          reason: `${warning.license} license may conflict with commercial use`,
          impact: 'Legal compliance ensured'
        });
      } else if (warning.severity === 'critical' || warning.severity === 'high') {
        recommendations.push({
          priority: warning.severity === 'critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH,
          category: 'license',
          title: 'Review license compatibility',
          package: warning.package,
          action: `Review license compatibility for ${warning.package}`,
          reason: `${warning.license} license may conflict with commercial use`,
          impact: 'Legal compliance ensured'
        });
      }
    });
  }

  if (quality?.packages) {
    quality.packages.forEach(pkg => {
      if (pkg.status === 'deprecated' || pkg.status === 'abandoned') {
        const alternative = pkg.alternative?.replacement || pkg.alternative || null;
        recommendations.push({
          priority: PRIORITY.HIGH,
          category: 'quality',
          title: `Replace ${pkg.status} package`,
          package: pkg.package || pkg.name,
          action: alternative
            ? `npm uninstall ${pkg.package || pkg.name} && npm install ${alternative}`
            : `Find actively maintained alternative for ${pkg.package || pkg.name}`,
          reason: `Package is ${pkg.status}`,
          impact: 'Improved stability and security'
        });
      }
    });
  }

  if (security?.vulnerabilities?.length > 0) {
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

  if (ecosystem?.alerts?.length > 0) {
    ecosystem.alerts.forEach(alert => {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        recommendations.push({
          priority: alert.severity === 'critical' ? PRIORITY.CRITICAL : PRIORITY.HIGH,
          category: 'ecosystem',
          title: 'Address known package issue',
          package: alert.package,
          action: alert.fix ? `npm install ${alert.package}@${alert.fix}` : `Review ${alert.package}`,
          reason: alert.issue || alert.title,
          impact: 'Known issues resolved'
        });
      }
    });
  }

  if (Array.isArray(unused) && unused.length > 0) {
    const names = unused.map(u => (typeof u === 'string' ? u : u.name)).filter(Boolean);
    if (names.length > 0) {
      recommendations.push({
        priority: PRIORITY.MEDIUM,
        category: 'cleanup',
        title: 'Clean up unused dependencies',
        package: 'multiple',
        action: `npm uninstall ${names.join(' ')}`,
        reason: `${names.length} unused dependencies detected`,
        impact: 'Reduced bundle size and maintenance burden'
      });
    }
  }

  if (Array.isArray(outdated) && outdated.length > 0) {
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

  recommendations.sort((a, b) => (a.priority?.level || 99) - (b.priority?.level || 99));
  return recommendations;
}

function calculateExpectedImprovement(currentScore, recommendations = []) {
  let improvement = 0;

  recommendations.forEach(rec => {
    switch (rec.priority?.level) {
      case 1: improvement += 2.0; break;
      case 2: improvement += 1.5; break;
      case 3: improvement += 0.5; break;
      case 4: improvement += 0.2; break;
    }
  });

  const safeCurrentScore = typeof currentScore === 'number' ? currentScore : 0;
  const expectedScore = Math.min(safeCurrentScore + improvement, 10);

  return {
    current: safeCurrentScore,
    expected: expectedScore,
    improvement,
    improvementPercent: Math.round((improvement / 10) * 100)
  };
}

module.exports = { generateSecurityRecommendations, calculateExpectedImprovement, PRIORITY };