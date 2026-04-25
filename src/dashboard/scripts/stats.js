// src/dashboard/scripts/stats.js

class StatsManager {
  constructor() {
    this.stats = {
      total: 0,
      visible: 0,
      clusters: 0,
      vulnerable: 0,
      deprecated: 0,
      outdated: 0,
      unused: 0,
      healthy: 0,
      maxDepth: 0
    };
  }
  
  calculate(nodes, visibleNodes = null, clusters = []) {
    this.stats.total = nodes.length;
    this.stats.visible = visibleNodes ? visibleNodes.length : nodes.length;
    this.stats.clusters = clusters.length;
    
    this.stats.vulnerable = 0;
    this.stats.deprecated = 0;
    this.stats.outdated = 0;
    this.stats.unused = 0;
    this.stats.healthy = 0;
    this.stats.maxDepth = 0;
    
    nodes.forEach(node => {
      if (node.type === 'root') return;
      
      if (node.isVulnerable) this.stats.vulnerable++;
      if (node.isDeprecated) this.stats.deprecated++;
      if (node.isOutdated) this.stats.outdated++;
      if (node.isUnused) this.stats.unused++;
      
      const score = node.healthScore || 8;
      if (score >= 7 && !node.isVulnerable && !node.isDeprecated) {
        this.stats.healthy++;
      }
      
      this.stats.maxDepth = Math.max(this.stats.maxDepth, node.depth || 0);
    });
    
    return this.stats;
  }
  
  updateDisplay() {
    this.updateStat('stat-total', this.stats.total);
    this.updateStat('stat-visible', this.stats.visible);
    this.updateStat('stat-clusters', this.stats.clusters);
    this.updateStat('stat-vulnerable', this.stats.vulnerable);
    this.updateStat('stat-outdated', this.stats.outdated);
    this.updateStat('stat-healthy', this.stats.healthy);
    
    this.updateHeaderMeta();
  }
  
  updateStat(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = window.formatNumber(value);
    }
  }
  
  updateHeaderMeta() {
    const totalDepsEl = document.getElementById('totalDeps');
    if (totalDepsEl) {
      totalDepsEl.textContent = this.stats.total;
    }
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  getHealthDistribution(nodes) {
    const distribution = {
      excellent: 0,
      good: 0,
      caution: 0,
      warning: 0,
      critical: 0
    };
    
    nodes.forEach(node => {
      if (node.type === 'root') return;
      
      const score = node.healthScore || 8;
      
      if (score >= 9) distribution.excellent++;
      else if (score >= 7) distribution.good++;
      else if (score >= 5) distribution.caution++;
      else if (score >= 3) distribution.warning++;
      else distribution.critical++;
    });
    
    return distribution;
  }
  
  getDepthDistribution(nodes) {
    const distribution = {};
    
    nodes.forEach(node => {
      const depth = node.depth || 0;
      distribution[depth] = (distribution[depth] || 0) + 1;
    });
    
    return distribution;
  }
  
  getIssueSummary(nodes) {
    const summary = {
      security: 0,
      quality: 0,
      license: 0,
      ecosystem: 0
    };
    
    nodes.forEach(node => {
      if (!node.issues || !Array.isArray(node.issues)) return;
      
      node.issues.forEach(issue => {
        const type = issue.type || 'other';
        if (summary.hasOwnProperty(type)) {
          summary[type]++;
        }
      });
    });
    
    return summary;
  }
  
  exportAsCSV() {
    const rows = [
      ['Metric', 'Value'],
      ['Total Packages', this.stats.total],
      ['Visible Packages', this.stats.visible],
      ['Clusters', this.stats.clusters],
      ['Vulnerable', this.stats.vulnerable],
      ['Deprecated', this.stats.deprecated],
      ['Outdated', this.stats.outdated],
      ['Unused', this.stats.unused],
      ['Healthy', this.stats.healthy],
      ['Max Depth', this.stats.maxDepth]
    ];
    
    return rows.map(row => row.join(',')).join('\n');
  }
}

let statsManager;

function initStats() {
  statsManager = new StatsManager();
  return statsManager;
}

function updateStats(nodes, visibleNodes, clusters) {
  if (!statsManager) statsManager = new StatsManager();
  statsManager.calculate(nodes, visibleNodes, clusters);
  statsManager.updateDisplay();
}

function getStats() {
  if (!statsManager) statsManager = new StatsManager();
  return statsManager.getStats();
}

// Export to window
window.StatsManager = StatsManager;
window.initStats = initStats;
window.updateStats = updateStats;
window.getStats = getStats;
window.statsManager = null;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    StatsManager,
    initStats,
    updateStats,
    getStats
  };
}