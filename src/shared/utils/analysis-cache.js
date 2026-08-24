// src/shared/utils/analysis-cache.js

const fs = require('fs');
const path = require('path');
const OutputManager = require('./output-manager');
const { version } = require('../../../package.json');

function getCachePath(projectPath = process.cwd()) {
  return new OutputManager(projectPath).getCachePath('analysis-cache.json');
}

function getTempCachePath(projectPath = process.cwd()) {
  return new OutputManager(projectPath).getTempPath('analysis-cache.json.tmp');
}

function saveAnalysisCache(data, projectPath = process.cwd()) {
  try {
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

module.exports = { saveAnalysisCache, loadAnalysisCache, getCachePath };