// src/features/analyze/collectors/dependency.collector.js

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const registryClient = require('../../../shared/services/registry-client');
const SemverValidator = require('../../../shared/utils/semver-validator');
const { analyzeUnusedDependencies } = require('./unused-deps.collector');
const logger = require('../../../shared/utils/logger').default;

// A range this can't meaningfully compare against a registry version:
// git/file/link/workspace protocols, tags ("latest"), and "*".
function isComparableRange(range) {
  if (typeof range !== 'string' || range.trim() === '') return false;
  if (/^(git|git\+|https?:|file:|link:|workspace:|npm:|github:)/i.test(range)) return false;
  if (range === '*' || range === 'latest' || range === 'next') return false;
  return semver.validRange(range) !== null;
}

async function collectOutdatedData(projectPath, packageJson = null) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  try {
    if (!packageJson) {
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    }

    const declared = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    const names = Object.keys(declared).filter(name => isComparableRange(declared[name]));
    if (names.length === 0) return [];

    // CL-03/platform: the npm registry client this project already ships,
    // rather than npm-check-updates (6.3 MB, and its own network stack) —
    // "is there a newer version" only needs dist-tags.latest plus semver,
    // and this client already has the 24h disk cache and retry/backoff.
    const registryData = await registryClient.fetchBatch(names);

    if (registryData.size === 0) {
      // Asked about packages and heard nothing back: a network/registry
      // failure, not "everything is up to date" (CL-09).
      const result = [];
      result.incomplete = true;
      result.incompleteReason = 'Could not reach the npm registry for any dependency';
      return result;
    }

    const outdated = [];
    for (const name of names) {
      const data = registryData.get(name);
      const latest = data?.version;
      if (!latest || !semver.valid(latest)) continue;

      const declaredRange = declared[name];
      const current = declaredRange.replace(/^[\^~>=<\s]+/, '');
      const currentCoerced = semver.coerce(current);
      if (!currentCoerced) continue;

      if (!semver.gt(latest, currentCoerced)) continue;

      // What the declared range would actually install today (what `npm
      // update` would move to) — distinct from latest when the range pins a
      // major. A cache entry from before `versions` was kept only knows
      // latest, so it can only tell "latest is in range" from "it isn't".
      const available = Array.isArray(data.versions) && data.versions.length > 0 ? data.versions : [latest, currentCoerced.version];
      outdated.push({
        name,
        current,
        latest,
        wanted: semver.maxSatisfying(available, declaredRange) || current,
        updateType: SemverValidator.getUpdateType(current, latest)
      });
    }

    // Some packages resolved and some didn't (private/unpublished names, or
    // partial registry failure) — report what we have, but don't let it read
    // as a clean bill of health for the ones we never heard about.
    if (registryData.size < names.length) {
      outdated.incomplete = true;
      outdated.incompleteReason = `Could not check ${names.length - registryData.size} of ${names.length} dependencies against the registry`;
    }

    return outdated;
  } catch (error) {
    logger.debug('Outdated collection failed:', error.message);
    // An empty array here is indistinguishable from "everything is up to
    // date" — mark it incomplete so the report says so instead (CL-09).
    const result = [];
    result.incomplete = true;
    result.incompleteReason = error.message;
    return result;
  }
}

async function collectUnusedData(projectPath, packageJson = null) {
  try {
    return await analyzeUnusedDependencies(projectPath, packageJson);
  } catch (error) {
    logger.debug('Unused collection failed:', error.message);
    return [];
  }
}

module.exports = { collectOutdatedData, collectUnusedData, isComparableRange };
