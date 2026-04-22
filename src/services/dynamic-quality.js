// src/services/dynamic-quality.js
const path = require('path');
const fs = require('fs');
const registryClient = require('./registry-client');

// Load quality alternatives from JSON
const FALLBACK_ALTERNATIVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/quality-alternatives.json'), 'utf8')
);

// Thresholds (in milliseconds)
const ABANDONED_THRESHOLD = 36 * 30 * 24 * 60 * 60 * 1000; // 36 months
const STALE_THRESHOLD = 24 * 30 * 24 * 60 * 60 * 1000;     // 24 months

/**
 * Analyze a package's quality
 */
async function analyzePackage(packageName, version) {
  try {
    const packageData = await registryClient.getPackageData(packageName, version);
    
    if (!packageData) {
      return null;
    }

    const time = packageData.time || {};
    const modified = time.modified || time[version] || Date.now();
    const lastPublish = new Date(modified);
    const now = new Date();
    const ageMs = now - lastPublish;

    const deprecated = packageData.deprecated || false;
    const isAbandoned = ageMs > ABANDONED_THRESHOLD;
    const isStale = ageMs > STALE_THRESHOLD && ageMs <= ABANDONED_THRESHOLD;

    let status = 'healthy';
    let healthScore = 10;

    if (deprecated) {
      status = 'deprecated';
      healthScore = 0;
    } else if (isAbandoned) {
      status = 'abandoned';
      healthScore = 2;
    } else if (isStale) {
      status = 'stale';
      healthScore = 5;
    } else {
      status = 'healthy';
      healthScore = 10;
    }

    const alternative = getAlternative(packageName);

    return {
      package: packageName,
      version: version,
      status: status,
      healthScore: healthScore,
      lastUpdate: lastPublish.toISOString(),
      ageMonths: Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000)),
      deprecated: deprecated,
      alternative: alternative,
      autoFixable: (deprecated || isAbandoned) && !!alternative
    };
  } catch (error) {
    return null;
  }
}

/**
 * Analyze multiple packages
 */
async function analyzeBatch(packages) {
  const results = [];
  
  for (const pkg of packages) {
    const analysis = await analyzePackage(pkg.name, pkg.version);
    if (analysis) {
      results.push(analysis);
    }
  }

  return results;
}

/**
 * Get project quality summary
 */
function getProjectQualitySummary(analyses) {
  const summary = {
    total: analyses.length,
    healthy: 0,
    stale: 0,
    abandoned: 0,
    deprecated: 0,
    averageHealth: 0
  };

  let totalHealth = 0;

  analyses.forEach(analysis => {
    totalHealth += analysis.healthScore;
    
    switch (analysis.status) {
      case 'healthy':
        summary.healthy++;
        break;
      case 'stale':
        summary.stale++;
        break;
      case 'abandoned':
        summary.abandoned++;
        break;
      case 'deprecated':
        summary.deprecated++;
        break;
    }
  });

  summary.averageHealth = analyses.length > 0 
    ? (totalHealth / analyses.length).toFixed(1) 
    : 0;

  return summary;
}

/**
 * Get alternative for a package
 */
function getAlternative(packageName) {
  return FALLBACK_ALTERNATIVES[packageName] || null;
}

module.exports = {
  analyzePackage,
  analyzeBatch,
  getProjectQualitySummary,
  getAlternative,
  FALLBACK_ALTERNATIVES
};