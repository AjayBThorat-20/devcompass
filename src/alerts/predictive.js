// src/alerts/predictive.js
const { checkGitHubIssues } = require('./github-tracker');

/**
 * Generate predictive warnings based on GitHub activity
 * OPTIMIZED: Only checks packages that are actually installed
 */
async function generatePredictiveWarnings(packages) {
  try {
    // Only check packages that are actually installed
    const installedPackages = Object.keys(packages);
    
    if (installedPackages.length === 0) {
      return [];
    }
    
    // Pass only installed packages to GitHub checker
    const githubData = await checkGitHubIssues(packages);
    
    const warnings = [];
    
    for (const data of githubData) {
      // High risk: many recent issues
      if (data.riskScore >= 3) {
        warnings.push({
          package: data.package,
          severity: 'high',
          type: 'predictive',
          title: 'High bug activity detected',
          description: `${data.last7Days} new issues in last 7 days`,
          recommendation: 'Consider delaying upgrade or monitoring closely',
          data: {
            totalIssues: data.totalIssues,
            recentIssues: data.last7Days,
            criticalIssues: data.criticalIssues,
            trend: data.trend,
            repoUrl: data.repoUrl
          }
        });
      }
      
      // Medium risk: increasing trend
      else if (data.riskScore >= 2 || data.trend === 'increasing') {
        warnings.push({
          package: data.package,
          severity: 'medium',
          type: 'predictive',
          title: 'Increased issue activity',
          description: `${data.last7Days} issues opened recently`,
          recommendation: 'Monitor for stability',
          data: {
            totalIssues: data.totalIssues,
            recentIssues: data.last7Days,
            criticalIssues: data.criticalIssues,
            trend: data.trend,
            repoUrl: data.repoUrl
          }
        });
      }
      
      // Low risk: stable but worth noting
      else if (data.riskScore >= 1) {
        warnings.push({
          package: data.package,
          severity: 'low',
          type: 'predictive',
          title: 'Minor issue activity',
          description: `${data.last7Days} issues in last week`,
          recommendation: 'No immediate action needed',
          data: {
            totalIssues: data.totalIssues,
            recentIssues: data.last7Days,
            trend: data.trend,
            repoUrl: data.repoUrl
          }
        });
      }
    }
    
    return warnings;
  } catch (error) {
    console.error('Error generating predictive warnings:', error.message);
    return [];
  }
}

/**
 * Calculate risk score for a package
 */
function calculateRiskScore(githubData) {
  let score = 0;
  
  // High recent activity
  if (githubData.last7Days > 20) score += 3;
  else if (githubData.last7Days > 10) score += 2;
  else if (githubData.last7Days > 5) score += 1;
  
  // Critical issues
  if (githubData.criticalIssues > 5) score += 2;
  else if (githubData.criticalIssues > 2) score += 1;
  
  // Trend
  if (githubData.trend === 'increasing') score += 1;
  
  return score;
}

/**
 * Get statistics about predictive warnings
 */
function getPredictiveStats(warnings) {
  return {
    total: warnings.length,
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    low: warnings.filter(w => w.severity === 'low').length,
    packages: warnings.map(w => w.package)
  };
}

module.exports = {
  generatePredictiveWarnings,
  calculateRiskScore,
  getPredictiveStats
};