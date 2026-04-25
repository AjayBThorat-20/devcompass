// src/dashboard/scripts/controls.js

let currentZoom = null;
let currentSvg = null;
let currentG = null;
let currentTransform = null;

let showLabels = true;
let showLinks = true;
let showDepthCircles = true;
let currentFilters = {
  health: 'all',
  maxDepth: 10,
  searchTerm: ''
};

function initZoom(svg, g) {
  currentZoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      currentTransform = event.transform;
      updateZoomDisplay(event.transform.k);
    });
  
  svg.call(currentZoom);
  
  currentSvg = svg;
  currentG = g;
}

function updateZoomDisplay(scale) {
  const zoomPercent = Math.round(scale * 100) + '%';
  
  const zoomLevelEl = document.getElementById('zoomLevel');
  if (zoomLevelEl) {
    zoomLevelEl.textContent = zoomPercent;
  }
  
  const zoomStatEl = document.getElementById('zoom-stat');
  if (zoomStatEl) {
    zoomStatEl.textContent = zoomPercent;
  }
}

function zoomIn() {
  if (currentSvg && currentZoom) {
    currentSvg.transition().duration(300).call(currentZoom.scaleBy, 1.3);
  }
}

function zoomOut() {
  if (currentSvg && currentZoom) {
    currentSvg.transition().duration(300).call(currentZoom.scaleBy, 0.7);
  }
}

function resetZoom() {
  if (currentSvg && currentZoom) {
    currentSvg.transition().duration(500).call(
      currentZoom.transform,
      d3.zoomIdentity
    );
  }
}

function resetView() {
  resetZoom();
}

function centerGraph() {
  if (!currentSvg || !currentZoom || !currentG) return;
  
  try {
    const bounds = currentG.node().getBBox();
    const containerWidth = currentSvg.node().clientWidth;
    const containerHeight = currentSvg.node().clientHeight;
    
    const padding = 50;
    const scaleX = (containerWidth - padding * 2) / bounds.width;
    const scaleY = (containerHeight - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const tx = (containerWidth - bounds.width * scale) / 2 - bounds.x * scale;
    const ty = (containerHeight - bounds.height * scale) / 2 - bounds.y * scale;
    
    currentSvg.transition().duration(750).call(
      currentZoom.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    );
  } catch (error) {
    console.warn('Center graph failed:', error);
    resetZoom();
  }
}

function fitToScreen() {
  centerGraph();
}

function toggleLabels() {
  showLabels = !showLabels;
  d3.selectAll('.node-label').classed('hidden', !showLabels);
}

function toggleLinks() {
  showLinks = !showLinks;
  d3.selectAll('.link').classed('hidden', !showLinks);
}

function toggleDepthCircles() {
  showDepthCircles = !showDepthCircles;
  d3.selectAll('.depth-circle').classed('hidden', !showDepthCircles);
}

function handleSearch(value) {
  currentFilters.searchTerm = value;
  applyFilters();
}

function handleDepthChange(value) {
  currentFilters.maxDepth = parseInt(value);
  
  const depthValueEl = document.getElementById('depthValue');
  if (depthValueEl) {
    depthValueEl.textContent = value === '10' ? '∞' : value;
  }
  
  applyFilters();
}

function applyFilters() {
  const healthFilterEl = document.getElementById('healthFilter');
  if (healthFilterEl) {
    currentFilters.health = healthFilterEl.value;
  }
  
  if (typeof window.renderCurrentLayout === 'function') {
    window.renderCurrentLayout();
  }
}

function getFilteredNodes(allNodes) {
  return allNodes.filter(node => window.nodeMatchesFilters(node, currentFilters));
}

function exportPNG() {
  try {
    const svgElement = document.getElementById('graph');
    if (!svgElement) {
      alert('Graph not found');
      return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = svgElement.clientWidth;
    canvas.height = svgElement.clientHeight;

    img.onload = function() {
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devcompass-graph-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  } catch (error) {
    console.error('PNG export failed:', error);
    alert('PNG export failed. Please try again.');
  }
}

function exportJSON() {
  if (typeof window.graphData === 'undefined') {
    alert('No graph data available');
    return;
  }
  
  const exportData = {
    version: '3.2.0',
    timestamp: new Date().toISOString(),
    nodes: window.graphData.nodes,
    links: window.graphData.links,
    metadata: window.graphData.metadata || {},
    filters: currentFilters
  };
  
  window.exportAsJSON(exportData, `devcompass-data-${Date.now()}.json`);
}

function exportReport() {
  if (typeof window.graphData === 'undefined') {
    alert('No graph data available');
    return;
  }
  
  const stats = window.getStats();
  const healthDist = window.statsManager ? window.statsManager.getHealthDistribution(window.graphData.nodes) : {};
  
  const report = {
    title: 'DevCompass Dependency Report',
    generated: new Date().toISOString(),
    project: {
      name: document.getElementById('projectName')?.textContent || 'Unknown',
      version: document.getElementById('projectVersion')?.textContent || 'Unknown'
    },
    statistics: stats,
    healthDistribution: healthDist,
    nodes: window.graphData.nodes.map(n => ({
      name: n.name,
      version: n.version,
      healthScore: n.healthScore,
      depth: n.depth,
      issues: n.issues
    }))
  };
  
  window.exportAsJSON(report, `devcompass-report-${Date.now()}.json`);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Fullscreen not supported:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('theme-dark');
  
  if (isDark) {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
    window.storage.set('theme', 'light');
    document.getElementById('themeIcon').textContent = '☀️';
  } else {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
    window.storage.set('theme', 'dark');
    document.getElementById('themeIcon').textContent = '🌙';
  }
}

function initTheme() {
  const savedTheme = window.storage.get('theme', 'dark');
  const body = document.body;
  
  if (savedTheme === 'light') {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
    document.getElementById('themeIcon').textContent = '☀️';
  } else {
    body.classList.add('theme-dark');
    document.getElementById('themeIcon').textContent = '🌙';
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch(e.key.toLowerCase()) {
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case 'r':
        e.preventDefault();
        resetView();
        break;
      case 'f':
        e.preventDefault();
        fitToScreen();
        break;
      case 'l':
        e.preventDefault();
        toggleLabels();
        break;
      case 't':
        e.preventDefault();
        toggleTheme();
        break;
      case 'escape':
        window.hideTooltip();
        break;
    }
  });
}

// Export to window
window.initZoom = initZoom;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
window.resetView = resetView;
window.centerGraph = centerGraph;
window.fitToScreen = fitToScreen;
window.toggleLabels = toggleLabels;
window.toggleLinks = toggleLinks;
window.toggleDepthCircles = toggleDepthCircles;
window.handleSearch = handleSearch;
window.handleDepthChange = handleDepthChange;
window.applyFilters = applyFilters;
window.getFilteredNodes = getFilteredNodes;
window.exportPNG = exportPNG;
window.exportJSON = exportJSON;
window.exportReport = exportReport;
window.toggleFullscreen = toggleFullscreen;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.initKeyboardShortcuts = initKeyboardShortcuts;
window.currentFilters = currentFilters;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    resetView,
    centerGraph,
    fitToScreen,
    toggleLabels,
    toggleLinks,
    toggleDepthCircles,
    handleSearch,
    handleDepthChange,
    applyFilters,
    getFilteredNodes,
    exportPNG,
    exportJSON,
    exportReport,
    toggleFullscreen,
    toggleTheme,
    initTheme,
    initKeyboardShortcuts,
    currentFilters
  };
}