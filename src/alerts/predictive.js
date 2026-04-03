// src/alerts/predictive.js
const { checkGitHubIssues } = require('./github-tracker');

/**
 * Generate predictive warnings based on GitHub activity
 */
async function generatePredictiveWarnings(packages) {
  try {
    const packageNames = Object.keys(packages);
    const githubData = await checkGitHubIssues(packageNames);
    
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

module.exports = {
  generatePredictiveWarnings,
  calculateRiskScore
};