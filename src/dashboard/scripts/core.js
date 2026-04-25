// src/dashboard/scripts/core.js

(function() {
  'use strict';
  
  window.clusters = [];
  window.clusterer = null;
  window.currentClusterMode = 'ecosystem';

  function init() {
    console.log('🚀 DevCompass Dashboard v3.2.0 initializing...');
    
    if (typeof window.graphData === 'undefined' || !window.graphData) {
      console.error('No graph data available');
      showEmptyState();
      return;
    }
    
    if (!window.graphData.nodes || !Array.isArray(window.graphData.nodes)) {
      console.error('Invalid graph data structure');
      showEmptyState();
      return;
    }
    
    console.log(`📊 Loaded ${window.graphData.nodes.length} nodes, ${window.graphData.links?.length || 0} links`);
    
    window.initTheme();
    window.initTooltip();
    window.initStats();
    initClustering();
    window.initKeyboardShortcuts();
    
    updateMetadata();
    
    window.switchLayout('tree');
    
    console.log('✅ Dashboard initialized successfully');
  }

  function initClustering() {
    if (typeof DependencyClusterer === 'undefined') {
      console.warn('DependencyClusterer not available');
      return;
    }
    
    try {
      window.clusterer = new DependencyClusterer(window.graphData.nodes, window.graphData.links);
      updateClusters();
    } catch (error) {
      console.error('Clustering initialization failed:', error);
    }
  }

  function updateClusters() {
    if (!window.clusterer) {
      window.clusters = [];
      renderClusterList();
      return;
    }
    
    try {
      window.clusters = window.clusterer.clusterBy(window.currentClusterMode);
      renderClusterList();
      window.updateStats(window.graphData.nodes, window.getFilteredNodes(window.graphData.nodes), window.clusters);
    } catch (error) {
      console.error('Cluster update failed:', error);
      window.clusters = [];
      renderClusterList();
    }
  }

  function renderClusterList() {
    const container = document.getElementById('clusterList');
    if (!container) return;
    
    if (window.clusters.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.875rem; padding: 1rem;">No clusters available</div>';
      return;
    }
    
    container.innerHTML = '';
    
    window.clusters.forEach(cluster => {
      const item = document.createElement('div');
      item.className = 'cluster-item';
      
      let statsHTML = '';
      if (cluster.stats.vulnerable > 0) {
        statsHTML += `<span class="cluster-badge vulnerable">🔴 ${cluster.stats.vulnerable}</span>`;
      }
      if (cluster.stats.deprecated > 0) {
        statsHTML += `<span class="cluster-badge deprecated">🟣 ${cluster.stats.deprecated}</span>`;
      }
      if (cluster.stats.outdated > 0) {
        statsHTML += `<span class="cluster-badge outdated">🟡 ${cluster.stats.outdated}</span>`;
      }
      if (cluster.stats.healthy > 0) {
        statsHTML += `<span class="cluster-badge healthy">🟢 ${cluster.stats.healthy}</span>`;
      }
      
      item.innerHTML = `
        <div class="cluster-header">
          <div class="cluster-title">
            <span class="cluster-icon">${cluster.icon || '📦'}</span>
            <span>${window.truncateText(cluster.name, 20)}</span>
          </div>
          <span class="cluster-count">${cluster.stats.total}</span>
        </div>
        ${statsHTML ? `<div class="cluster-stats">${statsHTML}</div>` : ''}
      `;
      
      item.addEventListener('click', () => window.highlightCluster(cluster));
      
      container.appendChild(item);
    });
  }

  window.highlightCluster = function(cluster) {
    const clusterNodeIds = new Set(cluster.nodes.map(n => n.id));
    
    const svg = d3.select('#graph');
    
    svg.selectAll('.node')
      .transition()
      .duration(300)
      .style('opacity', d => {
        const nodeId = d.data ? d.data.id : d.id;
        return clusterNodeIds.has(nodeId) ? 1 : 0.3;
      });
    
    svg.selectAll('.link')
      .transition()
      .duration(300)
      .style('opacity', 0.2);
    
    setTimeout(() => {
      svg.selectAll('.node')
        .transition()
        .duration(500)
        .style('opacity', 1);
      
      svg.selectAll('.link')
        .transition()
        .duration(500)
        .style('opacity', 0.6);
    }, 3000);
  };

  window.switchClusterMode = function(mode) {
    window.currentClusterMode = mode;
    
    document.querySelectorAll('.cluster-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    updateClusters();
  };

  function updateMetadata() {
    const metadata = window.graphData.metadata || {};
    
    const projectNameEl = document.getElementById('projectName');
    if (projectNameEl) {
      projectNameEl.textContent = metadata.projectName || 'Unknown Project';
    }
    
    const projectVersionEl = document.getElementById('projectVersion');
    if (projectVersionEl) {
      projectVersionEl.textContent = metadata.projectVersion || '1.0.0';
    }
    
    const totalDepsEl = document.getElementById('totalDeps');
    if (totalDepsEl) {
      totalDepsEl.textContent = window.graphData.nodes.length;
    }
  }

  function showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'flex';
    }
    
    const graphSvg = document.getElementById('graph');
    if (graphSvg) {
      graphSvg.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DevCompass = {
    version: '3.2.0',
    get graphData() { return window.graphData; },
    get clusters() { return window.clusters; },
    get currentLayout() { return window.currentLayout; },
    switchLayout: window.switchLayout,
    switchClusterMode: window.switchClusterMode,
    updateStats: window.updateStats,
    exportPNG: window.exportPNG,
    exportJSON: window.exportJSON,
    exportReport: window.exportReport
  };

})();