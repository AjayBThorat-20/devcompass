// src/graph/generator.js
const fs = require('fs');
const path = require('path');

/**
 * GraphGenerator - Generates dependency graph data
 */
class GraphGenerator {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.packageJson = null;
    this.packageLock = null;
    this.analysisResults = null;
  }

  /**
   * Load package files
   */
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

  /**
   * Set analysis results for enriched graph data
   */
  setAnalysisResults(results) {
    this.analysisResults = results;
  }

  /**
   * Generate graph data structure
   */
  generate(options = {}) {
    const {
      maxDepth = Infinity,
      includeDevDeps = false,
      filter = 'all'
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
      depth: 0
    };

    const deps = {
      ...this.packageJson.dependencies,
      ...(includeDevDeps ? this.packageJson.devDependencies : {})
    };

    const nodes = [rootNode];
    const links = [];
    const visited = new Set();

    this.buildTree(rootNode, deps, nodes, links, visited, 0, maxDepth);

    // Enrich with analysis results
    if (this.analysisResults) {
      this.enrichNodesWithAnalysis(nodes);
    }

    // Apply filters
    const filteredData = this.applyFilter(nodes, links, filter);

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
        filter
      }
    };
  }

  /**
   * Build dependency tree recursively
   */
  buildTree(parent, deps, nodes, links, visited, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;

    for (const [name, versionRange] of Object.entries(deps)) {
      const nodeId = `${name}@${versionRange}`;
      
      // Check for circular dependencies
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
        issues: []
      };

      nodes.push(node);
      links.push({
        source: parent.id,
        target: nodeId,
        type: 'normal',
        depth: currentDepth + 1
      });

      // Recursively build tree
      if (this.packageLock && this.packageLock.packages) {
        const pkgKey = `node_modules/${name}`;
        const lockEntry = this.packageLock.packages[pkgKey];
        
        if (lockEntry && lockEntry.dependencies) {
          this.buildTree(node, lockEntry.dependencies, nodes, links, visited, currentDepth + 1, maxDepth);
        }
      }
    }
  }

  /**
   * Enrich nodes with analysis results
   */
  enrichNodesWithAnalysis(nodes) {
    if (!this.analysisResults) return;

    const {
      security = {},
      outdatedPackages = [],
      unusedDependencies = [],
      ecosystemAlerts = []
    } = this.analysisResults;

    nodes.forEach(node => {
      if (node.type === 'root') return;

      // Add security vulnerabilities
      if (security.vulnerabilities) {
        const vulnerabilities = security.vulnerabilities.filter(v => 
          v.package === node.name || v.via?.includes(node.name)
        );
        
        vulnerabilities.forEach(v => {
          node.issues.push({
            type: 'security',
            severity: v.severity,
            message: v.title,
            fixAvailable: v.fixAvailable
          });
        });
      }

      // Add outdated info
      const outdated = outdatedPackages.find(p => p.name === node.name);
      if (outdated) {
        node.issues.push({
          type: 'outdated',
          severity: 'medium',
          message: `Outdated: ${outdated.current} → ${outdated.latest}`,
          current: outdated.current,
          latest: outdated.latest
        });
      }

      // Add unused info
      const unused = unusedDependencies.find(u => u.name === node.name);
      if (unused) {
        node.issues.push({
          type: 'unused',
          severity: 'low',
          message: 'Package appears to be unused'
        });
      }

      // Add ecosystem alerts
      const alert = ecosystemAlerts.find(a => a.package === node.name);
      if (alert) {
        node.issues.push({
          type: 'deprecated',
          severity: alert.severity,
          message: alert.title,
          fix: alert.fix
        });
      }

      // Calculate health score based on issues
      node.healthScore = this.calculateHealthScore(node.issues);
    });
  }

  /**
   * Calculate health score based on issues
   */
  calculateHealthScore(issues) {
    if (!issues || issues.length === 0) return 10;

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

  /**
   * Apply filters to graph data
   */
  applyFilter(nodes, links, filter) {
    if (filter === 'all') {
      return { nodes, links };
    }

    let filteredNodes = nodes;

    switch (filter) {
      case 'vulnerable':
        filteredNodes = nodes.filter(node => 
          node.type === 'root' || 
          node.issues.some(i => i.type === 'security')
        );
        break;

      case 'outdated':
        filteredNodes = nodes.filter(node => 
          node.type === 'root' || 
          node.issues.some(i => i.type === 'outdated')
        );
        break;

      case 'unused':
        filteredNodes = nodes.filter(node => 
          node.type === 'root' || 
          node.issues.some(i => i.type === 'unused')
        );
        break;

      case 'conflict':
        filteredNodes = nodes.filter(node => 
          node.type === 'root' || 
          node.issues.length > 0
        );
        break;
    }

    // Filter links to only include connections between visible nodes
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      visibleIds.has(link.source) && visibleIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  /**
   * Get installed version from package-lock
   */
  getInstalledVersion(packageName) {
    if (!this.packageLock || !this.packageLock.packages) {
      return null;
    }

    const pkgKey = `node_modules/${packageName}`;
    const lockEntry = this.packageLock.packages[pkgKey];
    
    return lockEntry ? lockEntry.version : null;
  }

  /**
   * Calculate maximum depth in tree
   */
  calculateMaxDepth(nodes) {
    return nodes.reduce((max, node) => {
      return Math.max(max, node.depth || 0);
    }, 0);
  }
}

module.exports = GraphGenerator;