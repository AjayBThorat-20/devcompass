// src/core/graph/index.js
//
// AR-01: one dependency graph, built from the lockfile, that every collector
// can read from instead of each re-deriving its own partial view (the OSV
// check only covering direct dependencies, the dashboard's graph only
// looking up top-level node_modules/<name> and getting nested versions
// wrong, "unknown" versions when a collector didn't resolve one itself).
//
// Deliberately dependency-free: @npmcli/arborist (npm's own resolver, the
// obvious library choice) pulls in ~115 packages / 24 MB. Edges are resolved
// from package-lock.json alone — its install paths already encode the
// node_modules layout — so the graph is complete even before `npm install`
// / `npm ci` has run, and never reads the disk beyond the lockfile.
//
// npm only for now — pnpm/yarn/bun need their own lockfile parsers (not
// implemented; see incomplete/incompleteReason below).

const fs = require('fs');
const path = require('path');

/**
 * @typedef {object} PackageNode
 * @property {string} id                 "name@version"
 * @property {string} name
 * @property {string} version
 * @property {string[]} paths            lockfile install paths, e.g. ["node_modules/express/node_modules/qs"]
 * @property {boolean} direct            declared in the root package.json
 * @property {boolean} dev
 * @property {boolean} optional
 * @property {boolean} hasInstallScript
 * @property {string|null} license
 */

function detectPackageManager(projectPath) {
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectPath, 'bun.lock')) || fs.existsSync(path.join(projectPath, 'bun.lockb'))) return 'bun';
  return null;
}

function packageNameFromPath(pkgPath) {
  const idx = pkgPath.lastIndexOf('node_modules/');
  return idx === -1 ? pkgPath : pkgPath.slice(idx + 'node_modules/'.length);
}

// Which lockfile entry `depName` resolves to when required from the package
// installed at `fromKey` ('' for the project root): Node's own lookup —
// nearest node_modules wins, walking up — applied to the lockfile's install
// paths. A package that isn't installed on this platform (an optional,
// OS-specific binary) still resolves to its own nested copy, where walking
// the real node_modules would have climbed to an unrelated top-level one.
function resolveInLockfile(packages, fromKey, depName) {
  let base = fromKey;
  while (true) {
    const candidate = base ? `${base}/node_modules/${depName}` : `node_modules/${depName}`;
    if (packages[candidate]) return candidate;
    if (!base) return null;
    const idx = base.lastIndexOf('/node_modules/');
    base = idx === -1 ? '' : base.slice(0, idx);
  }
}

