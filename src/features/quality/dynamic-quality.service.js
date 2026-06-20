// src/features/quality/dynamic-quality.service.js

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const registryClient = require('../../shared/services/registry-client');

const FALLBACK_ALTERNATIVES = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/quality-alternatives.json'), 'utf8')
);

const ABANDONED_THRESHOLD = 36 * 30 * 24 * 60 * 60 * 1000;
const STALE_THRESHOLD = 24 * 30 * 24 * 60 * 60 * 1000;

async function analyzePackage(packageName, version) {
  const packageData = await registryClient.fetchPackage(packageName);
  if (!packageData) return null;
  return analyzePackageData(packageData, version);
}

function analyzePackageData(packageData, installedVersion = null) {
  try {
    const registryVersion = packageData.version;
    const normalizedVersion = semver.coerce(installedVersion || registryVersion)?.version || installedVersion || registryVersion || 'unknown';
    const time = packageData.time || {};
    const modified = time.modified || time[registryVersion] || Date.now();
    const lastPublish = new Date(modified);
    const ageMs = Date.now() - lastPublish;
    const deprecated = packageData.deprecated || false;
    const isAbandoned = ageMs > ABANDONED_THRESHOLD;
    const isStale = ageMs > STALE_THRESHOLD && ageMs <= ABANDONED_THRESHOLD;

    let status = 'healthy', healthScore = 10;
    if (deprecated) { status = 'deprecated'; healthScore = 0; }
    else if (isAbandoned) { status = 'abandoned'; healthScore = 2; }
    else if (isStale) { status = 'stale'; healthScore = 5; }

    const alternative = FALLBACK_ALTERNATIVES[packageData.name] || null;

    return {
      package: packageData.name,
      version: normalizedVersion,
      latestVersion: registryVersion,
      status,
      healthScore,
      lastUpdate: lastPublish.toISOString(),
      ageMonths: Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000)),
      deprecated,
      alternative,
      autoFixable: (deprecated || isAbandoned) && !!alternative
    };
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-quality] Analysis failed:', error.message);
    return null;
  }
}

async function analyzeBatch(packages) {
  const packageNames = packages.map(p => p.name);
  const packageDataMap = await registryClient.fetchBatch(packageNames);
  const results = [];
  for (const pkg of packages) {
    const data = packageDataMap.get(pkg.name);
    if (!data) continue;
    const analysis = analyzePackageData(data, pkg.version);
    if (analysis) results.push(analysis);
  }
  return results;
}

function getAlternative(packageName) { return FALLBACK_ALTERNATIVES[packageName] || null; }

module.exports = { analyzePackage, analyzePackageData, analyzeBatch, getAlternative, FALLBACK_ALTERNATIVES };