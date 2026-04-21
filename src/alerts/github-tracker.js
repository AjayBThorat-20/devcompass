// src/alerts/github-tracker.js
const https = require('https');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const GitHubTokenManager = require('../config/github-token');

// Load tracked repositories from data/tracked-repos.json
let TRACKED_REPOS = {};
try {
  const trackedReposPath = path.join(__dirname, '../../data/tracked-repos.json');
  const trackedReposData = JSON.parse(fs.readFileSync(trackedReposPath, 'utf8'));
  TRACKED_REPOS = trackedReposData.repositories || {};
} catch (error) {
  // Fallback to empty object if file not found
  console.warn(chalk.yellow('⚠'), 'Could not load tracked-repos.json, using fallback');
  TRACKED_REPOS = {};
}

/**
 * Make GitHub API request with token support
 */
function makeGitHubRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    const tokenManager = new GitHubTokenManager();
    const token = tokenManager.getToken();

    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    
    const options = {
      hostname: 'api.github.com',
      path: `${path}?${queryString}`,
      method: 'GET',
      headers: {
        'User-Agent': 'DevCompass-CLI',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    // Add token if available
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else if (res.statusCode === 403 || res.statusCode === 429) {
          if (!token) {
            console.log(chalk.yellow('\n⚠'), 'GitHub rate limit exceeded. Configure a token to continue:');
            console.log('  Run:', chalk.cyan('devcompass config --github-token <your-token>'));
            console.log('  Get token:', chalk.cyan('https://github.com/settings/tokens/new'));
            console.log('');
          }
          reject(new Error('GitHub rate limit exceeded'));
        } else if (res.statusCode === 404) {
          reject(new Error('Repository not found'));
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('GitHub API request timeout'));
    });
    
    req.end();
  });
}

/**
 * Fetch GitHub issues for a package
 */
async function fetchGitHubIssues(packageName) {
  if (!packageName || typeof packageName !== 'string') {
    return null;
  }

  const repo = TRACKED_REPOS[packageName];
  
  if (!repo) {
    return null;
  }
  
  try {
    const data = await makeGitHubRequest(`/repos/${repo}/issues`, {
      state: 'open',
      per_page: 100,
      labels: 'bug'
    });
    
    if (!Array.isArray(data)) {
      console.error(`Invalid GitHub response for ${packageName}: expected array`);
      return null;
    }
    
    return analyzeIssues(data, packageName);
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('429')) {
      // Rate limit - already handled in makeGitHubRequest
    } else if (error.message.includes('404')) {
      // Repository not found - silently skip
    } else {
      console.error(`GitHub API error for ${packageName}:`, error.message);
    }
    return null;
  }
}

/**
 * Analyze issues to detect trends
 */
