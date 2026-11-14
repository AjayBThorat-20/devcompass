// test/unit/supply-chain-analyzer.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const dynamicSecurity = require('../../src/features/quality/dynamic-security.service');
const { analyzeSupplyChain, isNonBreakingFix, describeVulnerability } = require('../../src/features/security/supply-chain.analyzer');

// npm audit's fixAvailable is `true`, `false`, or an object with
// `isSemVerMajor`. `!!vuln.fixAvailable` treated the object form as truthy
// regardless of isSemVerMajor, so a fix needing a breaking major upgrade
// was marked safe.
test('isNonBreakingFix(true) is non-breaking', () => {
  assert.equal(isNonBreakingFix(true), true);
});

test('isNonBreakingFix(false) is not non-breaking', () => {
  assert.equal(isNonBreakingFix(false), false);
});

test('isNonBreakingFix({ isSemVerMajor: true }) is not non-breaking', () => {
  assert.equal(isNonBreakingFix({ name: 'qs', version: '6.9.0', isSemVerMajor: true }), false);
});

test('isNonBreakingFix({ isSemVerMajor: false }) is non-breaking', () => {
  assert.equal(isNonBreakingFix({ name: 'qs', version: '6.7.1', isSemVerMajor: false }), true);
});

test('isNonBreakingFix(null) and isNonBreakingFix(undefined) are not non-breaking', () => {
  assert.equal(isNonBreakingFix(null), false);
  assert.equal(isNonBreakingFix(undefined), false);
});

function stubSecurity({ typosquat, audit }) {
  const original = { checkTyposquattingRisk: dynamicSecurity.checkTyposquattingRisk, runNpmAudit: dynamicSecurity.runNpmAudit };
  dynamicSecurity.checkTyposquattingRisk = typosquat;
  dynamicSecurity.runNpmAudit = audit || (async () => ({ vulnerabilities: [], summary: { total: 0 } }));
  return () => Object.assign(dynamicSecurity, original);
}

test('analyzeSupplyChain reports a confirmed typosquat with both download counts', async () => {
  const restore = stubSecurity({
    typosquat: async (name) => (name === 'expres'
      ? { package: 'expres', similarTo: 'express', distance: 1, warning: 'Possible typosquatting - similar to "express"', downloads: 21937, popularDownloads: 598035551 }
      : null)
  });
  try {
    const result = await analyzeSupplyChain('/fake', { expres: '1.0.0', lodash: '4.17.21' });
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].type, 'typosquatting');
    assert.match(result.warnings[0].reason, /598,035,551 downloads a month vs 21,937/);
    assert.equal(result.incomplete, false);
  } finally { restore(); }
});

test('analyzeSupplyChain reports the scan incomplete, not clean, when a match could not be verified', async () => {
  const restore = stubSecurity({
    typosquat: async (name) => (name === 'expres' ? { package: 'expres', similarTo: 'express', distance: 1, unverified: true } : null)
  });
  try {
    const result = await analyzeSupplyChain('/fake', { expres: '1.0.0' });
    assert.equal(result.warnings.length, 0);
    assert.equal(result.incomplete, true);
    assert.match(result.incompleteReason, /expres/);
  } finally { restore(); }
});

test('analyzeSupplyChain does not mark an npm audit fix that needs a major upgrade as auto-fixable', async () => {
  const restore = stubSecurity({
    typosquat: async () => null,
    audit: async () => ({
      vulnerabilities: [
        { package: 'axios', severity: 'high', via: [{ title: 'SSRF' }], fixAvailable: { name: 'axios', version: '1.6.0', isSemVerMajor: true } },
        { package: 'qs', severity: 'high', via: [{ title: 'Prototype pollution' }], fixAvailable: true }
      ],
      summary: { total: 2 }
    })
  });
  try {
    const result = await analyzeSupplyChain('/fake', { axios: '0.21.1' });
    const byName = Object.fromEntries(result.warnings.map(w => [w.package, w]));
    assert.equal(byName.axios.autoFixable, false);
    assert.equal(byName.qs.autoFixable, true);
  } finally { restore(); }
});

// npm audit's `via` mixes advisory objects (with a real `.title`) and plain
// package-name strings (the dependency chain) — using only the strings
// produced descriptions like "body-parser, qs" instead of the actual
// vulnerability title.
test('describeVulnerability() prefers advisory titles from object entries in via', () => {
  const via = ['body-parser', { source: 123, title: 'Prototype pollution', severity: 'high' }, 'qs'];
  assert.equal(describeVulnerability(via), 'Prototype pollution');
});

test('describeVulnerability() falls back to joined package names when via has no objects', () => {
  assert.equal(describeVulnerability(['body-parser', 'qs']), 'body-parser, qs');
});

test('describeVulnerability() falls back to a generic message for empty or malformed via', () => {
  assert.equal(describeVulnerability([]), 'Security vulnerability detected');
  assert.equal(describeVulnerability(null), 'Security vulnerability detected');
});
