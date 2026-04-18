// src/graph/layouts/force.js
// Force-directed layout with D3.js physics simulation


function generateForceLayoutHTML(graphData, options = {}) {
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

  // Calculate max depth
  const maxDepth = Math.max(...nodes.map(n => n.depth || 0), 0);

  const graphDataJSON = JSON.stringify({ nodes, links });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Force Graph</title>
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
      left: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 16px 24px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 100;
    }

    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Search */
    .search-container {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    .search-input {
      width: 320px;
      padding: 12px 20px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 25px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
      border-color: var(--accent-cyan);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }

    .search-input::placeholder {
      color: var(--text-muted);
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
      min-width: 200px;
    }

    .controls-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .controls-section {
      margin-bottom: 16px;
    }

    .controls-section-title {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      margin: 4px 0;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
    }

    .control-btn.primary {
      background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%);
      border-color: var(--accent-blue);
    }

    .control-btn.active {
      background: var(--accent-cyan);
      border-color: var(--accent-cyan);
    }

    /* Filter Dropdowns */
    .filter-select {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 12px;
      outline: none;
      cursor: pointer;
      margin: 4px 0;
    }

    .filter-select:focus {
      border-color: var(--accent-cyan);
    }

    /* Statistics Panel */
    .stats {
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 16px 20px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 100;
      min-width: 160px;
    }

    .stats-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 12px;
    }

    .stat-label { color: var(--text-secondary); }
    .stat-value { color: var(--accent-cyan); font-weight: 700; }

    /* Legend */
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
      display: flex;
      align-items: center;
      gap: 6px;
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

    /* Zoom Controls */
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

    .node.selected circle {
      stroke: var(--accent-cyan);
      stroke-width: 4px;
    }

    .node-label {
      font-size: 10px;
      fill: var(--text-secondary);
      pointer-events: none;
      font-weight: 500;
    }

    .node-label.hidden { display: none; }

    /* Link styles */
    .link {
      stroke: var(--border-color);
      stroke-width: 1.5px;
      stroke-opacity: 0.4;
    }

    .link.highlighted {
      stroke: var(--accent-cyan);
      stroke-opacity: 0.8;
      stroke-width: 2.5px;
    }

    .link.hidden { display: none; }
  </style>
