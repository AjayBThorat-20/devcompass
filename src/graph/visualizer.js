// src/graph/visualizer.js
// Unified graph visualizer - routes to appropriate layout generator

const { generateTreeLayoutHTML } = require('./layouts/tree');
const { generateRadialLayoutHTML } = require('./layouts/radial');
const { generateForceLayoutHTML } = require('./layouts/force');
const { generateConflictLayoutHTML } = require('./layouts/conflict');

/**
 * GraphVisualizer - Main entry point for graph visualization
 * Generates HTML output for various layout types
 */
class GraphVisualizer {
  constructor(graphData, options = {}) {
    this.graphData = this.validateGraphData(graphData);
    this.options = {
      width: options.width || 1400,
      height: options.height || 900,
      layout: options.layout || 'tree',
      projectName: options.projectName || 'Project',
      projectVersion: options.projectVersion || '1.0.0',
      filter: options.filter || 'all',
      ...options
    };
  }

  /**
   * Validate and normalize graph data
   */
  validateGraphData(graphData) {
    if (!graphData) {
      return { nodes: [], links: [] };
    }

    return {
      nodes: Array.isArray(graphData.nodes) ? graphData.nodes : [],
      links: Array.isArray(graphData.links) ? graphData.links : [],
      metadata: graphData.metadata || {}
    };
  }

  /**
   * Apply filter to graph data
   */
  applyFilter(filter) {
    if (!filter || filter === 'all') {
      return this.graphData;
    }

    const nodes = this.graphData.nodes;
    const links = this.graphData.links;

    let filteredNodes = [];

    switch (filter) {
      case 'vulnerable':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          (Array.isArray(n.issues) && n.issues.some(i => i.type === 'security' || i.type === 'vulnerability'))
        );
        break;

      case 'outdated':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          n.isOutdated === true ||
          (Array.isArray(n.issues) && n.issues.some(i => i.type === 'outdated'))
        );
        break;

      case 'unused':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          n.isUnused === true ||
          (Array.isArray(n.issues) && n.issues.some(i => i.type === 'unused'))
        );
        break;

      case 'conflict':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          (Array.isArray(n.issues) && n.issues.length > 0) ||
          n.healthScore < 7
        );
        break;

      default:
        filteredNodes = nodes;
    }

    // Get IDs of filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter links to only include those between filtered nodes
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return {
      nodes: filteredNodes,
      links: filteredLinks,
      metadata: this.graphData.metadata
    };
  }

  /**
   * Generate HTML output for the configured layout
   */
  generateHTML() {
    const filteredData = this.applyFilter(this.options.filter);
    const layout = this.options.layout.toLowerCase();

    switch (layout) {
      case 'force':
        return generateForceLayoutHTML(filteredData, this.options);

      case 'radial':
        return generateRadialLayoutHTML(filteredData, this.options);

      case 'conflict':
        return generateConflictLayoutHTML(filteredData, this.options);

      case 'tree':
      default:
        return generateTreeLayoutHTML(filteredData, this.options);
    }
  }

  /**
   * Get graph script for embedding (backward compatibility)
   */
  generateGraphScript() {
    // For backward compatibility, return a script that can be embedded
    return this.generateHTML();
  }
}

/**
 * Get available layouts
 */
function getAvailableLayouts() {
  return [
    { id: 'tree', name: 'Tree Layout', description: 'Hierarchical tree structure' },
    { id: 'force', name: 'Force-Directed', description: 'Interactive physics simulation' },
    { id: 'radial', name: 'Radial Layout', description: 'Concentric circles by depth' },
    { id: 'conflict', name: 'Conflict View', description: 'Shows only problematic packages' }
  ];
}

/**
 * Get available filters
 */
function getAvailableFilters() {
  return [
    { id: 'all', name: 'All Packages', description: 'Show all dependencies' },
    { id: 'vulnerable', name: 'Vulnerable', description: 'Security vulnerabilities only' },
    { id: 'outdated', name: 'Outdated', description: 'Outdated packages only' },
    { id: 'unused', name: 'Unused', description: 'Unused dependencies only' },
    { id: 'conflict', name: 'Conflicts', description: 'Packages with issues' }
  ];
}

module.exports = {
  GraphVisualizer,
  getAvailableLayouts,
  getAvailableFilters
};