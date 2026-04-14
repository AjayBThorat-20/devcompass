// src/graph/layouts/force.js
/**
 * Force-directed network layout for dependency graphs
 * Enhanced with better viewport coverage and spacing
 */

function generateForceLayout(graphData, options = {}) {
  // ✅ FIXED: Validate input
  if (!graphData || typeof graphData !== 'object') {
    throw new Error('Invalid graph data provided');
  }

  const {
    width = 1200,
    height = 800,
    nodeRadius = 6,
    linkDistance = 150,        // INCREASED for better spacing
    chargeStrength = -400,     // INCREASED for more repulsion
    centerStrength = 0.05      // DECREASED for less center pull
  } = options;

  // ✅ FIXED: Ensure nodes and links are arrays
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData.links) ? graphData.links : [];

  // ✅ FIXED: Handle empty graph
  if (nodes.length === 0) {
    return {
      type: 'force',
      width,
      height,
      simulation: {
        nodes: [],
        links: [],
        forces: {
          charge: chargeStrength,
          link: linkDistance,
          center: centerStrength,
          collision: true,
          forceX: 0.05,
          forceY: 0.05
        }
      },
      metadata: {
        nodeCount: 0,
        linkCount: 0,
        avgDegree: 0
      }
    };
  }

  // Better initial positioning - spread across viewport
  nodes.forEach((node, i) => {
    // ✅ FIXED: Validate node object
    if (!node || typeof node !== 'object') return;
    
    if (!node.x || !node.y) {
      // Spread nodes in a circle initially for better distribution
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      node.x = width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 100;
      node.y = height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;
    }
  });

  // D3 force simulation configuration
  const simulation = {
    nodes: nodes.map(n => {
      // ✅ FIXED: Safe node mapping with validation
      if (!n || typeof n !== 'object') {
        return {
          id: 'invalid',
          radius: nodeRadius,
          color: '#64748b'
        };
      }
      
      return {
        ...n,
        radius: getNodeRadius(n, nodeRadius),
        color: getNodeColor(n)
      };
    }),
    links: links.map(l => {
      // ✅ FIXED: Safe link mapping with validation
      if (!l || typeof l !== 'object') {
        return {
          source: 'invalid',
          target: 'invalid',
          strength: 0.4
        };
      }
      
      return {
        source: l.source,
        target: l.target,
        strength: getLinkStrength(l)
      };
    }),
    forces: {
      charge: chargeStrength,
      link: linkDistance,
      center: centerStrength,
      collision: true,
      forceX: 0.05,  // ADD: spread horizontally
      forceY: 0.05   // ADD: spread vertically
    }
  };

  // ✅ FIXED: Safe average degree calculation
  const avgDegree = nodes.length > 0 ? (links.length * 2) / nodes.length : 0;

  return {
    type: 'force',
    width,
    height,
    simulation,
    metadata: {
      nodeCount: nodes.length,
      linkCount: links.length,
      avgDegree: Number(avgDegree.toFixed(2))
    }
  };
}

function getNodeRadius(node, baseRadius) {
  // ✅ FIXED: Validate inputs
  if (!node || typeof node !== 'object') {
    return baseRadius;
  }

  const validBaseRadius = typeof baseRadius === 'number' && baseRadius > 0 ? baseRadius : 6;
  
  if (node.type === 'root') return validBaseRadius * 2.5;
  
  const issueCount = Array.isArray(node.issues) ? node.issues.length : 0;
  if (issueCount > 5) return validBaseRadius * 2;
  if (issueCount > 0) return validBaseRadius * 1.5;
  
  return validBaseRadius;
}

function getNodeColor(node) {
  // ✅ FIXED: Validate input
  if (!node || typeof node !== 'object') {
    return '#64748b'; // Default gray color
  }
  
  if (node.type === 'root') return '#60a5fa';
  
  const score = typeof node.healthScore === 'number' ? node.healthScore : 10;
  if (score < 3) return '#ef4444';
  if (score < 5) return '#f97316';
  if (score < 7) return '#eab308';
  if (score < 9) return '#84cc16';
  return '#10b981';
}

function getLinkStrength(link) {
  // ✅ FIXED: Validate input
  if (!link || typeof link !== 'object') {
    return 0.4;
  }
  
  return link.depth === 1 ? 0.8 : 0.4;  // ADJUSTED: weaker links
}

