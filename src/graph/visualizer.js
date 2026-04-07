const fs = require('fs');
const path = require('path');
const { createTreeLayout } = require('./layouts/tree');

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
      ...options
    };
  }

  /**
   * Generate HTML visualization
   */
  generateHTML() {
    const templatePath = path.join(__dirname, 'template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    const graphScript = this.generateGraphScript();

    template = template
      .replace(/{{TITLE}}/g, 'Dependency Graph')
      .replace(/{{PROJECT_NAME}}/g, this.graphData.metadata.projectName || 'Unknown')
      .replace(/{{PROJECT_VERSION}}/g, this.graphData.metadata.version || '1.0.0')
      .replace(/{{TOTAL_DEPS}}/g, this.graphData.metadata.totalDependencies)
      .replace(/{{MAX_DEPTH}}/g, this.graphData.metadata.maxDepth)
      .replace(/{{GENERATED_AT}}/g, new Date(this.graphData.metadata.generatedAt).toLocaleString())
      .replace(/{{GRAPH_SCRIPT}}/g, graphScript);

    return template;
  }

  /**
   * Generate D3.js graph script
   */
  generateGraphScript() {
    return createTreeLayout(this.graphData, this.options);
  }
}

module.exports = GraphVisualizer;
