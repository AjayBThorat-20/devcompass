// src/core/services/policy-gate.js
//
// Policy gates (`--fail-on <severity>`, `--fail-on-license`). A health-score
// threshold (`--ci --threshold`) says whether a project's *overall* state is
// acceptable; a policy gate says whether a *specific kind* of finding is
// acceptable at all, which is what most teams actually want to enforce in CI
// ("no HIGH or CRITICAL findings"), whatever that does to the score.

const { getSeverityWeight } = require('../utils/severity');

const EXIT_CODES = {
  PASS: 0,
  POLICY_VIOLATION: 1,
  INCOMPLETE: 2,
  ERROR: 3
};

const FAIL_ON_LEVELS = ['critical', 'high', 'medium', 'low', 'kev'];

// An unknown level would weigh 0 and match every finding, so it's rejected
// up front instead.
function validateFailOn(failOn) {
  if (failOn === null || failOn === undefined) return null;
  const level = String(failOn).toLowerCase();
  if (!FAIL_ON_LEVELS.includes(level)) {
    throw new Error(`--fail-on must be one of: ${FAIL_ON_LEVELS.join(', ')} (got "${failOn}")`);
  }
  return level;
}

// Any finding at or above the given severity, whatever its type — "fail on
// any HIGH or CRITICAL finding" means exactly that, not just vulnerabilities.
// `kev` (CISA Known Exploited Vulnerabilities) only ever matches a
// vulnerability, since nothing else can be "known exploited".
function matchesSeverityGate(issue, failOn) {
  if (!failOn) return false;
  if (failOn === 'kev') return issue.type === 'security' && !!issue.metadata?.knownExploited;
  return getSeverityWeight(issue.severity) >= getSeverityWeight(failOn.toUpperCase());
}

function licenseId(license) {
  if (typeof license === 'string') return license;
  if (license && typeof license === 'object' && typeof license.type === 'string') return license.type; // pre-SPDX package.json form
  return null;
}

// Whether a package's license (an SPDX expression: "MIT", "(MIT OR
// GPL-3.0-only)", "Apache-2.0 AND BSD-3-Clause") is blocked by the list. A
// dual-licensed "MIT OR GPL-3.0" can be used under MIT, so a package is only
// blocked when every OR-alternative includes a blocked license. A listed
// "GPL-3.0" also covers "GPL-3.0-only", "GPL-3.0-or-later" and "GPL-3.0+".
// Parentheses are dropped rather than parsed — exact for the expressions
// npm packages actually use.
function isLicenseBlocked(license, blockedLicenses) {
  const expression = licenseId(license);
  if (!expression || !blockedLicenses || blockedLicenses.length === 0) return false;
  const blocked = blockedLicenses.map(l => l.toLowerCase());
  const isBlockedId = id => {
    const lower = id.toLowerCase();
    return blocked.some(b => lower === b || lower === `${b}-only` || lower === `${b}-or-later` || lower === `${b}+`);
  };
  return expression
    .replace(/[()]/g, ' ')
    .split(/\s+OR\s+/i)
    .every(alternative => alternative.split(/\s+AND\s+/i).map(s => s.trim()).filter(Boolean).some(isBlockedId));
}

/**
 * @param {Array} issues  findings, after ignores
 * @param {object} policy
 * @param {string|null} [policy.failOn]  one of FAIL_ON_LEVELS
 * @param {string[]} [policy.failOnLicenses]  SPDX ids
 * @param {boolean} [policy.onlyDirect]  ignore anything not declared in package.json
 * @param {Set<string>|null} [policy.directDependencies]  names declared in package.json
 * @param {Array<{name: string, version: string, license: *, direct: boolean}>|null} [policy.packages]
 *   every installed package with its license (from the lockfile). The
 *   license gate checks these — the whole tree, whatever DevCompass rates
 *   the license — and falls back to license findings when it's null.
 * @param {boolean} [policy.incomplete]  some check didn't run or didn't finish
 * @param {boolean} [policy.failOnIncomplete]
 * @returns {{matched: Array, exitCode: number}}
 */
function evaluatePolicy(issues, policy = {}) {
  const {
    failOn = null,
    failOnLicenses = [],
    onlyDirect = false,
    directDependencies = null,
    packages = null,
    incomplete = false,
    failOnIncomplete = false
  } = policy;

  const level = validateFailOn(failOn);
  const licenses = failOnLicenses || [];
  if (!level && licenses.length === 0) return { matched: [], exitCode: EXIT_CODES.PASS };

  const isDirect = name => !directDependencies || directDependencies.has(name);
  const inScope = issues.filter(issue => !onlyDirect || isDirect(issue.name));

  const matched = inScope
    .filter(issue => matchesSeverityGate(issue, level))
    .map(issue => ({ ...issue, matchedBy: 'severity' }));

  if (licenses.length > 0) {
    const alreadyMatched = new Set(matched.filter(m => m.type === 'license').map(m => `${m.name}@${m.version}`));
    const candidates = packages
      ? packages.filter(pkg => !onlyDirect || pkg.direct).map(pkg => ({ name: pkg.name, version: pkg.version, license: licenseId(pkg.license) }))
      : inScope.filter(issue => issue.type === 'license').map(issue => ({ name: issue.name, version: issue.version, license: issue.metadata?.license }));
    for (const candidate of candidates) {
      if (!isLicenseBlocked(candidate.license, licenses)) continue;
      if (alreadyMatched.has(`${candidate.name}@${candidate.version}`)) continue;
      matched.push({ type: 'license', name: candidate.name, version: candidate.version, metadata: { license: candidate.license }, matchedBy: 'license' });
    }
  }

  if (incomplete && failOnIncomplete) {
    return { matched, exitCode: EXIT_CODES.INCOMPLETE };
  }

  return { matched, exitCode: matched.length > 0 ? EXIT_CODES.POLICY_VIOLATION : EXIT_CODES.PASS };
}

module.exports = { evaluatePolicy, validateFailOn, isLicenseBlocked, EXIT_CODES, FAIL_ON_LEVELS };