function generateForceHTML(layoutData, graphData) {
  // ✅ FIXED: Validate inputs
  if (!layoutData || typeof layoutData !== 'object') {
    throw new Error('Invalid layout data provided');
  }

  if (!graphData || typeof graphData !== 'object') {
    throw new Error('Invalid graph data provided');
  }

  const { width = 1200, height = 800, simulation } = layoutData;
  
  // ✅ FIXED: Validate simulation data
  if (!simulation || typeof simulation !== 'object') {
    throw new Error('Invalid simulation data');
  }

  const nodes = Array.isArray(simulation.nodes) ? simulation.nodes : [];
  const links = Array.isArray(simulation.links) ? simulation.links : [];

  // ✅ FIXED: Safe JSON stringification with error handling
  let simulationJSON;
  try {
    simulationJSON = JSON.stringify(simulation);
  } catch (error) {
    console.error('Failed to stringify simulation data:', error.message);
    simulationJSON = JSON.stringify({ nodes: [], links: [], forces: {} });
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Interactive Force Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      overflow: hidden;
    }
    
    #graph-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    
    svg {
      width: 100%;
      height: 100%;
    }
    
    /* Enhanced Node Styles */
    .node {
      cursor: grab;
      stroke: #1e293b;
      stroke-width: 2.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    .node:hover {
      stroke: #fff;
      stroke-width: 4px;
      filter: drop-shadow(0 4px 12px rgba(96, 165, 250, 0.6));
    }
    
    .node:active {
      cursor: grabbing;
    }
    
    .node.selected {
      stroke: #fbbf24;
      stroke-width: 4px;
      filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
    }
    
    .node.dimmed {
      opacity: 0.2;
    }
    
    /* Enhanced Link Styles */
    .link {
      stroke: #475569;
      stroke-opacity: 0.4;
      stroke-width: 1.5px;
      transition: all 0.3s ease;
    }
    
    .link:hover {
      stroke: #60a5fa;
      stroke-opacity: 0.8;
      stroke-width: 2.5px;
    }
    
    .link.highlighted {
      stroke: #fbbf24;
      stroke-opacity: 1;
      stroke-width: 3px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    .link.dimmed {
      opacity: 0.1;
    }
    
    @keyframes pulse {
      0%, 100% { stroke-opacity: 0.6; }
      50% { stroke-opacity: 1; }
    }
    
    /* Node Labels */
    .node-label {
      font-size: 11px;
      font-weight: 500;
      fill: #e2e8f0;
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }
    
    .node-label.dimmed {
      opacity: 0.2;
    }
    
    /* Modern Tooltip */
    .tooltip {
      position: absolute;
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid #475569;
      border-radius: 12px;
      pointer-events: none;
      font-size: 13px;
      max-width: 350px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      backdrop-filter: blur(12px);
      transform: translateY(-10px);
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
    }
    
    .tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #334155;
    }
    
    .tooltip-icon {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .tooltip-title {
      font-weight: 600;
      font-size: 15px;
      color: #60a5fa;
    }
    
    .tooltip-section {
      margin: 10px 0;
    }
    
    .tooltip-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      align-items: center;
    }
    
    .tooltip-label {
      color: #94a3b8;
      font-size: 12px;
    }
    
    .tooltip-value {
      color: #e2e8f0;
      font-weight: 600;
    }
    
    .tooltip-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-critical { background: #ef4444; color: white; }
    .badge-warning { background: #f97316; color: white; }
    .badge-caution { background: #eab308; color: #1e293b; }
    .badge-healthy { background: #10b981; color: white; }
    
    /* Modern Control Panel */
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
      min-width: 220px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }
    
    .controls::-webkit-scrollbar {
      width: 6px;
    }
    
    .controls::-webkit-scrollbar-track {
      background: #1e293b;
      border-radius: 3px;
    }
    
    .controls::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;
    }
    
    .controls-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .controls-section {
      margin: 20px 0;
      padding-top: 16px;
      border-top: 1px solid #334155;
    }
    
    .controls-section:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .control-button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      margin: 6px 0;
      background: linear-gradient(135deg, #334155 0%, #475569 100%);
      color: #f1f5f9;
      border: 1px solid #475569;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .control-button:hover {
      background: linear-gradient(135deg, #475569 0%, #64748b 100%);
      border-color: #60a5fa;
      transform: translateX(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .control-button:active {
      transform: translateX(0);
    }
    
    .control-button.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      border-color: #60a5fa;
    }
    
    .control-button.primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
    }
    
    .control-button.danger {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-color: #ef4444;
    }
    
    .control-button.danger:hover {
      background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
    }
    
    .control-icon {
      font-size: 16px;
    }
    
    /* Zoom Controls */
    .zoom-controls {
      position: fixed;
      bottom: 20px;
      right: 240px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 100;
    }
    
    .zoom-button {
      width: 48px;
      height: 48px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #475569;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #f1f5f9;
      font-size: 20px;
      font-weight: 700;
      transition: all 0.3s;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    
    .zoom-button:hover {
      background: rgba(59, 130, 246, 0.95);
      border-color: #60a5fa;
      transform: scale(1.1);
      box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
    }
    
    .zoom-button:active {
      transform: scale(0.95);
    }
    
    .zoom-level {
      width: 48px;
      padding: 8px;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid #475569;
      border-radius: 12px;
      text-align: center;
      color: #60a5fa;
      font-size: 11px;
      font-weight: 700;
      backdrop-filter: blur(12px);
    }
    
    /* Search Box */
    .search-box {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30, 41, 59, 0.95);
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
      min-width: 400px;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 16px;
      background: #1e293b;
      border: 2px solid #475569;
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      transition: all 0.3s;
    }
    
    .search-input:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }
    
    .search-input::placeholder {
      color: #64748b;
    }
    
    /* Stats Panel */
    .stats {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
      min-width: 220px;
    }
    
    .stats-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }
    
    .stat-item:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 500;
    }
    
    .stat-value {
      color: #60a5fa;
      font-weight: 700;
      font-size: 14px;
    }
    
    /* Legend */
    .legend {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
    }
    
    .legend.collapsed {
      padding: 12px;
    }
    
    .legend.collapsed .legend-items {
      display: none;
    }
    
    .legend-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    
    .legend.collapsed .legend-title {
      margin-bottom: 0;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin: 10px 0;
      gap: 12px;
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #1e293b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }
    
    .legend-text {
      color: #cbd5e1;
      font-size: 13px;
      font-weight: 500;
    }
    
    /* Header */
    .header {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(30, 41, 59, 0.95);
      padding: 20px 24px;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      backdrop-filter: blur(12px);
      border: 1px solid #334155;
    }
    
    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    /* Fullscreen Mode */
    body.fullscreen .header,
    body.fullscreen .search-box {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    
    body.fullscreen:hover .header,
    body.fullscreen:hover .search-box {
      opacity: 1;
      pointer-events: all;
    }
    
    /* Loading Animation */
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 1000;
    }
    
    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #334155;
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #60a5fa;
      font-size: 16px;
      font-weight: 600;
    }
    
    /* Filter Dropdown */
    .filter-group {
      margin: 12px 0;
    }
    
    .filter-label {
      display: block;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filter-select {
      width: 100%;
      padding: 10px 12px;
      background: #1e293b;
      border: 2px solid #475569;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      transition: all 0.3s;
    }
    
    .filter-select:focus {
      border-color: #60a5fa;
    }
    
    .filter-select:hover {
      border-color: #60a5fa;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .controls, .stats, .legend {
        padding: 12px;
        min-width: 150px;
      }
      
      .header {
        padding: 12px 16px;
      }
      
      .header-title {
        font-size: 16px;
      }
      
      .search-box {
        min-width: 280px;
      }
      
      .zoom-controls {
        right: 20px;
      }
    }
  </style>
</head>
<body>
  <div id="graph-container">
    <div class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Initializing Force Simulation...</div>
    </div>
  </div>
  
  <div class="header">
    <div class="header-title">🧭 Force Graph</div>
    <div class="header-subtitle">Interactive Physics Simulation</div>
  </div>
  
  <div class="search-box">
    <input 
      type="text" 
      class="search-input" 
      id="search-input"
      placeholder="🔍 Search packages..."
      autocomplete="off"
    />
  </div>
  
  <div class="controls">
    <div class="controls-title">⚙️ Controls</div>
    
    <div class="controls-section">
      <div class="section-title">View</div>
      <button class="control-button primary" onclick="resetSimulation()">
        <span class="control-icon">↻</span>
        <span>Reset Layout</span>
      </button>
      <button class="control-button" onclick="centerView()">
        <span class="control-icon">🎯</span>
        <span>Center View</span>
      </button>
      <button class="control-button" onclick="fitToScreen()">
        <span class="control-icon">⛶</span>
        <span>Fit to Screen</span>
      </button>
      <button class="control-button" onclick="toggleFullscreen()">
        <span class="control-icon">⛶</span>
        <span id="fullscreen-text">Fullscreen</span>
      </button>
    </div>
    
    <div class="controls-section">
      <div class="section-title">Display</div>
      <button class="control-button" onclick="toggleLabels()">
        <span class="control-icon">🏷️</span>
        <span id="label-btn-text">Hide Labels</span>
      </button>
      <button class="control-button" onclick="toggleLinks()">
        <span class="control-icon">🔗</span>
        <span id="link-btn-text">Hide Links</span>
      </button>
    </div>
    
    <div class="controls-section">
      <div class="section-title">Filter</div>
      <div class="filter-group">
        <label class="filter-label">Health Score</label>
        <select class="filter-select" id="health-filter" onchange="applyFilters()">
          <option value="all">All Packages</option>
          <option value="critical">Critical (&lt;3)</option>
          <option value="warning">Warning (3-5)</option>
          <option value="caution">Caution (5-7)</option>
          <option value="healthy">Healthy (&gt;7)</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Package Type</label>
        <select class="filter-select" id="type-filter" onchange="applyFilters()">
          <option value="all">All Types</option>
          <option value="root">Root Only</option>
          <option value="dependency">Dependencies</option>
        </select>
      </div>
    </div>
    
    <div class="controls-section">
      <div class="section-title">Actions</div>
      <button class="control-button danger" onclick="clearSelection()">
        <span class="control-icon">✕</span>
        <span>Clear Selection</span>
      </button>
    </div>
  </div>
  
  <div class="zoom-controls">
    <button class="zoom-button" onclick="zoomIn()" title="Zoom In">+</button>
    <div class="zoom-level" id="zoom-level">100%</div>
    <button class="zoom-button" onclick="zoomOut()" title="Zoom Out">−</button>
    <button class="zoom-button" onclick="resetZoom()" title="Reset Zoom">⟲</button>
  </div>
  
  <div class="stats">
    <div class="stats-title">📊 Statistics</div>
    <div class="stat-item">
      <span class="stat-label">Total Nodes</span>
      <span class="stat-value" id="total-nodes">${nodes.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Visible Nodes</span>
      <span class="stat-value" id="visible-nodes">${nodes.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Links</span>
      <span class="stat-value" id="link-count">${links.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Selected</span>
      <span class="stat-value" id="selected-count">0</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Zoom</span>
      <span class="stat-value" id="zoom-stat">100%</span>
    </div>
  </div>
  
  <div class="legend">
    <div class="legend-title" onclick="toggleLegend()">
      🎨 Health Status
      <span style="margin-left: auto; font-size: 12px;">▼</span>
    </div>
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-color" style="background: #10b981;"></div>
        <span class="legend-text">Excellent (9-10)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #84cc16;"></div>
        <span class="legend-text">Good (7-8)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #eab308;"></div>
        <span class="legend-text">Caution (5-7)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #f97316;"></div>
        <span class="legend-text">Warning (3-5)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ef4444;"></div>
        <span class="legend-text">Critical (&lt;3)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #60a5fa; border-width: 3px;"></div>
        <span class="legend-text">Root Package</span>
      </div>
    </div>
  </div>
  
  <div class="tooltip" id="tooltip"></div>

  <script>
    // ✅ FIXED: Safe data parsing with error handling
    let graphData;
    try {
      graphData = ${simulationJSON};
      // ✅ FIXED: Validate parsed data
      if (!graphData || typeof graphData !== 'object') {
        throw new Error('Invalid graph data');
      }
      if (!Array.isArray(graphData.nodes)) {
        graphData.nodes = [];
      }
      if (!Array.isArray(graphData.links)) {
        graphData.links = [];
      }
    } catch (error) {
      console.error('Failed to parse graph data:', error);
      graphData = { nodes: [], links: [], forces: {} };
    }

    const width = window.innerWidth;   // USE FULL WINDOW WIDTH
    const height = window.innerHeight;  // USE FULL WINDOW HEIGHT
    
    let showLabels = true;
    let showLinks = true;
    let selectedNode = null;
    let currentZoom = 1;
    let searchTerm = '';
    let healthFilter = 'all';
    let typeFilter = 'all';
    
    // Remove loading
    setTimeout(() => {
      const loading = document.querySelector('.loading');
      if (loading) loading.remove();
    }, 500);
    
    // ✅ FIXED: Check if D3 is loaded
    if (typeof d3 === 'undefined') {
      console.error('D3.js failed to load');
      document.querySelector('.loading-text').textContent = 'Error: D3.js library failed to load';
      throw new Error('D3.js not loaded');
    }

    // Create SVG with full viewport
    const svg = d3.select("#graph-container")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, width, height]);
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentZoom = event.transform.k;
        updateZoomDisplay();
      });
    
    svg.call(zoom);
    
    const g = svg.append("g");
    
    // ✅ FIXED: Safe force configuration extraction
    const forces = graphData.forces || {};
    const linkDistance = forces.link || 150;
    const chargeStrength = forces.charge || -400;
    const centerStrength = forces.center || 0.05;
    const forceXStrength = forces.forceX || 0.05;
    const forceYStrength = forces.forceY || 0.05;

    // Create force simulation with better spacing
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(d => d.strength || 0.4))
      .force("charge", d3.forceManyBody()
        .strength(chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2)
        .strength(centerStrength))
      .force("collision", d3.forceCollide()
        .radius(d => (d.radius || 6) + 12))
      .force("x", d3.forceX(width / 2).strength(forceXStrength))
      .force("y", d3.forceY(height / 2).strength(forceYStrength))
      .alphaDecay(0.02);
    
    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("class", "link");
    
    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("class", "node")
      .attr("r", d => d.radius || 6)
      .attr("fill", d => d.color || '#64748b')
      .call(drag(simulation))
      .on("click", handleNodeClick)
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);
    
    // Create labels
    const label = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .join("text")
      .attr("class", "node-label")
      .attr("dy", d => (d.radius || 6) + 15)
      .text(d => d.name || 'unknown');
    
    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x || 0)
        .attr("y1", d => d.source.y || 0)
        .attr("x2", d => d.target.x || 0)
        .attr("y2", d => d.target.y || 0);
      
      node
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);
      
      label
        .attr("x", d => d.x || 0)
        .attr("y", d => d.y || 0);
    });
    
    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        d3.select(this).style("cursor", "grabbing");
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        d3.select(this).style("cursor", "grab");
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Node click handler
    function handleNodeClick(event, d) {
      event.stopPropagation();
      
      if (selectedNode?.id !== d.id) {
        selectedNode = d;
        highlightConnections(d);
        document.getElementById('selected-count').textContent = '1';
      } else {
        clearSelection();
      }
    }
    
    function highlightConnections(d) {
      const connectedNodes = new Set([d.id]);
      const connectedLinks = new Set();
      
      graphData.links.forEach(l => {
        // ✅ FIXED: Safe property access
        const sourceId = l.source?.id || l.source;
        const targetId = l.target?.id || l.target;
        
        if (sourceId === d.id) {
          connectedNodes.add(targetId);
          connectedLinks.add(l);
        }
        if (targetId === d.id) {
          connectedNodes.add(sourceId);
          connectedLinks.add(l);
        }
      });
      
      node.classed("selected", n => n.id === d.id)
          .classed("dimmed", n => !connectedNodes.has(n.id));
      
      link.classed("highlighted", l => connectedLinks.has(l))
          .classed("dimmed", l => !connectedLinks.has(l));
      
      label.classed("dimmed", n => !connectedNodes.has(n.id));
    }
    
    // Click outside to deselect
    svg.on("click", clearSelection);
    
    // Enhanced tooltip
    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      // ✅ FIXED: Safe property access
      const issues = Array.isArray(d.issues) ? d.issues : [];
      const score = typeof d.healthScore === 'number' ? d.healthScore : 10;
      
      let badgeClass = 'badge-healthy';
      if (score < 3) badgeClass = 'badge-critical';
      else if (score < 5) badgeClass = 'badge-warning';
      else if (score < 7) badgeClass = 'badge-caution';
      
      let html = \`
        <div class="tooltip-header">
          <div class="tooltip-icon" style="background: \${d.color || '#64748b'};"></div>
          <div class="tooltip-title">\${d.name || 'unknown'}@\${d.version || '?'}</div>
        </div>
        <div class="tooltip-section">
          <div class="tooltip-row">
            <span class="tooltip-label">Health Score</span>
            <span class="tooltip-badge \${badgeClass}">\${score}/10</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Type</span>
            <span class="tooltip-value">\${d.type || 'unknown'}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Depth</span>
            <span class="tooltip-value">\${d.depth || 0}</span>
          </div>
      \`;
      
      if (issues.length > 0) {
        html += \`
          <div class="tooltip-row">
            <span class="tooltip-label">Issues</span>
            <span class="tooltip-value" style="color: #ef4444;">\${issues.length}</span>
          </div>
        \`;
      }
      
      html += '</div>';
      
      tooltip.innerHTML = html;
      tooltip.classList.add('visible');
      
      const x = Math.min(event.pageX + 20, window.innerWidth - 370);
      const y = event.pageY + 20;
      
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
    
    function hideTooltip() {
      const tooltip = document.getElementById('tooltip');
      tooltip.classList.remove('visible');
    }
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      applyFilters();
    });
    
    // Control functions
    function resetSimulation() {
      simulation.alpha(1).restart();
    }
    
    function toggleLabels() {
      showLabels = !showLabels;
      label.style("display", showLabels ? "block" : "none");
      document.getElementById('label-btn-text').textContent = showLabels ? "Hide Labels" : "Show Labels";
    }
    
    function toggleLinks() {
      showLinks = !showLinks;
      link.style("display", showLinks ? "block" : "none");
      document.getElementById('link-btn-text').textContent = showLinks ? "Hide Links" : "Show Links";
    }
    
    function centerView() {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
      );
    }
    
    function fitToScreen() {
      // Let simulation settle first
      simulation.alpha(0.3).restart();
      
      setTimeout(() => {
        // ✅ FIXED: Safe bbox access
        try {
          const bounds = g.node().getBBox();
          const fullWidth = width;
          const fullHeight = height;
          const midX = bounds.x + bounds.width / 2;
          const midY = bounds.y + bounds.height / 2;
          
          const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
          const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
          
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
        } catch (error) {
          console.error('Failed to fit to screen:', error);
        }
      }, 1000);
    }
    
    function toggleFullscreen() {
      // ✅ FIXED: Add browser compatibility for fullscreen
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
        document.getElementById('fullscreen-text').textContent = 'Exit Fullscreen';
        document.body.classList.add('fullscreen');
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        document.getElementById('fullscreen-text').textContent = 'Fullscreen';
        document.body.classList.remove('fullscreen');
      }
    }
    
    function toggleLegend() {
      document.querySelector('.legend').classList.toggle('collapsed');
    }
    
    function clearSelection() {
      selectedNode = null;
      node.classed("selected", false).classed("dimmed", false);
      link.classed("highlighted", false).classed("dimmed", false);
      label.classed("dimmed", false);
      document.getElementById('selected-count').textContent = '0';
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
    
    function updateZoomDisplay() {
      const zoomPercent = Math.round(currentZoom * 100);
      document.getElementById('zoom-level').textContent = zoomPercent + '%';
      document.getElementById('zoom-stat').textContent = zoomPercent + '%';
    }
    
    // Filter functionality
    function applyFilters() {
      healthFilter = document.getElementById('health-filter').value;
      typeFilter = document.getElementById('type-filter').value;
      
      let visibleCount = 0;
      
      node.style("display", function(d) {
        let visible = true;
        
        // ✅ FIXED: Safe name access
        const name = (d.name || '').toLowerCase();
        if (searchTerm && !name.includes(searchTerm)) {
          visible = false;
        }
        
        if (healthFilter !== 'all') {
          const score = typeof d.healthScore === 'number' ? d.healthScore : 10;
          if (healthFilter === 'critical' && score >= 3) visible = false;
          if (healthFilter === 'warning' && (score < 3 || score >= 5)) visible = false;
          if (healthFilter === 'caution' && (score < 5 || score >= 7)) visible = false;
          if (healthFilter === 'healthy' && score < 7) visible = false;
        }
        
        if (typeFilter !== 'all' && d.type !== typeFilter) {
          visible = false;
        }
        
        if (visible) visibleCount++;
        return visible ? "block" : "none";
      });
      
      label.style("display", function(d) {
        if (!showLabels) return "none";
        const nodeVisible = node.filter(n => n.id === d.id).style("display") === "block";
        return nodeVisible ? "block" : "none";
      });
      
      document.getElementById('visible-nodes').textContent = visibleCount;
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' && !e.target.matches('input')) {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
      if (e.key === 'Escape') {
        clearSelection();
        document.getElementById('search-input').blur();
      }
      if (e.key === 'r' && !e.target.matches('input')) {
        e.preventDefault();
        resetSimulation();
      }
      if (e.key === 'c' && !e.target.matches('input')) {
        e.preventDefault();
        centerView();
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      }
    });
    
    // Auto fit after initial load
    setTimeout(() => {
      fitToScreen();
    }, 2000);
    
    // Initialize
    updateZoomDisplay();
  </script>
</body>
</html>
  `.trim();
}

module.exports = {
  generateForceLayout,
  generateForceHTML
};