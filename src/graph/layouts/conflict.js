// src/graph/layouts/conflict.js
/**
 * Conflict-only view for dependency graphs
 * Shows only packages with issues (vulnerabilities, outdated, deprecated)
 */

function generateConflictLayout(graphData, options = {}) {
  const {
    width = 1200,
    height = 800,
    nodeRadius = 8
  } = options;

  const { nodes, links } = graphData;

  // Filter nodes with issues
  const conflictNodes = nodes.filter(node => hasConflict(node));
  
  if (conflictNodes.length === 0) {
    return {
      type: 'conflict',
      width,
      height,
      nodes: [],
      links: [],
      message: 'No conflicts found! All dependencies are healthy.',
      metadata: {
        totalNodes: nodes.length,
        conflictNodes: 0,
        healthyNodes: nodes.length
      }
    };
  }

  // Create set of conflict node IDs for quick lookup
  const conflictIds = new Set(conflictNodes.map(n => n.id));

  // Filter links that connect conflict nodes
  const conflictLinks = links.filter(link => 
    conflictIds.has(link.source) && conflictIds.has(link.target)
  );

  // Group nodes by severity
  const nodesBySeverity = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  conflictNodes.forEach(node => {
    const severity = getNodeSeverity(node);
    nodesBySeverity[severity].push(node);
  });

  // Position nodes by severity in columns
  const columnWidth = width / 4;
  const positionedNodes = [];

  Object.keys(nodesBySeverity).forEach((severity, colIndex) => {
    const nodesInColumn = nodesBySeverity[severity];
    const x = columnWidth * (colIndex + 0.5);
    const spacing = height / (nodesInColumn.length + 1);

    nodesInColumn.forEach((node, rowIndex) => {
      positionedNodes.push({
        ...node,
        x: x,
        y: spacing * (rowIndex + 1),
        radius: getNodeRadius(node, nodeRadius),
        color: getNodeColor(node),
        severity: severity
      });
    });
  });

  return {
    type: 'conflict',
    width,
    height,
    nodes: positionedNodes,
    links: conflictLinks,
    metadata: {
      totalNodes: nodes.length,
      conflictNodes: conflictNodes.length,
      healthyNodes: nodes.length - conflictNodes.length,
      bySeverity: {
        critical: nodesBySeverity.critical.length,
        high: nodesBySeverity.high.length,
        medium: nodesBySeverity.medium.length,
        low: nodesBySeverity.low.length
      }
    }
  };
}

function hasConflict(node) {
  if (!node.issues || node.issues.length === 0) return false;
  
  // Check for various types of conflicts
  const hasVulnerability = node.issues.some(i => 
    i.type === 'security' || i.type === 'vulnerability'
  );
  const isOutdated = node.issues.some(i => i.type === 'outdated');
  const isDeprecated = node.issues.some(i => i.type === 'deprecated');
  const hasLicenseIssue = node.issues.some(i => i.type === 'license');
  const isUnused = node.issues.some(i => i.type === 'unused');
  
  return hasVulnerability || isOutdated || isDeprecated || hasLicenseIssue || isUnused;
}

function getNodeSeverity(node) {
  const issues = node.issues || [];
  
  // Check for critical issues
  if (issues.some(i => i.severity === 'critical')) return 'critical';
  if (issues.some(i => i.severity === 'high')) return 'high';
  if (issues.some(i => i.severity === 'medium' || i.severity === 'moderate')) return 'medium';
  
  // Check health score
  if (node.healthScore < 3) return 'critical';
  if (node.healthScore < 5) return 'high';
  if (node.healthScore < 7) return 'medium';
  
  return 'low';
}

function getNodeRadius(node, baseRadius) {
  const issueCount = node.issues?.length || 0;
  return baseRadius + Math.min(issueCount * 2, 12);
}

