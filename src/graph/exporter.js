// src/graph/exporter.js

const fs = require('fs');
const path = require('path');

/**
 * GraphExporter - Exports graph data using unified dashboard
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
      unified: options.unified !== false,
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
   * Generate unified dashboard HTML
   */
  generateHTML() {
    const dashboardIndexPath = path.join(__dirname, '../dashboard/index.html');
    const clusteringPath = path.join(__dirname, 'clustering.js');
    
    try {
      // Check if dashboard exists
      if (!fs.existsSync(dashboardIndexPath)) {
        console.warn('Dashboard not found at:', dashboardIndexPath);
        console.warn('Falling back to minimal graph...');
        return this.generateFallbackHTML();
      }

      // Read dashboard template
      let html = fs.readFileSync(dashboardIndexPath, 'utf8');
      
      // Add metadata to graph data
      const enrichedData = {
        ...this.graphData,
        metadata: {
          ...this.graphData.metadata,
          projectName: this.options.projectName,
          projectVersion: this.options.projectVersion,
          defaultLayout: this.options.layout,
          defaultFilter: this.options.filter,
          generatedAt: new Date().toISOString()
        }
      };
      
      // Inject graph data
      html = html.replace('{{GRAPH_DATA}}', JSON.stringify(enrichedData, null, 2));
      
      // Read and inject clustering code
      let clusteringCode = '';
      if (fs.existsSync(clusteringPath)) {
        clusteringCode = fs.readFileSync(clusteringPath, 'utf8');
        
        // Remove Node.js exports for browser
        clusteringCode = clusteringCode.replace(
          /if \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\}/g,
          ''
        );
      }
      
      html = html.replace('{{CLUSTERING_CODE}}', clusteringCode);
      
      // Inline all assets (CSS and JS)
      html = this.inlineAllAssets(html);
      
      return html;
    } catch (error) {
      console.error('Failed to generate dashboard HTML:', error.message);
      console.error('Falling back to minimal graph...');
      return this.generateFallbackHTML();
    }
  }


  inlineAllAssets(html) {
    const dashboardDir = path.join(__dirname, '../dashboard');
    
    // Inline CSS files
    const cssRegex = /<link rel="stylesheet" href="styles\/(.*?\.css)">/g;
    html = html.replace(cssRegex, (match, filename) => {
      const cssPath = path.join(dashboardDir, 'styles', filename);
      
      try {
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf8');
          return `<style>\n/* ${filename} */\n${cssContent}\n</style>`;
        }
      } catch (error) {
        console.warn(`Could not inline CSS: ${filename}`);
      }
      
      return match; // Keep original if file not found
    });
    
    // Inline JavaScript files (except D3.js CDN)
    const jsRegex = /<script src="scripts\/(.*?\.js)"><\/script>/g;
    html = html.replace(jsRegex, (match, filename) => {
      const jsPath = path.join(dashboardDir, 'scripts', filename);
      
      try {
        if (fs.existsSync(jsPath)) {
          const jsContent = fs.readFileSync(jsPath, 'utf8');
          return `<script>\n/* ${filename} */\n${jsContent}\n</script>`;
        }
      } catch (error) {
        console.warn(`Could not inline JS: ${filename}`);
      }
      
      return match; // Keep original if file not found
    });
    
    return html;
  }

  /**
   * Fallback HTML generator (minimal working graph)
   */
  generateFallbackHTML() {
    const nodes = Array.isArray(this.graphData.nodes) ? this.graphData.nodes : [];
    const links = Array.isArray(this.graphData.links) ? this.graphData.links : [];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass v3.2.0 - Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      margin: 0;
      overflow: hidden;
    }
    .header {
      background: rgba(30, 41, 59, 0.95);
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    .header .meta {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    svg { 
      width: 100vw; 
      height: calc(100vh - 80px);
      cursor: grab;
    }
    svg:active { cursor: grabbing; }
    .node circle { 
      fill: #3b82f6; 
      stroke: #0f172a; 
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .node circle:hover {
      fill: #60a5fa;
      stroke: #fff;
      stroke-width: 3px;
    }
    .node text { 
      fill: #94a3b8; 
      font-size: 11px;
      pointer-events: none;
      user-select: none;
    }
    .link { 
      stroke: #475569; 
      stroke-width: 1.5px; 
      stroke-opacity: 0.6;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 1000;
    }
    .btn {
      width: 48px;
      height: 48px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #475569;
      border-radius: 12px;
      color: #f1f5f9;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #3b82f6;
      border-color: #3b82f6;
      transform: scale(1.1);
    }
    .zoom-level {
      width: 48px;
      padding: 0.5rem;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #475569;
      border-radius: 12px;
      text-align: center;
      color: #60a5fa;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .tooltip {
      position: absolute;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10000;
      font-size: 0.875rem;
      max-width: 250px;
    }
    .tooltip.visible { opacity: 1; }
    .tooltip-title {
      font-weight: 600;
      color: #60a5fa;
      margin-bottom: 0.5rem;
    }
    .tooltip-row {
      display: flex;
      justify-content: space-between;
      margin: 0.25rem 0;
      font-size: 0.8rem;
    }
    .tooltip-label { color: #94a3b8; }
    .tooltip-value { color: #f1f5f9; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 DevCompass v3.2.0 - Minimal Graph</h1>
    <div class="meta">
      Project: ${this.options.projectName} v${this.options.projectVersion} | 
      ${nodes.length} packages
    </div>
  </div>
  
  <svg id="graph"></svg>
  
  <div class="controls">
    <button class="btn" onclick="zoomIn()" title="Zoom In">+</button>
    <div class="zoom-level" id="zoomLevel">100%</div>
    <button class="btn" onclick="zoomOut()" title="Zoom Out">−</button>
    <button class="btn" onclick="resetZoom()" title="Reset">⟲</button>
  </div>
  
  <div class="tooltip" id="tooltip"></div>
  
  <script>
    const graphData = ${JSON.stringify({ nodes, links })};
    const svg = d3.select("#graph");
    const width = window.innerWidth;
    const height = window.innerHeight - 80;
    
    const g = svg.append("g");
    
    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        updateZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    
    // Force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width/2, height/2))
      .force("collision", d3.forceCollide().radius(20));
    
    // Links
    const link = g.append("g").selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("class", "link");
    
    // Nodes
    const node = g.append("g").selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragStart)
        .on("drag", dragging)
        .on("end", dragEnd))
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);
    
    node.append("circle")
      .attr("r", d => d.type === 'root' ? 12 : 8);
    
    node.append("text")
      .attr("dy", -12)
      .attr("text-anchor", "middle")
      .text(d => {
        const name = d.name || d.id;
        return name.length > 15 ? name.substring(0, 12) + '...' : name;
      });
    
    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });
    
    // Drag functions
    function dragStart(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragging(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragEnd(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Tooltip
    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = \`
        <div class="tooltip-title">\${d.name || d.id}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Version</span>
          <span class="tooltip-value">\${d.version || 'N/A'}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Depth</span>
          <span class="tooltip-value">\${d.depth || 0}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Health</span>
          <span class="tooltip-value">\${d.healthScore || 8}/10</span>
        </div>
      \`;
      tooltip.style.left = (event.pageX + 10) + 'px';
      tooltip.style.top = (event.pageY + 10) + 'px';
      tooltip.classList.add('visible');
    }
    
    function hideTooltip() {
      document.getElementById('tooltip').classList.remove('visible');
    }
    
    // Zoom controls
    function zoomIn() {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    }
    
    function zoomOut() {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }
    
    function resetZoom() {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    }
    
    function updateZoomLevel(scale) {
      document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate JSON output
   */
  generateJSON() {
    return JSON.stringify(this.graphData, null, 2);
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
   * Main export method
   */
  export(outputPath) {
    return this.exportToFile(outputPath);
  }

  /**
   * Legacy methods for backward compatibility
   */
  exportHTML(outputPath) {
    const content = this.generateHTML();
    fs.writeFileSync(outputPath, content, 'utf-8');
    return { success: true, path: outputPath, format: 'HTML' };
  }

  exportJSON(outputPath) {
    const content = this.generateJSON();
    fs.writeFileSync(outputPath, content, 'utf-8');
    return { success: true, path: outputPath, format: 'JSON' };
  }
}

module.exports = GraphExporter;