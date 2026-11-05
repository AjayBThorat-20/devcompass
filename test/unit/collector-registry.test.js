// test/unit/collector-registry.test.js
// The collector registry — every check analyze runs is one entry, and
// resolveEnabledCollectors() decides which of them run.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { COLLECTORS, resolveEnabledCollectors } = require('../../src/features/analyze/collectors');

test('every collector declares the required shape', () => {
  for (const collector of COLLECTORS) {
    assert.equal(typeof collector.id, 'string');
    assert.equal(typeof collector.label, 'string');
    assert.equal(typeof collector.needsNetwork, 'boolean');
    assert.equal(typeof collector.run, 'function');
    assert.equal(typeof collector.addTo, 'function');
    assert.equal(typeof collector.incompleteMessage, 'string');
  }
});

test('collector ids are unique', () => {
  const ids = COLLECTORS.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('by default every collector runs, including the GitHub-API ones', () => {
  const enabled = resolveEnabledCollectors().map(c => c.id);
  assert.deepEqual(enabled, ['cve', 'license', 'quality', 'security', 'outdated', 'unused', 'ecosystem', 'predictive']);
});

test('includeEcosystem: false skips only the GitHub-API collectors', () => {
  const enabled = resolveEnabledCollectors({ includeEcosystem: false }).map(c => c.id);
  assert.deepEqual(enabled, ['cve', 'license', 'quality', 'security', 'outdated', 'unused']);
});
