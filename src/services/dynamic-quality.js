// src/services/dynamic-quality.js
const registryClient = require('./registry-client');

// Minimal fallback alternatives for offline mode
// Only most common replacements - live data covers everything else
const FALLBACK_ALTERNATIVES = {
  'request': { replacement: 'axios', reason: 'request is deprecated' },
  'moment': { replacement: 'dayjs', reason: 'moment is in maintenance mode' },
  'underscore': { replacement: 'lodash', reason: 'lodash is more actively maintained' },
  'colors': { replacement: 'chalk', reason: 'colors had a malicious release' },
  'faker': { replacement: '@faker-js/faker', reason: 'faker was corrupted, use community fork' },
  'left-pad': { replacement: 'string.prototype.padstart', reason: 'Use native String methods' },
  'node-uuid': { replacement: 'uuid', reason: 'node-uuid is deprecated' },
  'querystring': { replacement: 'qs', reason: 'querystring is legacy' },
  'node-fetch': { replacement: 'undici', reason: 'undici is faster and maintained by Node.js' }
};

// Thresholds for maintenance status
const ABANDONED_THRESHOLD_MONTHS = 36;
const STALE_THRESHOLD_MONTHS = 24;


function monthsSince(date) {
  if (!date) return Infinity;
  const then = new Date(date);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24 * 30));
}

async function analyzePackage(packageName) {
  const result = {
    name: packageName,
    status: 'HEALTHY',
    deprecated: false,
    abandoned: false,
    stale: false,
    lastPublish: null,
    monthsSinceUpdate: null,
    deprecationMessage: null,
    alternative: null,
    source: 'live' // 'live' or 'fallback'
  };
  
  try {
    const data = await registryClient.fetchPackage(packageName);
    
    if (!data) {
      // Package not found - check fallback
      if (FALLBACK_ALTERNATIVES[packageName]) {
        const fallback = FALLBACK_ALTERNATIVES[packageName];
        result.status = 'DEPRECATED';
        result.deprecated = true;
        result.alternative = fallback.replacement;
        result.deprecationMessage = fallback.reason;
        result.source = 'fallback';
      }
      return result;
    }
    
    // Check deprecation status from registry
    const latestVersion = data['dist-tags']?.latest;
    const latestData = latestVersion ? data.versions?.[latestVersion] : null;
    
    if (latestData?.deprecated || data.deprecated) {
      result.deprecated = true;
      result.status = 'DEPRECATED';
      result.deprecationMessage = latestData?.deprecated || data.deprecated || 'Package is deprecated';
    }
    
    // Check maintenance status
    const timeData = data.time || {};
    const lastModified = timeData.modified || timeData[latestVersion];
    
    if (lastModified) {
      result.lastPublish = lastModified;
      result.monthsSinceUpdate = monthsSince(lastModified);
      
      if (result.monthsSinceUpdate >= ABANDONED_THRESHOLD_MONTHS) {
        result.abandoned = true;
        if (result.status === 'HEALTHY') {
          result.status = 'ABANDONED';
        }
      } else if (result.monthsSinceUpdate >= STALE_THRESHOLD_MONTHS) {
        result.stale = true;
        if (result.status === 'HEALTHY') {
          result.status = 'STALE';
        }
      }
    }
    
    // Check fallback for known alternatives
    if (FALLBACK_ALTERNATIVES[packageName]) {
      result.alternative = FALLBACK_ALTERNATIVES[packageName].replacement;
    }
    
    return result;
  } catch (error) {
    // Network error - check fallback
    if (FALLBACK_ALTERNATIVES[packageName]) {
      const fallback = FALLBACK_ALTERNATIVES[packageName];
      result.status = 'DEPRECATED';
      result.deprecated = true;
      result.alternative = fallback.replacement;
      result.deprecationMessage = fallback.reason;
      result.source = 'fallback';
    }
    return result;
  }
}

