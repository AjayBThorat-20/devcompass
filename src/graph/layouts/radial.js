// src/graph/layouts/radial.js
/**
 * Radial/circular layout for dependency graphs
 * Arranges nodes in concentric circles based on depth
 */

function generateRadialLayout(graphData, options = {}) {
  const {
    width = 1200,
    height = 800,
    nodeRadius = 6,
    startRadius = 120,
    radiusIncrement = 100
  } = options;

  const { nodes, links } = graphData;
  const centerX = width / 2;
  const centerY = height / 2;

  // Group nodes by depth
  const nodesByDepth = new Map();
  nodes.forEach(node => {
    const depth = node.depth || 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth).push(node);
  });

  // Calculate positions for each depth level
  const positionedNodes = [];
  
  nodesByDepth.forEach((nodesAtDepth, depth) => {
    const radius = depth === 0 ? 0 : startRadius + (depth - 1) * radiusIncrement;
    const angleStep = (2 * Math.PI) / nodesAtDepth.length;
    
    nodesAtDepth.forEach((node, index) => {
      if (depth === 0) {
        // Root node at center
        positionedNodes.push({
          ...node,
          x: centerX,
          y: centerY,
          radius: getNodeRadius(node, nodeRadius),
          color: getNodeColor(node),
          angle: 0
        });
      } else {
        // Other nodes in circles
        const angle = index * angleStep - Math.PI / 2; // Start from top
        positionedNodes.push({
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          radius: getNodeRadius(node, nodeRadius),
          color: getNodeColor(node),
          angle: angle
        });
      }
    });
  });

  return {
    type: 'radial',
    width,
    height,
    nodes: positionedNodes,
    links: links.map(l => ({
      source: l.source,
      target: l.target,
      curved: true
    })),
    center: { x: centerX, y: centerY },
    metadata: {
      nodeCount: nodes.length,
      linkCount: links.length,
      maxDepth: Math.max(...Array.from(nodesByDepth.keys()))
    }
  };
}

function getNodeRadius(node, baseRadius) {
  if (node.type === 'root') return baseRadius * 2.5;
  
  const issueCount = node.issues?.length || 0;
  if (issueCount > 5) return baseRadius * 1.8;
  if (issueCount > 0) return baseRadius * 1.4;
  
  return baseRadius;
}

function getNodeColor(node) {
  if (node.type === 'root') return '#4299e1';
  
  const score = node.healthScore || 10;
  if (score < 3) return '#f56565';
  if (score < 5) return '#ed8936';
  if (score < 7) return '#ecc94b';
  return '#48bb78';
}

function generateRadialHTML(layoutData) {
  const { width, height, nodes, links, center } = layoutData;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DevCompass - Radial Dependency Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1a202c;
      color: #e2e8f0;
    }
    
    #graph-container {
      background: #2d3748;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .node {
      cursor: pointer;
      stroke: #1a202c;
      stroke-width: 2px;
      transition: all 0.3s ease;
    }
    
    .node:hover {
      stroke: #fff;
      stroke-width: 3px;
    }
    
    .link {
      stroke: #4a5568;
      stroke-opacity: 0.4;
      stroke-width: 1.5px;
      fill: none;
    }
    
    .node-label {
      font-size: 11px;
      fill: #e2e8f0;
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }
    
    .depth-circle {
      stroke: #4a5568;
      stroke-width: 1px;
      stroke-dasharray: 5,5;
      fill: none;
      opacity: 0.3;
    }
    
    .tooltip {
      position: absolute;
      padding: 12px;
      background: rgba(26, 32, 44, 0.95);
      border: 1px solid #4a5568;
      border-radius: 6px;
      pointer-events: none;
      font-size: 13px;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }
    
    .tooltip-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #4299e1;
      font-size: 14px;
    }
    
    .tooltip-row {
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
    }
    
    .tooltip-label {
      color: #a0aec0;
      margin-right: 12px;
    }
    
    .tooltip-value {
      color: #e2e8f0;
      font-weight: 500;
    }
    
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2d3748;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      z-index: 100;
    }
    
    .control-button {
      display: block;
      width: 100%;
      padding: 8px 16px;
      margin: 6px 0;
      background: #4299e1;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .control-button:hover {
      background: #3182ce;
    }
    
    .control-button.secondary {
      background: #4a5568;
    }
    
    .control-button.secondary:hover {
      background: #2d3748;
    }
    
    .legend {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2d3748;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      font-size: 12px;
    }
    
    .legend-title {
      font-weight: 600;
      margin-bottom: 10px;
      color: #e2e8f0;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin: 6px 0;
    }
    
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 10px;
      border: 2px solid #1a202c;
    }
  </style>
