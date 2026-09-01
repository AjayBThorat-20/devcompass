// src/features/graph/graph.exporter.js

const fs = require('fs');
const path = require('path');

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

  validateGraphData(graphData) {
    if (!graphData) return { nodes: [], links: [], metadata: {} };
    return { nodes: Array.isArray(graphData.nodes) ? graphData.nodes : [], links: Array.isArray(graphData.links) ? graphData.links : [], metadata: graphData.metadata || {} };
  }

  generateHTML() {
    const dashboardIndexPath = path.join(__dirname, '../../dashboard/index.html');
    const clusteringPath = path.join(__dirname, '../graph/graph.clustering.js');

    try {
      if (!fs.existsSync(dashboardIndexPath)) {
        console.warn('Dashboard not found, falling back to minimal graph...');
        return this.generateFallbackHTML();
      }

      let html = fs.readFileSync(dashboardIndexPath, 'utf8');
      const enrichedData = {
        ...this.graphData,
        metadata: { ...this.graphData.metadata, projectName: this.options.projectName, projectVersion: this.options.projectVersion, defaultLayout: this.options.layout, defaultFilter: this.options.filter, generatedAt: new Date().toISOString() }
      };

      html = html.replace('{{GRAPH_DATA}}', JSON.stringify(enrichedData, null, 2));

      let clusteringCode = '';
      if (fs.existsSync(clusteringPath)) {
        clusteringCode = fs.readFileSync(clusteringPath, 'utf8').replace(/if \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\}/g, '');
      }
      html = html.replace('{{CLUSTERING_CODE}}', clusteringCode);
      html = this.inlineAllAssets(html);
      return html;
    } catch (error) {
      if (process.env.DEBUG) console.error('Failed to generate dashboard HTML:', error.message);
      return this.generateFallbackHTML();
    }
  }

  inlineAllAssets(html) {
    const dashboardDir = path.join(__dirname, '../../dashboard');

    html = html.replace(/<link rel="stylesheet" href="styles\/(.*?\.css)">/g, (match, filename) => {
      const cssPath = path.join(dashboardDir, 'styles', filename);
      try {
        if (fs.existsSync(cssPath)) return `<style>\n/* ${filename} */\n${fs.readFileSync(cssPath, 'utf8')}\n</style>`;
      } catch (e) { /* skip */ }
      return match;
    });

    html = html.replace(/<script src="scripts\/(.*?\.js)"><\/script>/g, (match, filename) => {
      const jsPath = path.join(dashboardDir, 'scripts', filename);
      try {
        if (fs.existsSync(jsPath)) return `<script>\n/* ${filename} */\n${fs.readFileSync(jsPath, 'utf8')}\n</script>`;
      } catch (e) { /* skip */ }
      return match;
    });

    return html;
  }

  generateFallbackHTML() {
    const nodes = this.graphData.nodes || [];
    const links = this.graphData.links || [];
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; overflow: hidden; }
    svg { width: 100vw; height: 100vh; cursor: grab; }
    svg:active { cursor: grabbing; }
    .node circle { fill: #3b82f6; stroke: #0f172a; stroke-width: 2px; cursor: pointer; }
    .node text { fill: #94a3b8; font-size: 11px; pointer-events: none; }
    .link { stroke: #475569; stroke-width: 1.5px; stroke-opacity: 0.6; }
    .controls { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; }
    .btn { width: 48px; height: 48px; background: rgba(30, 41, 59, 0.95); border: 1px solid #475569; border-radius: 12px; color: #f1f5f9; font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn:hover { background: #3b82f6; border-color: #3b82f6; }
    .tooltip { position: absolute; background: rgba(15, 23, 42, 0.98); border: 1px solid #3b82f6; border-radius: 8px; padding: 12px 16px; pointer-events: none; opacity: 0; transition: opacity 0.2s; font-size: 14px; max-width: 250px; z-index: 10000; }
    .tooltip.visible { opacity: 1; }
  </style>
</head>
<body>
  <svg id="graph"></svg>
  <div class="controls">
    <button class="btn" onclick="zoomIn()">+</button>
    <button class="btn" onclick="zoomOut()">−</button>
    <button class="btn" onclick="resetZoom()">⟲</button>
  </div>
  <div class="tooltip" id="tooltip"></div>
  <script>
    const graphData = ${JSON.stringify({ nodes, links })};
    const svg = d3.select("#graph");
    const width = window.innerWidth, height = window.innerHeight;
    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", e => { g.attr("transform", e.transform); });
    svg.call(zoom);
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width/2, height/2))
      .force("collision", d3.forceCollide().radius(20));
    const link = g.append("g").selectAll("line").data(graphData.links).join("line").attr("class", "link");
    const node = g.append("g").selectAll("g").data(graphData.nodes).join("g").attr("class", "node")
      .call(d3.drag().on("start", e => { if (!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y; })
        .on("drag", e => { e.subject.fx = e.x; e.subject.fy = e.y; })
        .on("end", e => { if (!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; }))
      .on("mouseover", (ev, d) => {
        const t = document.getElementById('tooltip');
        t.innerHTML = \`<div style="color:#60a5fa;font-weight:600">\${d.name || d.id}</div><div>Version: \${d.version || 'N/A'}</div><div>Health: \${d.healthScore || 8}/10</div>\`;
        t.style.left = (ev.pageX + 10) + 'px'; t.style.top = (ev.pageY + 10) + 'px'; t.classList.add('visible');
      })
      .on("mouseout", () => document.getElementById('tooltip').classList.remove('visible'));
    node.append("circle").attr("r", d => d.type === 'root' ? 12 : 8);
    node.append("text").attr("dy", -12).attr("text-anchor", "middle").text(d => { const n = d.name || d.id; return n.length > 15 ? n.substring(0, 12) + '...' : n; });
    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
    });
    function zoomIn() { svg.transition().duration(300).call(zoom.scaleBy, 1.3); }
    function zoomOut() { svg.transition().duration(300).call(zoom.scaleBy, 0.7); }
    function resetZoom() { svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity); }
  </script>
</body>
</html>`;
  }

  generateJSON() { return JSON.stringify(this.graphData, null, 2); }

  exportToFile(outputPath) {
    try {
      const ext = path.extname(outputPath).toLowerCase();
      const isJSON = ext === '.json';
      const content = isJSON ? this.generateJSON() : this.generateHTML();
      const format = isJSON ? 'JSON' : 'HTML';

      const dir = path.dirname(outputPath);
      if (dir && dir !== '.' && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, content, 'utf-8');

      return { success: true, format, path: outputPath, fileSize: this.getFileSize(outputPath), nodes: this.graphData.nodes.length, links: this.graphData.links.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getFileSize(filePath) {
    try {
      const bytes = fs.statSync(filePath).size;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } catch { return 'Unknown'; }
  }

  export(outputPath) { return this.exportToFile(outputPath); }
}

module.exports = GraphExporter;