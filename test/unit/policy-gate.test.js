// test/unit/policy-gate.test.js
// `--fail-on <severity>` / `--fail-on-license` fail CI on a specific kind of
// finding, independent of the aggregate health score.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluatePolicy, validateFailOn, isLicenseBlocked, EXIT_CODES } = require('../../src/core/services/policy-gate');

test('with no policy configured, exits 0 regardless of issues', () => {
  const result = evaluatePolicy([{ type: 'security', severity: 'CRITICAL' }], {});
  assert.equal(result.exitCode, EXIT_CODES.PASS);
  assert.equal(result.matched.length, 0);
});

test('--fail-on high matches HIGH and CRITICAL security issues, not MEDIUM/LOW', () => {
  const issues = [
    { type: 'security', severity: 'CRITICAL' },
    { type: 'security', severity: 'HIGH' },
    { type: 'security', severity: 'MEDIUM' },
    { type: 'security', severity: 'LOW' }
  ];
  const result = evaluatePolicy(issues, { failOn: 'high' });
  assert.equal(result.matched.length, 2);
  assert.equal(result.exitCode, EXIT_CODES.POLICY_VIOLATION);
});

test('--fail-on matches any finding type at or above the severity, not just security', () => {
  const issues = [{ type: 'outdated', severity: 'CRITICAL' }, { type: 'unused', severity: 'HIGH' }, { type: 'quality', severity: 'LOW' }];
  const result = evaluatePolicy(issues, { failOn: 'high' });
  assert.equal(result.matched.length, 2);
  assert.equal(result.exitCode, EXIT_CODES.POLICY_VIOLATION);
});

test('--fail-on kev only ever matches security findings, even if another type claims knownExploited', () => {
  const issues = [{ type: 'outdated', severity: 'CRITICAL', metadata: { knownExploited: true } }];
  const result = evaluatePolicy(issues, { failOn: 'kev' });
  assert.equal(result.matched.length, 0);
});

test('--fail-on-license matches only license issues with a listed license', () => {
  const issues = [
    { type: 'license', metadata: { license: 'AGPL-3.0-only' } },
    { type: 'license', metadata: { license: 'MIT' } }
  ];
  const result = evaluatePolicy(issues, { failOnLicenses: ['AGPL-3.0-only', 'GPL-3.0-only'] });
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].metadata.license, 'AGPL-3.0-only');
});

test('--only-direct excludes findings for packages not declared in package.json', () => {
  const issues = [
    { name: 'qs', type: 'security', severity: 'CRITICAL', metadata: {} },
    { name: 'express', type: 'security', severity: 'CRITICAL', metadata: {} }
  ];
  const result = evaluatePolicy(issues, { failOn: 'high', onlyDirect: true, directDependencies: new Set(['express']) });
  assert.deepEqual(result.matched.map(m => m.name), ['express']);
});

test('an incomplete scan with --fail-on-incomplete exits 2, even with no matching findings', () => {
  const result = evaluatePolicy([], { failOn: 'high', incomplete: true, failOnIncomplete: true });
  assert.equal(result.exitCode, EXIT_CODES.INCOMPLETE);
});

test('an incomplete scan without --fail-on-incomplete falls through to the normal pass/fail result', () => {
  const result = evaluatePolicy([], { failOn: 'high', incomplete: true, failOnIncomplete: false });
  assert.equal(result.exitCode, EXIT_CODES.PASS);
});

test('--fail-on kev matches only findings flagged as known-exploited', () => {
  const issues = [
    { type: 'security', severity: 'LOW', metadata: { knownExploited: true } },
    { type: 'security', severity: 'CRITICAL', metadata: {} }
  ];
  const result = evaluatePolicy(issues, { failOn: 'kev' });
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].metadata.knownExploited, true);
});

// An unknown level would weigh 0 and match every finding.
test('an unknown --fail-on level is rejected instead of matching everything', () => {
  assert.throws(() => evaluatePolicy([{ type: 'unused', severity: 'LOW' }], { failOn: 'severe' }), /--fail-on must be one of: critical, high, medium, low, kev/);
  assert.equal(validateFailOn('HIGH'), 'high');
  assert.equal(validateFailOn(null), null);
});

test('isLicenseBlocked() handles SPDX expressions and -only/-or-later variants', () => {
  assert.equal(isLicenseBlocked('GPL-3.0-only', ['GPL-3.0']), true);
  assert.equal(isLicenseBlocked('GPL-3.0-or-later', ['gpl-3.0']), true);
  assert.equal(isLicenseBlocked('GPL-3.0+', ['GPL-3.0']), true);
  assert.equal(isLicenseBlocked('LGPL-3.0-only', ['GPL-3.0']), false, 'a different license that merely contains the id');
  assert.equal(isLicenseBlocked('(MIT OR GPL-3.0-only)', ['GPL-3.0']), false, 'dual-licensed: usable under MIT');
  assert.equal(isLicenseBlocked('MIT AND GPL-3.0-only', ['GPL-3.0']), true, 'both apply');
  assert.equal(isLicenseBlocked({ type: 'AGPL-3.0' }, ['AGPL-3.0']), true, 'pre-SPDX object form');
  assert.equal(isLicenseBlocked(undefined, ['GPL-3.0']), false);
});

// The license gate used to see only licenses DevCompass had already rated
// risky, and only direct dependencies.
test('--fail-on-license checks every installed package from the lockfile, not just flagged ones', () => {
  const packages = [
    { name: 'express', version: '4.17.1', license: 'MIT', direct: true },
    { name: 'some-transitive', version: '1.0.0', license: 'MPL-2.0', direct: false }
  ];
  const result = evaluatePolicy([], { failOnLicenses: ['MPL-2.0'], packages });
  assert.equal(result.exitCode, EXIT_CODES.POLICY_VIOLATION);
  assert.deepEqual(result.matched.map(m => m.name), ['some-transitive']);

  const directOnly = evaluatePolicy([], { failOnLicenses: ['MPL-2.0'], packages, onlyDirect: true });
  assert.equal(directOnly.exitCode, EXIT_CODES.PASS);
});

test('a package matched by both --fail-on and --fail-on-license is listed once', () => {
  const issues = [{ name: 'gpl-lib', version: '1.0.0', type: 'license', severity: 'HIGH', metadata: { license: 'GPL-3.0-only' } }];
  const packages = [{ name: 'gpl-lib', version: '1.0.0', license: 'GPL-3.0-only', direct: true }];
  const result = evaluatePolicy(issues, { failOn: 'high', failOnLicenses: ['GPL-3.0'], packages });
  assert.equal(result.matched.length, 1);
});
