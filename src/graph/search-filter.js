// src/graph/search-filter.js
/**
 * Search and filter utilities for dependency graphs
 * Provides real-time search and filtering capabilities
 */

/**
 * Generate search and filter HTML controls
 */
function generateSearchFilterHTML(graphData) {
  const { nodes = [], links = [] } = graphData;
  
  // Collect unique values for filters
  const types = [...new Set(nodes.map(n => n.type).filter(Boolean))];
  const severities = ['critical', 'high', 'medium', 'low'];
  const minDepth = Math.min(...nodes.map(n => n.depth || 0).filter(d => d !== undefined));
  const maxDepth = Math.max(...nodes.map(n => n.depth || 0).filter(d => d !== undefined));

  return `
<div class="search-filter-panel">
  <div class="search-section">
    <h3 class="section-title">🔍 Search</h3>
    <input 
      type="text" 
      id="search-input" 
      class="search-input" 
      placeholder="Search packages..."
      autocomplete="off"
    />
    <div id="search-results" class="search-results" style="display: none;"></div>
  </div>

  <div class="filter-section">
    <h3 class="section-title">⚙️ Filters</h3>
    
    <div class="filter-group">
      <label class="filter-label">
        <input type="checkbox" id="filter-vulnerable" class="filter-checkbox" />
        Show only vulnerable
      </label>
    </div>

    <div class="filter-group">
      <label class="filter-label">
        <input type="checkbox" id="filter-outdated" class="filter-checkbox" />
        Show only outdated
      </label>
    </div>

    <div class="filter-group">
      <label class="filter-label">
        <input type="checkbox" id="filter-deprecated" class="filter-checkbox" />
        Show only deprecated
      </label>
    </div>

    <div class="filter-group">
      <label class="filter-label">Health Score:</label>
      <select id="filter-health" class="filter-select">
        <option value="all">All packages</option>
        <option value="0-3">Critical (0-3)</option>
        <option value="3-5">Warning (3-5)</option>
        <option value="5-7">Caution (5-7)</option>
        <option value="7-10">Healthy (7-10)</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Depth Level:</label>
      <select id="filter-depth" class="filter-select">
        <option value="all">All levels</option>
        ${Array.from({length: maxDepth - minDepth + 1}, (_, i) => i + minDepth)
          .map(d => `<option value="${d}">Level ${d}${d === 0 ? ' (root)' : ''}</option>`)
          .join('\n        ')}
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label">Package Type:</label>
      <select id="filter-type" class="filter-select">
        <option value="all">All types</option>
        <option value="dependency">Dependencies</option>
        <option value="devDependency">Dev Dependencies</option>
        <option value="peerDependency">Peer Dependencies</option>
      </select>
    </div>

    <button class="reset-button" onclick="resetFilters()">Reset Filters</button>
  </div>

  <div class="stats-section">
    <h3 class="section-title">📊 Stats</h3>
    <div class="stat-item">
      <span class="stat-label">Visible:</span>
      <span class="stat-value" id="visible-count">${nodes.length}</span>
      <span class="stat-total">/ ${nodes.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Hidden:</span>
      <span class="stat-value" id="hidden-count">0</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Links:</span>
      <span class="stat-value" id="visible-links">${links.length}</span>
      <span class="stat-total">/ ${links.length}</span>
    </div>
  </div>
</div>

<style>
  .search-filter-panel {
    position: fixed;
    left: 20px;
    top: 20px;
    width: 280px;
    background: #2d3748;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    z-index: 100;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #4a5568;
  }

  .search-section {
    margin-bottom: 24px;
  }

  .search-input {
    width: 100%;
    padding: 10px 12px;
    background: #1a202c;
    border: 1px solid #4a5568;
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #4299e1;
  }

  .search-input::placeholder {
    color: #718096;
  }

  .search-results {
    margin-top: 8px;
    background: #1a202c;
    border: 1px solid #4a5568;
    border-radius: 6px;
    max-height: 200px;
    overflow-y: auto;
  }

  .search-result-item {
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid #4a5568;
    transition: background 0.2s;
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .search-result-item:hover {
    background: #2d3748;
  }

  .search-result-name {
    font-weight: 600;
    color: #4299e1;
    font-size: 13px;
  }

  .search-result-version {
    color: #a0aec0;
    font-size: 12px;
    margin-left: 6px;
  }

  .filter-section {
    margin-bottom: 24px;
  }

  .filter-group {
    margin-bottom: 12px;
  }

  .filter-label {
    display: flex;
    align-items: center;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
    margin-bottom: 6px;
  }

  .filter-checkbox {
    margin-right: 8px;
    cursor: pointer;
  }

  .filter-select {
    width: 100%;
    padding: 8px 10px;
    background: #1a202c;
    border: 1px solid #4a5568;
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 13px;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #4299e1;
  }

  .reset-button {
    width: 100%;
    padding: 10px;
    background: #4a5568;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 8px;
  }

  .reset-button:hover {
    background: #2d3748;
  }

  .stats-section {
    padding-top: 16px;
    border-top: 1px solid #4a5568;
  }

  .stat-item {
    display: flex;
    align-items: center;
    margin: 8px 0;
    font-size: 13px;
  }

  .stat-label {
    color: #a0aec0;
    margin-right: 8px;
  }

  .stat-value {
    color: #4299e1;
    font-weight: 600;
  }

  .stat-total {
    color: #718096;
    margin-left: 4px;
  }

  /* Scrollbar styling */
  .search-filter-panel::-webkit-scrollbar,
  .search-results::-webkit-scrollbar {
    width: 6px;
  }

  .search-filter-panel::-webkit-scrollbar-track,
  .search-results::-webkit-scrollbar-track {
    background: #1a202c;
    border-radius: 3px;
  }

  .search-filter-panel::-webkit-scrollbar-thumb,
  .search-results::-webkit-scrollbar-thumb {
    background: #4a5568;
    border-radius: 3px;
  }

  .search-filter-panel::-webkit-scrollbar-thumb:hover,
  .search-results::-webkit-scrollbar-thumb:hover {
    background: #718096;
  }
</style>
  `.trim();
}

