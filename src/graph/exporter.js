// src/graph/exporter.js
// Graph exporter - generates HTML/JSON output from graph data
// v3.1.2 - Fixed: module.exports = GraphExporter (not object)

const fs = require('fs');
const path = require('path');

// Import layout generators with safe fallbacks
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
 * Fallback HTML generator if layout file fails to load
 */
function generateFallbackHTML(graphData, options, layoutType) {
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData.links) ? graphData.links : [];
  const projectName = options.projectName || 'Project';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --border-color: #475569;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      overflow: hidden;
    }
    .header {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.95);
      padding: 16px 32px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      z-index: 100;
      text-align: center;
    }
    .header h1 { font-size: 20px; margin-bottom: 4px; }
    .header p { font-size: 12px; color: var(--text-secondary); }
    svg { width: 100vw; height: 100vh; cursor: grab; }
    svg:active { cursor: grabbing; }
    .node circle {
      fill: var(--accent-blue);
      stroke: var(--bg-primary);
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .node circle:hover {
      stroke: var(--text-primary);
      filter: drop-shadow(0 0 8px var(--accent-cyan));
    }
    .node.root circle { fill: #60a5fa; r: 18; }
    .node text {
      fill: var(--text-secondary);
      font-size: 10px;
      pointer-events: none;
    }
    .link {
      stroke: var(--border-color);
      stroke-width: 1.5px;
      stroke-opacity: 0.5;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
    }
    .controls button {
      width: 44px;
      height: 44px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-primary);
      font-size: 20px;
      cursor: pointer;
      backdrop-filter: blur(12px);
    }
    .controls button:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
    }
    .legend {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      z-index: 100;
    }
    .legend-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
    .legend-item { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 11px; color: var(--text-secondary); }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .tooltip {
      position: absolute;
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1000;
      backdrop-filter: blur(12px);
    }
    .tooltip.visible { opacity: 1; }
    .tooltip-title { font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧭 DevCompass - ${layoutType} Layout</h1>
    <p>${nodes.length} packages • ${links.length} dependencies</p>
  </div>
  
  <svg id="graph"></svg>
  
  <div class="controls">
    <button onclick="zoomIn()" title="Zoom In">+</button>
    <button onclick="zoomOut()" title="Zoom Out">−</button>
    <button onclick="resetZoom()" title="Reset">⟲</button>
  </div>
  
  <div class="legend">
    <div class="legend-title">🎨 Health Status</div>
    <div class="legend-item"><div class="legend-dot" style="background: #10b981;"></div>Healthy (7-10)</div>
    <div class="legend-item"><div class="legend-dot" style="background: #eab308;"></div>Caution (5-7)</div>
    <div class="legend-item"><div class="legend-dot" style="background: #f97316;"></div>Warning (3-5)</div>
    <div class="legend-item"><div class="legend-dot" style="background: #ef4444;"></div>Critical (<3)</div>
    <div class="legend-item"><div class="legend-dot" style="background: #60a5fa;"></div>Root Package</div>
  </div>
  
  <div class="tooltip" id="tooltip"></div>

  <script>
    const graphData = ${JSON.stringify({ nodes, links })};
    const width = window.innerWidth;
    const height = window.innerHeight;

    function getColor(node) {
      if (node.type === 'root') return '#60a5fa';
      const score = node.healthScore || 8;
      if (score >= 7) return '#10b981';
      if (score >= 5) return '#eab308';
      if (score >= 3) return '#f97316';
      return '#ef4444';
    }

    function getRadius(node) {
      if (node.type === 'root') return 18;
      if (node.depth === 1) return 10;
      return 6;
    }

    const svg = d3.select("#graph").attr("width", width).attr("height", height);
    const g = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => getRadius(d) + 5));

    const link = g.append("g").selectAll("line")
      .data(graphData.links).join("line").attr("class", "link");

    const node = g.append("g").selectAll("g")
      .data(graphData.nodes).join("g")
      .attr("class", d => "node" + (d.type === "root" ? " root" : ""))
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);

    node.append("circle").attr("r", d => getRadius(d)).attr("fill", d => getColor(d));
    node.append("text").attr("dy", d => getRadius(d) + 12).attr("text-anchor", "middle")
      .text(d => (d.name || d.id).substring(0, 20));

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });

    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = '<div class="tooltip-title">' + (d.name || d.id) + '</div>' +
        'Version: ' + (d.version || 'N/A') + '<br>' +
        'Health: ' + (d.healthScore || 8) + '/10<br>' +
        'Depth: ' + (d.depth || 0);
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY - 10) + 'px';
      tooltip.classList.add('visible');
    }

    function hideTooltip() {
      document.getElementById('tooltip').classList.remove('visible');
    }

    window.zoomIn = () => svg.transition().call(zoom.scaleBy, 1.3);
    window.zoomOut = () => svg.transition().call(zoom.scaleBy, 0.7);
    window.resetZoom = () => svg.transition().call(zoom.transform, d3.zoomIdentity);
  </script>
</body>
</html>`;
}

/**
 * GraphExporter - Exports graph data to various formats
 * This class IS the module.exports (not wrapped in object)
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
   * Generate HTML content based on layout type
   */
  generateHTML() {
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

    // Fallback to built-in generator
    return generateFallbackHTML(filteredData, this.options, layout);
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
   * Export to file (main method called by graph.js)
   */
  export(outputPath) {
    return this.exportToFile(outputPath);
  }

  /**
   * Export to file
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

// ============================================================================
// CRITICAL: Export the CLASS DIRECTLY, not wrapped in an object
// This matches: const GraphExporter = require('../graph/exporter');
// ============================================================================
module.exports = GraphExporter;