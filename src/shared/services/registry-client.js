// src/shared/services/registry-client.js

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.depcompass', 'cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CONCURRENCY = 5;
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_MEMORY_CACHE_SIZE = 1000;

class LRUCache {
  constructor(maxSize) { this.maxSize = maxSize; this.cache = new Map(); }
  get(key) { if (!this.cache.has(key)) return undefined; const value = this.cache.get(key); this.cache.delete(key); this.cache.set(key, value); return value; }
  set(key, value) { if (this.cache.has(key)) { this.cache.delete(key); } else if (this.cache.size >= this.maxSize) { this.cache.delete(this.cache.keys().next().value); } this.cache.set(key, value); }
  has(key) { return this.cache.has(key); }
  clear() { this.cache.clear(); }
  get size() { return this.cache.size; }
}

const memoryCache = new LRUCache(MAX_MEMORY_CACHE_SIZE);

function ensureCacheDir() { try { if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) { /* silent */ } }

function getCachePath(packageName) {
  const safeName = packageName.replace(/\//g, '__').replace(/@/g, '_at_');
  return path.join(CACHE_DIR, `${safeName}.json`);
}

function isCacheValid(cachePath) {
  try {
    if (!fs.existsSync(cachePath)) return false;
    const stats = fs.statSync(cachePath);
    if (Date.now() - stats.mtimeMs > CACHE_TTL_MS) { fs.unlinkSync(cachePath); return false; }
    return true;
  } catch (error) { return false; }
}

function minimizePackageData(data) {
  if (!data) return null;
  const latest = data['dist-tags']?.latest;
  return { name: data.name, version: latest || data.version, license: data.license, time: { modified: data.time?.modified, [latest || data.version]: data.time?.[latest || data.version] }, deprecated: data.deprecated };
}

function readFromDiskCache(packageName) {
  try {
    const cachePath = getCachePath(packageName);
    if (!isCacheValid(cachePath)) return null;
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (error) { return null; }
}

function writeToDiskCache(packageName, data) {
  try { ensureCacheDir(); fs.writeFileSync(getCachePath(packageName), JSON.stringify(minimizePackageData(data)), 'utf8'); }
  catch (error) { /* silent */ }
}

function httpsGet(url, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: REQUEST_TIMEOUT, headers: { 'Accept': 'application/json', 'User-Agent': 'devcompass-cli' } }, (response) => {
      if (response.statusCode === 429 || (response.statusCode >= 500 && response.statusCode < 600)) {
        if (retryCount < MAX_RETRIES) { setTimeout(() => httpsGet(url, retryCount + 1).then(resolve).catch(reject), INITIAL_RETRY_DELAY * Math.pow(2, retryCount)); return; }
        reject(new Error(`HTTP ${response.statusCode}`)); return;
      }
      if (response.statusCode === 404) { resolve(null); return; }
      if (response.statusCode !== 200) { reject(new Error(`HTTP ${response.statusCode}`)); return; }
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON response')); } });
    });
    request.on('error', (error) => { if (retryCount < MAX_RETRIES) { setTimeout(() => httpsGet(url, retryCount + 1).then(resolve).catch(reject), INITIAL_RETRY_DELAY * Math.pow(2, retryCount)); return; } reject(error); });
    request.on('timeout', () => { request.destroy(); if (retryCount < MAX_RETRIES) { setTimeout(() => httpsGet(url, retryCount + 1).then(resolve).catch(reject), INITIAL_RETRY_DELAY * Math.pow(2, retryCount)); return; } reject(new Error('Request timeout')); });
  });
}

async function fetchPackage(packageName, useCache = true) {
  if (!packageName || typeof packageName !== 'string') return null;
  if (useCache && memoryCache.has(packageName)) return memoryCache.get(packageName);
  if (useCache) { const cached = readFromDiskCache(packageName); if (cached) { memoryCache.set(packageName, cached); return cached; } }
  try {
    const encodedName = encodeURIComponent(packageName).replace('%40', '@');
    const data = await httpsGet(`https://registry.npmjs.org/${encodedName}`);
    if (data) { const minimized = minimizePackageData(data); memoryCache.set(packageName, minimized); writeToDiskCache(packageName, data); return minimized; }
    return data;
  } catch (error) { return null; }
}

async function fetchBatch(packageNames, useCache = true) {
  if (!Array.isArray(packageNames)) return new Map();
  const results = new Map();
  const uniqueNames = [...new Set(packageNames.filter(n => n && typeof n === 'string'))];
  const queue = [...uniqueNames];
  const active = new Set();
  while (queue.length > 0 || active.size > 0) {
    while (active.size < MAX_CONCURRENCY && queue.length > 0) {
      const name = queue.shift();
      const promise = fetchPackage(name, useCache).then(data => { if (data) results.set(name, data); active.delete(promise); }).catch(() => active.delete(promise));
      active.add(promise);
    }
    if (active.size > 0) await Promise.race(active);
  }
  return results;
}

function clearCache() {
  memoryCache.clear();
  try {
    if (fs.existsSync(CACHE_DIR)) {
      fs.readdirSync(CACHE_DIR).forEach(file => { if (file.endsWith('.json')) try { fs.unlinkSync(path.join(CACHE_DIR, file)); } catch (e) { /* silent */ } });
    }
  } catch (error) { /* silent */ }
}

function getCacheStats() {
  let diskCount = 0, diskSize = 0;
  try {
    if (fs.existsSync(CACHE_DIR)) {
      fs.readdirSync(CACHE_DIR).forEach(file => {
        if (file.endsWith('.json')) { diskCount++; diskSize += fs.statSync(path.join(CACHE_DIR, file)).size; }
      });
    }
  } catch (error) { /* silent */ }
  return { memoryCount: memoryCache.size, diskCount, diskSizeMB: (diskSize / (1024 * 1024)).toFixed(2), cacheDir: CACHE_DIR };
}

module.exports = { fetchPackage, fetchBatch, clearCache, getCacheStats };