// src/core/config/project-config.js
//
// devcompass.config.json: a project-level policy and ignore list, checked in
// next to package.json so the whole team (and CI) runs with the same rules.
//
// Rules:
// - Every ignore entry needs a `reason`, so accepted risks are visible to
//   the next reader, not silently swallowed.
// - An expired ignore stops suppressing its finding — the finding reappears
//   (and can fail a policy gate again) instead of staying hidden forever.
// - Anything this file doesn't recognize is an error, not silently skipped:
//   a typo like "failon" must not quietly turn a CI gate off.
// - CLI flags override the file, and the file overrides built-in defaults.
//   This module only loads and validates; merging with flags is the caller's
//   job (analyze), as is checking `checks` keys against the real check ids.

const fs = require('fs');
const path = require('path');
const { validateFailOn } = require('../services/policy-gate');

const CONFIG_FILENAME = 'devcompass.config.json';
const TOP_LEVEL_KEYS = ['$schema', 'failOn', 'ignore', 'checks'];
const IGNORE_KEYS = ['id', 'package', 'rule', 'reason', 'expires'];

const DEFAULT_CONFIG = Object.freeze({
  path: null,
  schema: null,
  failOn: Object.freeze({ severity: null, licenses: Object.freeze([]) }),
  ignore: Object.freeze([]),
  checks: Object.freeze({})
});

function loadProjectConfig(projectPath) {
  const configPath = path.join(projectPath, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`${CONFIG_FILENAME} is not valid JSON: ${error.message}`);
  }

  return normalizeConfig(raw, configPath);
}

function fail(message) {
  throw new Error(`${CONFIG_FILENAME}: ${message}`);
}

function normalizeConfig(raw, configPath = null) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('must contain a JSON object');

  const unknown = Object.keys(raw).filter(key => !TOP_LEVEL_KEYS.includes(key));
  if (unknown.length > 0) fail(`unknown key${unknown.length > 1 ? 's' : ''} ${unknown.map(k => `"${k}"`).join(', ')} (expected: ${TOP_LEVEL_KEYS.join(', ')})`);

  const failOn = raw.failOn ?? {};
  if (typeof failOn !== 'object' || Array.isArray(failOn)) fail('"failOn" must be an object');
  let severity;
  try {
    severity = validateFailOn(failOn.severity ?? null);
  } catch (error) {
    fail(`failOn.severity ${error.message.replace(/^--fail-on /, '')}`);
  }
  const licenses = failOn.licenses ?? [];
  if (!Array.isArray(licenses) || !licenses.every(l => typeof l === 'string')) fail('failOn.licenses must be an array of license ids');

  const ignore = raw.ignore ?? [];
  if (!Array.isArray(ignore)) fail('"ignore" must be an array');

  const checks = raw.checks ?? {};
  if (typeof checks !== 'object' || Array.isArray(checks)) fail('"checks" must be an object');
  for (const [id, entry] of Object.entries(checks)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(`checks.${id} must be an object`);
    const extra = Object.keys(entry).filter(key => key !== 'enabled');
    if (extra.length > 0) fail(`checks.${id} only supports "enabled" (got ${extra.map(k => `"${k}"`).join(', ')})`);
    if (entry.enabled !== undefined && typeof entry.enabled !== 'boolean') fail(`checks.${id}.enabled must be true or false`);
  }

  return {
    path: configPath,
    schema: raw.$schema || null,
    failOn: { severity, licenses },
    ignore: ignore.map(validateIgnoreEntry),
    checks
  };
}

function validateIgnoreEntry(entry, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(`ignore[${index}] must be an object`);
  const unknown = Object.keys(entry).filter(key => !IGNORE_KEYS.includes(key));
  if (unknown.length > 0) fail(`ignore[${index}] has unknown key${unknown.length > 1 ? 's' : ''} ${unknown.map(k => `"${k}"`).join(', ')} (expected: ${IGNORE_KEYS.join(', ')})`);
  if (!entry.reason || typeof entry.reason !== 'string') {
    fail(`ignore[${index}] is missing a required "reason" — every ignored finding needs one so it gets reviewed, not forgotten`);
  }
  if (!entry.id && !entry.package) {
    fail(`ignore[${index}] needs either an "id" (one specific finding) or a "package" (every finding for that package)`);
  }
  // An unparseable date would never compare as expired, so the ignore would
  // silently last forever.
  if (entry.expires !== undefined && (typeof entry.expires !== 'string' || Number.isNaN(Date.parse(entry.expires)))) {
    fail(`ignore[${index}].expires must be a date like "2027-01-31" (got ${JSON.stringify(entry.expires)})`);
  }
  return entry;
}

function isIgnoreExpired(entry, now = new Date()) {
  return !!(entry.expires && new Date(entry.expires) < now);
}

function matchesIgnoreEntry(entry, issue) {
  if (entry.id) return entry.id === issue.id;
  if (entry.package) {
    if (entry.package !== issue.name) return false;
    if (entry.rule) return entry.rule === issue.type || entry.rule === issue.ruleId;
    return true;
  }
  return false;
}

// Splits `issues` into what the ignore list actually suppresses vs. what
// survives (including findings whose only matching ignore has expired).
function applyIgnores(issues, config, now = new Date()) {
  if (!config?.ignore || config.ignore.length === 0) {
    return { kept: issues, ignored: [], expired: [] };
  }

  const kept = [];
  const ignored = [];
  const expired = [];

  for (const issue of issues) {
    const match = config.ignore.find(entry => matchesIgnoreEntry(entry, issue));
    if (!match) { kept.push(issue); continue; }
    if (isIgnoreExpired(match, now)) { expired.push({ issue, entry: match }); kept.push(issue); continue; }
    ignored.push({ issue, entry: match });
  }

  return { kept, ignored, expired };
}

module.exports = { loadProjectConfig, normalizeConfig, applyIgnores, matchesIgnoreEntry, isIgnoreExpired, CONFIG_FILENAME, DEFAULT_CONFIG };
