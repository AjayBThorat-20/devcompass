/**
 * Tree Layout - Hierarchical dependency tree
 */
function createTreeLayout(data, options = {}) {
  const {
    width = 1200,
    height = 800,
    nodeRadius = 8,
    fontSize = 12
  } = options;

  const root = buildHierarchy(data.nodes, data.links);

  const treeLayout = `
    var width = ${width};
    var height = ${height};
    var nodeRadius = ${nodeRadius};
    
    var svg = d3.select('#graph')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    var g = svg.append('g');
    
    var zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', function(event) {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    var tree = d3.tree()
      .size([height - 100, width - 200])
      .separation(function(a, b) {
        return a.parent == b.parent ? 1 : 1.2;
      });
    
    var root = ${JSON.stringify(root)};
    var hierarchy = d3.hierarchy(root);
    var treeData = tree(hierarchy);
    
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y + 100)
        .y(d => d.x + 50))
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);
    
    var node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + (d.y + 100) + ',' + (d.x + 50) + ')');
    
    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => getNodeColor(d.data.healthScore))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        showTooltip(event, d);
      })
      .on('mouseout', hideTooltip);
    
    node.append('text')
      .attr('dy', 4)
      .attr('x', d => d.children ? -12 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .attr('font-size', '${fontSize}px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .text(d => d.data.name);
    
    function getNodeColor(healthScore) {
      if (healthScore >= 9) return '#10b981';
      if (healthScore >= 7) return '#84cc16';
      if (healthScore >= 5) return '#eab308';
      if (healthScore >= 3) return '#f97316';
      return '#ef4444';
    }
    
    function showTooltip(event, d) {
      var tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', 1000);
      
      tooltip.html(
        '<strong>' + d.data.name + '</strong><br/>' +
        'Version: ' + d.data.version + '<br/>' +
        'Health: ' + d.data.healthScore + '/10'
      )
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }
    
    function hideTooltip() {
      d3.selectAll('.tooltip').remove();
    }
  `;

  return treeLayout;
}

function buildHierarchy(nodes, links) {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] }]));
  const root = nodes.find(n => n.type === 'root') || nodes[0];
  
  links.forEach(link => {
    const parent = nodeMap.get(link.source);
    const child = nodeMap.get(link.target);
    if (parent && child && link.type !== 'circular') {
      parent.children.push(child);
    }
  });
  
  return nodeMap.get(root.id);
}

module.exports = { createTreeLayout };
