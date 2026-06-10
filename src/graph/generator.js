const fs = require('fs');
const path = require('path');

const MAX_GRAPH_NODES = 500;
const MAX_STACK_DEPTH = 100;

let IssuesAnalyzer = null;
try {
  const issuesModule = require('../analyzers/issues');
  IssuesAnalyzer = issuesModule.IssuesAnalyzer;
} catch (e) {
  // Issues analyzer not available
}

class GraphGenerator {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.packageJson = null;
    this.packageLock = null;
    this.analysisResults = null;
    this.issuesAnalyzer = IssuesAnalyzer ? new IssuesAnalyzer() : null;
  }

  loadPackageFiles() {
    try {
      const pkgPath = path.join(this.projectPath, 'package.json');
      this.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      const lockPath = path.join(this.projectPath, 'package-lock.json');
      if (fs.existsSync(lockPath)) {
        this.packageLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      }

      return true;
    } catch (error) {
      console.error('Error loading package files:', error.message);
      return false;
    }
  }

  setAnalysisResults(results) {
    this.analysisResults = results;
  }

  async generate(options = {}) {
    const {
      maxDepth = Infinity,
      includeDevDeps = false,
      filter = 'all',
      enrichWithIssues = false
    } = options;

    if (!this.loadPackageFiles()) {
      return null;
    }

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

    const deps = {
      ...this.packageJson.dependencies,
      ...(includeDevDeps ? this.packageJson.devDependencies : {})
    };

    const nodes = [rootNode];
    const links = [];
    const visited = new Set();

    this.buildTree(rootNode, deps, nodes, links, visited, 0, maxDepth, 0);

    if (this.analysisResults) {
      this.enrichNodesWithAnalysisSinglePass(nodes);
    }

    if (enrichWithIssues && this.issuesAnalyzer) {
      await this.enrichNodesWithDynamicIssues(nodes);
    }

    const filteredData = this.applyFilter(nodes, links, filter);

    if (filteredData.nodes.length > MAX_GRAPH_NODES) {
      console.log(`\n⚠️  Graph truncated: Showing ${MAX_GRAPH_NODES} of ${filteredData.nodes.length} nodes`);
    }

    filteredData.nodes = filteredData.nodes.slice(0, MAX_GRAPH_NODES);

    const visibleIds = new Set(filteredData.nodes.map(n => n.id));

    filteredData.links = filteredData.links.filter(
      link => visibleIds.has(link.source) && visibleIds.has(link.target)
    );

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
        issuesEnriched: enrichWithIssues && !!this.issuesAnalyzer,
        truncated: nodes.length > MAX_GRAPH_NODES
      }
    };
  }

  buildTree(parent, deps, nodes, links, visited, currentDepth, maxDepth, stackDepth) {
    if (currentDepth >= maxDepth) return;
    if (stackDepth >= MAX_STACK_DEPTH) {
      if (process.env.DEBUG) {
        console.warn(`Stack depth limit reached at ${stackDepth}`);
      }
      return;
    }
    if (!deps || typeof deps !== 'object') return;

    for (const [name, versionRange] of Object.entries(deps)) {
      const nodeId = `${name}@${versionRange}`;

      if (visited.has(nodeId)) {
        links.push({
          source: parent.id,
          target: nodeId,
          type: 'circular',
          depth: currentDepth + 1
        });
        continue;
      }

      visited.add(nodeId);

      const installedVersion = this.getInstalledVersion(name);

      const node = {
        id: nodeId,
        name,
        version: installedVersion || versionRange,
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
      links.push({
        source: parent.id,
        target: nodeId,
        type: 'normal',
        depth: currentDepth + 1
      });

      if (this.packageLock && this.packageLock.packages) {
        const pkgKey = `node_modules/${name}`;
        const lockEntry = this.packageLock.packages[pkgKey];

        if (lockEntry && lockEntry.dependencies) {
          this.buildTree(node, lockEntry.dependencies, nodes, links, visited, currentDepth + 1, maxDepth, stackDepth + 1);
        }
      }
    }
  }

  enrichNodesWithAnalysisSinglePass(nodes) {
    if (!this.analysisResults) return;

    const results = this.analysisResults;
    const security = results.security || {};

    const lookupMaps = {
      vulnerable: new Map(),
      outdated: new Map(),
      unused: new Set(),
      alerts: new Map()
    };

    let vulnerabilities = [];
    if (Array.isArray(security.vulnerabilities)) {
      vulnerabilities = security.vulnerabilities;
    } else if (security.vulnerabilities && typeof security.vulnerabilities === 'object') {
      vulnerabilities = Object.entries(security.vulnerabilities).map(([name, data]) => ({
        package: name,
        name: name,
        ...data
      }));
    }

    vulnerabilities.forEach(v => {
      const pkgName = v.package || v.name || v.module_name;
      if (pkgName) {
        lookupMaps.vulnerable.set(pkgName, v);
      }

      if (Array.isArray(v.via)) {
        v.via.forEach(dep => {
          if (typeof dep === 'string') {
            lookupMaps.vulnerable.set(dep, { package: dep, severity: v.severity, via: pkgName });
          } else if (dep.name) {
            lookupMaps.vulnerable.set(dep.name, dep);
          }
        });
      }
    });

    const outdatedPackages = results.outdatedPackages || results.outdated || [];
    if (Array.isArray(outdatedPackages)) {
      outdatedPackages.forEach(p => {
        const name = p.name || p.package;
        if (name) lookupMaps.outdated.set(name, p);
      });
    } else if (typeof outdatedPackages === 'object' && outdatedPackages !== null) {
      Object.entries(outdatedPackages).forEach(([name, info]) => {
        lookupMaps.outdated.set(name, typeof info === 'object' ? info : { latest: info });
      });
    }

    const unusedDeps = results.unusedDependencies || results.unused || [];
    if (Array.isArray(unusedDeps)) {
      unusedDeps.forEach(u => {
        if (typeof u === 'string') {
          lookupMaps.unused.add(u);
        } else if (u && u.name) {
          lookupMaps.unused.add(u.name);
        } else if (u && u.package) {
          lookupMaps.unused.add(u.package);
        }
      });
    }

    const ecosystemAlerts = results.ecosystemAlerts || results.alerts || [];
    if (Array.isArray(ecosystemAlerts)) {
      ecosystemAlerts.forEach(a => {
        const name = a.package || a.name;
        if (name) lookupMaps.alerts.set(name, a);
      });
    }

    nodes.forEach(node => {
      if (node.type === 'root') return;

      const nodeName = node.name;

      if (lookupMaps.vulnerable.has(nodeName)) {
        node.isVulnerable = true;
        const vulnInfo = lookupMaps.vulnerable.get(nodeName);
        node.issues.push({
          type: 'security',
          severity: vulnInfo.severity || 'high',
          message: vulnInfo.title || `Security vulnerability in ${nodeName}`,
          fixAvailable: vulnInfo.fixAvailable,
          via: vulnInfo.via
        });
      }

      if (lookupMaps.outdated.has(nodeName)) {
        node.isOutdated = true;
        const info = lookupMaps.outdated.get(nodeName);
        node.issues.push({
          type: 'outdated',
          severity: 'medium',
          message: `Outdated: ${info.current || node.version} → ${info.latest || info.wanted || 'newer'}`,
          current: info.current || node.version,
          latest: info.latest || info.wanted
        });
      }

      if (lookupMaps.unused.has(nodeName)) {
        node.isUnused = true;
        node.issues.push({
          type: 'unused',
          severity: 'low',
          message: 'Package appears to be unused'
        });
      }

      if (lookupMaps.alerts.has(nodeName)) {
        const alert = lookupMaps.alerts.get(nodeName);
        const alertTitle = (alert.title || alert.message || '').toLowerCase();

        if (alertTitle.includes('deprecated')) {
          node.isDeprecated = true;
        }

        node.issues.push({
          type: 'deprecated',
          severity: alert.severity || 'medium',
          message: alert.title || alert.message || 'Known issue',
          fix: alert.fix,
          source: alert.source
        });
      }

      if (node.issues.length > 0) {
        node.healthScore = this.calculateHealthScore(node.issues);
      }
    });

    if (process.env.DEBUG) {
      const stats = {
        vulnerable: lookupMaps.vulnerable.size,
        outdated: lookupMaps.outdated.size,
        unused: lookupMaps.unused.size,
        alerts: lookupMaps.alerts.size,
        enriched: nodes.filter(n => n.issues.length > 0).length
      };
      console.log('[GraphGenerator] Enrichment stats:', stats);
    }
  }

  async enrichNodesWithDynamicIssues(nodes) {
    if (!this.issuesAnalyzer) return;

    const packages = nodes
      .filter(n => n.type !== 'root')
      .map(n => ({ name: n.name, version: n.version }));

    try {
      const issuesMap = await this.issuesAnalyzer.getBatchIssues(packages);

      nodes.forEach(node => {
        if (node.type === 'root') return;

        const packageIssues = issuesMap.get(node.name);
        if (packageIssues && packageIssues.length > 0) {
          packageIssues.forEach(issue => {
            node.issues.push({
              type: this.mapIssueType(issue),
              severity: issue.severity,
              message: issue.title,
              fix: issue.fix,
              source: issue.source
            });
          });

          node.isVulnerable = packageIssues.some(i =>
            i.source?.includes('audit') || i.source?.includes('advisory')
          );
          node.isDeprecated = packageIssues.some(i =>
            i.title?.toLowerCase().includes('deprecated')
          );
          node.isUnmaintained = packageIssues.some(i =>
            i.title?.toLowerCase().includes('unmaintained')
          );

          node.healthScore = this.calculateHealthScore(node.issues);
        }
      });
    } catch (error) {
      console.error('Error enriching nodes with dynamic issues:', error.message);
    }
  }

  mapIssueType(issue) {
    if (issue.source?.includes('audit') || issue.source?.includes('advisory')) {
      return 'security';
    }
    if (issue.title?.toLowerCase().includes('deprecated')) {
      return 'deprecated';
    }
    if (issue.title?.toLowerCase().includes('unmaintained')) {
      return 'maintenance';
    }
    return 'info';
  }

  calculateHealthScore(issues) {
    if (!issues || !Array.isArray(issues) || issues.length === 0) return 10;

    let score = 10;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 3;
          break;
        case 'high':
          score -= 2;
          break;
        case 'medium':
        case 'moderate':
          score -= 1;
          break;
        case 'low':
          score -= 0.5;
          break;
      }
    });

    return Math.max(0, Math.min(10, score));
  }

  applyFilter(nodes, links, filter) {
    if (filter === 'all') {
      return { nodes, links };
    }

    let filteredNodes = nodes;

    switch (filter) {
      case 'vulnerable':
        filteredNodes = nodes.filter(node =>
          node.type === 'root' ||
          node.isVulnerable ||
          node.issues.some(i => i.type === 'security')
        );
        break;

      case 'outdated':
        filteredNodes = nodes.filter(node =>
          node.type === 'root' ||
          node.isOutdated ||
          node.issues.some(i => i.type === 'outdated')
        );
        break;

      case 'unused':
        filteredNodes = nodes.filter(node =>
          node.type === 'root' ||
          node.isUnused ||
          node.issues.some(i => i.type === 'unused')
        );
        break;

      case 'deprecated':
        filteredNodes = nodes.filter(node =>
          node.type === 'root' ||
          node.isDeprecated ||
          node.issues.some(i => i.type === 'deprecated')
        );
        break;

      case 'conflict':
        filteredNodes = nodes.filter(node =>
          node.type === 'root' ||
          (node.issues && node.issues.length > 0)
        );
        break;
    }

    const visibleIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link =>
      visibleIds.has(link.source) && visibleIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  getInstalledVersion(packageName) {
    if (!this.packageLock || !this.packageLock.packages) {
      return null;
    }

    const pkgKey = `node_modules/${packageName}`;
    const lockEntry = this.packageLock.packages[pkgKey];

    return lockEntry ? lockEntry.version : null;
  }

  calculateMaxDepth(nodes) {
    if (!Array.isArray(nodes)) return 0;
    return nodes.reduce((max, node) => {
      return Math.max(max, node.depth || 0);
    }, 0);
  }
}

module.exports = GraphGenerator;