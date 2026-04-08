// src/graph/layouts/tree.js
/**
 * Tree layout generator for dependency graphs
 * Creates hierarchical D3 tree visualization
 */

function createTreeLayout(graphData, options = {}) {
  const { width = 1200, height = 800 } = options;
  const { nodes, links } = graphData;

  return `
// Tree layout visualization
const width = ${width};
const height = ${height};
const graphData = ${JSON.stringify({ nodes, links })};

// Create SVG
const svg = d3.select("#graph")
  .html('')
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height]);

const zoom = d3.zoom()
  .scaleExtent([0.1, 4])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

const g = svg.append("g");

// Create node map
const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));

// Create links
const link = g.append("g")
  .selectAll("line")
  .data(graphData.links)
  .join("line")
  .attr("class", "link")
  .attr("x1", d => {
    const source = nodeMap.get(d.source);
    return source ? source.x || width / 2 : width / 2;
  })
  .attr("y1", d => {
    const source = nodeMap.get(d.source);
    return source ? source.y || 50 : 50;
  })
  .attr("x2", d => {
    const target = nodeMap.get(d.target);
    return target ? target.x || width / 2 : width / 2;
  })
  .attr("y2", d => {
    const target = nodeMap.get(d.target);
    return target ? target.y || 100 : 100;
  });

// Create nodes
const node = g.append("g")
  .selectAll("circle")
  .data(graphData.nodes)
  .join("circle")
  .attr("class", "node")
  .attr("cx", d => d.x || width / 2)
  .attr("cy", d => d.y || (d.depth || 0) * 100 + 50)
  .attr("r", d => {
    if (d.type === 'root') return 12;
    const issueCount = d.issues?.length || 0;
    return issueCount > 0 ? 8 : 6;
  })
  .attr("fill", d => {
    if (d.type === 'root') return '#4299e1';
    const score = d.healthScore || 10;
    if (score < 3) return '#ef4444';
    if (score < 5) return '#f97316';
    if (score < 7) return '#eab308';
    if (score < 9) return '#84cc16';
    return '#10b981';
  })
  .on("mouseover", showTooltip)
  .on("mouseout", hideTooltip);

// Create labels
const label = g.append("g")
  .selectAll("text")
  .data(graphData.nodes)
  .join("text")
  .attr("class", "node-label")
  .attr("x", d => d.x || width / 2)
  .attr("y", d => (d.y || (d.depth || 0) * 100 + 50) + 20)
  .text(d => d.name);

// Tooltip functions
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("display", "none");

function showTooltip(event, d) {
  const issues = d.issues || [];
  
  let html = \`<div class="tooltip-title">\${d.name}@\${d.version}</div>\`;
  html += \`<div class="tooltip-row">
    <span class="tooltip-label">Health:</span>
    <span class="tooltip-value">\${d.healthScore}/10</span>
  </div>\`;
  html += \`<div class="tooltip-row">
    <span class="tooltip-label">Type:</span>
    <span class="tooltip-value">\${d.type}</span>
  </div>\`;
  
  if (issues.length > 0) {
    html += \`<div class="tooltip-row">
      <span class="tooltip-label">Issues:</span>
      <span class="tooltip-value">\${issues.length}</span>
    </div>\`;
  }
  
  tooltip
    .html(html)
    .style("display", "block")
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY + 15) + "px");
}

function hideTooltip() {
  tooltip.style("display", "none");
}
  `.trim();
}

module.exports = {
  createTreeLayout
};