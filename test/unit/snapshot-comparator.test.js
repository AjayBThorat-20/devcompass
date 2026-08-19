// test/unit/snapshot-comparator.test.js
// Regression test: compare.command.js used to call loader.getSnapshot() twice
// per snapshot ID — once to validate existence, then again inside
// comparator.compare() — doubling the SQLite reads on every `devcompass
// compare` run for no behavioral benefit. compare() now accepts already-
// loaded snapshots and only falls back to the loader when it doesn't have them.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('../../src/features/history/snapshot-loader');
const comparator = require('../../src/features/history/snapshot-comparator');

function makeSnapshot(id, healthScore, packages) {
  return {
    snapshot: { id, timestamp: `2026-01-0${id}T00:00:00Z`, health_score: healthScore },
    packages
  };
}

test('compare() uses preloaded snapshots without calling the loader again', () => {
  const snap1 = makeSnapshot(1, 7.0, [{ name: 'lodash', version: '4.17.15', health_score: 6 }]);
  const snap2 = makeSnapshot(2, 8.5, [{ name: 'lodash', version: '4.17.21', health_score: 9 }]);

  let loaderCalls = 0;
  const original = loader.getSnapshot;
  loader.getSnapshot = () => { loaderCalls++; throw new Error('loader.getSnapshot should not be called when snapshots are preloaded'); };

  try {
    const result = comparator.compare(1, 2, snap1, snap2);

    assert.equal(loaderCalls, 0);
    assert.equal(result.summary.snapshot1.healthScore, 7.0);
    assert.equal(result.summary.snapshot2.healthScore, 8.5);
    assert.equal(result.updated.length, 1);
    assert.equal(result.updated[0].name, 'lodash');
  } finally {
    loader.getSnapshot = original;
  }
});

test('compare() falls back to the loader when snapshots are not preloaded', () => {
  const snap1 = makeSnapshot(1, 7.0, []);
  const snap2 = makeSnapshot(2, 7.0, []);

  let loaderCalls = 0;
  const original = loader.getSnapshot;
  loader.getSnapshot = (id) => { loaderCalls++; return id === 1 ? snap1 : snap2; };

  try {
    comparator.compare(1, 2);
    assert.equal(loaderCalls, 2);
  } finally {
    loader.getSnapshot = original;
  }
});
