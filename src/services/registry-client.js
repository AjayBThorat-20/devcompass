//src/services/registry-client.js

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache configuration
const CACHE_DIR = path.join(os.homedir(), '.depcompass', 'cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENCY = 5;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Memory cache for current session
const memoryCache = new Map();

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch (error) {
    // Silent fail - cache is optional
  }
}


function getCachePath(packageName) {
  // Sanitize package name for filesystem
  const safeName = packageName.replace(/\//g, '__').replace(/@/g, '_at_');
  return path.join(CACHE_DIR, `${safeName}.json`);
}


function readFromDiskCache(packageName) {
  try {
    const cachePath = getCachePath(packageName);
    if (!fs.existsSync(cachePath)) return null;
    
    const stats = fs.statSync(cachePath);
    const ageMs = Date.now() - stats.mtimeMs;
    
    // Check if cache is expired
    if (ageMs > CACHE_TTL_MS) {
      fs.unlinkSync(cachePath); // Delete expired cache
      return null;
    }
    
    const data = fs.readFileSync(cachePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}


function writeToDiskCache(packageName, data) {
  try {
    ensureCacheDir();
    const cachePath = getCachePath(packageName);
    fs.writeFileSync(cachePath, JSON.stringify(data), 'utf8');
  } catch (error) {
    // Silent fail - cache is optional
  }
}

function httpsGet(url, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'depcompass-cli'
      }
    }, (response) => {
      // Handle rate limiting (429)
      if (response.statusCode === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          setTimeout(() => {
            httpsGet(url, retryCount + 1).then(resolve).catch(reject);
          }, delay);
          return;
        }
        reject(new Error('Rate limited'));
        return;
      }
      
      // Handle 404 (package not found)
      if (response.statusCode === 404) {
        resolve(null);
        return;
      }
      
      // Handle other errors
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    request.on('error', (error) => {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        setTimeout(() => {
          httpsGet(url, retryCount + 1).then(resolve).catch(reject);
        }, delay);
        return;
      }
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        setTimeout(() => {
          httpsGet(url, retryCount + 1).then(resolve).catch(reject);
        }, delay);
        return;
      }
      reject(new Error('Request timeout'));
    });
  });
}

async function fetchPackage(packageName, useCache = true) {
  if (!packageName || typeof packageName !== 'string') {
    return null;
  }
  
  // Check memory cache first
  if (useCache && memoryCache.has(packageName)) {
    return memoryCache.get(packageName);
  }
  
  // Check disk cache
  if (useCache) {
    const cached = readFromDiskCache(packageName);
    if (cached) {
      memoryCache.set(packageName, cached);
      return cached;
    }
  }
  
  try {
    // Encode package name for URL (handles scoped packages like @org/pkg)
    const encodedName = encodeURIComponent(packageName).replace('%40', '@');
    const url = `https://registry.npmjs.org/${encodedName}`;
    
    const data = await httpsGet(url);
    
    if (data) {
      // Cache the result
      memoryCache.set(packageName, data);
      writeToDiskCache(packageName, data);
    }
    
    return data;
  } catch (error) {
    // Return null on error (package may not exist or network issue)
    return null;
  }
}


async function fetchBatch(packageNames, useCache = true) {
  if (!Array.isArray(packageNames)) {
    return new Map();
  }
  
  const results = new Map();
  const uniqueNames = [...new Set(packageNames.filter(n => n && typeof n === 'string'))];
  
  // Process in batches to limit concurrency
  for (let i = 0; i < uniqueNames.length; i += MAX_CONCURRENCY) {
    const batch = uniqueNames.slice(i, i + MAX_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(name => fetchPackage(name, useCache).then(data => ({ name, data })))
    );
    
    for (const { name, data } of batchResults) {
      if (data) {
        results.set(name, data);
      }
    }
  }
  
  return results;
}

/**
 * Clear all caches (memory and disk)
 */
function clearCache() {
  memoryCache.clear();
  
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        }
      }
    }
  } catch (error) {
    // Silent fail
  }
}

/**
 * Get cache statistics
 * @returns {Object}
 */
function getCacheStats() {
  let diskCount = 0;
  let diskSize = 0;
  
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          diskCount++;
          const stats = fs.statSync(path.join(CACHE_DIR, file));
          diskSize += stats.size;
        }
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return {
    memoryCount: memoryCache.size,
    diskCount,
    diskSizeMB: (diskSize / (1024 * 1024)).toFixed(2),
    cacheDir: CACHE_DIR
  };
}

module.exports = {
  fetchPackage,
  fetchBatch,
  clearCache,
  getCacheStats
};