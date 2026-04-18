// src/graph/generator.js
// v3.1.3 - Dynamic issues integration (no hardcoded issues-db.json)
const fs = require('fs');
const path = require('path');

// Try to load dynamic issues analyzer
let IssuesAnalyzer = null;
try {
  const issuesModule = require('../analyzers/issues');
  IssuesAnalyzer = issuesModule.IssuesAnalyzer;
} catch (e) {
  // Issues analyzer not available, will skip dynamic enrichment
}

/**
 * GraphGenerator - Generates dependency graph data with dynamic issue detection
 */
class GraphGenerator {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.packageJson = null;
    this.packageLock = null;
    this.analysisResults = null;
    this.issuesAnalyzer = IssuesAnalyzer ? new IssuesAnalyzer() : null;
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
  async generate(options = {}) {
    const {
      maxDepth = Infinity,
      includeDevDeps = false,
      filter = 'all',
      enrichWithIssues = false  // Disabled by default - too slow for 100+ packages
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

    this.buildTree(rootNode, deps, nodes, links, visited, 0, maxDepth);

    // Enrich with analysis results (from analyze command)
    if (this.analysisResults) {
      this.enrichNodesWithAnalysis(nodes);
    }

    // Enrich with dynamic issues (real-time npm audit, deprecation, etc.)
    if (enrichWithIssues && this.issuesAnalyzer) {
      await this.enrichNodesWithDynamicIssues(nodes);
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
        filter,
        issuesEnriched: enrichWithIssues && !!this.issuesAnalyzer
      }
    };
  }

