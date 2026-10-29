// test/unit/why.test.js
// FT-06: `devcompass why <package>` traces every path from the project root
// to an installed package, built on the AR-01 dependency graph.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { why, findPaths } = require('../../src/core/graph/why');

function makeGraph(edges) {
  return { edges };
}

test('findPaths() finds a single path through one intermediate package', () => {
  const graph = makeGraph([['root', 'express@4.17.1'], ['express@4.17.1', 'qs@6.7.0']]);
  const paths = findPaths(graph.edges, 'qs@6.7.0');
  assert.deepEqual(paths, [['root', 'express@4.17.1', 'qs@6.7.0']]);
});

test('findPaths() finds multiple distinct paths to the same target, matching the plan\'s own example', () => {
  const graph = makeGraph([
    ['root', 'express@4.17.1'],
    ['express@4.17.1', 'qs@6.7.0'],
    ['express@4.17.1', 'body-parser@1.19.0'],
    ['body-parser@1.19.0', 'qs@6.7.0']
  ]);
  const paths = findPaths(graph.edges, 'qs@6.7.0');
  assert.equal(paths.length, 2);
  assert.ok(paths.some(p => p.join('>') === 'root>express@4.17.1>qs@6.7.0'));
  assert.ok(paths.some(p => p.join('>') === 'root>express@4.17.1>body-parser@1.19.0>qs@6.7.0'));
});

test('findPaths() for a direct root dependency returns the one-hop path', () => {
  const graph = makeGraph([['root', 'chalk@4.1.2']]);
  assert.deepEqual(findPaths(graph.edges, 'chalk@4.1.2'), [['root', 'chalk@4.1.2']]);
});

test('findPaths() terminates instead of looping forever on a cyclic graph', () => {
  const graph = makeGraph([
    ['root', 'a@1.0.0'],
    ['a@1.0.0', 'b@1.0.0'],
    ['b@1.0.0', 'a@1.0.0'] // cycle
  ]);
  const paths = findPaths(graph.edges, 'b@1.0.0');
  assert.equal(paths.length, 1);
  assert.deepEqual(paths[0], ['root', 'a@1.0.0', 'b@1.0.0']);
});

test('findPaths() for an unreachable target returns no paths', () => {
  const graph = makeGraph([['root', 'a@1.0.0']]);
  assert.deepEqual(findPaths(graph.edges, 'z@1.0.0'), []);
});

test('why() returns one entry per installed version of the named package', () => {
  const graph = {
    nodes: new Map([
      ['qs@6.7.0', { id: 'qs@6.7.0', name: 'qs', version: '6.7.0', direct: false }],
      ['qs@6.9.0', { id: 'qs@6.9.0', name: 'qs', version: '6.9.0', direct: true }],
      ['express@4.17.1', { id: 'express@4.17.1', name: 'express', version: '4.17.1', direct: true }]
    ]),
    edges: [
      ['root', 'express@4.17.1'],
      ['express@4.17.1', 'qs@6.7.0'],
      ['root', 'qs@6.9.0']
    ]
  };

  const results = why(graph, 'qs');
  assert.equal(results.length, 2);
  const byVersion = Object.fromEntries(results.map(r => [r.node.version, r]));
  assert.deepEqual(byVersion['6.7.0'].paths, [['root', 'express@4.17.1', 'qs@6.7.0']]);
  assert.deepEqual(byVersion['6.9.0'].paths, [['root', 'qs@6.9.0']]);
});

test('why() for a package that is not installed returns an empty array', () => {
  const graph = { nodes: new Map(), edges: [] };
  assert.deepEqual(why(graph, 'not-installed'), []);
});
