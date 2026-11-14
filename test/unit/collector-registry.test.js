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
    assert.equal(typeof collector.defaultEnabled, 'boolean');
    assert.equal(typeof collector.run, 'function');
    assert.equal(typeof collector.addTo, 'function');
    assert.equal(typeof collector.incompleteMessage, 'string');
  }
});

test('collector ids are unique', () => {
  const ids = COLLECTORS.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

// GitHub's API allows 60 requests an hour without a token, so the two
// checks that call it are opt-in.
test('by default the GitHub-API collectors are off and everything else runs', () => {
  const enabled = resolveEnabledCollectors().map(c => c.id);
  assert.deepEqual(enabled, ['cve', 'license', 'quality', 'security', 'outdated', 'unused']);
});

test('includeEcosystem (--ecosystem) turns on the GitHub-API collectors', () => {
  const enabled = resolveEnabledCollectors({ includeEcosystem: true }).map(c => c.id);
  assert.deepEqual(enabled, ['cve', 'license', 'quality', 'security', 'outdated', 'unused', 'ecosystem', 'predictive']);
});

test('devcompass.config.json checks.<id>.enabled overrides the default either way', () => {
  const enabled = resolveEnabledCollectors({ checksConfig: { unused: { enabled: false }, predictive: { enabled: true } } }).map(c => c.id);
  assert.deepEqual(enabled, ['cve', 'license', 'quality', 'security', 'outdated', 'predictive']);
});

test('offline skips every collector that needs the network, even one the config turned on', () => {
  const enabled = resolveEnabledCollectors({ offline: true, checksConfig: { ecosystem: { enabled: true } } }).map(c => c.id);
  assert.deepEqual(enabled, ['unused']);
});

test('an unknown check id in the config is an error listing the valid ones', () => {
  assert.throws(() => resolveEnabledCollectors({ checksConfig: { typosquat: { enabled: false } } }), /unknown check "typosquat".*valid: cve, license/);
});
