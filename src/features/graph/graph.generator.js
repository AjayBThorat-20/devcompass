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
    this.nodesById = new Map();

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
    const ancestorPath = new Set([rootNode.id]);
    this.nodesById.set(rootNode.id, rootNode);

    this.buildTree(rootNode, deps, nodes, links, ancestorPath, 0, maxDepth, 0);

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

  buildTree(parent, deps, nodes, links, ancestorPath, currentDepth, maxDepth, stackDepth) {
    if (currentDepth >= maxDepth || stackDepth >= MAX_STACK_DEPTH) return;
    if (!deps || typeof deps !== 'object') return;

    for (const [name, versionRange] of Object.entries(deps)) {
      const nodeId = `${name}@${versionRange}`;

      if (ancestorPath.has(nodeId)) {
        links.push({ source: parent.id, target: nodeId, type: 'circular', depth: currentDepth + 1 });
        continue;
      }

      if (this.nodesById.has(nodeId)) {
        links.push({ source: parent.id, target: nodeId, type: 'normal', depth: currentDepth + 1 });
        continue;
      }

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
      this.nodesById.set(nodeId, node);
      links.push({ source: parent.id, target: nodeId, type: 'normal', depth: currentDepth + 1 });

      if (this.packageLock?.packages) {
        const lockEntry = this.packageLock.packages[`node_modules/${name}`];
        if (lockEntry?.dependencies) {
          ancestorPath.add(nodeId);
          this.buildTree(node, lockEntry.dependencies, nodes, links, ancestorPath, currentDepth + 1, maxDepth, stackDepth + 1);
          ancestorPath.delete(nodeId);
        }
      }
    }
  }

  enrichNodesWithAnalysisSinglePass(nodes) {
    if (!this.analysisResults) return;
    const issues = this.analysisResults.issues;
    if (!Array.isArray(issues) || issues.length === 0) return;

    const issuesByName = new Map();
    issues.forEach(issue => {
      if (!issue?.name) return;
      if (!issuesByName.has(issue.name)) issuesByName.set(issue.name, []);
      issuesByName.get(issue.name).push(issue);
    });

    nodes.forEach(node => {
      if (node.type === 'root') return;
      const nodeIssues = issuesByName.get(node.name);
      if (!nodeIssues) return;

      nodeIssues.forEach(issue => {
        const severity = (issue.severity || 'medium').toLowerCase();
        if (issue.type === 'security') {
          node.isVulnerable = true;
          node.issues.push({ type: 'security', severity, message: issue.message || `Security vulnerability in ${node.name}`, fixAvailable: !!issue.safeFix, via: issue.source });
        } else if (issue.type === 'outdated') {
          node.isOutdated = true;
          const meta = issue.metadata || {};
          node.issues.push({ type: 'outdated', severity, message: issue.message || `Outdated: ${meta.current || node.version} → ${meta.latest || 'newer'}`, current: meta.current || node.version, latest: meta.latest });
        } else if (issue.type === 'unused') {
          node.isUnused = true;
          node.issues.push({ type: 'unused', severity, message: issue.message || 'Package appears to be unused' });
        } else if (issue.type === 'quality') {
          const status = issue.metadata?.status;
          const isDeprecatedLike = status === 'deprecated' || status === 'abandoned' || (issue.message || '').toLowerCase().includes('deprecated');
          if (isDeprecatedLike) node.isDeprecated = true;
          node.issues.push({ type: isDeprecatedLike ? 'deprecated' : 'quality', severity, message: issue.message || 'Known issue', fix: issue.fix, source: issue.source });
        } else if (issue.type === 'license') {
          node.issues.push({ type: 'license', severity, message: issue.message || 'License risk', fix: issue.fix });
        }
      });

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