  /**
   * Build dependency tree recursively
   */
  buildTree(parent, deps, nodes, links, visited, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;
    if (!deps || typeof deps !== 'object') return;

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
   * Enrich nodes with dynamic issues from npm audit, registry, etc.
   * This replaces the need for hardcoded issues-db.json
   */
  async enrichNodesWithDynamicIssues(nodes) {
    if (!this.issuesAnalyzer) return;

    // Collect all packages for batch processing
    const packages = nodes
      .filter(n => n.type !== 'root')
      .map(n => ({ name: n.name, version: n.version }));

    try {
      // Batch fetch issues for all packages
      const issuesMap = await this.issuesAnalyzer.getBatchIssues(packages);

      // Apply issues to nodes
      nodes.forEach(node => {
        if (node.type === 'root') return;

        const packageIssues = issuesMap.get(node.name);
        if (packageIssues && packageIssues.length > 0) {
          // Add issues to node
          packageIssues.forEach(issue => {
            node.issues.push({
              type: this.mapIssueType(issue),
              severity: issue.severity,
              message: issue.title,
              fix: issue.fix,
              source: issue.source
            });
          });

          // Set boolean flags for filtering
          node.isVulnerable = packageIssues.some(i => 
            i.source?.includes('audit') || i.source?.includes('advisory')
          );
          node.isDeprecated = packageIssues.some(i => 
            i.title?.toLowerCase().includes('deprecated')
          );
          node.isUnmaintained = packageIssues.some(i => 
            i.title?.toLowerCase().includes('unmaintained')
          );

          // Recalculate health score
          node.healthScore = this.calculateHealthScore(node.issues);
        }
      });
    } catch (error) {
      console.error('Error enriching nodes with dynamic issues:', error.message);
    }
  }

  /**
   * Map issue to type category
   */
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

  /**
   * Enrich nodes with analysis results (from analyze command)
   * Handles multiple possible data structures from analyzeProject()
   * 
   * Expected analysisResults structure from analyzeProject():
   * {
   *   security: { total, critical, high, moderate, low, vulnerabilities: [...] },
   *   outdatedPackages: [{ name, current, latest, wanted }],
   *   unusedDependencies: ['pkg1', 'pkg2'] or [{ name: 'pkg1' }],
   *   ecosystemAlerts: [{ package, title, severity, fix }],
   *   summary: { ... }
   * }
   */
  enrichNodesWithAnalysis(nodes) {
    if (!this.analysisResults) return;

    // Extract data - handle different possible structures from analyzeProject()
    // The analyze command returns data in a specific format
    const results = this.analysisResults;
    
    // Security vulnerabilities - can be in security.vulnerabilities or directly
    const security = results.security || {};
    let vulnerabilities = [];
    if (Array.isArray(security.vulnerabilities)) {
      vulnerabilities = security.vulnerabilities;
    } else if (security.vulnerabilities && typeof security.vulnerabilities === 'object') {
      // npm audit format: vulnerabilities is an object keyed by package name
      vulnerabilities = Object.entries(security.vulnerabilities).map(([name, data]) => ({
        package: name,
        name: name,
        ...data
      }));
    }
    
    // Outdated packages - array format
    const outdatedPackages = results.outdatedPackages || results.outdated || [];
    
    // Unused dependencies - can be array of strings or objects
    const unusedDeps = results.unusedDependencies || results.unused || [];
    
    // Ecosystem alerts from dynamic analyzer
    const ecosystemAlerts = results.ecosystemAlerts || results.alerts || [];

    // Build lookup maps for faster matching
    const vulnerablePackages = new Map(); // Map<packageName, vulnInfo>
    const outdatedMap = new Map();        // Map<packageName, outdatedInfo>
    const unusedSet = new Set();          // Set<packageName>
    const alertsMap = new Map();          // Map<packageName, alertInfo>

    // Process security vulnerabilities
    vulnerabilities.forEach(v => {
      // Handle different vulnerability structures
      const pkgName = v.package || v.name || v.module_name;
      if (pkgName) {
        vulnerablePackages.set(pkgName, v);
      }
      
      // Also check 'via' field for transitive vulnerabilities
      if (Array.isArray(v.via)) {
        v.via.forEach(dep => {
          if (typeof dep === 'string') {
            vulnerablePackages.set(dep, { package: dep, severity: v.severity, via: pkgName });
          } else if (dep.name) {
            vulnerablePackages.set(dep.name, dep);
          }
        });
      }
    });

    // Process outdated packages - handle both array of objects and object map
    if (Array.isArray(outdatedPackages)) {
      outdatedPackages.forEach(p => {
        const name = p.name || p.package;
        if (name) outdatedMap.set(name, p);
      });
    } else if (typeof outdatedPackages === 'object' && outdatedPackages !== null) {
      Object.entries(outdatedPackages).forEach(([name, info]) => {
        outdatedMap.set(name, typeof info === 'object' ? info : { latest: info });
      });
    }

    // Process unused dependencies - handle both array of objects and array of strings
    if (Array.isArray(unusedDeps)) {
      unusedDeps.forEach(u => {
        if (typeof u === 'string') {
          unusedSet.add(u);
        } else if (u && u.name) {
          unusedSet.add(u.name);
        } else if (u && u.package) {
          unusedSet.add(u.package);
        }
      });
    }

    // Process ecosystem alerts
    if (Array.isArray(ecosystemAlerts)) {
      ecosystemAlerts.forEach(a => {
        const name = a.package || a.name;
        if (name) alertsMap.set(name, a);
      });
    }

    // Now enrich each node with the collected data
    nodes.forEach(node => {
      if (node.type === 'root') return;

      const nodeName = node.name;

      // Check if vulnerable
      if (vulnerablePackages.has(nodeName)) {
        node.isVulnerable = true;
        const vulnInfo = vulnerablePackages.get(nodeName);
        node.issues.push({
          type: 'security',
          severity: vulnInfo.severity || 'high',
          message: vulnInfo.title || `Security vulnerability in ${nodeName}`,
          fixAvailable: vulnInfo.fixAvailable,
          via: vulnInfo.via
        });
      }

      // Check if outdated
      if (outdatedMap.has(nodeName)) {
        node.isOutdated = true;
        const info = outdatedMap.get(nodeName);
        node.issues.push({
          type: 'outdated',
          severity: 'medium',
          message: `Outdated: ${info.current || node.version} → ${info.latest || info.wanted || 'newer'}`,
          current: info.current || node.version,
          latest: info.latest || info.wanted
        });
      }

      // Check if unused (only applies to direct dependencies, depth 1)
      if (unusedSet.has(nodeName)) {
        node.isUnused = true;
        node.issues.push({
          type: 'unused',
          severity: 'low',
          message: 'Package appears to be unused'
        });
      }

      // Check ecosystem alerts (deprecated, unmaintained, etc.)
      if (alertsMap.has(nodeName)) {
        const alert = alertsMap.get(nodeName);
        const alertTitle = (alert.title || alert.message || '').toLowerCase();
        
        // Determine if it's deprecated or just a warning
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

      // Calculate health score based on issues
      if (node.issues.length > 0) {
        node.healthScore = this.calculateHealthScore(node.issues);
      }
    });

    // Log enrichment stats
    const stats = {
      vulnerable: vulnerablePackages.size,
      outdated: outdatedMap.size,
      unused: unusedSet.size,
      alerts: alertsMap.size,
      enriched: nodes.filter(n => n.issues.length > 0).length
    };
    
    if (process.env.DEBUG) {
      console.log(`[GraphGenerator] Enrichment stats:`, stats);
    }
    
    return stats;
  }

  /**
   * Calculate health score based on issues
   */
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

  /**
   * Apply filters to graph data
   * Now uses boolean flags for reliable filtering
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
    if (!Array.isArray(nodes)) return 0;
    return nodes.reduce((max, node) => {
      return Math.max(max, node.depth || 0);
    }, 0);
  }
}

module.exports = GraphGenerator;