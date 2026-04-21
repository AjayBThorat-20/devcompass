// src/analyzers/package-quality.js
// v3.1.4 - Dynamic quality analysis using npm registry

const { analyzer } = require('../services');

async function analyzePackageQuality(dependencies, githubData = []) {
  const packages = Object.keys(dependencies);
  
  if (packages.length === 0) {
    return {
      results: [],
      stats: {
        total: 0,
        healthy: 0,
        needsAttention: 0,
        stale: 0,
        abandoned: 0,
        deprecated: 0
      }
    };
  }
  
  try {
    // Fetch quality data for all packages dynamically
    const qualityResults = await analyzer.quality.analyzeBatch(packages);
    
    const results = [];
    const stats = {
      total: packages.length,
      healthy: 0,
      needsAttention: 0,
      stale: 0,
      abandoned: 0,
      deprecated: 0
    };
    
    for (const [name, data] of qualityResults) {
      // Find matching GitHub data if available
      const githubMetrics = githubData.find(g => g.package === name);
      
      // Calculate health score
      const healthScore = calculateHealthScore(data, githubMetrics);
      
      // Determine status
      let status = 'healthy';
      if (data.deprecated) {
        status = 'deprecated';
        stats.deprecated++;
      } else if (data.abandoned) {
        status = 'abandoned';
        stats.abandoned++;
      } else if (data.stale) {
        status = 'stale';
        stats.stale++;
      } else if (healthScore < 7) {
        status = 'needs_attention';
        stats.needsAttention++;
      } else {
        stats.healthy++;
      }
      
      // Add to results
      results.push({
        package: name,
        name: name,
        status: status,
        deprecated: data.deprecated,
        abandoned: data.abandoned,
        stale: data.stale,
        lastPublish: data.lastPublish,
        daysSincePublish: data.monthsSinceUpdate ? data.monthsSinceUpdate * 30 : null,
        monthsSinceUpdate: data.monthsSinceUpdate,
        deprecationMessage: data.deprecationMessage,
        alternative: data.alternative,
        healthScore: healthScore,
        githubMetrics: githubMetrics || null,
        autoFixable: data.alternative ? true : false,
        source: data.source
      });
    }
    
    return {
      results,
      stats,
      packages: results.filter(r => r.autoFixable) // For fix command
    };
    
  } catch (error) {
    console.error('[package-quality] Analysis failed:', error.message);
    return {
      results: [],
      stats: {
        total: packages.length,
        healthy: 0,
        needsAttention: 0,
        stale: 0,
        abandoned: 0,
        deprecated: 0
      }
    };
  }
}

function calculateHealthScore(qualityData, githubMetrics) {
  let score = 10;
  
  // Penalize based on maintenance status
  if (qualityData.deprecated) {
    score = 0; // Deprecated = 0
  } else if (qualityData.abandoned) {
    score = 2; // Abandoned = 2
  } else if (qualityData.stale) {
    score = 5; // Stale = 5
  } else if (qualityData.monthsSinceUpdate) {
    // Gradual penalty for age
    const months = qualityData.monthsSinceUpdate;
    if (months > 12) score -= 2;
    else if (months > 6) score -= 1;
  }
  
  // Adjust based on GitHub metrics if available
  if (githubMetrics) {
    const { openIssues, totalIssues, starsCount } = githubMetrics;
    
    // Penalize high issue ratio
    if (totalIssues > 0) {
      const issueRatio = openIssues / totalIssues;
      if (issueRatio > 0.8) score -= 1;
      if (issueRatio > 0.9) score -= 1;
    }
    
    // Bonus for popular packages
    if (starsCount > 10000) score += 0.5;
    if (starsCount > 50000) score += 0.5;
  }
  
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

module.exports = {
  analyzePackageQuality,
  calculateHealthScore
};