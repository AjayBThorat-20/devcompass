// src/graph/layouts/radial.js
// Fixed radial layout with improved label positioning and collision handling

function generateRadialLayoutHTML(graphData, options = {}) {
  const width = options.width || 1400;
  const height = options.height || 900;
  const projectName = options.projectName || 'Project';
  const projectVersion = options.projectVersion || '1.0.0';

  // Validate input
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData.links) ? graphData.links : [];

  if (nodes.length === 0) {
    return generateEmptyStateHTML(projectName, projectVersion);
  }

  const graphDataJSON = JSON.stringify({ nodes, links });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Radial Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --accent-purple: #8b5cf6;
      --border-color: #475569;
      --health-excellent: #10b981;
      --health-good: #84cc16;
      --health-caution: #eab308;
      --health-warning: #f97316;
      --health-critical: #ef4444;
      --root-color: #60a5fa;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      overflow: hidden;
    }

    #container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    svg {
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    svg:active { cursor: grabbing; }

    /* Header */
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
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 100;
      text-align: center;
    }

    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .header-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Controls Panel */
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 20px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 100;
      min-width: 180px;
    }

    .controls-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .control-btn {
      display: block;
      width: 100%;
      padding: 10px 14px;
      margin: 6px 0;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      text-align: left;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
    }

    .control-btn.active {
      background: var(--accent-purple);
      border-color: var(--accent-purple);
    }

    /* Legend */
    .legend {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 100;
    }

    .legend-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 6px 0;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Depth circles visualization */
    .depth-circle {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 1px;
      stroke-dasharray: 4, 4;
      opacity: 0.4;
    }

    .depth-label {
      fill: var(--text-muted);
      font-size: 10px;
      font-weight: 500;
    }

    /* Node styles */
    .node circle {
      stroke: var(--bg-primary);
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .node circle:hover {
      stroke: var(--text-primary);
      stroke-width: 3px;
      filter: drop-shadow(0 0 10px currentColor);
    }

    .node-label {
      font-size: 9px;
      fill: var(--text-secondary);
      pointer-events: none;
      font-weight: 500;
      text-shadow: 
        -1px -1px 2px var(--bg-primary),
        1px -1px 2px var(--bg-primary),
        -1px 1px 2px var(--bg-primary),
        1px 1px 2px var(--bg-primary);
    }

    .node-label.hidden { display: none; }

    /* Link styles */
    .link {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 1px;
      stroke-opacity: 0.4;
    }

    .link.highlighted {
      stroke: var(--accent-cyan);
      stroke-opacity: 0.8;
      stroke-width: 2px;
    }

    /* Tooltip */
    .tooltip {
      position: absolute;
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 12px;
      max-width: 280px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.2s, transform 0.2s;
      z-index: 1000;
      backdrop-filter: blur(12px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    }

    .tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .tooltip-title {
      font-weight: 700;
      color: var(--accent-cyan);
      margin-bottom: 8px;
      font-size: 13px;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .tooltip-label { color: var(--text-secondary); }
    .tooltip-value { color: var(--text-primary); font-weight: 600; }

    /* Zoom Controls */
    .zoom-controls {
      position: fixed;
      bottom: 20px;
      left: 20px;
      display: flex;
      gap: 8px;
      z-index: 100;
    }

    .zoom-btn {
      width: 40px;
      height: 40px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      backdrop-filter: blur(12px);
    }

    .zoom-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
    }
  </style>
</head>
<body>
  <div id="container"></div>

  <div class="header">
    <div class="header-title">🌐 Radial Dependency Graph</div>
    <div class="header-subtitle">Concentric circles by dependency depth</div>
  </div>

  <div class="controls">
    <div class="controls-title">Display Options</div>
    <button class="control-btn active" id="btn-labels" onclick="toggleLabels()">Toggle Labels</button>
    <button class="control-btn" id="btn-depth" onclick="toggleDepthCircles()">Toggle Depth Circles</button>
    <button class="control-btn" id="btn-links" onclick="toggleLinks()">Toggle Links</button>
  </div>

  <div class="legend">
    <div class="legend-title">Health Status</div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-excellent);"></div>
      <span>Healthy (7-10)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-caution);"></div>
      <span>Caution (5-7)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-warning);"></div>
      <span>Warning (3-5)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-critical);"></div>
      <span>Critical (<3)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--root-color);"></div>
      <span>Root Package</span>
    </div>
  </div>

  <div class="zoom-controls">
    <button class="zoom-btn" onclick="zoomIn()">+</button>
    <button class="zoom-btn" onclick="zoomOut()">−</button>
    <button class="zoom-btn" onclick="resetZoom()">⟲</button>
  </div>

  <div class="tooltip" id="tooltip"></div>

  <script>
    const graphData = ${graphDataJSON};
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let showLabels = true;
    let showDepthCircles = true;
    let showLinks = true;
    let currentZoom = 1;

    // Calculate max depth
    const maxDepth = Math.max(...graphData.nodes.map(n => n.depth || 0), 1);
    
    // Radius configuration - distribute nodes across available space
    const minRadius = 60;
    const maxRadius = Math.min(width, height) / 2 - 100;
    const radiusStep = (maxRadius - minRadius) / Math.max(maxDepth, 1);

    // Get radius for depth level
    function getRadiusForDepth(depth) {
      if (depth === 0) return 0; // Root at center
      return minRadius + (depth - 1) * radiusStep + radiusStep / 2;
    }

    // Get color based on health score
    function getHealthColor(node) {
      if (node.type === 'root' || node.depth === 0) return 'var(--root-color)';
      const score = node.healthScore || 8;
      if (score >= 7) return 'var(--health-excellent)';
      if (score >= 5) return 'var(--health-caution)';
      if (score >= 3) return 'var(--health-warning)';
      return 'var(--health-critical)';
    }

    // Get node radius based on type/depth
    function getNodeRadius(node) {
      if (node.type === 'root' || node.depth === 0) return 20;
      if (node.depth === 1) return 10;
      return 6;
    }

    // Group nodes by depth for angular distribution
    const nodesByDepth = {};
    graphData.nodes.forEach(node => {
      const depth = node.depth || 0;
      if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
      nodesByDepth[depth].push(node);
    });

    // Calculate positions for each node
    graphData.nodes.forEach(node => {
      const depth = node.depth || 0;
      const nodesAtDepth = nodesByDepth[depth];
      const index = nodesAtDepth.indexOf(node);
      const count = nodesAtDepth.length;
      
      if (depth === 0) {
        // Root at center
        node.x = centerX;
        node.y = centerY;
      } else {
        // Distribute evenly around circle at this depth
        // Add some offset to avoid all nodes starting at same angle
        const angleOffset = (depth * 0.3); // Stagger by depth
        const angle = (2 * Math.PI * index / count) + angleOffset;
        const radius = getRadiusForDepth(depth);
        
        node.x = centerX + radius * Math.cos(angle);
        node.y = centerY + radius * Math.sin(angle);
        node.angle = angle; // Store for label positioning
      }
    });

    // Create SVG
    const svg = d3.select("#container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentZoom = event.transform.k;
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Draw depth circles (concentric rings)
    const depthCirclesGroup = g.append("g").attr("class", "depth-circles");
    
    for (let d = 1; d <= maxDepth; d++) {
      const r = getRadiusForDepth(d);
      
      depthCirclesGroup.append("circle")
        .attr("class", "depth-circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", r);
      
      // Depth label
      depthCirclesGroup.append("text")
        .attr("class", "depth-label")
        .attr("x", centerX + r + 5)
        .attr("y", centerY - 5)
        .text("Depth " + d);
    }

    // Build link lookup for highlighting
    const linkLookup = new Set();
    graphData.links.forEach(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      linkLookup.add(sourceId + '-' + targetId);
    });

    // Create node lookup
    const nodeById = new Map();
    graphData.nodes.forEach(n => nodeById.set(n.id, n));

    // Draw links with curved paths
    const linksGroup = g.append("g").attr("class", "links");
    
    const links = linksGroup.selectAll(".link")
      .data(graphData.links)
      .join("path")
      .attr("class", "link")
      .attr("d", d => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        const source = nodeById.get(sourceId);
        const target = nodeById.get(targetId);
        
        if (!source || !target) return '';
        
        // Use curved path through center point for radial layout
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        
        // Pull midpoint slightly toward center for nice curves
        const pullFactor = 0.2;
        const curveX = midX + (centerX - midX) * pullFactor;
        const curveY = midY + (centerY - midY) * pullFactor;
        
        return "M" + source.x + "," + source.y 
             + "Q" + curveX + "," + curveY 
             + " " + target.x + "," + target.y;
      });

    // Draw nodes
    const nodesGroup = g.append("g").attr("class", "nodes");
    
    const node = nodesGroup.selectAll(".node")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    // Add circles
    node.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => getHealthColor(d));

    // Add labels with smart positioning
    node.append("text")
      .attr("class", "node-label")
      .attr("dy", d => {
        if (d.depth === 0) return -28;
        // Position label outside the circle based on angle
        const angle = d.angle || 0;
        return Math.sin(angle) > 0.3 ? 20 : (Math.sin(angle) < -0.3 ? -12 : 4);
      })
      .attr("dx", d => {
        if (d.depth === 0) return 0;
        const angle = d.angle || 0;
        return Math.cos(angle) > 0.3 ? 12 : (Math.cos(angle) < -0.3 ? -12 : 0);
      })
      .attr("text-anchor", d => {
        if (d.depth === 0) return "middle";
        const angle = d.angle || 0;
        if (Math.cos(angle) > 0.3) return "start";
        if (Math.cos(angle) < -0.3) return "end";
        return "middle";
      })
      .text(d => {
        // Truncate long names
        const name = d.name || d.id;
        return name.length > 15 ? name.substring(0, 12) + '...' : name;
      });

    // Tooltip functions
    function handleMouseOver(event, d) {
      // Highlight connected links
      links.classed("highlighted", l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return sourceId === d.id || targetId === d.id;
      });

      // Show tooltip
      const tooltip = document.getElementById('tooltip');
      const score = d.healthScore || 8;
      
      tooltip.innerHTML = 
        '<div class="tooltip-title">' + (d.name || d.id) + '</div>' +
        '<div class="tooltip-row"><span class="tooltip-label">Version</span><span class="tooltip-value">' + (d.version || 'N/A') + '</span></div>' +
        '<div class="tooltip-row"><span class="tooltip-label">Health Score</span><span class="tooltip-value">' + score + '/10</span></div>' +
        '<div class="tooltip-row"><span class="tooltip-label">Depth</span><span class="tooltip-value">' + (d.depth || 0) + '</span></div>' +
        '<div class="tooltip-row"><span class="tooltip-label">Type</span><span class="tooltip-value">' + (d.type || 'dependency') + '</span></div>';
      
      tooltip.classList.add('visible');
      
      const x = Math.min(event.pageX + 15, window.innerWidth - 300);
      const y = event.pageY - 10;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }

    function handleMouseOut() {
      links.classed("highlighted", false);
      document.getElementById('tooltip').classList.remove('visible');
    }

    // Control functions
    function toggleLabels() {
      showLabels = !showLabels;
      d3.selectAll('.node-label').classed('hidden', !showLabels);
      document.getElementById('btn-labels').classList.toggle('active', showLabels);
    }

    function toggleDepthCircles() {
      showDepthCircles = !showDepthCircles;
      d3.selectAll('.depth-circles').style('display', showDepthCircles ? 'block' : 'none');
      document.getElementById('btn-depth').classList.toggle('active', showDepthCircles);
    }

    function toggleLinks() {
      showLinks = !showLinks;
      d3.selectAll('.links').style('display', showLinks ? 'block' : 'none');
      document.getElementById('btn-links').classList.toggle('active', showLinks);
    }

    function zoomIn() {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    }

    function zoomOut() {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }

    function resetZoom() {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') toggleLabels();
      if (e.key === 'd' || e.key === 'D') toggleDepthCircles();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'r' || e.key === 'R') resetZoom();
    });
  </script>
</body>
</html>`;
}

/**
 * Generate empty state HTML
 */
function generateEmptyStateHTML(projectName, projectVersion) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DevCompass - No Dependencies</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .message {
      text-align: center;
      padding: 40px;
      background: rgba(30, 41, 59, 0.95);
      border-radius: 20px;
      border: 1px solid #475569;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; font-size: 24px; }
    p { color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="message">
    <div class="icon">🌐</div>
    <h1>No Dependencies Found</h1>
    <p>${projectName} has no dependencies to visualize.</p>
  </div>
</body>
</html>`;
}

/**
 * Legacy function for backward compatibility
 */
function generateRadialLayout(graphData, options = {}) {
  return generateRadialLayoutHTML(graphData, options);
}

module.exports = {
  generateRadialLayout,
  generateRadialLayoutHTML
};