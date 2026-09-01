// test/unit/graph-generator.test.js
// Regression coverage for the diamond-dependency fix: a shared transitive
// dependency must render once and be linked from each parent, not be dropped
// as a false cycle (ancestorPath vs. the old whole-run `visited` set), and a
// genuine circular reference must still be flagged as a 'circular' link.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GraphGenerator = require('../../src/features/graph/graph.generator');

function makeFixture(packageJson, packageLock) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'depvora-graph-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson));
  if (packageLock) fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify(packageLock));
  return dir;
}

test('a shared transitive dependency (diamond) renders as one node with two links', async () => {
  // root -> a -> c
  // root -> b -> c
  const dir = makeFixture(
    { name: 'root', version: '1.0.0', dependencies: { a: '1.0.0', b: '1.0.0' } },
    { packages: {
      'node_modules/a': { dependencies: { c: '1.0.0' } },
      'node_modules/b': { dependencies: { c: '1.0.0' } },
      'node_modules/c': {}
    } }
  );

  const graph = await new GraphGenerator(dir).generate();

  const cNodes = graph.nodes.filter(n => n.name === 'c');
  assert.equal(cNodes.length, 1, 'c must appear exactly once, not once per parent');

  const linksToC = graph.links.filter(l => l.target === 'c@1.0.0');
  assert.equal(linksToC.length, 2, 'c must be linked from both a and b');
  assert.deepEqual(linksToC.map(l => l.source).sort(), ['a@1.0.0', 'b@1.0.0']);
  assert.ok(linksToC.every(l => l.type === 'normal'), 'a shared dep is not a cycle');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('a genuine circular dependency is flagged as a circular link, not infinite recursion', async () => {
  // root -> x -> y -> x  (x is its own ancestor via y)
  const dir = makeFixture(
    { name: 'root', version: '1.0.0', dependencies: { x: '1.0.0' } },
    { packages: {
      'node_modules/x': { dependencies: { y: '1.0.0' } },
      'node_modules/y': { dependencies: { x: '1.0.0' } }
    } }
  );

  const graph = await new GraphGenerator(dir).generate();

  const xNodes = graph.nodes.filter(n => n.name === 'x');
  assert.equal(xNodes.length, 1, 'x must appear once even though y points back to it');

  const circular = graph.links.filter(l => l.type === 'circular');
  assert.equal(circular.length, 1);
  assert.equal(circular[0].source, 'y@1.0.0');
  assert.equal(circular[0].target, 'x@1.0.0');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('analysis issues enrich nodes via isVulnerable (not the old hasVulnerability name)', async () => {
  const dir = makeFixture(
    { name: 'root', version: '1.0.0', dependencies: { a: '1.0.0' } },
    { packages: { 'node_modules/a': {} } }
  );

  const generator = new GraphGenerator(dir);
  generator.setAnalysisResults({ issues: [{ name: 'a', type: 'security', severity: 'high', message: 'known CVE' }] });
  const graph = await generator.generate();

  const aNode = graph.nodes.find(n => n.name === 'a');
  assert.equal(aNode.isVulnerable, true);
  assert.equal(aNode.hasVulnerability, undefined, 'the old/wrong property name should not reappear');
  assert.equal(aNode.issues[0].type, 'security');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('metadata.truncated reflects the filtered node count, not the unfiltered total', async () => {
  // 501 flat direct deps (502 nodes incl. root) blows past MAX_GRAPH_NODES (500)
  // in the *unfiltered* graph, but a 'vulnerable' filter with zero vulnerable
  // packages collapses that down to just the root node.
  const dependencies = {};
  const packages = {};
  for (let i = 0; i < 501; i++) {
    dependencies[`pkg${i}`] = '1.0.0';
    packages[`node_modules/pkg${i}`] = {};
  }
  const dir = makeFixture(
    { name: 'root', version: '1.0.0', dependencies },
    { packages }
  );

  const graph = await new GraphGenerator(dir).generate({ filter: 'vulnerable' });

  assert.equal(graph.nodes.length, 1, 'only the root node survives the vulnerable-only filter');
  assert.equal(graph.metadata.truncated, false, 'a small filtered view must not be reported as truncated');

  fs.rmSync(dir, { recursive: true, force: true });
});