function loadNpmGraph(lock) {
  const packages = lock.packages || {};
  const nodes = new Map(); // id ("name@version") -> PackageNode
  const pathKeyToNodeId = new Map(); // lockfile path key -> node id, for edge resolution
  const roots = [];

  const rootEntry = packages[''] || {};
  const rootDirect = new Set(Object.keys({
    ...(rootEntry.dependencies || {}),
    ...(rootEntry.devDependencies || {}),
    ...(rootEntry.optionalDependencies || {})
  }));

  for (const [key, entry] of Object.entries(packages)) {
    if (key === '' || !entry || !key.includes('node_modules/')) continue;
    const name = packageNameFromPath(key);
    if (!name || !entry.version) continue;

    const id = `${name}@${entry.version}`;
    // A direct dependency's node_modules entry sits right at the top level
    // (node_modules/<name>), never nested under another package.
    const isTopLevel = key === `node_modules/${name}`;

    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        name,
        version: entry.version,
        paths: [],
        direct: isTopLevel && rootDirect.has(name),
        dev: !!entry.dev,
        optional: !!entry.optional,
        hasInstallScript: !!entry.hasInstallScript,
        license: entry.license || null
      });
    }
    const node = nodes.get(id);
    node.paths.push(key);
    if (isTopLevel && rootDirect.has(name)) node.direct = true;
    // dev/optional are per-install-location in npm's own model; a package
    // is only dev-only/optional-only overall if every location it appears
    // at agrees (a prod dep that's *also* pulled in by a devDependency is
    // still a prod dep).
    if (!entry.dev) node.dev = false;
    if (!entry.optional) node.optional = false;

    pathKeyToNodeId.set(key, id);
    if (isTopLevel && rootDirect.has(name)) roots.push(id);
  }

  // Nodes are deduplicated by name@version, but a node can have several
  // physical install locations (paths.length > 1) — without deduping here
  // too, each of those locations would independently produce the same
  // logical (fromId -> toId) edge, and a path search downstream (why.js)
  // would then "discover" the identical path once per redundant edge.
  const edgeKeys = new Set();
  const edges = [];
  function addEdge(fromId, toId) {
    if (!toId || toId === fromId) return;
    const key = `${fromId}->${toId}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push([fromId, toId]);
  }

  for (const [key, entry] of Object.entries(packages)) {
    if (key === '' || !entry) continue;
    const fromId = pathKeyToNodeId.get(key);
    if (!fromId) continue;

    const declaredDeps = {
      ...(entry.dependencies || {}),
      ...(entry.optionalDependencies || {})
    };
    for (const depName of Object.keys(declaredDeps)) {
      const resolvedKey = resolveInLockfile(packages, key, depName);
      if (resolvedKey) addEdge(fromId, pathKeyToNodeId.get(resolvedKey));
    }
  }

  // The root package.json's own declared deps -> edges from a synthetic "root" id.
  for (const depName of rootDirect) {
    const resolvedKey = resolveInLockfile(packages, '', depName);
    if (resolvedKey) addEdge('root', pathKeyToNodeId.get(resolvedKey));
  }

  return { packageManager: 'npm', nodes, edges, roots };
}

// Every installed package that runs code during `npm install` (lockfile
// v2+ records hasInstallScript per package). Information, not a finding:
// esbuild, sharp and plenty of other legitimate packages have one, but it's
// exactly where a compromised release would run its payload.
function listInstallScripts(graph) {
  return Array.from(graph?.nodes?.values() || [])
    .filter(node => node.hasInstallScript)
    .map(node => ({ package: node.name, version: node.version, direct: node.direct, dev: node.dev }))
    .sort((a, b) => a.package.localeCompare(b.package) || a.version.localeCompare(b.version));
}

/**
 * @param {string} projectPath
 * @returns {Promise<{packageManager: string|null, nodes: Map<string, PackageNode>, edges: Array<[string,string]>, roots: string[], incomplete?: boolean, incompleteReason?: string}>}
 */
async function loadDependencyGraph(projectPath) {
  const packageManager = detectPackageManager(projectPath);

  if (packageManager === null) {
    return { packageManager: null, nodes: new Map(), edges: [], roots: [], incomplete: true, incompleteReason: 'No lockfile found' };
  }

  if (packageManager !== 'npm') {
    return {
      packageManager,
      nodes: new Map(),
      edges: [],
      roots: [],
      incomplete: true,
      incompleteReason: `${packageManager} lockfiles aren't supported yet — only npm's package-lock.json is`
    };
  }

  const lockPath = path.join(projectPath, 'package-lock.json');
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (error) {
    return { packageManager, nodes: new Map(), edges: [], roots: [], incomplete: true, incompleteReason: `Could not read package-lock.json: ${error.message}` };
  }

  if (!lock.packages) {
    // lockfileVersion 1 (npm <=6): a different, nested `dependencies` shape
    // this parser doesn't read yet.
    return {
      packageManager,
      nodes: new Map(),
      edges: [],
      roots: [],
      incomplete: true,
      incompleteReason: `package-lock.json is lockfileVersion ${lock.lockfileVersion || 1}, which this parser doesn't support yet (needs lockfileVersion 2 or 3)`
    };
  }

  return loadNpmGraph(lock);
}

module.exports = { loadDependencyGraph, detectPackageManager, resolveInLockfile, listInstallScripts };
