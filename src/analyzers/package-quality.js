// src/analyzers/package-quality.js
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Fetch package metadata from npm registry
 */
function fetchNpmPackageInfo(packageName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'registry.npmjs.org',
      path: `/${packageName}`,
      method: 'GET',
      headers: {
        'User-Agent': 'DevCompass',
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse npm response'));
          }
        } else {
          reject(new Error(`npm registry returned ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Calculate days since last publish
 */
function daysSincePublish(dateString) {
  const publishDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - publishDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate package health score (0-10)
 */
function calculateHealthScore(packageData, githubData = null) {
  let score = 10;
  
  // Get latest version info
  const latestVersion = packageData['dist-tags']?.latest;
  const versionData = packageData.versions?.[latestVersion];
  const time = packageData.time?.[latestVersion];
  
  if (!versionData || !time) {
    return 5; // Default score if data missing
  }
  
  // 1. Age factor (max -2 points)
  const daysSince = daysSincePublish(time);
  if (daysSince > 365 * 3) {
    score -= 2; // 3+ years old
  } else if (daysSince > 365 * 2) {
    score -= 1.5; // 2-3 years old
  } else if (daysSince > 365) {
    score -= 1; // 1-2 years old
  } else if (daysSince > 180) {
    score -= 0.5; // 6-12 months old
  }
  
  // 2. Maintenance frequency (max -2 points)
  const versions = Object.keys(packageData.versions || {});
  const recentVersions = versions.filter(v => {
    const vTime = packageData.time?.[v];
    if (!vTime) return false;
    return daysSincePublish(vTime) <= 365;
  });
  
  if (recentVersions.length === 0) {
    score -= 2; // No updates in a year
  } else if (recentVersions.length < 3) {
    score -= 1; // Less than 3 updates in a year
  }
  
  // 3. GitHub activity (if available) (max -2 points)
  if (githubData) {
    const { totalIssues, last7Days, last30Days } = githubData;
    
    // High issue count with low activity is bad
    if (totalIssues > 100 && last30Days < 5) {
      score -= 1.5; // Many issues, low maintenance
    } else if (totalIssues > 50 && last30Days < 3) {
      score -= 1; // Medium issues, low maintenance
    }
    
    // Very high recent activity might indicate problems
    if (last7Days > 30) {
      score -= 0.5; // Unusually high activity
    }
  }
  
  // 4. Dependencies count (max -1 point)
  const deps = versionData.dependencies || {};
  const depCount = Object.keys(deps).length;
  
  if (depCount > 50) {
    score -= 1; // Too many dependencies
  } else if (depCount > 30) {
    score -= 0.5;
  }
  
  // 5. Has description and repository (max -1 point)
  if (!packageData.description) {
    score -= 0.5;
  }
  if (!packageData.repository) {
    score -= 0.5;
  }
  
  // 6. Deprecated packages (automatic 0)
  if (versionData.deprecated) {
    return 0;
  }
  
  return Math.max(0, Math.min(10, score));
}

/**
 * Determine package status based on health score
 */
function getPackageStatus(score, daysSince) {
  if (score === 0) {
    return {
      status: 'DEPRECATED',
      color: 'red',
      severity: 'critical',
      label: 'DEPRECATED'
    };
  } else if (score < 3 || daysSince > 365 * 3) {
    return {
      status: 'ABANDONED',
      color: 'red',
      severity: 'critical',
      label: 'ABANDONED'
    };
  } else if (score < 5 || daysSince > 365 * 2) {
    return {
      status: 'STALE',
      color: 'yellow',
      severity: 'high',
      label: 'STALE'
    };
  } else if (score < 7) {
    return {
      status: 'NEEDS_ATTENTION',
      color: 'yellow',
      severity: 'medium',
      label: 'NEEDS ATTENTION'
    };
  } else {
    return {
      status: 'HEALTHY',
      color: 'green',
      severity: 'low',
      label: 'HEALTHY'
    };
  }
}

/**
 * Get maintainer activity status
 */
function getMaintainerStatus(packageData) {
  const maintainers = packageData.maintainers || [];
  const latestVersion = packageData['dist-tags']?.latest;
  const time = packageData.time?.[latestVersion];
  
  if (!time) {
    return 'unknown';
  }
  
  const daysSince = daysSincePublish(time);
  
  if (daysSince > 365 * 2) {
    return 'inactive';
  } else if (daysSince > 365) {
    return 'low_activity';
  } else if (daysSince > 180) {
    return 'moderate_activity';
  } else {
    return 'active';
  }
}

/**
 * Format last update time in human-readable format
 */
function formatLastUpdate(daysSince) {
  if (daysSince < 30) {
    return `${daysSince} days ago`;
  } else if (daysSince < 365) {
    const months = Math.floor(daysSince / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(daysSince / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Analyze package quality for all dependencies
 */
async function analyzePackageQuality(dependencies, githubData = []) {
  // Load quality fixer for alternative suggestions
  const QualityFixer = require('../utils/quality-fixer');
  const qualityFixer = new QualityFixer();

  const results = [];
  const stats = {
    total: 0,
    healthy: 0,
    needsAttention: 0,
    stale: 0,
    abandoned: 0,
    deprecated: 0
  };
  
  // Create GitHub data lookup
  const githubLookup = {};
  for (const data of githubData) {
    githubLookup[data.package] = data;
  }
  
  // Analyze each package (limit to prevent rate limiting)
  const packages = Object.keys(dependencies).slice(0, 20); // Analyze first 20
  
  for (const packageName of packages) {
    try {
      stats.total++;
      
      // Fetch package info from npm
      const packageData = await fetchNpmPackageInfo(packageName);
      
      // Calculate health score
      const github = githubLookup[packageName];
      const healthScore = calculateHealthScore(packageData, github);
      
      // Get latest version info
      const latestVersion = packageData['dist-tags']?.latest;
      const time = packageData.time?.[latestVersion];
      const daysSince = time ? daysSincePublish(time) : 0;
      
      // Determine status
      const statusInfo = getPackageStatus(healthScore, daysSince);
      const maintainerStatus = getMaintainerStatus(packageData);
      
      // Count by status
      if (statusInfo.status === 'HEALTHY') {
        stats.healthy++;
      } else if (statusInfo.status === 'NEEDS_ATTENTION') {
        stats.needsAttention++;
      } else if (statusInfo.status === 'STALE') {
        stats.stale++;
      } else if (statusInfo.status === 'ABANDONED') {
        stats.abandoned++;
      } else if (statusInfo.status === 'DEPRECATED') {
        stats.deprecated++;
      }
      
      // Get repository info
      const repository = packageData.repository?.url || '';
      const hasGithub = repository.includes('github.com');
      
      // Check for alternative packages
      const alternative = qualityFixer.findAlternative(packageName);
      
      // Determine if package is auto-fixable
      const isAutoFixable = (
        (statusInfo.status === 'ABANDONED' || statusInfo.status === 'DEPRECATED' || statusInfo.status === 'STALE') &&
        alternative !== null
      );
      
      // Build result
      const result = {
        name: packageName,
        package: packageName,
        version: dependencies[packageName],
        healthScore: Number(healthScore.toFixed(1)),
        status: statusInfo.status,
        severity: statusInfo.severity,
        label: statusInfo.label,
        lastPublish: time ? new Date(time).toISOString().split('T')[0] : 'unknown',
        lastUpdate: formatLastUpdate(daysSince),
        daysSincePublish: daysSince,
        maintainerStatus: maintainerStatus,
        hasRepository: !!packageData.repository,
        hasGithub: hasGithub,
        totalVersions: Object.keys(packageData.versions || {}).length,
        description: packageData.description || '',
        deprecated: packageData.versions?.[latestVersion]?.deprecated || false,
        // Auto-fix metadata
        autoFixable: isAutoFixable,
        autoFixAction: isAutoFixable ? 'replace' : null,
        suggestedAlternative: alternative ? alternative.recommended : null,
        allAlternatives: alternative ? alternative.alternatives : null,
        migrationGuide: alternative ? alternative.migration_guide : null,
        requiresConfirmation: true,
        reason: alternative ? alternative.reason : getQualityRecommendation({ status: statusInfo.status, healthScore, daysSincePublish: daysSince }).recommendation
      };
      
      // Add GitHub metrics if available
      if (github) {
        result.githubMetrics = {
          totalIssues: github.totalIssues,
          recentIssues: github.last30Days,
          trend: github.trend
        };
      }
      
      results.push(result);
      
      // Small delay to respect npm registry rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error analyzing ${packageName}:`, error.message);
      // Continue with next package
    }
  }
  
  return {
    total: results.length,
    healthy: stats.healthy,
    needsAttention: stats.needsAttention,
    stale: stats.stale,
    abandoned: stats.abandoned,
    deprecated: stats.deprecated,
    packages: results
  };
}

