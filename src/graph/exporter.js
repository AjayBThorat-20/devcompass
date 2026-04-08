// src/graph/exporter.js
const fs = require('fs');
const path = require('path');
const GraphVisualizer = require('./visualizer');

/**
 * GraphExporter - Export graphs to HTML and JSON formats
 */
class GraphExporter {
  constructor(graphData, options = {}) {
    this.graphData = graphData;
    this.options = options;
  }

  /**
   * Export to HTML file
   */
  async exportHTML(outputPath) {
    try {
      const visualizer = new GraphVisualizer(this.graphData, {
        ...this.options,
        interactive: true
      });

      const html = visualizer.generateHTML();
      fs.writeFileSync(outputPath, html, 'utf8');

      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      return {
        success: true,
        path: outputPath,
        format: 'html',
        fileSize: fileSizeKB + ' KB'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export to JSON file
   */
  async exportJSON(outputPath) {
    try {
      const json = JSON.stringify(this.graphData, null, 2);
      fs.writeFileSync(outputPath, json, 'utf8');

      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      return {
        success: true,
        path: outputPath,
        format: 'json',
        fileSize: fileSizeKB + ' KB'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-detect format and export
   */
  async export(outputPath) {
    const ext = path.extname(outputPath).toLowerCase();

    switch (ext) {
      case '.html':
        return this.exportHTML(outputPath);
      case '.json':
        return this.exportJSON(outputPath);
      case '.svg':
      case '.png':
        return {
          success: false,
          error: `${ext.substring(1).toUpperCase()} export is not supported. Use HTML or JSON format instead.`
        };
      default:
        return this.exportHTML(outputPath);
    }
  }
}

module.exports = GraphExporter;