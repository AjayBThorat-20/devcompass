// src/dashboard/scripts/layouts.js

const LayoutEngine = {
  
  tree: function(svg, nodes, links) {
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;
    
    svg.selectAll('*').remove();
    const g = svg.append('g');
    
    const hierarchyRoot = this.buildHierarchyFast(nodes, links);
    if (!hierarchyRoot) {
      this.showEmptyState();
      return;
    }
    
    const root = d3.hierarchy(hierarchyRoot);
    
    const treeLayout = d3.tree()
      .size([height - 200, width - 400])
      .separation((a, b) => a.parent === b.parent ? 1.5 : 2);
    
    treeLayout(root);
    
    root.each(d => {
      [d.x, d.y] = [d.y + 200, d.x + 100];
    });
    
    const linkData = root.links();
    const linkGroup = g.append('g').attr('class', 'links');
    
    linkGroup.selectAll('path')
      .data(linkData)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal().x(d => d.x).y(d => d.y));
    
    const nodeData = root.descendants();
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    const node = nodeGroup.selectAll('g')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .on('mouseover', (e, d) => window.showTooltip(e, d))
      .on('mouseout', window.hideTooltip);
    
    node.append('circle')
      .attr('r', d => this.getNodeRadius(d.data))
      .attr('fill', d => window.getHealthColor(d.data))
      .attr('stroke', d => window.getNodeStroke(d.data))
      .attr('stroke-width', 2);
    
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', d => d.data.type === 'root' ? -25 : -15)
      .attr('text-anchor', 'middle')
      .text(d => this.truncate(d.data.name || d.data.id, 20));
    
    window.initZoom(svg, g);
    setTimeout(() => window.fitToScreen(), 50);
  },
  
  force: function(svg, nodes, links) {
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;
    
    svg.selectAll('*').remove();
    const g = svg.append('g');
    
    const simNodes = nodes.map(n => ({...n}));
    const simLinks = links.map(l => ({...l}));
    
    const simulation = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks)
        .id(d => d.id)
        .distance(80))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20))
      .alphaDecay(0.05)
      .velocityDecay(0.4);
    
    const linkGroup = g.append('g');
    const link = linkGroup.selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke-width', 1.5);
    
    const nodeGroup = g.append('g');
    const node = nodeGroup.selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(this.dragBehavior(simulation))
      .on('mouseover', (e, d) => {
        window.showTooltip(e, d);
        link.attr('stroke-opacity', l => 
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.3
        );
      })
      .on('mouseout', () => {
        window.hideTooltip();
        link.attr('stroke-opacity', 0.6);
      });
    
    node.append('circle')
      .attr('r', d => this.getNodeRadius(d))
      .attr('fill', d => window.getHealthColor(d))
      .attr('stroke', d => window.getNodeStroke(d))
      .attr('stroke-width', 2);
    
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', -12)
      .attr('text-anchor', 'middle')
      .text(d => this.truncate(d.name || d.id, 15));
    
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    window.initZoom(svg, g);
  },
  
  radial: function(svg, nodes, links) {
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    
    svg.selectAll('*').remove();
    const g = svg.append('g');
    
    const maxDepth = Math.max(...nodes.map(n => n.depth || 0), 1);
    const minRadius = 80;
    const maxRadius = Math.min(width, height) / 2 - 100;
    const radiusStep = (maxRadius - minRadius) / Math.max(maxDepth, 1);
    
    const getRadius = depth => depth === 0 ? 0 : minRadius + (depth - 1) * radiusStep + radiusStep / 2;
    
    const nodesByDepth = new Map();
    nodes.forEach(n => {
      const d = n.depth || 0;
      if (!nodesByDepth.has(d)) nodesByDepth.set(d, []);
      nodesByDepth.get(d).push(n);
    });
    
    const positioned = nodes.map(node => {
      const depth = node.depth || 0;
      if (depth === 0) return {...node, x: centerX, y: centerY, angle: 0};
      
      const atDepth = nodesByDepth.get(depth);
      const idx = atDepth.indexOf(node);
      const angle = (2 * Math.PI * idx / atDepth.length) + (depth * 0.3);
      const r = getRadius(depth);
      
      return {
        ...node,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        angle
      };
    });
    
    const nodeMap = new Map(positioned.map(n => [n.id, n]));
    
    const circleGroup = g.append('g');
    for (let d = 1; d <= maxDepth; d++) {
      const r = getRadius(d);
      circleGroup.append('circle')
        .attr('class', 'depth-circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', r);
    }
    
    const linkGroup = g.append('g');
    linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d => {
        const src = nodeMap.get(typeof d.source === 'object' ? d.source.id : d.source);
        const tgt = nodeMap.get(typeof d.target === 'object' ? d.target.id : d.target);
        if (!src || !tgt) return '';
        
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const cx = mx + (centerX - mx) * 0.2;
        const cy = my + (centerY - my) * 0.2;
        
        return `M${src.x},${src.y}Q${cx},${cy} ${tgt.x},${tgt.y}`;
      });
    
    const nodeGroup = g.append('g');
    const node = nodeGroup.selectAll('g')
      .data(positioned)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .on('mouseover', (e, d) => window.showTooltip(e, d))
      .on('mouseout', window.hideTooltip);
    
    node.append('circle')
      .attr('r', d => this.getNodeRadius(d))
      .attr('fill', d => window.getHealthColor(d))
      .attr('stroke', d => window.getNodeStroke(d))
      .attr('stroke-width', 2);
    
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', d => d.depth === 0 ? -28 : (Math.sin(d.angle) > 0.3 ? 20 : -12))
      .attr('text-anchor', d => d.depth === 0 ? 'middle' : (Math.cos(d.angle) > 0.3 ? 'start' : 'end'))
      .text(d => this.truncate(d.name || d.id, 15));
    
    window.initZoom(svg, g);
  },
  
  conflict: function(svg, nodes, links) {
    const conflicts = nodes.filter(n => 
      n.type === 'root' || 
      (n.issues && n.issues.length > 0) || 
      (n.healthScore || 10) < 7 ||
      n.isVulnerable || n.isDeprecated || n.isOutdated
    );
    
    if (conflicts.length <= 1) {
      this.showNoConflicts();
      return;
    }
    
    const ids = new Set(conflicts.map(n => n.id));
    const conflictLinks = links.filter(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      return ids.has(sid) && ids.has(tid);
    });
    
    this.force(svg, conflicts, conflictLinks);
  },
  
  analytics: function(container, nodes, links) {
    const svg = document.getElementById('graph');
    if (svg) svg.style.display = 'none';
    
    const view = document.getElementById('analyticsView');
    if (!view) return;
    view.style.display = 'block';
    
    const grid = view.querySelector('.analytics-grid');
    if (!grid) return;
    
    const stats = window.calculateStats(nodes);
    const healthDist = this.getHealthDist(nodes);
    const depthDist = this.getDepthDist(nodes);
    
    grid.innerHTML = `
      ${this.summaryCard(stats)}
      ${this.healthCard(healthDist)}
      ${this.depthCard(depthDist)}
      ${this.issuesCard(nodes)}
      ${this.topPackagesCard(nodes)}
    `;
  },
  
  buildHierarchyFast: function(nodes, links) {
    if (!nodes.length) return null;
    
    const map = new Map();
    nodes.forEach(n => map.set(n.id, {...n, children: []}));
    
    const root = nodes.find(n => n.type === 'root' || n.depth === 0) || nodes[0];
    const added = new Set();
    
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      const parent = map.get(sid);
      const child = map.get(tid);
      
      if (parent && child && !added.has(tid)) {
        parent.children.push(child);
        added.add(tid);
      }
    });
    
    return map.get(root.id);
  },
  
  getNodeRadius: function(node) {
    if (node.type === 'root' || node.depth === 0) return 20;
    if (node.depth === 1) return 12;
    return node.depth === 2 ? 8 : 6;
  },
  
  truncate: function(text, max) {
    return text && text.length > max ? text.slice(0, max - 3) + '...' : text || '';
  },
  
  dragBehavior: function(simulation) {
    return d3.drag()
      .on('start', e => {
        if (!e.active) simulation.alphaTarget(0.3).restart();
        e.subject.fx = e.subject.x;
        e.subject.fy = e.subject.y;
      })
      .on('drag', e => {
        e.subject.fx = e.x;
        e.subject.fy = e.y;
      })
      .on('end', e => {
        if (!e.active) simulation.alphaTarget(0);
        e.subject.fx = null;
        e.subject.fy = null;
      });
  },
  
  showEmptyState: function() {
    const el = document.getElementById('emptyState');
    if (el) el.style.display = 'block';
  },
  
  showNoConflicts: function() {
    const svg = document.getElementById('graph');
    if (svg) {
      const w = svg.clientWidth / 2;
      const h = svg.clientHeight / 2;
      svg.innerHTML = `
        <g transform="translate(${w},${h})">
          <text text-anchor="middle" style="font-size:3rem;fill:var(--health-excellent)" y="-20">🎉</text>
          <text text-anchor="middle" style="font-size:1.5rem;fill:var(--text-primary);font-weight:600" y="20">No Conflicts Found!</text>
          <text text-anchor="middle" style="font-size:1rem;fill:var(--text-secondary)" y="50">All dependencies are healthy</text>
        </g>
      `;
    }
  },
  
  getHealthDist: function(nodes) {
    const d = {excellent: 0, good: 0, caution: 0, warning: 0, critical: 0};
    nodes.forEach(n => {
      if (n.type === 'root') return;
      const s = n.healthScore || 8;
      if (s >= 9) d.excellent++;
      else if (s >= 7) d.good++;
      else if (s >= 5) d.caution++;
      else if (s >= 3) d.warning++;
      else d.critical++;
    });
    return d;
  },
  
  getDepthDist: function(nodes) {
    const d = {};
    nodes.forEach(n => {
      const depth = n.depth || 0;
      d[depth] = (d[depth] || 0) + 1;
    });
    return d;
  },
  
  summaryCard: function(s) {
    return `
      <div class="analytics-card">
        <h3 class="analytics-card-title">📊 Overview</h3>
        <div class="analytics-stats">
          <div class="analytics-stat-item"><div class="analytics-stat-value">${s.total}</div><div class="analytics-stat-label">Total</div></div>
          <div class="analytics-stat-item"><div class="analytics-stat-value stat-success">${s.healthy}</div><div class="analytics-stat-label">Healthy</div></div>
          <div class="analytics-stat-item"><div class="analytics-stat-value stat-danger">${s.vulnerable}</div><div class="analytics-stat-label">Vulnerable</div></div>
          <div class="analytics-stat-item"><div class="analytics-stat-value stat-warning">${s.outdated}</div><div class="analytics-stat-label">Outdated</div></div>
        </div>
      </div>
    `;
  },
  
  healthCard: function(d) {
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    const bar = (label, count, color) => {
      const pct = total > 0 ? Math.round(count / total * 100) : 0;
      return `
        <div class="analytics-bar-item">
          <div class="analytics-bar-label">${label}</div>
          <div class="analytics-bar-container">
            <div class="analytics-bar-fill" style="width:${pct}%;background:${color}"></div>
            <span class="analytics-bar-text">${count} (${pct}%)</span>
          </div>
        </div>
      `;
    };
    return `
      <div class="analytics-card">
        <h3 class="analytics-card-title">💊 Health Distribution</h3>
        <div class="analytics-distribution">
          ${bar('Excellent', d.excellent, 'var(--health-excellent)')}
          ${bar('Good', d.good, 'var(--health-good)')}
          ${bar('Caution', d.caution, 'var(--health-caution)')}
          ${bar('Warning', d.warning, 'var(--health-warning)')}
          ${bar('Critical', d.critical, 'var(--health-critical)')}
        </div>
      </div>
    `;
  },
  
  depthCard: function(d) {
    const max = Math.max(...Object.values(d));
    const items = Object.entries(d).sort((a, b) => +a[0] - +b[0]).map(([depth, count]) => `
      <div class="analytics-depth-item">
        <span class="analytics-depth-label">Depth ${depth}</span>
        <div class="analytics-depth-bar">
          <div class="analytics-depth-fill" style="width:${count/max*100}%"></div>
          <span class="analytics-depth-count">${count}</span>
        </div>
      </div>
    `).join('');
    return `
      <div class="analytics-card">
        <h3 class="analytics-card-title">📏 Depth Distribution</h3>
        <div class="analytics-depth-chart">${items}</div>
      </div>
    `;
  },
  
  issuesCard: function(nodes) {
    const types = {};
    nodes.forEach(n => {
      if (!n.issues) return;
      n.issues.forEach(i => {
        const t = i.type || 'other';
        types[t] = (types[t] || 0) + 1;
      });
    });
    const items = Object.entries(types).sort((a, b) => b[1] - a[1]).map(([type, count]) => `
      <div class="analytics-issue-item">
        <span class="analytics-issue-type">${type}</span>
        <span class="analytics-issue-count">${count}</span>
      </div>
    `).join('');
    return `
      <div class="analytics-card">
        <h3 class="analytics-card-title">🚨 Issues by Type</h3>
        <div class="analytics-issues-list">${items || '<p style="color:var(--text-muted);text-align:center">No issues</p>'}</div>
      </div>
    `;
  },
  
  topPackagesCard: function(nodes) {
    const sorted = nodes.filter(n => n.type !== 'root')
      .sort((a, b) => (a.healthScore || 8) - (b.healthScore || 8))
      .slice(0, 10);
    const items = sorted.map(n => `
      <div class="analytics-package-item">
        <div class="analytics-package-name">${this.truncate(n.name || n.id, 25)}</div>
        <div class="analytics-package-score" style="color:${window.getHealthColor(n)}">${n.healthScore || 8}/10</div>
      </div>
    `).join('');
    return `
      <div class="analytics-card">
        <h3 class="analytics-card-title">⚠️ Needs Attention</h3>
        <div class="analytics-packages-list">${items}</div>
      </div>
    `;
  }
};