function getNodeColor(node) {
  const severity = getNodeSeverity(node);
  
  switch (severity) {
    case 'critical': return '#f56565';
    case 'high': return '#ed8936';
    case 'medium': return '#ecc94b';
    case 'low': return '#a0aec0';
    default: return '#48bb78';
  }
}

function generateConflictHTML(layoutData) {
  const { width, height, nodes, links, metadata, message } = layoutData;
  
  if (nodes.length === 0) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DevCompass - Conflict View</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1a202c;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    .success-message {
      text-align: center;
      background: #2d3748;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      max-width: 600px;
    }
    
    .success-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    
    .success-title {
      font-size: 32px;
      font-weight: 700;
      color: #48bb78;
      margin-bottom: 16px;
    }
    
    .success-text {
      font-size: 18px;
      color: #a0aec0;
      line-height: 1.6;
    }
    
    .stats {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #4a5568;
    }
    
    .stat {
      display: inline-block;
      margin: 0 24px;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #48bb78;
    }
    
    .stat-label {
      font-size: 14px;
      color: #a0aec0;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="success-message">
    <div class="success-icon">✅</div>
    <div class="success-title">No Conflicts Found!</div>
    <div class="success-text">${message}</div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${metadata.totalNodes}</div>
        <div class="stat-label">Total Packages</div>
      </div>
      <div class="stat">
        <div class="stat-value">${metadata.healthyNodes}</div>
        <div class="stat-label">Healthy</div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DevCompass - Conflict View</title>
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
    }
    
    .node-label {
      font-size: 11px;
      fill: #e2e8f0;
      text-anchor: middle;
      pointer-events: none;
      user-select: none;
    }
    
    .column-label {
      font-size: 18px;
      font-weight: 600;
      fill: #e2e8f0;
      text-anchor: middle;
    }
    
    .column-count {
      font-size: 14px;
      fill: #a0aec0;
      text-anchor: middle;
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
    
    .tooltip-section {
      margin: 12px 0;
      padding-top: 8px;
      border-top: 1px solid #4a5568;
    }
    
    .tooltip-section:first-child {
      border-top: none;
      padding-top: 0;
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
    
    .issue-item {
      margin: 6px 0;
      padding: 6px;
      background: rgba(74, 85, 104, 0.3);
      border-radius: 4px;
      font-size: 12px;
    }
    
    .issue-type {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    .issue-critical { color: #f56565; }
    .issue-high { color: #ed8936; }
    .issue-medium { color: #ecc94b; }
    .issue-low { color: #a0aec0; }
    
    .stats {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2d3748;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      z-index: 100;
      min-width: 200px;
    }
    
    .stats-title {
      font-weight: 600;
      margin-bottom: 12px;
      color: #e2e8f0;
      font-size: 14px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 13px;
    }
    
    .stat-label {
      color: #a0aec0;
    }
    
    .stat-value {
      font-weight: 600;
      color: #e2e8f0;
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
  
  <div class="stats">
    <div class="stats-title">Conflict Summary</div>
    <div class="stat-row">
      <span class="stat-label">Total Packages:</span>
      <span class="stat-value">${metadata.totalNodes}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">With Issues:</span>
      <span class="stat-value" style="color: #f56565;">${metadata.conflictNodes}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Healthy:</span>
      <span class="stat-value" style="color: #48bb78;">${metadata.healthyNodes}</span>
    </div>
    <div style="border-top: 1px solid #4a5568; margin: 12px 0; padding-top: 12px;">
      <div class="stat-row">
        <span class="stat-label">Critical:</span>
        <span class="stat-value" style="color: #f56565;">${metadata.bySeverity.critical}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">High:</span>
        <span class="stat-value" style="color: #ed8936;">${metadata.bySeverity.high}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Medium:</span>
        <span class="stat-value" style="color: #ecc94b;">${metadata.bySeverity.medium}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Low:</span>
        <span class="stat-value" style="color: #a0aec0;">${metadata.bySeverity.low}</span>
      </div>
    </div>
  </div>
  
  <div class="legend">
    <div class="legend-title">Severity Levels</div>
    <div class="legend-item">
      <div class="legend-color" style="background: #f56565;"></div>
      <span>Critical</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ed8936;"></div>
      <span>High</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ecc94b;"></div>
      <span>Medium</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #a0aec0;"></div>
      <span>Low</span>
    </div>
  </div>
  
  <div class="tooltip" id="tooltip" style="display: none;"></div>

  <script>
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};
    const width = ${width};
    const height = ${height};
    const metadata = ${JSON.stringify(metadata)};
    
    // Create node map
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
    
    // Add column labels
    const columnWidth = width / 4;
    const columns = [
      { label: 'CRITICAL', count: metadata.bySeverity.critical, color: '#f56565' },
      { label: 'HIGH', count: metadata.bySeverity.high, color: '#ed8936' },
      { label: 'MEDIUM', count: metadata.bySeverity.medium, color: '#ecc94b' },
      { label: 'LOW', count: metadata.bySeverity.low, color: '#a0aec0' }
    ];
    
    columns.forEach((col, i) => {
      const x = columnWidth * (i + 0.5);
      
      g.append("text")
        .attr("class", "column-label")
        .attr("x", x)
        .attr("y", 30)
        .attr("fill", col.color)
        .text(col.label);
      
      g.append("text")
        .attr("class", "column-count")
        .attr("x", x)
        .attr("y", 50)
        .text(\`(\${col.count} packages)\`);
    });
    
    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("x1", d => {
        const source = nodeMap.get(d.source);
        return source ? source.x : 0;
      })
      .attr("y1", d => {
        const source = nodeMap.get(d.source);
        return source ? source.y : 0;
      })
      .attr("x2", d => {
        const target = nodeMap.get(d.target);
        return target ? target.x : 0;
      })
      .attr("y2", d => {
        const target = nodeMap.get(d.target);
        return target ? target.y : 0;
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
      .text(d => d.name);
    
    // Tooltip functions
    function showTooltip(event, d) {
      const tooltip = document.getElementById('tooltip');
      const issues = d.issues || [];
      
      let html = \`<div class="tooltip-title">\${d.name}@\${d.version}</div>\`;
      
      html += '<div class="tooltip-section">';
      html += \`<div class="tooltip-row">
        <span class="tooltip-label">Health Score:</span>
        <span class="tooltip-value">\${d.healthScore}/10</span>
      </div>\`;
      html += \`<div class="tooltip-row">
        <span class="tooltip-label">Severity:</span>
        <span class="tooltip-value issue-\${d.severity}">\${d.severity.toUpperCase()}</span>
      </div>\`;
      html += \`<div class="tooltip-row">
        <span class="tooltip-label">Issues:</span>
        <span class="tooltip-value">\${issues.length}</span>
      </div>\`;
      html += '</div>';
      
      if (issues.length > 0) {
        html += '<div class="tooltip-section">';
        issues.slice(0, 5).forEach(issue => {
          html += \`<div class="issue-item">
            <div class="issue-type issue-\${issue.severity || 'low'}">\${issue.type || 'ISSUE'}</div>
            <div>\${issue.message || issue.description || 'No description'}</div>
          </div>\`;
        });
        if (issues.length > 5) {
          html += \`<div style="margin-top: 8px; color: #a0aec0; font-size: 11px;">
            +\${issues.length - 5} more issues
          </div>\`;
        }
        html += '</div>';
      }
      
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
      tooltip.style.left = (event.pageX + 15) + 'px';
      tooltip.style.top = (event.pageY + 15) + 'px';
    }
    
    function hideTooltip() {
      document.getElementById('tooltip').style.display = 'none';
    }
  </script>
</body>
</html>
  `.trim();
}

module.exports = {
  generateConflictLayout,
  generateConflictHTML
};