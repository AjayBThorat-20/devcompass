// src/cache/manager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = '.devcompass-cache.json';
const CACHE_DURATION = 300000; // 5 minutes in milliseconds (reduced from 1 hour)
const CACHE_VERSION = 2; // Increment when data structure changes (e.g., CVE parser fixes)

/**
 * Get hash of package.json dependencies
 */
function getDependencyHash(projectPath) {
  try {
    const packagePath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packagePath)) {
      return null;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {}
    };
    
    // Create hash of dependency versions
    return crypto.createHash('md5').update(JSON.stringify(deps)).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Load cache from disk
 */
function loadCache(projectPath) {
  try {
    const cachePath = path.join(projectPath, CACHE_FILE);
    
    if (!fs.existsSync(cachePath)) {
      return { version: CACHE_VERSION, depHash: getDependencyHash(projectPath) };
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    // Invalidate cache if version mismatch
    if (!cacheData.version || cacheData.version < CACHE_VERSION) {
      console.log(`Invalidating project cache (v${cacheData.version || 1} → v${CACHE_VERSION})`);
      return { version: CACHE_VERSION, depHash: getDependencyHash(projectPath) };
    }
    
    // Invalidate cache if dependencies changed
    const currentDepHash = getDependencyHash(projectPath);
    if (currentDepHash && cacheData.depHash !== currentDepHash) {
      console.log('Dependencies changed - invalidating cache');
      return { version: CACHE_VERSION, depHash: currentDepHash };
    }
    
    return cacheData;
  } catch (error) {
    return { version: CACHE_VERSION, depHash: getDependencyHash(projectPath) };
  }
}

/**
 * Save cache to disk
 */
function saveCache(projectPath, cacheData) {
  try {
    const cachePath = path.join(projectPath, CACHE_FILE);
    // Always include version and dependency hash
    cacheData.version = CACHE_VERSION;
    cacheData.depHash = getDependencyHash(projectPath);
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (error) {
    // Silent fail - caching is not critical
  }
}

/**
 * Get cached data if still valid
 */
function getCached(projectPath, key) {
  const cache = loadCache(projectPath);
  
  if (!cache[key]) {
    return null;
  }
  
  const cached = cache[key];
  const age = Date.now() - cached.timestamp;
  
  if (age > CACHE_DURATION) {
    return null; // Expired
  }
  
  return cached.data;
}

/**
 * Set cache entry
 */
function setCache(projectPath, key, data) {
  const cache = loadCache(projectPath);
  
  cache[key] = {
    timestamp: Date.now(),
    data: data
  };
  
  saveCache(projectPath, cache);
}

/**
 * Clear all cache
 */
function clearCache(projectPath) {
  try {
    const cachePath = path.join(projectPath, CACHE_FILE);
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch (error) {
    // Silent fail
  }
}

module.exports = {
  getCached,
  setCache,
  clearCache,
  CACHE_VERSION
};