async function analyzeBatch(packageNames) {
  if (!Array.isArray(packageNames)) {
    return new Map();
  }
  
  const results = new Map();
  
  // Fetch all packages in parallel
  const packageData = await registryClient.fetchBatch(packageNames);
  
  // Analyze each package
  for (const name of packageNames) {
    if (!name || typeof name !== 'string') continue;
    
    const data = packageData.get(name);
    
    if (data) {
      // We have live data
      const result = {
        name,
        status: 'HEALTHY',
        deprecated: false,
        abandoned: false,
        stale: false,
        lastPublish: null,
        monthsSinceUpdate: null,
        deprecationMessage: null,
        alternative: FALLBACK_ALTERNATIVES[name]?.replacement || null,
        source: 'live'
      };
      
      // Check deprecation
      const latestVersion = data['dist-tags']?.latest;
      const latestData = latestVersion ? data.versions?.[latestVersion] : null;
      
      if (latestData?.deprecated || data.deprecated) {
        result.deprecated = true;
        result.status = 'DEPRECATED';
        result.deprecationMessage = latestData?.deprecated || data.deprecated || 'Package is deprecated';
      }
      
      // Check maintenance
      const timeData = data.time || {};
      const lastModified = timeData.modified || timeData[latestVersion];
      
      if (lastModified) {
        result.lastPublish = lastModified;
        result.monthsSinceUpdate = monthsSince(lastModified);
        
        if (result.monthsSinceUpdate >= ABANDONED_THRESHOLD_MONTHS) {
          result.abandoned = true;
          if (result.status === 'HEALTHY') result.status = 'ABANDONED';
        } else if (result.monthsSinceUpdate >= STALE_THRESHOLD_MONTHS) {
          result.stale = true;
          if (result.status === 'HEALTHY') result.status = 'STALE';
        }
      }
      
      results.set(name, result);
    } else {
      // Check fallback
      if (FALLBACK_ALTERNATIVES[name]) {
        const fallback = FALLBACK_ALTERNATIVES[name];
        results.set(name, {
          name,
          status: 'DEPRECATED',
          deprecated: true,
          abandoned: false,
          stale: false,
          lastPublish: null,
          monthsSinceUpdate: null,
          deprecationMessage: fallback.reason,
          alternative: fallback.replacement,
          source: 'fallback'
        });
      } else {
        // Unknown package
        results.set(name, {
          name,
          status: 'UNKNOWN',
          deprecated: false,
          abandoned: false,
          stale: false,
          lastPublish: null,
          monthsSinceUpdate: null,
          deprecationMessage: null,
          alternative: null,
          source: 'none'
        });
      }
    }
  }
  
  return results;
}


async function getProjectQualitySummary(packageNames) {
  const results = await analyzeBatch(packageNames);
  
  const summary = {
    total: packageNames.length,
    healthy: 0,
    deprecated: 0,
    abandoned: 0,
    stale: 0,
    unknown: 0,
    issues: []
  };
  
  for (const [name, data] of results) {
    switch (data.status) {
      case 'HEALTHY':
        summary.healthy++;
        break;
      case 'DEPRECATED':
        summary.deprecated++;
        summary.issues.push({
          package: name,
          type: 'deprecated',
          message: data.deprecationMessage,
          alternative: data.alternative
        });
        break;
      case 'ABANDONED':
        summary.abandoned++;
        summary.issues.push({
          package: name,
          type: 'abandoned',
          message: `No updates in ${data.monthsSinceUpdate} months`,
          alternative: data.alternative
        });
        break;
      case 'STALE':
        summary.stale++;
        summary.issues.push({
          package: name,
          type: 'stale',
          message: `No updates in ${data.monthsSinceUpdate} months`,
          alternative: data.alternative
        });
        break;
      default:
        summary.unknown++;
    }
  }
  
  return summary;
}

function getAlternative(packageName) {
  return FALLBACK_ALTERNATIVES[packageName]?.replacement || null;
}

module.exports = {
  analyzePackage,
  analyzeBatch,
  getProjectQualitySummary,
  getAlternative,
  FALLBACK_ALTERNATIVES
};