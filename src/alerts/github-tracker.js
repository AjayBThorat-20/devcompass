// src/alerts/github-tracker.js
const https = require('https');

// GitHub repos we track (you can expand this)
const TRACKED_REPOS = {
  'axios': 'axios/axios',
  'lodash': 'lodash/lodash',
  'moment': 'moment/moment',
  'express': 'expressjs/express',
  'react': 'facebook/react',
  'vue': 'vuejs/core',
  'next': 'vercel/next.js',
  'webpack': 'webpack/webpack',
  'typescript': 'microsoft/TypeScript',
  'eslint': 'eslint/eslint',
  'jest': 'jestjs/jest',
  'prettier': 'prettier/prettier',
  'node-fetch': 'node-fetch/node-fetch',
  'chalk': 'chalk/chalk'
};

/**
 * Fetch GitHub issues for a package
 */
async function fetchGitHubIssues(packageName) {
  const repo = TRACKED_REPOS[packageName];
  
  if (!repo) {
    return null; // Not tracked
  }
  
  try {
    const data = await makeGitHubRequest(`/repos/${repo}/issues`, {
      state: 'open',
      per_page: 100,
      labels: 'bug'
    });
    
    return analyzeIssues(data, packageName);
  } catch (error) {
    console.error(`GitHub API error for ${packageName}:`, error.message);
    return null;
  }
}

/**
 * Make GitHub API request
 */
function makeGitHubRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    
    const options = {
      hostname: 'api.github.com',
      path: `${path}?${queryString}`,
      method: 'GET',
      headers: {
        'User-Agent': 'DevCompass',
        'Accept': 'application/vnd.github.v3+json'
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
            reject(new Error('Failed to parse GitHub response'));
          }
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Analyze issues to detect trends
 */
function analyzeIssues(issues, packageName) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  // Count issues by recency
  const last7Days = issues.filter(i => 
    (now - new Date(i.created_at).getTime()) < 7 * day
  ).length;
  
  const last30Days = issues.filter(i => 
    (now - new Date(i.created_at).getTime()) < 30 * day
  ).length;
  
  // Detect critical issues (high priority labels)
  const criticalLabels = ['critical', 'security', 'regression', 'breaking'];
  const criticalIssues = issues.filter(issue => 
    issue.labels.some(label => 
      criticalLabels.some(critical => 
        label.name.toLowerCase().includes(critical)
      )
    )
  );
  
  // Calculate risk score
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
 * Determine trend (increasing/stable/decreasing)
 */
function determineTrend(last7Days, last30Days) {
  const weeklyAverage = last30Days / 4;
  
  if (last7Days > weeklyAverage * 1.5) {
    return 'increasing';
  } else if (last7Days < weeklyAverage * 0.5) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Check GitHub issues for multiple packages
 */
async function checkGitHubIssues(packages) {
  const results = [];
  
  // Process in batches to avoid rate limits
  for (const packageName of packages) {
    const result = await fetchGitHubIssues(packageName);
    
    if (result) {
      results.push(result);
    }
    
    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

module.exports = {
  checkGitHubIssues,
  fetchGitHubIssues,
  TRACKED_REPOS
};