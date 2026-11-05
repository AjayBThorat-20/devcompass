// src/features/quality/dynamic-security.service.js

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { runNpm } = require('../../shared/utils/run-npm');

const securityData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/popular-packages.json'), 'utf8')
);

const POPULAR_PACKAGES = securityData.packages || [];
const WHITELIST = new Set(securityData.whitelist || []);

function checkTyposquatting(packageName) {
  if (!packageName || typeof packageName !== 'string') return null;
  if (WHITELIST.has(packageName)) return null;

  for (const official of POPULAR_PACKAGES) {
    if (official === packageName) continue;
    const distance = editDistance(packageName, official);
    if (distance === 1) {
      return {
        package: packageName,
        similarTo: official,
        distance,
        type: 'typosquat',
        severity: 'high',
        warning: `Possible typosquatting - similar to "${official}"`
      };
    }
  }
  return null;
}

const downloadCountCache = new Map();

// Monthly downloads from npm's download-counts API: 0 when npm has never
// heard of the package (a 404), null when the count couldn't be fetched.
// Cached per process; a project only ever has a handful of candidates.
function fetchDownloadsLastMonth(packageName) {
  if (downloadCountCache.has(packageName)) return downloadCountCache.get(packageName);
  const promise = axios.get(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`, {
    timeout: 5000,
    validateStatus: status => status === 200 || status === 404
  })
    .then(response => (response.status === 404 ? 0 : (typeof response.data?.downloads === 'number' ? response.data.downloads : null)))
    .catch(() => null);
  downloadCountCache.set(packageName, promise);
  return promise;
}

// A name one character away from a popular package is a weak signal on its
// own: it also matches real, unrelated packages (preact/react, vuex/vue,
// nuxi/nuxt, cuid/uuid). Download counts separate the two cleanly — typo
// packages like expres, loadsh and axois get 55-30k downloads a month, all
// from a far more popular look-alike, while the real ones get hundreds of
// thousands to millions (Nov 2026 figures).
const POPULARITY_RATIO_THRESHOLD = 50; // the look-alike must be at least this many times more downloaded
const RARE_DOWNLOADS_THRESHOLD = 100000; // and the flagged package under this many downloads a month

// null: not a typosquat risk. Otherwise the name match, plus both download
// counts — or `unverified: true` when they couldn't be fetched, so the
// caller can report the check as incomplete instead of guessing either way.
async function checkTyposquattingRisk(packageName) {
  const match = checkTyposquatting(packageName);
  if (!match) return null;

  const [downloads, popularDownloads] = await Promise.all([
    module.exports.fetchDownloadsLastMonth(packageName),
    module.exports.fetchDownloadsLastMonth(match.similarTo)
  ]);
  if (downloads === null || popularDownloads === null) return { ...match, unverified: true };

  const isFarMorePopular = popularDownloads >= Math.max(downloads, 1) * POPULARITY_RATIO_THRESHOLD;
  const isRare = downloads < RARE_DOWNLOADS_THRESHOLD;
  if (!isFarMorePopular || !isRare) return null;

  return { ...match, downloads, popularDownloads };
}

async function runNpmAudit(projectPath) {
  // No package-lock.json is an expected reason for npm audit to come back
  // empty — not a failure worth flagging. Any other failure (npm missing,
  // timeout, permission error, unparseable output) with a lockfile present
  // means the audit genuinely didn't run, so callers must not treat the
  // resulting empty vulnerability list as a confirmed clean scan.
  const hasLockfile = fs.existsSync(path.join(projectPath, 'package-lock.json'));

  try {
    // Same helper as fix's npm calls: no shell, npm.cmd resolved on Windows.
    const output = runNpm(['audit', '--json'], { cwd: projectPath, timeout: 30000 });
    return parseAuditData(JSON.parse(output));
  } catch (error) {
    // npm audit exits non-zero whenever it finds vulnerabilities — its
    // normal behavior, not a failed run — so stdout still carries the report.
    if (error.stdout) {
      try {
        return parseAuditData(JSON.parse(error.stdout));
      } catch (parseError) {
        if (process.env.DEBUG) console.error('[dynamic-security] failed to parse npm audit error output:', parseError.message);
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 }, incomplete: hasLockfile };
      }
    }
    if (process.env.DEBUG) console.error('[dynamic-security] npm audit failed:', error.message);
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 }, incomplete: hasLockfile };
  }
}

function parseAuditData(auditData) {
  const vulnerabilities = [];
  let critical = 0, high = 0, moderate = 0, low = 0;

  try {
    if (auditData.vulnerabilities && typeof auditData.vulnerabilities === 'object') {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
        const severity = vuln.severity || 'unknown';
        vulnerabilities.push({
          package: name,
          severity,
          via: Array.isArray(vuln.via) ? vuln.via : [vuln.via],
          fixAvailable: vuln.fixAvailable || false
        });
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'moderate') moderate++;
        else if (severity === 'low') low++;
      }
    } else if (auditData.advisories && typeof auditData.advisories === 'object') {
      for (const advisory of Object.values(auditData.advisories)) {
        const severity = advisory.severity || 'unknown';
        vulnerabilities.push({
          package: advisory.module_name || 'unknown',
          severity,
          via: [advisory.title || 'Unknown vulnerability'],
          fixAvailable: true
        });
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'moderate') moderate++;
        else if (severity === 'low') low++;
      }
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-security] parseAuditData failed:', error.message);
  }

  return { vulnerabilities, summary: { total: vulnerabilities.length, critical, high, moderate, low } };
}

// Edit distance where swapping two adjacent characters also counts as one
// edit (optimal string alignment), not two as in plain Levenshtein — the
// most common typo, and the one behind real typo packages like loadsh
// (lodash) and axois (axios).
function editDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] = str2[i - 1] === str1[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      if (i > 1 && j > 1 && str2[i - 1] === str1[j - 2] && str2[i - 2] === str1[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }
  return matrix[str2.length][str1.length];
}

module.exports = {
  checkTyposquatting,
  checkTyposquattingRisk,
  fetchDownloadsLastMonth,
  runNpmAudit,
  parseAuditData,
  POPULAR_PACKAGES,
  WHITELIST
};