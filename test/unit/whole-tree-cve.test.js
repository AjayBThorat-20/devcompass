// test/unit/whole-tree-cve.test.js
// The OSV check used to query only package.json's direct dependencies, so a
// vulnerability in a transitive package (e.g. express's nested qs) was found
// only when npm audit also happened to flag it.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const osvClient = require('../../src/features/cve/osv.client');
const cacheManager = require('../../src/features/cve/cache.manager');
const vulnerabilityChecker = require('../../src/features/cve/vulnerability-checker');

function graphOf(ids) {
  const nodes = new Map(ids.map(id => {
    const at = id.lastIndexOf('@');
    return [id, { id, name: id.slice(0, at), version: id.slice(at + 1) }];
  }));
  return { nodes, edges: [], roots: [] };
}

function captureQueries() {
  const original = osvClient.batchQuery;
  const queried = [];
  osvClient.batchQuery = async (packages) => {
    queried.push(...packages.map(p => `${p.name}@${p.version}`));
    return packages.map(p => ({ package: p.name, version: p.version, vulnerabilities: [] }));
  };
  return { queried, restore: () => { osvClient.batchQuery = original; } };
}

const IDS = ['devcompass-tree-express@4.17.1', 'devcompass-tree-qs@6.7.0', 'devcompass-tree-qs@6.9.0'];
const clearCache = () => IDS.forEach(id => { const at = id.lastIndexOf('@'); cacheManager.delete(id.slice(0, at), id.slice(at + 1)); });

test('with a lockfile graph, every installed name@version is checked, including nested duplicates', async () => {
  clearCache();
  const { queried, restore } = captureQueries();
  try {
    await vulnerabilityChecker.checkProject('/fake', { dependencies: { 'devcompass-tree-express': '^4.17.1' } }, { graph: graphOf(IDS) });
    assert.deepEqual(queried.sort(), [...IDS].sort());
  } finally {
    restore();
    clearCache();
  }
});

test('without a usable graph (pnpm/yarn, no lockfile), it falls back to the direct dependencies', async () => {
  clearCache();
  const { queried, restore } = captureQueries();
  try {
    await vulnerabilityChecker.checkProject('/fake', { dependencies: { 'devcompass-tree-express': '4.17.1' } }, { graph: { nodes: new Map(), edges: [], incomplete: true } });
    assert.deepEqual(queried, ['devcompass-tree-express@4.17.1']);
  } finally {
    restore();
    clearCache();
  }
});

// One request per 200 packages, so one slow or rejected chunk doesn't fail
// every package in a large tree.
test('osvClient.batchQuery() splits a large tree into chunks and merges the results', async () => {
  const original = axios.post;
  const sizes = [];
  axios.post = async (url, body) => {
    sizes.push(body.queries.length);
    return { data: { results: body.queries.map(() => ({})) } };
  };
  try {
    const packages = Array.from({ length: 450 }, (_, i) => ({ name: `pkg-${i}`, version: '1.0.0' }));
    const results = await osvClient.batchQuery(packages);
    assert.deepEqual(sizes.sort((a, b) => b - a), [200, 200, 50]);
    assert.equal(results.length, 450);
    assert.deepEqual(results.map(r => r.package), packages.map(p => p.name), 'results keep the input order');
  } finally {
    axios.post = original;
  }
});
