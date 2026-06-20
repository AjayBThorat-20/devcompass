// src/features/graph/graph.generator.js

const fs = require('fs');
const path = require('path');

const MAX_GRAPH_NODES = 500;
const MAX_STACK_DEPTH = 100;

class GraphGenerator {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.packageJson = null;
    this.packageLock = null;
    this.analysisResults = null;
  }

  loadPackageFiles() {
    try {
      this.packageJson = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8'));
      const lockPath = path.join(this.projectPath, 'package-lock.json');
      if (fs.existsSync(lockPath)) this.packageLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      return true;
    } catch (error) {
      if (process.env.DEBUG) console.error('Error loading package files:', error.message);
      return false;
    }
  }

  setAnalysisResults(results) { this.analysisResults = results; }

  async generate(options = {}) {
    const { maxDepth = Infinity, includeDevDeps = false, filter = 'all', enrichWithIssues = false } = options;

    if (!this.loadPackageFiles()) return null;

    const rootNode = {
      id: this.packageJson.name || 'root',
      name: this.packageJson.name || 'root',
      version: this.packageJson.version || '1.0.0',
      type: 'root',
      dependencies: [],
      healthScore: 10,
      issues: [],
      depth: 0,
      isVulnerable: false,
      isDeprecated: false,
      isOutdated: false,
      isUnused: false
    };

    const deps = { ...this.packageJson.dependencies, ...(includeDevDeps ? this.packageJson.devDependencies : {}) };
    const nodes = [rootNode];
    const links = [];
    const visited = new Set();

    this.buildTree(rootNode, deps, nodes, links, visited, 0, maxDepth, 0);

    if (this.analysisResults) this.enrichNodesWithAnalysisSinglePass(nodes);

    const filteredData = this.applyFilter(nodes, links, filter);
    if (filteredData.nodes.length > MAX_GRAPH_NODES) {
      if (!process.env.SILENT) console.log(`\n⚠️  Graph truncated: Showing ${MAX_GRAPH_NODES} of ${filteredData.nodes.length} nodes`);
    }

    filteredData.nodes = filteredData.nodes.slice(0, MAX_GRAPH_NODES);
    const visibleIds = new Set(filteredData.nodes.map(n => n.id));
    filteredData.links = filteredData.links.filter(link => visibleIds.has(link.source) && visibleIds.has(link.target));

    return {
      nodes: filteredData.nodes,
      links: filteredData.links,
      metadata: {
        projectName: this.packageJson.name,
        version: this.packageJson.version,
        totalDependencies: nodes.length - 1,
        visibleDependencies: filteredData.nodes.length - 1,
        generatedAt: new Date().toISOString(),
        maxDepth: this.calculateMaxDepth(nodes),
        filter,
        truncated: nodes.length > MAX_GRAPH_NODES
      }
    };
  }

  buildTree(parent, deps, nodes, links, visited, currentDepth, maxDepth, stackDepth) {
    if (currentDepth >= maxDepth || stackDepth >= MAX_STACK_DEPTH) return;
    if (!deps || typeof deps !== 'object') return;

    for (const [name, versionRange] of Object.entries(deps)) {
      const nodeId = `${name}@${versionRange}`;
      if (visited.has(nodeId)) {
        links.push({ source: parent.id, target: nodeId, type: 'circular', depth: currentDepth + 1 });
        continue;
      }
      visited.add(nodeId);

      const node = {
        id: nodeId,
        name,
        version: this.getInstalledVersion(name) || versionRange,
        versionRange,
        type: 'dependency',
        depth: currentDepth + 1,
        dependencies: [],
        healthScore: 8,
        issues: [],
        isVulnerable: false,
        isDeprecated: false,
        isOutdated: false,
        isUnused: false
      };

      nodes.push(node);
      links.push({ source: parent.id, target: nodeId, type: 'normal', depth: currentDepth + 1 });

      if (this.packageLock?.packages) {
        const lockEntry = this.packageLock.packages[`node_modules/${name}`];
        if (lockEntry?.dependencies) {
          this.buildTree(node, lockEntry.dependencies, nodes, links, visited, currentDepth + 1, maxDepth, stackDepth + 1);
        }
      }
    }
  }

  enrichNodesWithAnalysisSinglePass(nodes) {
    if (!this.analysisResults) return;
    const results = this.analysisResults;
    const security = results.security || {};

    const lookupMaps = { vulnerable: new Map(), outdated: new Map(), unused: new Set(), alerts: new Map() };

    const vulnerabilities = Array.isArray(security.vulnerabilities)
      ? security.vulnerabilities
      : Object.entries(security.vulnerabilities || {}).map(([name, data]) => ({ package: name, name, ...data }));

    vulnerabilities.forEach(v => {
      const pkgName = v.package || v.name || v.module_name;
      if (pkgName) lookupMaps.vulnerable.set(pkgName, v);
      if (Array.isArray(v.via)) {
        v.via.forEach(dep => {
          if (typeof dep === 'string') lookupMaps.vulnerable.set(dep, { package: dep, severity: v.severity });
          else if (dep.name) lookupMaps.vulnerable.set(dep.name, dep);
        });
      }
    });

    const outdatedPackages = results.outdatedPackages || results.outdated || [];
    if (Array.isArray(outdatedPackages)) outdatedPackages.forEach(p => { const name = p.name || p.package; if (name) lookupMaps.outdated.set(name, p); });
    else if (typeof outdatedPackages === 'object') Object.entries(outdatedPackages).forEach(([name, info]) => lookupMaps.outdated.set(name, typeof info === 'object' ? info : { latest: info }));

    const unusedDeps = results.unusedDependencies || results.unused || [];
    if (Array.isArray(unusedDeps)) unusedDeps.forEach(u => { if (typeof u === 'string') lookupMaps.unused.add(u); else if (u?.name) lookupMaps.unused.add(u.name); });

    const ecosystemAlerts = results.ecosystemAlerts || results.alerts || [];
    if (Array.isArray(ecosystemAlerts)) ecosystemAlerts.forEach(a => { const name = a.package || a.name; if (name) lookupMaps.alerts.set(name, a); });

    nodes.forEach(node => {
      if (node.type === 'root') return;
      const nodeName = node.name;

      if (lookupMaps.vulnerable.has(nodeName)) {
        node.isVulnerable = true;
        const v = lookupMaps.vulnerable.get(nodeName);
        node.issues.push({ type: 'security', severity: v.severity || 'high', message: v.title || `Security vulnerability in ${nodeName}`, fixAvailable: v.fixAvailable, via: v.via });
      }
      if (lookupMaps.outdated.has(nodeName)) {
        node.isOutdated = true;
        const info = lookupMaps.outdated.get(nodeName);
        node.issues.push({ type: 'outdated', severity: 'medium', message: `Outdated: ${info.current || node.version} → ${info.latest || 'newer'}`, current: info.current || node.version, latest: info.latest });
      }
      if (lookupMaps.unused.has(nodeName)) {
        node.isUnused = true;
        node.issues.push({ type: 'unused', severity: 'low', message: 'Package appears to be unused' });
      }
      if (lookupMaps.alerts.has(nodeName)) {
        const alert = lookupMaps.alerts.get(nodeName);
        if ((alert.title || alert.message || '').toLowerCase().includes('deprecated')) node.isDeprecated = true;
        node.issues.push({ type: 'deprecated', severity: alert.severity || 'medium', message: alert.title || alert.message || 'Known issue', fix: alert.fix, source: alert.source });
      }

      if (node.issues.length > 0) node.healthScore = this.calculateHealthScore(node.issues);
    });
  }

  calculateHealthScore(issues) {
    if (!issues?.length) return 10;
    let score = 10;
    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 3;
      else if (issue.severity === 'high') score -= 2;
      else if (issue.severity === 'medium' || issue.severity === 'moderate') score -= 1;
      else if (issue.severity === 'low') score -= 0.5;
    });
    return Math.max(0, Math.min(10, score));
  }

  applyFilter(nodes, links, filter) {
    if (filter === 'all') return { nodes, links };
    let filteredNodes = nodes;
    switch (filter) {
      case 'vulnerable': filteredNodes = nodes.filter(n => n.type === 'root' || n.isVulnerable || n.issues.some(i => i.type === 'security')); break;
      case 'outdated': filteredNodes = nodes.filter(n => n.type === 'root' || n.isOutdated || n.issues.some(i => i.type === 'outdated')); break;
      case 'unused': filteredNodes = nodes.filter(n => n.type === 'root' || n.isUnused || n.issues.some(i => i.type === 'unused')); break;
      case 'deprecated': filteredNodes = nodes.filter(n => n.type === 'root' || n.isDeprecated || n.issues.some(i => i.type === 'deprecated')); break;
      case 'conflict': filteredNodes = nodes.filter(n => n.type === 'root' || (n.issues?.length > 0)); break;
    }
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    return { nodes: filteredNodes, links: links.filter(link => visibleIds.has(link.source) && visibleIds.has(link.target)) };
  }

  getInstalledVersion(packageName) {
    if (!this.packageLock?.packages) return null;
    const lockEntry = this.packageLock.packages[`node_modules/${packageName}`];
    return lockEntry ? lockEntry.version : null;
  }

  calculateMaxDepth(nodes) {
    if (!Array.isArray(nodes)) return 0;
    return nodes.reduce((max, node) => Math.max(max, node.depth || 0), 0);
  }
}

module.exports = GraphGenerator;