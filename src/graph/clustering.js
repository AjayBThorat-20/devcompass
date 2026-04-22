// src/graph/clustering.js
// v3.1.6 - Node Grouping and Clustering Engine

/**
 * Cluster dependencies by ecosystem, health, depth, or custom criteria
 */
class DependencyClusterer {
  constructor(nodes, links) {
    this.nodes = nodes;
    this.links = links;
    this.clusters = [];
  }

  /**
   * Main clustering function - groups nodes by specified strategy
   */
  clusterBy(strategy = 'ecosystem') {
    switch (strategy) {
      case 'ecosystem':
        return this.clusterByEcosystem();
      case 'health':
        return this.clusterByHealth();
      case 'depth':
        return this.clusterByDepth();
      case 'category':
        return this.clusterByCategory();
      default:
        return this.clusterByEcosystem();
    }
  }

  /**
   * Cluster by ecosystem (React, Testing, Build Tools, etc.)
   */
  clusterByEcosystem() {
    const ecosystems = {
      react: {
        name: 'React Ecosystem',
        icon: '⚛️',
        color: '#61dafb',
        keywords: ['react', 'redux', 'recoil', 'mobx', 'next', 'gatsby', '@babel/preset-react', 'react-router', 'react-dom']
      },
      vue: {
        name: 'Vue Ecosystem',
        icon: '💚',
        color: '#42b883',
        keywords: ['vue', 'vuex', 'nuxt', 'vite', '@vue']
      },
      angular: {
        name: 'Angular Ecosystem',
        icon: '🅰️',
        color: '#dd0031',
        keywords: ['@angular', 'angular', 'ng-', 'rxjs']
      },
      testing: {
        name: 'Testing Tools',
        icon: '🧪',
        color: '#99424f',
        keywords: ['jest', 'mocha', 'chai', 'sinon', 'enzyme', '@testing-library', 'cypress', 'playwright', 'vitest', 'karma', 'jasmine']
      },
      build: {
        name: 'Build & Bundle',
        icon: '🔧',
        color: '#f59e0b',
        keywords: ['webpack', 'rollup', 'parcel', 'esbuild', 'vite', 'babel', '@babel', 'swc', 'turbopack']
      },
      linting: {
        name: 'Code Quality',
        icon: '✨',
        color: '#4b32c3',
        keywords: ['eslint', 'prettier', 'stylelint', 'tslint', 'husky', 'lint-staged']
      },
      typescript: {
        name: 'TypeScript',
        icon: '📘',
        color: '#3178c6',
        keywords: ['typescript', '@types/', 'ts-node', 'ts-jest', 'tslib']
      },
      utilities: {
        name: 'Utilities',
        icon: '🛠️',
        color: '#6b7280',
        keywords: ['lodash', 'ramda', 'underscore', 'moment', 'date-fns', 'dayjs', 'uuid', 'nanoid']
      },
      http: {
        name: 'HTTP & API',
        icon: '🌐',
        color: '#0ea5e9',
        keywords: ['axios', 'fetch', 'request', 'node-fetch', 'got', 'superagent', 'ky']
      },
      server: {
        name: 'Server & Backend',
        icon: '🖥️',
        color: '#10b981',
        keywords: ['express', 'koa', 'fastify', 'hapi', 'nest', 'apollo', 'graphql']
      },
      database: {
        name: 'Database',
        icon: '💾',
        color: '#8b5cf6',
        keywords: ['mongoose', 'sequelize', 'typeorm', 'prisma', 'knex', 'pg', 'mysql', 'redis']
      },
      styling: {
        name: 'Styling',
        icon: '🎨',
        color: '#ec4899',
        keywords: ['styled-components', 'emotion', '@emotion', 'sass', 'less', 'postcss', 'tailwind', 'css-loader']
      }
    };

    const clusters = [];
    const uncategorized = [];

    this.nodes.forEach(node => {
      let assigned = false;
      
      for (const [key, ecosystem] of Object.entries(ecosystems)) {
        if (ecosystem.keywords.some(keyword => node.id.toLowerCase().includes(keyword))) {
          let cluster = clusters.find(c => c.id === key);
          if (!cluster) {
            cluster = {
              id: key,
              name: ecosystem.name,
              icon: ecosystem.icon,
              color: ecosystem.color,
              nodes: [],
              collapsed: true
            };
            clusters.push(cluster);
          }
          cluster.nodes.push(node);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        uncategorized.push(node);
      }
    });

    // Add uncategorized cluster if exists
    if (uncategorized.length > 0) {
      clusters.push({
        id: 'other',
        name: 'Other Dependencies',
        icon: '📦',
        color: '#6b7280',
        nodes: uncategorized,
        collapsed: true
      });
    }

    return this.enrichClusters(clusters);
  }

  /**
   * Cluster by health status
   */
  clusterByHealth() {
    const healthCategories = {
      critical: {
        name: 'Critical Issues',
        icon: '🔴',
        color: '#ef4444',
        filter: node => node.hasVulnerability || node.isDeprecated
      },
      warning: {
        name: 'Needs Attention',
        icon: '🟡',
        color: '#f59e0b',
        filter: node => node.isOutdated && !node.hasVulnerability && !node.isDeprecated
      },
      healthy: {
        name: 'Healthy',
        icon: '🟢',
        color: '#10b981',
        filter: node => !node.isOutdated && !node.hasVulnerability && !node.isDeprecated
      }
    };

    const clusters = [];

    for (const [key, category] of Object.entries(healthCategories)) {
      const nodes = this.nodes.filter(category.filter);
      if (nodes.length > 0) {
        clusters.push({
          id: key,
          name: category.name,
          icon: category.icon,
          color: category.color,
          nodes: nodes,
          collapsed: key !== 'critical' // Expand critical by default
        });
      }
    }

    return this.enrichClusters(clusters);
  }

  /**
   * Cluster by dependency depth (direct vs transitive)
   */
  clusterByDepth() {
    const depthMap = new Map();
    
    // Calculate depth for each node using BFS
    const rootNodes = this.nodes.filter(node => 
      !this.links.some(link => link.target === node.id)
    );

    const queue = rootNodes.map(node => ({ node, depth: 0 }));
    const visited = new Set();

    while (queue.length > 0) {
      const { node, depth } = queue.shift();
      
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      
      depthMap.set(node.id, depth);

      // Add children to queue
      this.links
        .filter(link => link.source === node.id)
        .forEach(link => {
          const childNode = this.nodes.find(n => n.id === link.target);
          if (childNode && !visited.has(childNode.id)) {
            queue.push({ node: childNode, depth: depth + 1 });
          }
        });
    }

    const clusters = [];
    const maxDepth = Math.max(...depthMap.values(), 0);

    for (let depth = 0; depth <= maxDepth; depth++) {
      const nodesAtDepth = this.nodes.filter(node => depthMap.get(node.id) === depth);
      if (nodesAtDepth.length > 0) {
        clusters.push({
          id: `depth-${depth}`,
          name: depth === 0 ? 'Direct Dependencies' : `Level ${depth} Dependencies`,
          icon: depth === 0 ? '📌' : '🔗',
          color: this.getDepthColor(depth, maxDepth),
          nodes: nodesAtDepth,
          collapsed: depth > 1 // Collapse deeper levels
        });
      }
    }

    return this.enrichClusters(clusters);
  }

  /**
   * Cluster by package category (from package.json keywords/description)
   */
  clusterByCategory() {
    const categories = {
      ui: { name: 'UI Components', icon: '🎨', color: '#ec4899', keywords: ['ui', 'component', 'widget', 'button', 'input'] },
      cli: { name: 'CLI Tools', icon: '⌨️', color: '#6366f1', keywords: ['cli', 'command', 'terminal', 'console'] },
      security: { name: 'Security', icon: '🔒', color: '#dc2626', keywords: ['security', 'auth', 'crypto', 'jwt', 'bcrypt'] },
      data: { name: 'Data Processing', icon: '📊', color: '#8b5cf6', keywords: ['data', 'parse', 'serialize', 'json', 'xml'] },
      performance: { name: 'Performance', icon: '⚡', color: '#eab308', keywords: ['cache', 'compress', 'optimize', 'performance'] },
      dev: { name: 'Development', icon: '🔨', color: '#0ea5e9', keywords: ['dev', 'development', 'debug', 'log'] }
    };

    const clusters = [];
    const uncategorized = [];

    this.nodes.forEach(node => {
      let assigned = false;
      
      for (const [key, category] of Object.entries(categories)) {
        if (category.keywords.some(keyword => 
          node.id.toLowerCase().includes(keyword) || 
          (node.description && node.description.toLowerCase().includes(keyword))
        )) {
          let cluster = clusters.find(c => c.id === key);
          if (!cluster) {
            cluster = {
              id: key,
              name: category.name,
              icon: category.icon,
              color: category.color,
              nodes: [],
              collapsed: true
            };
            clusters.push(cluster);
          }
          cluster.nodes.push(node);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        uncategorized.push(node);
      }
    });

    if (uncategorized.length > 0) {
      clusters.push({
        id: 'other',
        name: 'Other',
        icon: '📦',
        color: '#6b7280',
        nodes: uncategorized,
        collapsed: true
      });
    }

    return this.enrichClusters(clusters);
  }

  /**
   * Enrich clusters with health statistics
   */
  enrichClusters(clusters) {
    return clusters.map(cluster => {
      const stats = {
        total: cluster.nodes.length,
        vulnerable: cluster.nodes.filter(n => n.hasVulnerability || n.isVulnerable).length,
        deprecated: cluster.nodes.filter(n => n.isDeprecated).length,
        outdated: cluster.nodes.filter(n => n.isOutdated).length,
        healthy: cluster.nodes.filter(n => !n.isOutdated && !n.hasVulnerability && !n.isVulnerable && !n.isDeprecated).length
      };

      // Determine cluster health color if not already set by strategy
      let healthColor = cluster.color;
      if (stats.vulnerable > 0 || stats.deprecated > 0) {
        healthColor = '#ef4444'; // Red
      } else if (stats.outdated > 0) {
        healthColor = '#f59e0b'; // Orange
      } else {
        healthColor = '#10b981'; // Green
      }

      return {
        ...cluster,
        stats,
        healthColor,
        // Calculate centroid for positioning
        centroid: this.calculateCentroid(cluster.nodes)
      };
    });
  }

  /**
   * Calculate centroid position for cluster
   */
  calculateCentroid(nodes) {
    if (nodes.length === 0) return { x: 0, y: 0 };
    
    const sum = nodes.reduce((acc, node) => ({
      x: acc.x + (node.x || 0),
      y: acc.y + (node.y || 0)
    }), { x: 0, y: 0 });

    return {
      x: sum.x / nodes.length,
      y: sum.y / nodes.length
    };
  }

  /**
   * Get color based on depth (gradient from blue to purple)
   */
  getDepthColor(depth, maxDepth) {
    const colors = [
      '#3b82f6', // Blue
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#a855f7', // Purple-500
      '#c026d3', // Fuchsia
      '#e879f9'  // Fuchsia-400
    ];
    
    const index = Math.min(depth, colors.length - 1);
    return colors[index];
  }

  /**
   * Create virtual cluster nodes for visualization
   */
  createClusterNodes(clusters) {
    return clusters.map((cluster, index) => ({
      id: `cluster-${cluster.id}`,
      name: cluster.name,
      icon: cluster.icon,
      type: 'cluster',
      cluster: cluster,
      x: cluster.centroid.x,
      y: cluster.centroid.y,
      fx: null,
      fy: null,
      collapsed: cluster.collapsed
    }));
  }

  /**
   * Create links between clusters based on inter-cluster dependencies
   */
  createClusterLinks(clusters) {
    const clusterLinks = [];
    const clusterMap = new Map();

    // Map nodes to their clusters
    clusters.forEach(cluster => {
      cluster.nodes.forEach(node => {
        clusterMap.set(node.id, cluster.id);
      });
    });

    // Find inter-cluster links
    this.links.forEach(link => {
      const sourceCluster = clusterMap.get(link.source);
      const targetCluster = clusterMap.get(link.target);

      if (sourceCluster && targetCluster && sourceCluster !== targetCluster) {
        const linkId = `${sourceCluster}-${targetCluster}`;
        const existingLink = clusterLinks.find(l => l.id === linkId);

        if (existingLink) {
          existingLink.count++;
        } else {
          clusterLinks.push({
            id: linkId,
            source: `cluster-${sourceCluster}`,
            target: `cluster-${targetCluster}`,
            count: 1,
            type: 'cluster-link'
          });
        }
      }
    });

    return clusterLinks;
  }
}

// Export for use in template
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DependencyClusterer;
}