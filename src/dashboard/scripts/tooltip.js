// src/dashboard/scripts/tooltip.js

class Tooltip {
  constructor(elementId = 'tooltip') {
    this.element = document.getElementById(elementId);
    this.visible = false;
  }
  
  show(event, node) {
    if (!this.element) return;
    
    const data = node.data || node;
    const score = data.healthScore || 8;
    const issues = data.issues || [];
    
    let content = `<div class="tooltip-title">${window.truncateText(data.name || data.id, 30)}</div>`;
    content += `<div class="tooltip-content">`;
    
    content += `<div class="tooltip-row">
      <span class="tooltip-label">Version</span>
      <span class="tooltip-value">${data.version || 'N/A'}</span>
    </div>`;
    
    content += `<div class="tooltip-row">
      <span class="tooltip-label">Health Score</span>
      <span class="tooltip-value">${score}/10</span>
    </div>`;
    
    content += `<div class="tooltip-row">
      <span class="tooltip-label">Depth</span>
      <span class="tooltip-value">${data.depth || 0}</span>
    </div>`;
    
    if (data.type) {
      content += `<div class="tooltip-row">
        <span class="tooltip-label">Type</span>
        <span class="tooltip-value">${data.type}</span>
      </div>`;
    }
    
    if (node.children || node._children) {
      const childCount = (node.children || node._children || []).length;
      content += `<div class="tooltip-row">
        <span class="tooltip-label">Children</span>
        <span class="tooltip-value">${childCount}</span>
      </div>`;
    }
    
    if (issues.length > 0) {
      content += `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">`;
      issues.forEach(issue => {
        const badgeClass = this.getIssueBadgeClass(issue.type);
        content += `<span class="tooltip-badge ${badgeClass}">${issue.title || issue.type}</span>`;
      });
      content += `</div>`;
    }
    
    if (data.isVulnerable) {
      content += `<span class="tooltip-badge critical">🔴 Vulnerable</span>`;
    }
    if (data.isDeprecated) {
      content += `<span class="tooltip-badge deprecated">🟣 Deprecated</span>`;
    }
    if (data.isOutdated) {
      content += `<span class="tooltip-badge warning">🟡 Outdated</span>`;
    }
    if (data.isUnused) {
      content += `<span class="tooltip-badge info">⚪ Unused</span>`;
    }
    
    content += `</div>`;
    
    this.element.innerHTML = content;
    this.position(event);
    this.element.classList.add('visible');
    this.visible = true;
  }
  
  hide() {
    if (!this.element) return;
    this.element.classList.remove('visible');
    this.visible = false;
  }
  
  position(event) {
    if (!this.element) return;
    
    const offset = 15;
    const tooltipWidth = this.element.offsetWidth || 300;
    const tooltipHeight = this.element.offsetHeight || 200;
    
    let x = event.pageX + offset;
    let y = event.pageY - offset;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (x + tooltipWidth > viewportWidth) {
      x = event.pageX - tooltipWidth - offset;
    }
    
    if (y + tooltipHeight > viewportHeight) {
      y = event.pageY - tooltipHeight - offset;
    }
    
    if (y < 0) {
      y = event.pageY + offset;
    }
    
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
  }
  
  getIssueBadgeClass(issueType) {
    const typeMap = {
      'security': 'critical',
      'vulnerability': 'critical',
      'deprecated': 'deprecated',
      'outdated': 'warning',
      'unused': 'info'
    };
    
    return typeMap[issueType] || 'info';
  }
  
  updatePosition(event) {
    if (this.visible) {
      this.position(event);
    }
  }
}

let tooltipInstance;

function initTooltip() {
  tooltipInstance = new Tooltip();
  return tooltipInstance;
}

function showTooltip(event, node) {
  if (!tooltipInstance) tooltipInstance = new Tooltip();
  tooltipInstance.show(event, node);
}

function hideTooltip() {
  if (tooltipInstance) tooltipInstance.hide();
}

function updateTooltipPosition(event) {
  if (tooltipInstance) tooltipInstance.updatePosition(event);
}

// Export to window
window.Tooltip = Tooltip;
window.initTooltip = initTooltip;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.updateTooltipPosition = updateTooltipPosition;
window.tooltipInstance = null;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Tooltip,
    initTooltip,
    showTooltip,
    hideTooltip,
    updateTooltipPosition
  };
}