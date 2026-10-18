// test/unit/supply-chain-analyzer.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { describeVulnerability } = require('../../src/features/security/supply-chain.analyzer');

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