/**
 * Generate search and filter JavaScript
 */
function generateSearchFilterJS(graphData) {
  return `
// Search and filter functionality
(function() {
  const allNodes = ${JSON.stringify(graphData.nodes || [])};
  const allLinks = ${JSON.stringify(graphData.links || [])};
  let filteredNodes = [...allNodes];
  let filteredLinks = [...allLinks];

  // Search functionality
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      if (query.length === 0) {
        searchResults.style.display = 'none';
        return;
      }

      const results = allNodes.filter(node => 
        node.name.toLowerCase().includes(query) ||
        (node.version && node.version.includes(query))
      ).slice(0, 10);

      if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 12px; color: #a0aec0; font-size: 12px;">No results found</div>';
        searchResults.style.display = 'block';
        return;
      }

      searchResults.innerHTML = results.map(node => \`
        <div class="search-result-item" onclick="highlightNode('\${node.id}')">
          <span class="search-result-name">\${node.name}</span>
          <span class="search-result-version">@\${node.version || '?'}</span>
        </div>
      \`).join('');
      searchResults.style.display = 'block';
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });
  }

  // Highlight node function
  window.highlightNode = function(nodeId) {
    const node = d3.selectAll('.node').filter(d => d.id === nodeId);
    
    // Reset all nodes
    d3.selectAll('.node')
      .transition()
      .duration(200)
      .style('opacity', 0.3);
    
    // Highlight selected node
    node
      .transition()
      .duration(200)
      .style('opacity', 1)
      .attr('r', d => (d.radius || 6) * 1.5);

    // Reset after 3 seconds
    setTimeout(() => {
      d3.selectAll('.node')
        .transition()
        .duration(500)
        .style('opacity', 1)
        .attr('r', d => d.radius || 6);
    }, 3000);

    if (searchResults) {
      searchResults.style.display = 'none';
    }
    if (searchInput) {
      searchInput.value = '';
    }
  };

  // Filter functionality
  function applyFilters() {
    const vulnerableOnly = document.getElementById('filter-vulnerable')?.checked || false;
    const outdatedOnly = document.getElementById('filter-outdated')?.checked || false;
    const deprecatedOnly = document.getElementById('filter-deprecated')?.checked || false;
    const healthFilter = document.getElementById('filter-health')?.value || 'all';
    const depthFilter = document.getElementById('filter-depth')?.value || 'all';
    const typeFilter = document.getElementById('filter-type')?.value || 'all';

    filteredNodes = allNodes.filter(node => {
      // Vulnerable filter
      if (vulnerableOnly) {
        const hasVulnerability = node.issues?.some(i => 
          i.type === 'security' || i.type === 'vulnerability'
        );
        if (!hasVulnerability) return false;
      }

      // Outdated filter
      if (outdatedOnly) {
        const isOutdated = node.issues?.some(i => i.type === 'outdated');
        if (!isOutdated) return false;
      }

      // Deprecated filter
      if (deprecatedOnly) {
        const isDeprecated = node.issues?.some(i => i.type === 'deprecated');
        if (!isDeprecated) return false;
      }

      // Health filter
      if (healthFilter !== 'all') {
        const [min, max] = healthFilter.split('-').map(Number);
        const score = node.healthScore || 10;
        if (score < min || score > max) return false;
      }

      // Depth filter
      if (depthFilter !== 'all') {
        const depth = parseInt(depthFilter);
        if ((node.depth || 0) !== depth) return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (node.type !== typeFilter) return false;
      }

      return true;
    });

    // Filter links to only show connections between visible nodes
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    filteredLinks = allLinks.filter(link => 
      visibleIds.has(link.source) && visibleIds.has(link.target)
    );

    updateGraph();
    updateStats();
  }

  // Update graph visibility
  function updateGraph() {
    const visibleIds = new Set(filteredNodes.map(n => n.id));

    // Update nodes
    d3.selectAll('.node')
      .style('display', d => visibleIds.has(d.id) ? 'block' : 'none')
      .style('opacity', d => visibleIds.has(d.id) ? 1 : 0);

    // Update labels
    d3.selectAll('.node-label')
      .style('display', d => visibleIds.has(d.id) ? 'block' : 'none');

    // Update links
    d3.selectAll('.link')
      .style('display', d => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        return visibleIds.has(sourceId) && visibleIds.has(targetId) ? 'block' : 'none';
      });
  }

  // Update stats
  function updateStats() {
    const visibleCountEl = document.getElementById('visible-count');
    const hiddenCountEl = document.getElementById('hidden-count');
    const visibleLinksEl = document.getElementById('visible-links');
    
    if (visibleCountEl) visibleCountEl.textContent = filteredNodes.length;
    if (hiddenCountEl) hiddenCountEl.textContent = allNodes.length - filteredNodes.length;
    if (visibleLinksEl) visibleLinksEl.textContent = filteredLinks.length;
  }

  // Reset filters
  window.resetFilters = function() {
    const filterVulnerable = document.getElementById('filter-vulnerable');
    const filterOutdated = document.getElementById('filter-outdated');
    const filterDeprecated = document.getElementById('filter-deprecated');
    const filterHealth = document.getElementById('filter-health');
    const filterDepth = document.getElementById('filter-depth');
    const filterType = document.getElementById('filter-type');
    
    if (filterVulnerable) filterVulnerable.checked = false;
    if (filterOutdated) filterOutdated.checked = false;
    if (filterDeprecated) filterDeprecated.checked = false;
    if (filterHealth) filterHealth.value = 'all';
    if (filterDepth) filterDepth.value = 'all';
    if (filterType) filterType.value = 'all';
    
    filteredNodes = [...allNodes];
    filteredLinks = [...allLinks];
    
    updateGraph();
    updateStats();
  };

  // Attach event listeners
  const listeners = [
    'filter-vulnerable',
    'filter-outdated',
    'filter-deprecated',
    'filter-health',
    'filter-depth',
    'filter-type'
  ];

  listeners.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', applyFilters);
    }
  });

  // Initialize
  updateStats();
})();
  `.trim();
}

module.exports = {
  generateSearchFilterHTML,
  generateSearchFilterJS
};