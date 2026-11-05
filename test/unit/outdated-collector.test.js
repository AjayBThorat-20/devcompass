// test/unit/outdated-collector.test.js
// The outdated check used to be `npm-check-updates` (6.3 MB, its own network
// stack). It's now ~40 lines over the registry client this project already
// ships — which means the comparison logic is ours to get right and to test.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const registryClient = require('../../src/shared/services/registry-client');
const { collectOutdatedData, isComparableRange } = require('../../src/features/analyze/collectors/dependency.collector');

function makeProject(pkg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-outdated-test-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', ...pkg }, null, 2));
  return dir;
}

// versionsByName: { name: latest } or { name: { latest, versions: [...] } }
function stubRegistry(versionsByName) {
  const original = registryClient.fetchBatch;
  registryClient.fetchBatch = async (names) => {
    const map = new Map();
    for (const name of names) {
      const entry = versionsByName[name];
      if (!entry) continue;
      map.set(name, typeof entry === 'string' ? { name, version: entry } : { name, version: entry.latest, versions: entry.versions });
    }
    return map;
  };
  return () => { registryClient.fetchBatch = original; };
}

test('isComparableRange accepts semver ranges and rejects protocols/tags it cannot compare', () => {
  assert.equal(isComparableRange('^1.2.3'), true);
  assert.equal(isComparableRange('1.2.3'), true);
  assert.equal(isComparableRange('~7.3.0'), true);
  assert.equal(isComparableRange('>=2 <3'), true);

  assert.equal(isComparableRange('*'), false);
  assert.equal(isComparableRange('latest'), false);
  assert.equal(isComparableRange('workspace:*'), false);
  assert.equal(isComparableRange('file:../local'), false);
  assert.equal(isComparableRange('git+https://github.com/x/y.git'), false);
  assert.equal(isComparableRange('github:user/repo'), false);
  assert.equal(isComparableRange(''), false);
  assert.equal(isComparableRange(undefined), false);
});

test('reports only packages with a newer published version, classified by update type', async () => {
  const dir = makeProject({ dependencies: { chalk: '4.1.2', lodash: '^4.17.15', stable: '2.0.0' } });
  const restore = stubRegistry({ chalk: '6.0.0', lodash: '4.18.1', stable: '2.0.0' });
  try {
    const result = await collectOutdatedData(dir);
    const byName = Object.fromEntries(result.map(r => [r.name, r]));

    assert.equal(byName.chalk.updateType, 'major');
    assert.equal(byName.chalk.latest, '6.0.0');
    assert.equal(byName.lodash.updateType, 'minor');
    assert.equal(byName.stable, undefined, 'a package already at the latest version is not outdated');
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// `wanted` is what the declared range would actually install today — which
// is not the same as the latest published version when the range pins a
// major. npm-check-updates always reported latest here, which was wrong.
test('wanted respects the declared range, latest does not', async () => {
  const dir = makeProject({ dependencies: { pinned: '4.1.2', caret: '^4.17.15' } });
  const restore = stubRegistry({ pinned: '6.0.0', caret: '4.18.1' });
  try {
    const result = await collectOutdatedData(dir);
    const byName = Object.fromEntries(result.map(r => [r.name, r]));

    assert.equal(byName.pinned.latest, '6.0.0');
    assert.equal(byName.pinned.wanted, '4.1.2', 'a pinned range cannot move to a new major');
    assert.equal(byName.caret.wanted, '4.18.1', 'a caret range can move within the major');
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('skips ranges it cannot compare instead of reporting them as outdated', async () => {
  const dir = makeProject({ dependencies: { 'local-pkg': 'file:../local', 'ws-pkg': 'workspace:*', normal: '1.0.0' } });
  const restore = stubRegistry({ normal: '2.0.0' });
  try {
    const result = await collectOutdatedData(dir);
    assert.deepEqual(result.map(r => r.name), ['normal']);
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// CL-09: an empty result must never be indistinguishable from "everything is
// up to date" when the check actually failed.
test('a total registry failure is reported as incomplete, not as "up to date"', async () => {
  const dir = makeProject({ dependencies: { chalk: '4.1.2' } });
  const original = registryClient.fetchBatch;
  registryClient.fetchBatch = async () => new Map();
  try {
    const result = await collectOutdatedData(dir);
    assert.equal(result.length, 0);
    assert.equal(result.incomplete, true);
    assert.match(result.incompleteReason, /registry/i);
  } finally {
    registryClient.fetchBatch = original;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a partial registry failure still reports what resolved, flagged incomplete', async () => {
  const dir = makeProject({ dependencies: { chalk: '4.1.2', 'private-pkg': '1.0.0' } });
  const restore = stubRegistry({ chalk: '6.0.0' }); // private-pkg never resolves
  try {
    const result = await collectOutdatedData(dir);
    assert.deepEqual(result.map(r => r.name), ['chalk']);
    assert.equal(result.incomplete, true);
    assert.match(result.incompleteReason, /1 of 2/);
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a project with no comparable dependencies returns empty without calling the registry', async () => {
  const dir = makeProject({ dependencies: {} });
  let called = false;
  const original = registryClient.fetchBatch;
  registryClient.fetchBatch = async () => { called = true; return new Map(); };
  try {
    const result = await collectOutdatedData(dir);
    assert.deepEqual(result, []);
    assert.equal(called, false);
  } finally {
    registryClient.fetchBatch = original;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// With only "latest" to go on, a caret range behind a new major was reported
// as wanting its own floor version; with the published version list it gets
// the highest version the range actually allows.
test('wanted is the highest published version the range allows, even when latest is a new major', async () => {
  const dir = makeProject({ dependencies: { lodash: '^4.17.15' } });
  const restore = stubRegistry({ lodash: { latest: '5.0.0', versions: ['4.17.15', '4.17.20', '4.17.21', '5.0.0'] } });
  try {
    const [entry] = await collectOutdatedData(dir);
    assert.equal(entry.latest, '5.0.0');
    assert.equal(entry.wanted, '4.17.21');
    assert.equal(entry.updateType, 'major');
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
