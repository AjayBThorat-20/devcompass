// src/graph/exporter.js
// v3.1.6 - Unified graph exporter with clustering support

const fs = require('fs');
const path = require('path');

// Import layout generators
let generateTreeLayoutHTML, generateRadialLayoutHTML, generateForceLayoutHTML, generateConflictLayoutHTML;

try {
  const tree = require('./layouts/tree');
  generateTreeLayoutHTML = tree.generateTreeLayoutHTML || tree.createTreeLayout || tree;
} catch (e) {
  generateTreeLayoutHTML = null;
}

try {
  const radial = require('./layouts/radial');
  generateRadialLayoutHTML = radial.generateRadialLayoutHTML || radial.generateRadialLayout || radial;
} catch (e) {
  generateRadialLayoutHTML = null;
}

try {
  const force = require('./layouts/force');
  generateForceLayoutHTML = force.generateForceLayoutHTML || force.generateForceLayout || force;
} catch (e) {
  generateForceLayoutHTML = null;
}

try {
  const conflict = require('./layouts/conflict');
  generateConflictLayoutHTML = conflict.generateConflictLayoutHTML || conflict;
} catch (e) {
  generateConflictLayoutHTML = null;
}

/**
 * GraphExporter - Exports graph data to various formats
 */
class GraphExporter {
  constructor(graphData, options = {}) {
    this.graphData = this.validateGraphData(graphData);
    this.options = {
      width: options.width || 1400,
      height: options.height || 900,
      layout: options.layout || 'tree',
      projectName: options.projectName || 'Project',
      projectVersion: options.projectVersion || '1.0.0',
      filter: options.filter || 'all',
      unified: options.unified !== false, // Enable unified mode by default
      ...options
    };
  }

  /**
   * Validate and normalize graph data
   */
  validateGraphData(graphData) {
    if (!graphData) {
      return { nodes: [], links: [], metadata: {} };
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
  applyFilter() {
    const filter = this.options.filter;
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
          n.isVulnerable === true ||
          (Array.isArray(n.issues) && n.issues.some(i => 
            i.type === 'security' || i.type === 'vulnerability'
          ))
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

      case 'deprecated':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          n.isDeprecated === true ||
          (Array.isArray(n.issues) && n.issues.some(i => i.type === 'deprecated'))
        );
        break;

      case 'conflict':
        filteredNodes = nodes.filter(n => 
          n.type === 'root' || 
          (Array.isArray(n.issues) && n.issues.length > 0) ||
          (n.healthScore !== undefined && n.healthScore < 7)
        );
        break;

      default:
        filteredNodes = nodes;
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
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
   * Generate unified HTML with dynamic controls and clustering (v3.1.6)
   */
  generateUnifiedHTML() {
    const templatePath = path.join(__dirname, 'template.html');
    const clusteringPath = path.join(__dirname, 'clustering.js');
    
    try {
      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Read clustering code (v3.1.6)
      let clusteringCode = '';
      if (fs.existsSync(clusteringPath)) {
        clusteringCode = fs.readFileSync(clusteringPath, 'utf8');
        
        // Remove Node.js exports from clustering code for browser
        clusteringCode = clusteringCode.replace(
          /if \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\}/g,
          ''
        );
      }
      
      // Inject graph data
      template = template.replace('{{GRAPH_DATA}}', JSON.stringify(this.graphData, null, 2));
      
      // Inject clustering code (v3.1.6)
      template = template.replace('{{CLUSTERING_CODE}}', clusteringCode);
      
      return template;
    } catch (error) {
      console.error('Failed to load unified template:', error.message);
      console.error('Template path:', templatePath);
      console.error('Clustering path:', clusteringPath);
      // Fallback to traditional layout
      return this.generateTraditionalHTML();
    }
  }

  /**
   * Generate traditional HTML (single layout)
   */
  generateTraditionalHTML() {
    const filteredData = this.applyFilter();
    const layout = (this.options.layout || 'tree').toLowerCase();

    try {
      switch (layout) {
        case 'force':
          if (typeof generateForceLayoutHTML === 'function') {
            return generateForceLayoutHTML(filteredData, this.options);
          }
          break;

        case 'radial':
          if (typeof generateRadialLayoutHTML === 'function') {
            return generateRadialLayoutHTML(filteredData, this.options);
          }
          break;

        case 'conflict':
          if (typeof generateConflictLayoutHTML === 'function') {
            return generateConflictLayoutHTML(filteredData, this.options);
          }
          break;

        case 'tree':
        default:
          if (typeof generateTreeLayoutHTML === 'function') {
            return generateTreeLayoutHTML(filteredData, this.options);
          }
          break;
      }
    } catch (error) {
      console.error(`Layout error (${layout}):`, error.message);
    }

    // Final fallback
    return this.generateFallbackHTML(filteredData, layout);
  }

  /**
   * Generate HTML content
   */
  generateHTML() {
    // Use unified template by default
    if (this.options.unified) {
      return this.generateUnifiedHTML();
    }
    
    // Fallback to traditional single-layout mode
    return this.generateTraditionalHTML();
  }

  /**
   * Fallback HTML generator
   */
  generateFallbackHTML(graphData, layoutType) {
    const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const links = Array.isArray(graphData.links) ? graphData.links : [];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f1f5f9; margin: 0; }
    svg { width: 100vw; height: 100vh; }
    .node circle { fill: #3b82f6; stroke: #fff; stroke-width: 2px; }
    .node text { fill: #94a3b8; font-size: 10px; }
    .link { stroke: #475569; stroke-width: 1.5px; stroke-opacity: 0.6; }
  </style>
</head>
<body>
  <svg id="graph"></svg>
  <script>
    const data = ${JSON.stringify({ nodes, links })};
    const svg = d3.select("#graph");
    const width = window.innerWidth;
    const height = window.innerHeight;
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width/2, height/2));
    const link = svg.append("g").selectAll("line").data(data.links).join("line").attr("class", "link");
    const node = svg.append("g").selectAll("g").data(data.nodes).join("g").attr("class", "node");
    node.append("circle").attr("r", 8);
    node.append("text").attr("dy", -12).text(d => d.name);
    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });
  </script>
</body>
</html>`;
  }

  /**
   * Generate JSON output
   */
  generateJSON() {
    const filteredData = this.applyFilter();
    return JSON.stringify(filteredData, null, 2);
  }

  /**
   * Get file size helper
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const bytes = stats.size;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Export to file (main method)
   */
  export(outputPath) {
    return this.exportToFile(outputPath);
  }

  /**
   * Export to file implementation
   */
  exportToFile(outputPath) {
    try {
      const ext = path.extname(outputPath).toLowerCase();
      let content;
      let format;

      if (ext === '.json') {
        content = this.generateJSON();
        format = 'JSON';
      } else {
        content = this.generateHTML();
        format = 'HTML';
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (dir && dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, content, 'utf-8');

      return {
        success: true,
        format,
        path: outputPath,
        fileSize: this.getFileSize(outputPath),
        nodes: this.graphData.nodes.length,
        links: this.graphData.links.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export HTML (legacy method)
   */
  exportHTML(outputPath) {
    const content = this.generateHTML();
    fs.writeFileSync(outputPath, content, 'utf-8');
    return { success: true, path: outputPath, format: 'HTML' };
  }

  /**
   * Export JSON (legacy method)
   */
  exportJSON(outputPath) {
    const content = this.generateJSON();
    fs.writeFileSync(outputPath, content, 'utf-8');
    return { success: true, path: outputPath, format: 'JSON' };
  }
}

module.exports = GraphExporter;