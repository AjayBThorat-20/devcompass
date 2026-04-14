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
        } else if (res.statusCode === 404) {
          reject(new Error('Package not found'));
        } else if (res.statusCode === 429) {
          reject(new Error('Rate limit exceeded'));
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
  if (!dateString) return 0;
  
  try {
    const publishDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - publishDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate package health score (0-10)
 */
function calculateHealthScore(packageData, githubData = null) {
  let score = 10;
  
  // ✅ FIXED: Validate packageData structure
  if (!packageData || typeof packageData !== 'object') {
    return 5; // Default score for invalid data
  }
  
  // Get latest version info with safety checks
  const latestVersion = packageData['dist-tags']?.latest;
  const versionData = latestVersion ? packageData.versions?.[latestVersion] : null;
  const time = latestVersion ? packageData.time?.[latestVersion] : null;
  
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
  if (githubData && typeof githubData === 'object') {
    const { totalIssues = 0, last7Days = 0, last30Days = 0 } = githubData;
    
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
  // ✅ FIXED: Add input validation
  const validScore = typeof score === 'number' && !isNaN(score) ? score : 5;
  const validDaysSince = typeof daysSince === 'number' && !isNaN(daysSince) ? daysSince : 0;
  
  if (validScore === 0) {
    return {
      status: 'DEPRECATED',
      color: 'red',
      severity: 'critical',
      label: 'DEPRECATED'
    };
  } else if (validScore < 3 || validDaysSince > 365 * 3) {
    return {
      status: 'ABANDONED',
      color: 'red',
      severity: 'critical',
      label: 'ABANDONED'
    };
  } else if (validScore < 5 || validDaysSince > 365 * 2) {
    return {
      status: 'STALE',
      color: 'yellow',
      severity: 'high',
      label: 'STALE'
    };
  } else if (validScore < 7) {
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
  // ✅ FIXED: Add null checks
  if (!packageData || typeof packageData !== 'object') {
    return 'unknown';
  }
  
  const maintainers = packageData.maintainers || [];
  const latestVersion = packageData['dist-tags']?.latest;
  const time = latestVersion ? packageData.time?.[latestVersion] : null;
  
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
  // ✅ FIXED: Add input validation
  const validDays = typeof daysSince === 'number' && !isNaN(daysSince) ? daysSince : 0;
  
  if (validDays < 30) {
    return `${validDays} days ago`;
  } else if (validDays < 365) {
    const months = Math.floor(validDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(validDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Analyze package quality for all dependencies
 */
async function analyzePackageQuality(dependencies, githubData = []) {
  // ✅ FIXED: Validate inputs
  if (!dependencies || typeof dependencies !== 'object') {
    return {
      total: 0,
      healthy: 0,
      needsAttention: 0,
      stale: 0,
      abandoned: 0,
      deprecated: 0,
      packages: []
    };
  }

  // ✅ FIXED: Ensure githubData is always an array
  const safeGithubData = Array.isArray(githubData) ? githubData : [];

  // Load quality fixer for alternative suggestions
  let qualityFixer = null;
  try {
    const QualityFixer = require('../utils/quality-fixer');
    qualityFixer = new QualityFixer();
  } catch (error) {
    // Quality fixer not available, continue without alternatives
  }

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
  for (const data of safeGithubData) {
    if (data && data.package) {
      githubLookup[data.package] = data;
    }
  }
  
  // Analyze each package (limit to prevent rate limiting)
  const packages = Object.keys(dependencies).slice(0, 20); // Analyze first 20
  
  for (const packageName of packages) {
    // ✅ FIXED: Skip invalid package names
    if (!packageName || typeof packageName !== 'string') {
      continue;
    }

    try {
      stats.total++;
      
      // Fetch package info from npm
      const packageData = await fetchNpmPackageInfo(packageName);
      
      // ✅ FIXED: Validate packageData before proceeding
      if (!packageData || typeof packageData !== 'object') {
        console.error(`Invalid package data for ${packageName}`);
        continue;
      }
      
      // Calculate health score
      const github = githubLookup[packageName];
      const healthScore = calculateHealthScore(packageData, github);
      
      // Get latest version info
      const latestVersion = packageData['dist-tags']?.latest;
      const time = latestVersion ? packageData.time?.[latestVersion] : null;
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
      
      // Check for alternative packages (only if qualityFixer is available)
      let alternative = null;
      if (qualityFixer) {
        try {
          alternative = qualityFixer.findAlternative(packageName);
        } catch (error) {
          // Alternative lookup failed, continue without it
        }
      }
      
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
        deprecated: latestVersion && packageData.versions?.[latestVersion]?.deprecated ? true : false,
        // Auto-fix metadata
        autoFixable: isAutoFixable,
        autoFixAction: isAutoFixable ? 'replace' : null,
        suggestedAlternative: alternative ? alternative.recommended : null,
        allAlternatives: alternative ? alternative.alternatives : null,
        migrationGuide: alternative ? alternative.migration_guide : null,
        requiresConfirmation: true,
        reason: alternative 
          ? alternative.reason 
          : getQualityRecommendation({ 
              status: statusInfo.status, 
              healthScore, 
              daysSincePublish: daysSince 
            }).recommendation
      };
      
      // Add GitHub metrics if available
      if (github && typeof github === 'object') {
        result.githubMetrics = {
          totalIssues: github.totalIssues || 0,
          recentIssues: github.last30Days || 0,
          trend: github.trend || 'stable'
        };
      }
      
      results.push(result);
      
      // Small delay to respect npm registry rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      // ✅ FIXED: Better error handling with specific error types
      if (error.message === 'Rate limit exceeded') {
        console.error(`Rate limit hit while analyzing ${packageName}, skipping remaining packages`);
        break; // Stop analyzing more packages
      } else if (error.message === 'Package not found') {
        // Skip packages that don't exist
        continue;
      } else {
        console.error(`Error analyzing ${packageName}:`, error.message);
        // Continue with next package
      }
    }
  }
  
  // ✅ FIXED: Return consistent structure with results instead of packages
  return {
    total: results.length,
    healthy: stats.healthy,
    needsAttention: stats.needsAttention,
    stale: stats.stale,
    abandoned: stats.abandoned,
    deprecated: stats.deprecated,
    results: results,  // Return as 'results'
    packages: results, // Also keep as 'packages' for backward compatibility
    stats: stats       // Also include stats object
  };
}

/**
 * Get quality recommendations for a package
 */
function getQualityRecommendation(packageResult) {
  // ✅ FIXED: Add input validation
  if (!packageResult || typeof packageResult !== 'object') {
    return {
      action: 'none',
      message: 'No data available',
      recommendation: 'Unable to provide recommendation'
    };
  }

  const { 
    status = 'UNKNOWN', 
    healthScore = 5, 
    daysSincePublish = 0, 
    maintainerStatus = 'unknown' 
  } = packageResult;
  
  if (status === 'DEPRECATED') {
    return {
      action: 'critical',
      message: 'Package is deprecated',
      recommendation: 'Find an actively maintained alternative immediately'
    };
  }
  
  if (status === 'ABANDONED') {
    const years = Math.floor(daysSincePublish / 365);
    return {
      action: 'high',
      message: `Last updated ${years} year${years > 1 ? 's' : ''} ago`,
      recommendation: 'Migrate to an actively maintained alternative'
    };
  }
  
  if (status === 'STALE') {
    const months = Math.floor(daysSincePublish / 30);
    return {
      action: 'medium',
      message: `Not updated in ${months} month${months > 1 ? 's' : ''} ago`,
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