/**
 * Get quality recommendations for a package
 */
function getQualityRecommendation(packageResult) {
  const { status, healthScore, daysSincePublish, maintainerStatus } = packageResult;
  
  if (status === 'DEPRECATED') {
    return {
      action: 'critical',
      message: 'Package is deprecated',
      recommendation: 'Find an actively maintained alternative immediately'
    };
  }
  
  if (status === 'ABANDONED') {
    return {
      action: 'high',
      message: `Last updated ${Math.floor(daysSincePublish / 365)} years ago`,
      recommendation: 'Migrate to an actively maintained alternative'
    };
  }
  
  if (status === 'STALE') {
    return {
      action: 'medium',
      message: `Not updated in ${Math.floor(daysSincePublish / 30)} months`,
      recommendation: 'Consider finding a more actively maintained package'
    };
  }
  
  if (status === 'NEEDS_ATTENTION') {
    return {
      action: 'low',
      message: `Health score: ${healthScore}/10`,
      recommendation: 'Monitor for updates and potential alternatives'
    };
  }
  
  return {
    action: 'none',
    message: 'Package is healthy',
    recommendation: 'No action needed'
  };
}

module.exports = {
  analyzePackageQuality,
  calculateHealthScore,
  getPackageStatus,
  getMaintainerStatus,
  getQualityRecommendation,
  fetchNpmPackageInfo
};