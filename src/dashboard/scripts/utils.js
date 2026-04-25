// src/dashboard/scripts/utils.js

function getHealthColor(node) {
  if (node.type === 'root' || node.depth === 0) {
    return 'var(--root-color)';
  }
  
  const score = node.healthScore || 8;
  
  if (score >= 9) return 'var(--health-excellent)';
  if (score >= 7) return 'var(--health-good)';
  if (score >= 5) return 'var(--health-caution)';
  if (score >= 3) return 'var(--health-warning)';
  return 'var(--health-critical)';
}

function getNodeRadius(node) {
  if (node.type === 'root' || node.depth === 0) return 20;
  if (node.depth === 1) return 12;
  if (node.depth === 2) return 8;
  return 6;
}

function getNodeStroke(node) {
  if (node.type === 'root') return 'var(--accent-blue)';
  return 'var(--bg-primary)';
}

function buildHierarchy(nodes, links) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;
  
  const nodeMap = new Map();
  nodes.forEach(n => {
    nodeMap.set(n.id, { ...n, children: [] });
  });
  
  const root = nodes.find(n => n.type === 'root' || n.depth === 0) || nodes[0];
  
  const childrenAdded = new Set();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const parent = nodeMap.get(sourceId);
    const child = nodeMap.get(targetId);
    
    if (parent && child && !childrenAdded.has(targetId)) {
      parent.children.push(child);
      childrenAdded.add(targetId);
    }
  });
  
  return nodeMap.get(root.id);
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function truncateText(text, maxLength = 20) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function nodeMatchesFilters(node, filters) {
  if (filters.health && filters.health !== 'all') {
    const score = node.healthScore || 8;
    
    switch (filters.health) {
      case 'excellent':
        if (score < 9) return false;
        break;
      case 'good':
        if (score < 7 || score >= 9) return false;
        break;
      case 'caution':
        if (score < 5 || score >= 7) return false;
        break;
      case 'warning':
        if (score < 3 || score >= 5) return false;
        break;
      case 'critical':
        if (score >= 3) return false;
        break;
    }
  }
  
  if (filters.maxDepth && filters.maxDepth !== 10) {
    if ((node.depth || 0) > filters.maxDepth) return false;
  }
  
  if (filters.searchTerm) {
    const name = (node.name || node.id || '').toLowerCase();
    if (!name.includes(filters.searchTerm.toLowerCase())) return false;
  }
  
  return true;
}

function calculateStats(nodes) {
  const stats = {
    total: nodes.length,
    vulnerable: 0,
    deprecated: 0,
    outdated: 0,
    unused: 0,
    healthy: 0,
    maxDepth: 0
  };
  
  nodes.forEach(node => {
    if (node.type === 'root') return;
    
    if (node.isVulnerable) stats.vulnerable++;
    if (node.isDeprecated) stats.deprecated++;
    if (node.isOutdated) stats.outdated++;
    if (node.isUnused) stats.unused++;
    
    const score = node.healthScore || 8;
    if (score >= 7 && !node.isVulnerable && !node.isDeprecated) {
      stats.healthy++;
    }
    
    stats.maxDepth = Math.max(stats.maxDepth, node.depth || 0);
  });
  
  return stats;
}

function exportAsJSON(data, filename = 'devcompass-export.json') {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getContrastColor(bgColor) {
  const color = bgColor.replace('var(--', '').replace(')', '');
  const darkColors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'accent-blue'];
  return darkColors.includes(color) ? '#ffffff' : '#000000';
}

const storage = {
  set(key, value) {
    try {
      localStorage.setItem(`devcompass_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`devcompass_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('LocalStorage not available:', e);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(`devcompass_${key}`);
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  }
};

// Export to window for global access
window.getHealthColor = getHealthColor;
window.getNodeRadius = getNodeRadius;
window.getNodeStroke = getNodeStroke;
window.buildHierarchy = buildHierarchy;
window.formatNumber = formatNumber;
window.truncateText = truncateText;
window.debounce = debounce;
window.deepClone = deepClone;
window.nodeMatchesFilters = nodeMatchesFilters;
window.calculateStats = calculateStats;
window.exportAsJSON = exportAsJSON;
window.getContrastColor = getContrastColor;
window.storage = storage;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getHealthColor,
    getNodeRadius,
    getNodeStroke,
    buildHierarchy,
    formatNumber,
    truncateText,
    debounce,
    deepClone,
    nodeMatchesFilters,
    calculateStats,
    exportAsJSON,
    getContrastColor,
    storage
  };
}