function analyzeIssues(issues, packageName) {
  if (!Array.isArray(issues)) {
    return {
      package: packageName,
      totalIssues: 0,
      last7Days: 0,
      last30Days: 0,
      criticalIssues: 0,
      riskScore: 0,
      trend: 'stable',
      repoUrl: TRACKED_REPOS[packageName] ? `https://github.com/${TRACKED_REPOS[packageName]}` : ''
    };
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  const last7Days = issues.filter(i => {
    if (!i || !i.created_at) return false;
    try {
      return (now - new Date(i.created_at).getTime()) < 7 * day;
    } catch {
      return false;
    }
  }).length;
  
  const last30Days = issues.filter(i => {
    if (!i || !i.created_at) return false;
    try {
      return (now - new Date(i.created_at).getTime()) < 30 * day;
    } catch {
      return false;
    }
  }).length;
  
  const criticalLabels = ['critical', 'security', 'regression', 'breaking'];
  const criticalIssues = issues.filter(issue => {
    if (!issue || !Array.isArray(issue.labels)) return false;
    
    return issue.labels.some(label => {
      if (!label || !label.name) return false;
      return criticalLabels.some(critical => 
        label.name.toLowerCase().includes(critical)
      );
    });
  });
  
  let riskScore = 0;
  if (last7Days > 15) riskScore += 3;
  else if (last7Days > 10) riskScore += 2;
  else if (last7Days > 5) riskScore += 1;
  
  if (criticalIssues.length > 5) riskScore += 2;
  else if (criticalIssues.length > 2) riskScore += 1;
  
  return {
    package: packageName,
    totalIssues: issues.length,
    last7Days,
    last30Days,
    criticalIssues: criticalIssues.length,
    riskScore,
    trend: determineTrend(last7Days, last30Days),
    repoUrl: `https://github.com/${TRACKED_REPOS[packageName]}`
  };
}

/**
 * Determine trend
 */
function determineTrend(last7Days, last30Days) {
  const validLast7 = typeof last7Days === 'number' && !isNaN(last7Days) ? last7Days : 0;
  const validLast30 = typeof last30Days === 'number' && !isNaN(last30Days) ? last30Days : 0;
  
  if (validLast30 === 0) {
    return 'stable';
  }
  
  const weeklyAverage = validLast30 / 4;
  
  if (validLast7 > weeklyAverage * 1.5) {
    return 'increasing';
  } else if (validLast7 < weeklyAverage * 0.5) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Process packages in parallel batches
 */
async function processBatch(packages, concurrency = 5, onProgress) {
  if (!Array.isArray(packages)) {
    return [];
  }

  const validConcurrency = typeof concurrency === 'number' && concurrency > 0 
    ? Math.min(concurrency, 10)
    : 5;

  const results = [];
  const batches = [];
  
  for (let i = 0; i < packages.length; i += validConcurrency) {
    batches.push(packages.slice(i, i + validConcurrency));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    const batchResults = await Promise.allSettled(
      batch.map(async (packageName) => {
        try {
          const result = await fetchGitHubIssues(packageName);
          
          if (onProgress && typeof onProgress === 'function') {
            try {
              const processed = batchIndex * validConcurrency + batch.indexOf(packageName) + 1;
              onProgress(processed, packages.length, packageName);
            } catch {
              // Ignore progress callback errors
            }
          }
          
          return result;
        } catch (error) {
          return null;
        }
      })
    );
    
    results.push(...batchResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)
    );
    
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Check GitHub issues for multiple packages
 */
async function checkGitHubIssues(packages, options = {}) {
  if (!packages || typeof packages !== 'object') {
    return [];
  }

  const { 
    concurrency = 5, 
    onProgress 
  } = options || {};
  
  const results = [];
  const packageNames = Object.keys(packages);
  
  const trackedAndInstalled = packageNames.filter(pkg => {
    if (!pkg || typeof pkg !== 'string') return false;
    return TRACKED_REPOS[pkg] !== undefined;
  });
  
  if (trackedAndInstalled.length === 0) {
    return results;
  }
  
  try {
    const batchResults = await processBatch(trackedAndInstalled, concurrency, onProgress);
    results.push(...batchResults);
  } catch (error) {
    console.error('GitHub batch processing error:', error.message);
  }
  
  return results;
}

/**
 * Get total count of tracked packages
 */
function getTrackedPackageCount() {
  return Object.keys(TRACKED_REPOS).length;
}

/**
 * Get tracked packages by category
 */
function getTrackedPackagesByCategory() {
  return {
    'Web Frameworks': 25,
    'Meta Frameworks': 15,
    'Mobile Frameworks': 10,
    'Backend Frameworks': 20,
    'Build Tools': 25,
    'Testing': 25,
    'Linters & Formatters': 15,
    'TypeScript Tools': 15,
    'State Management': 20,
    'HTTP Clients': 20,
    'Utilities': 50,
    'CSS & Styling': 25,
    'Documentation': 15,
    'Database & ORM': 20,
    'GraphQL': 15,
    'Authentication': 15,
    'Validation': 10,
    'Reactivity': 10,
    'Animation': 10,
    'Charts & Visualization': 15,
    'UI Libraries': 25,
    'Forms': 10,
    'Routing': 10,
    'File Upload': 8,
    'Markdown & Rich Text': 12,
    'Image Processing': 10,
    'Email': 8,
    'WebSockets': 8,
    'Compression': 6,
    'Security': 10,
    'CLI Tools': 15,
    'Performance': 10,
    'Miscellaneous': 20
  };
}

module.exports = {
  checkGitHubIssues,
  fetchGitHubIssues,
  TRACKED_REPOS,
  getTrackedPackageCount,
  getTrackedPackagesByCategory
};