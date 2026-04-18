// src/graph/layouts/tree.js
// Fixed tree layout with proper horizontal spreading
// v3.1.2 - Fixed overlapping Controls/Statistics panels

function generateTreeLayoutHTML(graphData, options = {}) {
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

  // Build hierarchy from flat nodes/links
  const hierarchyData = buildHierarchy(nodes, links);
  const graphDataJSON = JSON.stringify({ nodes, links, hierarchy: hierarchyData });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Dependency Tree</title>
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

    .header-meta {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    .header-meta span { display: flex; align-items: center; gap: 4px; }

    /* Right Sidebar - Contains Controls and Stats stacked vertically */
    .right-sidebar {
      position: fixed;
      top: 100px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 100;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
    }

    /* Hide scrollbar but keep functionality */
    .right-sidebar::-webkit-scrollbar {
      width: 4px;
    }
    .right-sidebar::-webkit-scrollbar-track {
      background: transparent;
    }
    .right-sidebar::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 2px;
    }

    /* Panel base style (shared by controls and stats) */
    .panel {
      background: rgba(30, 41, 59, 0.95);
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      min-width: 180px;
    }

    .panel-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Control buttons */
    .control-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      margin: 6px 0;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      transform: translateX(-2px);
    }

    .control-btn.primary {
      background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%);
      border-color: var(--accent-blue);
    }

    .control-btn:first-of-type {
      margin-top: 0;
    }

    /* Stats rows */
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 12px;
    }

    .stat-row:first-of-type {
      margin-top: 0;
    }

    .stat-label { color: var(--text-secondary); }
    .stat-value { color: var(--accent-cyan); font-weight: 700; }

    /* Zoom Controls - Bottom Right */
    .zoom-controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
    }

    .zoom-btn {
      width: 44px;
      height: 44px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-primary);
      font-size: 20px;
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
      transform: scale(1.1);
    }

    .zoom-level {
      width: 44px;
      padding: 8px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      text-align: center;
      color: var(--accent-cyan);
      font-size: 10px;
      font-weight: 700;
      backdrop-filter: blur(12px);
    }

    /* Legend - Bottom Left */
    .legend {
      position: fixed;
      bottom: 20px;
      left: 20px;
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
      margin: 8px 0;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid var(--bg-primary);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    /* Tooltip */
    .tooltip {
      position: absolute;
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 13px;
      max-width: 300px;
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
      font-size: 14px;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .tooltip-label { color: var(--text-secondary); }
    .tooltip-value { color: var(--text-primary); font-weight: 600; }

    /* Tree specific styles */
    .node circle {
      stroke: var(--bg-primary);
      stroke-width: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .node circle:hover {
      stroke: var(--text-primary);
      stroke-width: 3px;
      filter: drop-shadow(0 0 8px currentColor);
    }

    .node text {
      font-size: 11px;
      fill: var(--text-secondary);
      pointer-events: none;
      font-weight: 500;
    }

    .link {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 1.5px;
      stroke-opacity: 0.6;
    }

    .link:hover {
      stroke: var(--accent-cyan);
      stroke-opacity: 1;
      stroke-width: 2px;
    }
  </style>
</head>
<body>
  <div id="container"></div>

  <!-- Header - Top Center -->
  <div class="header">
    <div class="header-title">🧭 Dependency Tree</div>
    <div class="header-meta">
      <span><strong>Version:</strong> ${projectVersion}</span>
      <span><strong>Dependencies:</strong> ${nodes.length}</span>
      <span><strong>Generated:</strong> ${new Date().toLocaleString()}</span>
    </div>
  </div>

  <!-- Right Sidebar - Controls and Stats stacked vertically -->
  <div class="right-sidebar">
    <!-- Controls Panel -->
    <div class="panel" id="controls-panel">
      <div class="panel-title">⚙️ Controls</div>
      <button class="control-btn primary" onclick="resetView()">↻ Reset View</button>
      <button class="control-btn" onclick="fitToScreen()">⛶ Fit to Screen</button>
      <button class="control-btn" onclick="toggleLabels()">🏷️ Toggle Labels</button>
      <button class="control-btn" onclick="expandAll()">📂 Expand All</button>
      <button class="control-btn" onclick="collapseAll()">📁 Collapse All</button>
    </div>

    <!-- Statistics Panel - Separate panel below controls -->
    <div class="panel" id="stats-panel">
      <div class="panel-title">📊 Statistics</div>
      <div class="stat-row">
        <span class="stat-label">Total Nodes</span>
        <span class="stat-value" id="total-nodes">${nodes.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Visible</span>
        <span class="stat-value" id="visible-nodes">${nodes.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Max Depth</span>
        <span class="stat-value" id="max-depth">0</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Zoom</span>
        <span class="stat-value" id="zoom-stat">100%</span>
      </div>
    </div>
  </div>

  <!-- Zoom Controls - Bottom Right -->
  <div class="zoom-controls">
    <button class="zoom-btn" onclick="zoomIn()">+</button>
    <div class="zoom-level" id="zoom-level">100%</div>
    <button class="zoom-btn" onclick="zoomOut()">−</button>
    <button class="zoom-btn" onclick="resetView()">⟲</button>
  </div>

  <!-- Legend - Bottom Left -->
  <div class="legend">
    <div class="legend-title">🎨 Health Status</div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-excellent);"></div>
      <span>Excellent (9-10)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--health-good);"></div>
      <span>Good (7-8)</span>
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

  <!-- Tooltip -->
  <div class="tooltip" id="tooltip"></div>

  <script>
    const graphData = ${graphDataJSON};
    const width = window.innerWidth;
    const height = window.innerHeight;
    let showLabels = true;
    let currentZoom = 1;

    // Build hierarchy from nodes and links
    function buildHierarchyFromData(nodes, links) {
      if (!nodes || nodes.length === 0) return null;

      // Create node map
      const nodeMap = new Map();
      nodes.forEach(n => {
        nodeMap.set(n.id, { ...n, children: [] });
      });

      // Find root (type === 'root' or depth === 0)
      let root = nodes.find(n => n.type === 'root' || n.depth === 0);
      if (!root) root = nodes[0];

      // Build parent-child relationships from links
      const childrenAdded = new Set();
      links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const parent = nodeMap.get(sourceId);
        const child = nodeMap.get(targetId);
        
        if (parent && child && !childrenAdded.has(targetId)) {
          parent.children.push(child);
          childrenAdded.add(targetId);
        }
      });

      return nodeMap.get(root.id);
    }

    // Get color based on health score
    function getHealthColor(node) {
      if (node.type === 'root') return 'var(--root-color)';
      const score = node.healthScore || 8;
      if (score >= 9) return 'var(--health-excellent)';
      if (score >= 7) return 'var(--health-good)';
      if (score >= 5) return 'var(--health-caution)';
      if (score >= 3) return 'var(--health-warning)';
      return 'var(--health-critical)';
    }

    // Get node radius based on type
    function getNodeRadius(node) {
      if (node.type === 'root') return 18;
      if (node.depth === 1) return 10;
      return 7;
    }

    // Create SVG
    const svg = d3.select("#container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentZoom = event.transform.k;
        updateZoomDisplay();
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Build hierarchy
    const hierarchyRoot = buildHierarchyFromData(graphData.nodes, graphData.links);

    if (hierarchyRoot) {
      const root = d3.hierarchy(hierarchyRoot);
      
      // Calculate max depth for display
      let maxDepth = 0;
      root.each(d => { maxDepth = Math.max(maxDepth, d.depth); });
      document.getElementById('max-depth').textContent = maxDepth;

      // Create tree layout - HORIZONTAL orientation for better visibility
      const treeLayout = d3.tree()
        .size([height - 200, width - 400])
        .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));

      treeLayout(root);

      // Swap x and y for horizontal layout (top-to-bottom becomes left-to-right)
      root.each(d => {
        const temp = d.x;
        d.x = d.y + 200; // Add left margin
        d.y = temp + 100; // Add top margin
      });

      // Draw links with curved paths
      const linkGenerator = d3.linkHorizontal()
        .x(d => d.x)
        .y(d => d.y);

      g.selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", linkGenerator);

      // Draw nodes
      const node = g.selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => \`translate(\${d.x},\${d.y})\`)
        .on("mouseover", showTooltip)
        .on("mouseout", hideTooltip)
        .on("click", toggleChildren);

      // Add circles
      node.append("circle")
        .attr("r", d => getNodeRadius(d.data))
        .attr("fill", d => getHealthColor(d.data));

      // Add labels
      node.append("text")
        .attr("dy", d => d.data.type === 'root' ? -25 : -15)
        .attr("text-anchor", "middle")
        .text(d => d.data.name || d.data.id)
        .attr("class", "node-label");

      // Initial fit to screen
      setTimeout(fitToScreen, 100);
    }

    // Tooltip functions
    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      const node = d.data;
      const score = node.healthScore || 8;
      
      tooltip.innerHTML = \`
        <div class="tooltip-title">\${node.name || node.id}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Version</span>
          <span class="tooltip-value">\${node.version || 'N/A'}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Health Score</span>
          <span class="tooltip-value">\${score}/10</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Depth</span>
          <span class="tooltip-value">\${d.depth}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Children</span>
          <span class="tooltip-value">\${d.children ? d.children.length : 0}</span>
        </div>
      \`;
      
      tooltip.classList.add('visible');
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY - 10) + 'px';
    }

    function hideTooltip() {
      document.getElementById('tooltip').classList.remove('visible');
    }

    // Toggle children visibility (collapse/expand)
    function toggleChildren(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      // Note: Full implementation would re-render the tree
    }

    // Control functions
    function resetView() {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    }

    function fitToScreen() {
      const bounds = g.node().getBBox();
      const fullWidth = width;
      const fullHeight = height;
      const boundsWidth = bounds.width;
      const boundsHeight = bounds.height;
      const midX = bounds.x + boundsWidth / 2;
      const midY = bounds.y + boundsHeight / 2;
      
      const scale = 0.85 / Math.max(boundsWidth / fullWidth, boundsHeight / fullHeight);
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
      
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
    }

    function toggleLabels() {
      showLabels = !showLabels;
      d3.selectAll('.node-label').style('display', showLabels ? 'block' : 'none');
    }

    function expandAll() {
      // Placeholder for full expand functionality
      console.log('Expand all nodes');
    }

    function collapseAll() {
      // Placeholder for full collapse functionality
      console.log('Collapse all nodes');
    }

    function zoomIn() {
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    }

    function zoomOut() {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }

    function updateZoomDisplay() {
      const zoomPercent = Math.round(currentZoom * 100) + '%';
      document.getElementById('zoom-level').textContent = zoomPercent;
      document.getElementById('zoom-stat').textContent = zoomPercent;
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'r' || e.key === 'R') resetView();
      if (e.key === 'f' || e.key === 'F') fitToScreen();
      if (e.key === 'l' || e.key === 'L') toggleLabels();
    });
  </script>
</body>
</html>`;
}

/**
 * Generate empty state HTML when no nodes
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
      margin: 0;
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
    <div class="icon">📦</div>
    <h1>No Dependencies Found</h1>
    <p>${projectName} v${projectVersion} has no dependencies to visualize.</p>
  </div>
</body>
</html>`;
}

/**
 * Build hierarchy structure from flat nodes/links
 */
function buildHierarchy(nodes, links) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, { ...n, children: [] }));
  
  const root = nodes.find(n => n.type === 'root' || n.depth === 0) || nodes[0];
  const childrenAdded = new Set();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const parent = nodeMap.get(sourceId);
    const child = nodeMap.get(targetId);
    
    if (parent && child && !childrenAdded.has(targetId)) {
      parent.children.push(child);
      childrenAdded.add(targetId);
    }
  });
  
  return nodeMap.get(root.id);
}

/**
 * Create tree layout D3 script (for backward compatibility)
 */
function createTreeLayout(graphData, options = {}) {
  return generateTreeLayoutHTML(graphData, options);
}

module.exports = { 
  createTreeLayout, 
  generateTreeLayoutHTML,
  buildHierarchy 
};