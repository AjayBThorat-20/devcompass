// src/features/alerts/github-tracker.service.js

const https = require('https');
const path = require('path');
const fs = require('fs');
const GitHubTokenManager = require('../config/github-token.manager');

let TRACKED_REPOS = {};
try {
  const trackedReposPath = path.join(__dirname, '../../../data/tracked-repos.json');
  const trackedReposData = JSON.parse(fs.readFileSync(trackedReposPath, 'utf8'));
  TRACKED_REPOS = trackedReposData.repositories || {};
} catch (error) {
  if (process.env.DEBUG) console.error('Could not load tracked-repos.json:', error.message);
  TRACKED_REPOS = {};
}

function makeGitHubRequest(requestPath, params = {}) {
  return new Promise((resolve, reject) => {
    let token = null;
    try {
      const tokenManager = new GitHubTokenManager();
      token = tokenManager.getToken();
    } catch (error) {
      if (process.env.DEBUG) console.error('Could not read GitHub token:', error.message);
    }

    const queryString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');

    const options = {
      hostname: 'api.github.com',
      path: `${requestPath}?${queryString}`,
      method: 'GET',
      headers: {
        'User-Agent': 'DevCompass-CLI',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else if (res.statusCode === 403 || res.statusCode === 429) {
          reject(new Error('GitHub rate limit exceeded'));
        } else if (res.statusCode === 404) {
          reject(new Error('Repository not found'));
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => reject(new Error(`Network error: ${error.message}`)));
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('GitHub API request timeout')); });
    req.end();
  });
}

async function fetchGitHubIssues(packageName) {
  if (!packageName || typeof packageName !== 'string') return null;

  const repo = TRACKED_REPOS[packageName];
  if (!repo) return null;

  try {
    const data = await makeGitHubRequest(`/repos/${repo}/issues`, {
      state: 'open',
      per_page: 100,
      labels: 'bug'
    });

    if (!Array.isArray(data)) return null;
    return analyzeIssues(data, packageName);
  } catch (error) {
    if (process.env.DEBUG) console.error(`GitHub API error for ${packageName}:`, error.message);
    return null;
  }
}

function analyzeIssues(issues, packageName) {
  const repoUrl = TRACKED_REPOS[packageName] ? `https://github.com/${TRACKED_REPOS[packageName]}` : '';

  if (!Array.isArray(issues)) {
    return { package: packageName, totalIssues: 0, last7Days: 0, last30Days: 0, criticalIssues: 0, riskScore: 0, trend: 'stable', repoUrl };
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const last7Days = issues.filter(i => {
    if (!i?.created_at) return false;
    try { return (now - new Date(i.created_at).getTime()) < 7 * day; } catch { return false; }
  }).length;

  const last30Days = issues.filter(i => {
    if (!i?.created_at) return false;
    try { return (now - new Date(i.created_at).getTime()) < 30 * day; } catch { return false; }
  }).length;

  const criticalLabels = ['critical', 'security', 'regression', 'breaking'];
  const criticalIssues = issues.filter(issue => {
    if (!issue || !Array.isArray(issue.labels)) return false;
    return issue.labels.some(label => label?.name && criticalLabels.some(c => label.name.toLowerCase().includes(c)));
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
    repoUrl
  };
}

function determineTrend(last7Days, last30Days) {
  const validLast7 = typeof last7Days === 'number' && !isNaN(last7Days) ? last7Days : 0;
  const validLast30 = typeof last30Days === 'number' && !isNaN(last30Days) ? last30Days : 0;

  if (validLast30 === 0) return 'stable';

  const weeklyAverage = validLast30 / 4;
  if (validLast7 > weeklyAverage * 1.5) return 'increasing';
  if (validLast7 < weeklyAverage * 0.5) return 'decreasing';
  return 'stable';
}

async function processBatch(packages, concurrency = 5, onProgress) {
  if (!Array.isArray(packages)) return [];

  const validConcurrency = typeof concurrency === 'number' && concurrency > 0 ? Math.min(concurrency, 10) : 5;
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
          if (typeof onProgress === 'function') {
            try {
              const processed = batchIndex * validConcurrency + batch.indexOf(packageName) + 1;
              onProgress(processed, packages.length, packageName);
            } catch { /* ignore progress callback errors */ }
          }
          return result;
        } catch (error) {
          return null;
        }
      })
    );

    results.push(...batchResults.filter(r => r.status === 'fulfilled' && r.value !== null).map(r => r.value));

    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

async function checkGitHubIssues(packages, options = {}) {
  if (!packages || typeof packages !== 'object') return [];

  const { concurrency = 5, onProgress } = options || {};
  const packageNames = Object.keys(packages);
  const trackedAndInstalled = packageNames.filter(pkg => typeof pkg === 'string' && TRACKED_REPOS[pkg] !== undefined);

  if (trackedAndInstalled.length === 0) return [];

  try {
    return await processBatch(trackedAndInstalled, concurrency, onProgress);
  } catch (error) {
    if (process.env.DEBUG) console.error('GitHub batch processing error:', error.message);
    return [];
  }
}

function getTrackedPackageCount() {
  return Object.keys(TRACKED_REPOS).length;
}

module.exports = {
  checkGitHubIssues,
  fetchGitHubIssues,
  TRACKED_REPOS,
  getTrackedPackageCount
};