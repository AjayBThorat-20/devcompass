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
      issues: []
    };

    const deps = {
      ...this.packageJson.dependencies,
      ...(includeDevDeps ? this.packageJson.devDependencies : {})
    };

    const nodes = [rootNode];
    const links = [];
    const visited = new Set();

    this.buildTree(rootNode, deps, nodes, links, visited, 0, maxDepth);

    return {
      nodes,
      links,
      metadata: {
        projectName: this.packageJson.name,
        version: this.packageJson.version,
        totalDependencies: nodes.length - 1,
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
      
      if (visited.has(nodeId)) {
        links.push({
          source: parent.id,
          target: nodeId,
          type: 'circular'
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
        type: 'normal'
      });

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
