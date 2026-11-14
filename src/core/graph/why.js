// src/core/graph/why.js
//
// FT-06: `devcompass why <package>` — how did this package get into the
// tree? Built on the dependency graph (AR-01).

const MAX_PATHS_PER_NODE = 10;
const MAX_DEPTH = 20; // guards against a malformed/cyclic lockfile

// Every path from 'root' to `targetId`, as arrays of node ids
// (['root', 'express@4.17.1', 'qs@6.7.0']), depth-first with a visited set
// per path so a cycle can't loop forever.
function findPaths(edges, targetId) {
  const adjacency = new Map();
  for (const [from, to] of edges) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  }

  const paths = [];

  function walk(currentId, trail, visited) {
    if (paths.length >= MAX_PATHS_PER_NODE) return;
    if (trail.length > MAX_DEPTH) return;

    if (currentId === targetId && trail.length > 1) {
      paths.push([...trail]);
      return;
    }

    const next = adjacency.get(currentId) || [];
    for (const child of next) {
      if (visited.has(child)) continue; // cycle guard
      if (paths.length >= MAX_PATHS_PER_NODE) return;
      visited.add(child);
      trail.push(child);
      walk(child, trail, visited);
      trail.pop();
      visited.delete(child);
    }
  }

  walk('root', ['root'], new Set(['root']));
  return paths;
}

/**
 * @param {{nodes: Map, edges: Array<[string,string]>}} graph
 * @param {string} packageName
 * @returns {Array<{node: object, paths: string[][]}>} one entry per
 *   installed version of `packageName`, each with every path from root.
 */
function why(graph, packageName) {
  const matches = Array.from(graph.nodes.values()).filter(n => n.name === packageName);

  return matches.map(node => ({
    node,
    paths: findPaths(graph.edges, node.id)
  }));
}

module.exports = { why, findPaths, MAX_PATHS_PER_NODE };