let currentLayout = 'tree';

function switchLayout(name) {
  if (!window.graphData || !window.graphData.nodes || !window.graphData.nodes.length) {
    console.warn('No graph data');
    return;
  }
  
  currentLayout = name;
  
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.layout === name);
  });
  
  const svg = document.getElementById('graph');
  const view = document.getElementById('analyticsView');
  const loading = document.getElementById('loading');
  
  if (name === 'analytics') {
    if (svg) svg.style.display = 'none';
    if (view) view.style.display = 'block';
    LayoutEngine.analytics(view, window.graphData.nodes, window.graphData.links);
  } else {
    if (svg) svg.style.display = 'block';
    if (view) view.style.display = 'none';
    if (loading) loading.classList.add('visible');
    
    requestAnimationFrame(() => {
      renderCurrentLayout();
      if (loading) loading.classList.remove('visible');
    });
  }
}

function renderCurrentLayout() {
  if (!window.graphData || currentLayout === 'analytics') return;
  
  const svg = d3.select('#graph');
  const filtered = window.getFilteredNodes(window.graphData.nodes);
  const ids = new Set(filtered.map(n => n.id));
  const filteredLinks = window.graphData.links.filter(l => {
    const sid = typeof l.source === 'object' ? l.source.id : l.source;
    const tid = typeof l.target === 'object' ? l.target.id : l.target;
    return ids.has(sid) && ids.has(tid);
  });
  
  LayoutEngine[currentLayout](svg, filtered, filteredLinks);
  
  const clusterArray = window.clusters || [];
  window.updateStats(window.graphData.nodes, filtered, clusterArray);
}

// Export to window
window.LayoutEngine = LayoutEngine;
window.switchLayout = switchLayout;
window.renderCurrentLayout = renderCurrentLayout;
window.currentLayout = currentLayout;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {LayoutEngine, switchLayout, renderCurrentLayout, currentLayout};
}