</head>
<body>
  <div id="container"></div>

  <div class="header">
    <div class="header-title">
      ⚡ Force Graph
    </div>
    <div class="header-subtitle">Interactive Physics Simulation</div>
  </div>

  <div class="search-container">
    <input type="text" class="search-input" id="search" placeholder="🔍 Search packages..." />
  </div>

  <div class="controls">
    <div class="controls-title">⚙️ Controls</div>
    
    <div class="controls-section">
      <div class="controls-section-title">VIEW</div>
      <button class="control-btn primary" onclick="resetLayout()">↻ Reset Layout</button>
      <button class="control-btn" onclick="centerView()">◎ Center View</button>
      <button class="control-btn" onclick="fitToScreen()">⛶ Fit to Screen</button>
      <button class="control-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
    </div>

    <div class="controls-section">
      <div class="controls-section-title">DISPLAY</div>
      <button class="control-btn active" id="btn-labels" onclick="toggleLabels()">🏷️ Hide Labels</button>
      <button class="control-btn active" id="btn-links" onclick="toggleLinks()">🔗 Hide Links</button>
    </div>

    <div class="controls-section">
      <div class="controls-section-title">FILTER</div>
      <div class="controls-section-title">HEALTH SCORE</div>
      <select class="filter-select" id="health-filter" onchange="applyFilters()">
        <option value="all">All Packages</option>
        <option value="excellent">Excellent (9-10)</option>
        <option value="good">Good (7-8)</option>
        <option value="caution">Caution (5-7)</option>
        <option value="warning">Warning (3-5)</option>
        <option value="critical">Critical (&lt;3)</option>
      </select>
    </div>
  </div>

  <div class="stats">
    <div class="stats-title">📊 Statistics</div>
    <div class="stat-row">
      <span class="stat-label">Total Nodes</span>
      <span class="stat-value" id="total-nodes">${nodes.length}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Visible Nodes</span>
      <span class="stat-value" id="visible-nodes">${nodes.length}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Links</span>
      <span class="stat-value" id="total-links">${links.length}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Selected</span>
      <span class="stat-value" id="selected-count">0</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Zoom</span>
      <span class="stat-value" id="zoom-stat">100%</span>
    </div>
  </div>

  <div class="legend">
    <div class="legend-title">🎨 Health Status ▾</div>
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
      <span>Critical (&lt;3)</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background: var(--root-color);"></div>
      <span>Root Package</span>
    </div>
  </div>

  <div class="zoom-controls">
    <button class="zoom-btn" onclick="zoomIn()">+</button>
    <div class="zoom-level" id="zoom-level">100%</div>
    <button class="zoom-btn" onclick="zoomOut()">−</button>
    <button class="zoom-btn" onclick="resetLayout()">⟲</button>
  </div>

  <div class="tooltip" id="tooltip"></div>

  <script>
    const graphData = ${graphDataJSON};
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let showLabels = true;
    let showLinks = true;
    let currentZoom = 1;
    let selectedNode = null;

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

    // Get node radius based on type/depth
    function getNodeRadius(node) {
      if (node.type === 'root') return 20;
      if (node.depth === 1) return 12;
      if (node.depth === 2) return 8;
      return 6;
    }

    // Create SVG
    const svg = d3.select("#container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentZoom = event.transform.k;
        updateZoomDisplay();
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(d => {
          const sourceDepth = d.source.depth || 0;
          const targetDepth = d.target.depth || 0;
          return 50 + Math.abs(sourceDepth - targetDepth) * 30;
        }))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => getNodeRadius(d) + 10));

    // Draw links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("class", "link");

    // Draw nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick);

    // Add circles
    node.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => getHealthColor(d));

    // Add labels
    node.append("text")
      .attr("class", "node-label")
      .attr("dy", d => getNodeRadius(d) + 12)
      .attr("text-anchor", "middle")
      .text(d => {
        const name = d.name || d.id;
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
      });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    });

    // Drag functions
    function dragStarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Tooltip functions
    function handleMouseOver(event, d) {
      // Highlight connected links
      link.classed("highlighted", l => 
        l.source.id === d.id || l.target.id === d.id
      );

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
      link.classed("highlighted", false);
      document.getElementById('tooltip').classList.remove('visible');
    }

    function handleClick(event, d) {
      // Toggle selection
      if (selectedNode === d) {
        selectedNode = null;
        node.classed("selected", false);
        document.getElementById('selected-count').textContent = '0';
      } else {
        selectedNode = d;
        node.classed("selected", n => n === d);
        document.getElementById('selected-count').textContent = '1';
      }
    }

    // Control functions
    function resetLayout() {
      simulation.alpha(1).restart();
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    }

    function centerView() {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(currentZoom).translate(-width / 2, -height / 2)
      );
    }

    function fitToScreen() {
      const bounds = g.node().getBBox();
      const fullWidth = width;
      const fullHeight = height;
      const midX = bounds.x + bounds.width / 2;
      const midY = bounds.y + bounds.height / 2;
      const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
      
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY).scale(scale)
      );
    }

    function toggleFullscreen() {
      const elem = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    }

    function toggleLabels() {
      showLabels = !showLabels;
      d3.selectAll('.node-label').classed('hidden', !showLabels);
      document.getElementById('btn-labels').textContent = showLabels ? '🏷️ Hide Labels' : '🏷️ Show Labels';
      document.getElementById('btn-labels').classList.toggle('active', showLabels);
    }

    function toggleLinks() {
      showLinks = !showLinks;
      d3.selectAll('.link').classed('hidden', !showLinks);
      document.getElementById('btn-links').textContent = showLinks ? '🔗 Hide Links' : '🔗 Show Links';
      document.getElementById('btn-links').classList.toggle('active', showLinks);
    }

    function applyFilters() {
      const healthFilter = document.getElementById('health-filter').value;
      let visibleCount = 0;

      node.style('display', d => {
        let show = true;

        if (healthFilter !== 'all') {
          const score = d.healthScore || 8;
          switch (healthFilter) {
            case 'excellent': show = score >= 9; break;
            case 'good': show = score >= 7 && score < 9; break;
            case 'caution': show = score >= 5 && score < 7; break;
            case 'warning': show = score >= 3 && score < 5; break;
            case 'critical': show = score < 3; break;
          }
        }

        if (show) visibleCount++;
        return show ? 'block' : 'none';
      });

      document.getElementById('visible-nodes').textContent = visibleCount;
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

    // Search functionality
    document.getElementById('search').addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      let visibleCount = 0;

      node.style('display', d => {
        const name = (d.name || d.id).toLowerCase();
        const match = !searchTerm || name.includes(searchTerm);
        if (match) visibleCount++;
        return match ? 'block' : 'none';
      });

      document.getElementById('visible-nodes').textContent = visibleCount;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'r' || e.key === 'R') resetLayout();
      if (e.key === 'f' || e.key === 'F') document.getElementById('search').focus();
      if (e.key === 'l' || e.key === 'L') toggleLabels();
      if (e.key === 'Escape') {
        selectedNode = null;
        node.classed("selected", false);
        document.getElementById('selected-count').textContent = '0';
      }
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
 * Legacy function for backward compatibility
 */
function generateForceLayout(graphData, options = {}) {
  return generateForceLayoutHTML(graphData, options);
}

module.exports = {
  generateForceLayout,
  generateForceLayoutHTML
};