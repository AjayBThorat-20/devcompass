// src/cache/manager.js
const fs = require('fs');
const path = require('path');

const CACHE_FILE = '.devcompass-cache.json';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Load cache from disk
 */
function loadCache(projectPath) {
  try {
    const cachePath = path.join(projectPath, CACHE_FILE);
    
    if (!fs.existsSync(cachePath)) {
      return {};
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return cacheData;
  } catch (error) {
    return {};
  }
}

/**
 * Save cache to disk
 */
function saveCache(projectPath, cacheData) {
  try {
    const cachePath = path.join(projectPath, CACHE_FILE);
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
  clearCache
};