</head>
<body>
  <div id="graph-container"></div>
  
  <div class="controls">
    <button class="control-button secondary" onclick="toggleLabels()">Toggle Labels</button>
    <button class="control-button secondary" onclick="toggleDepthCircles()">Toggle Depth Circles</button>
    <button class="control-button secondary" onclick="toggleLinks()">Toggle Links</button>
  </div>
  
  <div class="legend">
    <div class="legend-title">Health Status</div>
    <div class="legend-item">
      <div class="legend-color" style="background: #48bb78;"></div>
      <span>Healthy (7-10)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ecc94b;"></div>
      <span>Caution (5-7)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ed8936;"></div>
      <span>Warning (3-5)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #f56565;"></div>
      <span>Critical (&lt;3)</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #4299e1; border: 3px solid #1a202c;"></div>
      <span>Root Package</span>
    </div>
  </div>
  
  <div class="tooltip" id="tooltip" style="display: none;"></div>

  <script>
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};
    const center = ${JSON.stringify(center)};
    const width = ${width};
    const height = ${height};
    
    let showLabels = true;
    let showDepthCircles = true;
    let showLinks = true;
    
    // Create node map for link lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Create SVG
    const svg = d3.select("#graph-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .call(d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        }));
    
    const g = svg.append("g");
    
    // Draw depth circles
    const maxDepth = Math.max(...nodes.map(n => n.depth || 0));
    const depthCircles = g.append("g").attr("class", "depth-circles");
    
    for (let i = 1; i <= maxDepth; i++) {
      const radius = 120 + (i - 1) * 100;
      depthCircles.append("circle")
        .attr("class", "depth-circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", radius);
    }
    
    // Create curved path generator
    const linkPath = d3.linkRadial()
      .angle(d => {
        const node = nodeMap.get(d.id);
        return node ? node.angle : 0;
      })
      .radius(d => {
        const node = nodeMap.get(d.id);
        if (!node) return 0;
        const depth = node.depth || 0;
        return depth === 0 ? 0 : 120 + (depth - 1) * 100;
      });
    
    // Create links
    const link = g.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", d => {
        const source = nodeMap.get(d.source);
        const target = nodeMap.get(d.target);
        if (!source || !target) return '';
        
        // Simple curved path
        const path = d3.path();
        path.moveTo(source.x, source.y);
        
        // Calculate control point for curve
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offset = dist * 0.2;
        
        // Perpendicular offset for curve
        const cx = midX - dy / dist * offset;
        const cy = midY + dx / dist * offset;
        
        path.quadraticCurveTo(cx, cy, target.x, target.y);
        return path.toString();
      });
    
    // Create nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("class", "node")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.radius)
      .attr("fill", d => d.color)
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);
    
    // Create labels
    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("class", "node-label")
      .attr("x", d => d.x)
      .attr("y", d => d.y + d.radius + 15)
      .text(d => d.name)
      .style("display", showLabels ? "block" : "none");
    
    // Tooltip functions
    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      const issues = d.issues || [];
      
      let html = \`<div class="tooltip-title">\${d.name}@\${d.version}</div>\`;
      html += \`<div class="tooltip-row">
        <span class="tooltip-label">Health:</span>
        <span class="tooltip-value">\${d.healthScore}/10</span>
      </div>\`;
      html += \`<div class="tooltip-row">
        <span class="tooltip-label">Depth:</span>
        <span class="tooltip-value">\${d.depth}</span>
      </div>\`;
      
      if (issues.length > 0) {
        html += \`<div class="tooltip-row">
          <span class="tooltip-label">Issues:</span>
          <span class="tooltip-value">\${issues.length}</span>
        </div>\`;
      }
      
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY + 15) + 'px';
    }
    
    function hideTooltip() {
      document.getElementById('tooltip').style.display = 'none';
    }
    
    // Control functions
    function toggleLabels() {
      showLabels = !showLabels;
      label.style("display", showLabels ? "block" : "none");
    }
    
    function toggleDepthCircles() {
      showDepthCircles = !showDepthCircles;
      depthCircles.style("display", showDepthCircles ? "block" : "none");
    }
    
    function toggleLinks() {
      showLinks = !showLinks;
      link.style("display", showLinks ? "block" : "none");
    }
  </script>
</body>
</html>
  `.trim();
}

module.exports = {
  generateRadialLayout,
  generateRadialHTML
};