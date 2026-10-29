// test/unit/dependency-graph.test.js
// AR-01: one dependency graph built from the lockfile. Covers correct
// nesting/conflicts (the thing the old top-level-only node_modules/<name>
// lookup got wrong), direct-vs-transitive, and graceful degradation for
// lockfile versions/managers this doesn't support yet.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadDependencyGraph, detectPackageManager, resolveInLockfile } = require('../../src/core/graph');

function makeProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-graph-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return dir;
}

// A small but realistic v3 lockfile: express@4 depends on qs@6.7.0 (nested,
// vulnerable version) while the project also directly depends on a newer
// qs@6.9.0 at the top level — the exact "conflict" scenario the old
// top-level-only lookup couldn't represent.
function fixtureLock() {
  return {
    name: 'fixture',
    version: '1.0.0',
    lockfileVersion: 3,
    packages: {
      '': {
        name: 'fixture',
        version: '1.0.0',
        dependencies: { express: '^4.17.1', qs: '^6.9.0' },
        devDependencies: { jest: '^29.0.0' }
      },
      'node_modules/express': {
        version: '4.17.1',
        dependencies: { qs: '6.7.0' }
      },
      'node_modules/express/node_modules/qs': {
        version: '6.7.0'
      },
      'node_modules/qs': {
        version: '6.9.0'
      },
      'node_modules/jest': {
        version: '29.0.0',
        dev: true
      },
      'node_modules/better-sqlite3': {
        version: '11.10.0',
        hasInstallScript: true,
        license: 'MIT'
      }
    }
  };
}

function makeFixtureProject() {
  return makeProject({
    'package.json': { name: 'fixture', version: '1.0.0', dependencies: { express: '^4.17.1', qs: '^6.9.0' }, devDependencies: { jest: '^29.0.0' } },
    'package-lock.json': fixtureLock(),
    'node_modules/express/package.json': { name: 'express', version: '4.17.1', dependencies: { qs: '6.7.0' } },
    'node_modules/express/node_modules/qs/package.json': { name: 'qs', version: '6.7.0' },
    'node_modules/qs/package.json': { name: 'qs', version: '6.9.0' },
    'node_modules/jest/package.json': { name: 'jest', version: '29.0.0' },
    'node_modules/better-sqlite3/package.json': { name: 'better-sqlite3', version: '11.10.0' }
  });
}

test('detectPackageManager() recognizes npm, pnpm, yarn and no-lockfile', () => {
  const npmDir = makeProject({ 'package-lock.json': '{}' });
  const pnpmDir = makeProject({ 'pnpm-lock.yaml': '' });
  const yarnDir = makeProject({ 'yarn.lock': '' });
  const noneDir = makeProject({});
  try {
    assert.equal(detectPackageManager(npmDir), 'npm');
    assert.equal(detectPackageManager(pnpmDir), 'pnpm');
    assert.equal(detectPackageManager(yarnDir), 'yarn');
    assert.equal(detectPackageManager(noneDir), null);
  } finally {
    [npmDir, pnpmDir, yarnDir, noneDir].forEach(d => fs.rmSync(d, { recursive: true, force: true }));
  }
});

