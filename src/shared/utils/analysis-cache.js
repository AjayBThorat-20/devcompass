// src/shared/utils/analysis-cache.js

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { version } = require('../../../package.json');

// `analyze` is documented as read-only, so its cache never lives inside the
// scanned project — it's keyed by a hash of the project path and stored
// alongside the registry/OSV cache in the user's home directory instead.
const CACHE_DIR = path.join(os.homedir(), '.devcompass', 'cache');

function projectHash(projectPath) {
  return crypto.createHash('sha256').update(path.resolve(projectPath)).digest('hex').slice(0, 16);
}

function ensureCacheDir() {
  try { if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (error) { /* silent */ }
}

function getCachePath(projectPath = process.cwd()) {
  return path.join(CACHE_DIR, `${projectHash(projectPath)}-analysis-cache.json`);
}

function getTempCachePath(projectPath = process.cwd()) {
  return path.join(CACHE_DIR, `${projectHash(projectPath)}-analysis-cache.json.tmp`);
}

function saveAnalysisCache(data, projectPath = process.cwd()) {
  try {
    ensureCacheDir();
    const cacheFile = getCachePath(projectPath);
    const cacheTempFile = getTempCachePath(projectPath);
    const cacheData = { ...data, version, savedAt: new Date().toISOString() };

    fs.writeFileSync(cacheTempFile, JSON.stringify(cacheData, null, 2), 'utf8');
    // fs.renameSync already atomically replaces an existing destination on
    // POSIX, so unlinking first (the old behavior) just opened a window where
    // neither the old nor new cache file existed — a crash there silently
    // loses the cache. Only fall back to unlink+rename for Windows, where
    // rename-over-existing-file fails.
    try {
      fs.renameSync(cacheTempFile, cacheFile);
    } catch (renameError) {
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
      fs.renameSync(cacheTempFile, cacheFile);
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('Failed to save analysis cache:', error.message);
    const tempFile = getTempCachePath(projectPath);
    if (fs.existsSync(tempFile)) try { fs.unlinkSync(tempFile); } catch (e) { /* ignore */ }
  }
}

function loadAnalysisCache(projectPath = process.cwd()) {
  try {
    const cacheFile = getCachePath(projectPath);
    if (!fs.existsSync(cacheFile)) return null;
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (!data.version || !data.savedAt) return null;
    const ageMs = Date.now() - new Date(data.savedAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) { fs.unlinkSync(cacheFile); return null; }
    return data;
  } catch (error) {
    if (process.env.DEBUG) console.error('Failed to load analysis cache:', error.message);
    const cacheFile = getCachePath(projectPath);
    if (fs.existsSync(cacheFile)) try { fs.unlinkSync(cacheFile); } catch (e) { /* ignore */ }
    return null;
  }
}

// Used by `devcompass clean --cache`, which clears every project's analysis
// cache from the shared home-directory location, not just the current one.
function clearAllAnalysisCaches() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return 0;
    let count = 0;
    fs.readdirSync(CACHE_DIR).forEach(file => {
      if (file.endsWith('-analysis-cache.json') || file.endsWith('-analysis-cache.json.tmp')) {
        try { fs.unlinkSync(path.join(CACHE_DIR, file)); count++; } catch (error) { /* ignore */ }
      }
    });
    return count;
  } catch (error) { return 0; }
}

module.exports = { saveAnalysisCache, loadAnalysisCache, getCachePath, clearAllAnalysisCaches };
