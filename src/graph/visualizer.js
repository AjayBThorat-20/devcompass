// src/graph/visualizer.js
const fs = require('fs');
const path = require('path');

/**
 * GraphVisualizer - Main visualization engine
 */
class GraphVisualizer {
  constructor(graphData, options = {}) {
    this.graphData = graphData;
    this.options = {
      layout: options.layout || 'tree',
      width: options.width || 1200,
      height: options.height || 800,
      interactive: options.interactive !== false,
      filter: options.filter || 'all',
      includeSearch: options.includeSearch !== false,
      ...options
    };
  }

  /**
   * Generate HTML visualization
   */
  generateHTML() {
    const layout = this.options.layout;
    
    // Use layout-specific HTML generation if available
    if (layout === 'force') {
      return this.generateForceHTML();
    } else if (layout === 'radial') {
      return this.generateRadialHTML();
    } else if (layout === 'conflict') {
      return this.generateConflictHTML();
    }
    
    // Default to tree layout
    return this.generateTreeHTML();
  }

  /**
   * Generate tree layout HTML
   */
  generateTreeHTML() {
    const templatePath = path.join(__dirname, 'template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    const { createTreeLayout } = require('./layouts/tree');
    const graphScript = createTreeLayout(this.graphData, this.options);

    // Add search/filter if enabled
    let searchFilterHTML = '';
    let searchFilterJS = '';
    
    if (this.options.includeSearch) {
      const searchFilter = require('./search-filter');
      searchFilterHTML = searchFilter.generateSearchFilterHTML(this.graphData);
      searchFilterJS = searchFilter.generateSearchFilterJS(this.graphData);
    }

    template = template
      .replace(/{{TITLE}}/g, 'Dependency Graph')
      .replace(/{{PROJECT_NAME}}/g, this.graphData.metadata.projectName || 'Unknown')
      .replace(/{{PROJECT_VERSION}}/g, this.graphData.metadata.version || '1.0.0')
      .replace(/{{TOTAL_DEPS}}/g, this.graphData.metadata.totalDependencies || this.graphData.nodes.length - 1)
      .replace(/{{MAX_DEPTH}}/g, this.graphData.metadata.maxDepth || 0)
      .replace(/{{GENERATED_AT}}/g, new Date(this.graphData.metadata.generatedAt).toLocaleString())
      .replace(/{{SEARCH_FILTER_HTML}}/g, searchFilterHTML)
      .replace(/{{GRAPH_SCRIPT}}/g, graphScript + '\n\n' + searchFilterJS);

    return template;
  }

  /**
   * Generate force layout HTML
   */
  generateForceHTML() {
    const forceLayout = require('./layouts/force');
    const layoutData = forceLayout.generateForceLayout(this.graphData, this.options);
    return forceLayout.generateForceHTML(layoutData, this.graphData);
  }

  /**
   * Generate radial layout HTML
   */
  generateRadialHTML() {
    const radialLayout = require('./layouts/radial');
    const layoutData = radialLayout.generateRadialLayout(this.graphData, this.options);
    return radialLayout.generateRadialHTML(layoutData);
  }

  /**
   * Generate conflict layout HTML
   */
  generateConflictHTML() {
    const conflictLayout = require('./layouts/conflict');
    const layoutData = conflictLayout.generateConflictLayout(this.graphData, this.options);
    return conflictLayout.generateConflictHTML(layoutData);
  }
}

module.exports = GraphVisualizer;