test('loadDependencyGraph() on a pnpm/yarn project reports incomplete rather than silently returning an empty graph as if the project had no dependencies', async () => {
  const dir = makeProject({ 'pnpm-lock.yaml': '' });
  try {
    const graph = await loadDependencyGraph(dir);
    assert.equal(graph.packageManager, 'pnpm');
    assert.equal(graph.incomplete, true);
    assert.match(graph.incompleteReason, /pnpm/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadDependencyGraph() sees both the direct qs@6.9.0 and the nested, vulnerable qs@6.7.0 as distinct nodes', async () => {
  const dir = makeFixtureProject();
  try {
    const graph = await loadDependencyGraph(dir);
    assert.equal(graph.packageManager, 'npm');
    assert.equal(graph.incomplete, undefined);

    assert.ok(graph.nodes.has('qs@6.9.0'));
    assert.ok(graph.nodes.has('qs@6.7.0'));

    const direct = graph.nodes.get('qs@6.9.0');
    assert.equal(direct.direct, true);
    assert.deepEqual(direct.paths, ['node_modules/qs']);

    const nested = graph.nodes.get('qs@6.7.0');
    assert.equal(nested.direct, false);
    assert.deepEqual(nested.paths, ['node_modules/express/node_modules/qs']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadDependencyGraph() builds an edge from express to its nested qs, not the top-level one', async () => {
  const dir = makeFixtureProject();
  try {
    const graph = await loadDependencyGraph(dir);
    const edgeExists = (from, to) => graph.edges.some(([f, t]) => f === from && t === to);

    assert.ok(edgeExists('express@4.17.1', 'qs@6.7.0'), 'express must point at its own nested qs');
    assert.equal(edgeExists('express@4.17.1', 'qs@6.9.0'), false, 'express must not point at the unrelated top-level qs');
    assert.ok(edgeExists('root', 'qs@6.9.0'), 'the root project depends on the top-level qs directly');
    assert.ok(edgeExists('root', 'express@4.17.1'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadDependencyGraph() flags dev dependencies and carries hasInstallScript/license through', async () => {
  const dir = makeFixtureProject();
  try {
    const graph = await loadDependencyGraph(dir);
    assert.equal(graph.nodes.get('jest@29.0.0').dev, true);
    assert.equal(graph.nodes.get('express@4.17.1').dev, false);

    const sqlite = graph.nodes.get('better-sqlite3@11.10.0');
    assert.equal(sqlite.hasInstallScript, true);
    assert.equal(sqlite.license, 'MIT');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadDependencyGraph() reports incomplete for a lockfileVersion 1 file instead of an empty graph', async () => {
  const dir = makeProject({
    'package.json': { name: 'legacy', version: '1.0.0' },
    'package-lock.json': { name: 'legacy', version: '1.0.0', lockfileVersion: 1, dependencies: {} }
  });
  try {
    const graph = await loadDependencyGraph(dir);
    assert.equal(graph.incomplete, true);
    assert.match(graph.incompleteReason, /lockfileVersion 1/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadDependencyGraph() runs against this repo\'s own real lockfile without throwing', async () => {
  const graph = await loadDependencyGraph(path.join(__dirname, '../..'));
  assert.equal(graph.packageManager, 'npm');
  assert.ok(graph.nodes.size > 50, 'this repo has well over 50 installed packages');
  assert.ok(graph.edges.length > 50);
  assert.ok(graph.nodes.has('chalk@4.1.2'));
});

// Edges come from the lockfile's own install paths, so the graph is
// complete before `npm install`/`npm ci` has run — walking node_modules
// found no edges at all in that case.
test('loadDependencyGraph() resolves every edge from the lockfile alone, with no node_modules on disk', async () => {
  const dir = makeProject({
    'package.json': { name: 'fixture', version: '1.0.0', dependencies: { express: '^4.17.1', qs: '^6.9.0' } },
    'package-lock.json': fixtureLock()
  });
  try {
    const graph = await loadDependencyGraph(dir);
    const edges = graph.edges.map(([a, b]) => `${a}->${b}`);
    assert.ok(edges.includes('express@4.17.1->qs@6.7.0'), 'express must link to its own nested qs');
    assert.ok(edges.includes('root->qs@6.9.0'));
    assert.ok(edges.includes('root->express@4.17.1'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// An optional, OS-specific package that isn't installed here still links to
// its own nested dependency; walking the real node_modules from a folder
// that doesn't exist climbed to an unrelated top-level copy instead.
test('resolveInLockfile() prefers the nearest nested copy, then walks up', () => {
  const packages = {
    'node_modules/a': {},
    'node_modules/a/node_modules/shared': {},
    'node_modules/shared': {},
    'node_modules/@scope/b': {},
    'node_modules/@scope/b/node_modules/c': {}
  };
  assert.equal(resolveInLockfile(packages, 'node_modules/a', 'shared'), 'node_modules/a/node_modules/shared');
  assert.equal(resolveInLockfile(packages, 'node_modules/@scope/b', 'shared'), 'node_modules/shared');
  assert.equal(resolveInLockfile(packages, 'node_modules/@scope/b/node_modules/c', 'shared'), 'node_modules/shared');
  assert.equal(resolveInLockfile(packages, '', 'a'), 'node_modules/a');
  assert.equal(resolveInLockfile(packages, '', 'missing'), null);
});
