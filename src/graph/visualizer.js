// src/graph/visualizer.js

const GraphExporter = require('./exporter');

/**
 * GraphVisualizer - Wrapper around GraphExporter for backward compatibility
 */
class GraphVisualizer {
  constructor(graphData, options = {}) {
    this.exporter = new GraphExporter(graphData, options);
  }

  /**
   * Generate HTML output
   */
  generateHTML() {
    return this.exporter.generateHTML();
  }

  /**
   * Generate graph script (legacy)
   */
  generateGraphScript() {
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
    { id: 'conflict', name: 'Conflict View', description: 'Shows only problematic packages' },
    { id: 'analytics', name: 'Analytics Dashboard', description: 'Statistical overview' }
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