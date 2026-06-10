const fs = require('fs');
const path = require('path');
const { loadAnalysisCache } = require('../utils/analysis-cache');

const MAX_CONTEXT_TOKENS = 6000;

async function buildContext(projectPath) {
  try {
    const cache = loadAnalysisCache();

    if (cache && cache.issues) {
      return buildFromCache(cache);
    }

    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return buildEmptyContext(projectPath);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    return {
      project: {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '1.0.0',
        path: projectPath
      },
      analysis: {
        healthScore: 8.0,
        totalIssues: 0,
        outdatedPackages: [],
        majorVersionRisks: [],
        securityIssues: [],
        deprecatedPackages: [],
        topIssues: []
      }
    };
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Context builder failed:', error.message);
    }
    return buildEmptyContext(projectPath);
  }
}

function buildFromCache(cache) {
  const issues = cache.issues || [];

  const outdatedPackages = issues
    .filter(i => i.type === 'outdated')
    .slice(0, 10)
    .map(i => ({
      name: i.name,
      current: i.current || 'unknown',
      latest: i.latest || 'unknown'
    }));

  const majorVersionRisks = outdatedPackages.filter(pkg => {
    if (!pkg.current || !pkg.latest) return false;
    const currentMajor = parseInt(pkg.current.split('.')[0]);
    const latestMajor = parseInt(pkg.latest.split('.')[0]);
    return !isNaN(currentMajor) && !isNaN(latestMajor) && latestMajor > currentMajor;
  });

  const securityIssues = issues
    .filter(i => i.type === 'cve' || i.type === 'security')
    .slice(0, 10)
    .map(i => ({
      name: i.name,
      severity: i.severity || 'MEDIUM'
    }));

  const deprecatedPackages = issues
    .filter(i => i.type === 'quality' || i.type === 'deprecated')
    .slice(0, 10)
    .map(i => ({
      name: i.name,
      message: i.message || 'Package is deprecated'
    }));

  const topIssues = issues
    .sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
    })
    .slice(0, 10)
    .map(i => ({
      name: i.name,
      severity: i.severity,
      message: i.message || 'Issue detected'
    }));

  return {
    project: {
      name: cache.projectName || cache.metadata?.projectName || 'unknown',
      version: cache.version || cache.metadata?.projectVersion || '1.0.0',
      path: cache.metadata?.projectPath || process.cwd()
    },
    analysis: {
      healthScore: cache.healthScore || cache.metadata?.healthScore || 8.0,
      totalIssues: issues.length,
      outdatedPackages,
      majorVersionRisks,
      securityIssues,
      deprecatedPackages,
      topIssues
    }
  };
}

function buildEmptyContext(projectPath) {
  return {
    project: {
      name: 'unknown',
      version: '1.0.0',
      path: projectPath
    },
    analysis: {
      healthScore: 8.0,
      totalIssues: 0,
      outdatedPackages: [],
      majorVersionRisks: [],
      securityIssues: [],
      deprecatedPackages: [],
      topIssues: []
    }
  };
}

function estimateTokens(context) {
  const jsonString = JSON.stringify(context);
  return Math.ceil(jsonString.length / 4);
}

function truncateContext(context, maxTokens = MAX_CONTEXT_TOKENS) {
  let tokens = estimateTokens(context);

  if (tokens <= maxTokens) {
    return context;
  }

  const truncated = { ...context };
  truncated.analysis = { ...context.analysis };

  const reductions = [
    { field: 'outdatedPackages', limit: 5 },
    { field: 'majorVersionRisks', limit: 3 },
    { field: 'securityIssues', limit: 5 },
    { field: 'deprecatedPackages', limit: 3 },
    { field: 'topIssues', limit: 5 }
  ];

  for (const reduction of reductions) {
    if (estimateTokens(truncated) <= maxTokens) {
      break;
    }

    if (truncated.analysis[reduction.field]) {
      truncated.analysis[reduction.field] = truncated.analysis[reduction.field].slice(0, reduction.limit);
    }
  }

  return truncated;
}

module.exports = {
  buildContext,
  estimateTokens,
  truncateContext,
  MAX_CONTEXT_TOKENS
};