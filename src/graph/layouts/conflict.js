// src/graph/layouts/conflict.js
// Conflict-only view - shows packages with issues organized by severity

/**
 * Generate conflict layout HTML
 * Shows only packages with issues, organized by severity
 */
function generateConflictLayoutHTML(graphData, options = {}) {
  const projectName = options.projectName || 'Project';
  const projectVersion = options.projectVersion || '1.0.0';

  // Validate input
  const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const links = Array.isArray(graphData.links) ? graphData.links : [];

  // Filter to only nodes with issues or low health scores
  const conflictNodes = nodes.filter(n => {
    if (n.type === 'root') return true; // Always show root
    const hasIssues = Array.isArray(n.issues) && n.issues.length > 0;
    const lowHealth = (n.healthScore || 10) < 7;
    return hasIssues || lowHealth;
  });

  // If no conflicts, show success message
  if (conflictNodes.length <= 1) {
    return generateNoConflictsHTML(projectName, projectVersion, nodes.length);
  }

  // Categorize by severity
  const categorized = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    root: []
  };

  conflictNodes.forEach(node => {
    if (node.type === 'root') {
      categorized.root.push(node);
    } else {
      const score = node.healthScore || 8;
      if (score < 3) categorized.critical.push(node);
      else if (score < 5) categorized.high.push(node);
      else if (score < 7) categorized.medium.push(node);
      else categorized.low.push(node);
    }
  });

  const graphDataJSON = JSON.stringify({ 
    nodes: conflictNodes, 
    links,
    categorized 
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - Conflict View</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --border-color: #475569;
      --critical: #ef4444;
      --high: #f97316;
      --medium: #eab308;
      --low: #84cc16;
      --root-color: #60a5fa;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      padding: 30px;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 20px;
      border: 1px solid var(--border-color);
      margin-bottom: 30px;
      backdrop-filter: blur(12px);
    }

    .header-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .header-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }

    .header-meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .header-meta span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Summary Cards */
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: rgba(30, 41, 59, 0.8);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      padding: 20px;
      text-align: center;
      backdrop-filter: blur(12px);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .summary-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .summary-count {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .summary-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card.critical .summary-count { color: var(--critical); }
    .summary-card.high .summary-count { color: var(--high); }
    .summary-card.medium .summary-count { color: var(--medium); }
    .summary-card.low .summary-count { color: var(--low); }

    /* Severity Sections */
    .severity-section {
      background: rgba(30, 41, 59, 0.8);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      margin-bottom: 20px;
      overflow: hidden;
      backdrop-filter: blur(12px);
    }

    .severity-header {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background 0.2s;
    }

    .severity-header:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .severity-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .severity-title {
      font-weight: 600;
      font-size: 15px;
      flex: 1;
    }

    .severity-count {
      background: var(--bg-tertiary);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .severity-toggle {
      color: var(--text-muted);
      font-size: 18px;
      transition: transform 0.2s;
    }

    .severity-section.collapsed .severity-toggle {
      transform: rotate(-90deg);
    }

    .severity-section.collapsed .severity-content {
      display: none;
    }

    .severity-content {
      padding: 16px;
    }

    /* Package Cards */
    .package-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .package-card {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid var(--border-color);
      transition: transform 0.2s, border-color 0.2s;
    }

    .package-card:hover {
      transform: translateX(4px);
      border-color: var(--accent-cyan);
    }

    .package-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--accent-cyan);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .package-version {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .package-issues {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .issue-tag {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
    }

    .issue-tag.security { background: rgba(239, 68, 68, 0.2); color: var(--critical); }
    .issue-tag.outdated { background: rgba(249, 115, 22, 0.2); color: var(--high); }
    .issue-tag.deprecated { background: rgba(234, 179, 8, 0.2); color: var(--medium); }

    .package-score {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .score-label { color: var(--text-secondary); }
    .score-value { font-weight: 600; }

    /* Empty state for sections */
    .empty-section {
      padding: 30px;
      text-align: center;
      color: var(--text-muted);
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">
        ⚠️ Dependency Conflict View
      </div>
      <div class="header-subtitle">
        Packages requiring attention, organized by severity
      </div>
      <div class="header-meta">
        <span><strong>Project:</strong> ${projectName}</span>
        <span><strong>Version:</strong> ${projectVersion}</span>
        <span><strong>Total Deps:</strong> ${nodes.length}</span>
        <span><strong>With Issues:</strong> ${conflictNodes.length - 1}</span>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card critical">
        <div class="summary-count" id="critical-count">0</div>
        <div class="summary-label">Critical</div>
      </div>
      <div class="summary-card high">
        <div class="summary-count" id="high-count">0</div>
        <div class="summary-label">High</div>
      </div>
      <div class="summary-card medium">
        <div class="summary-count" id="medium-count">0</div>
        <div class="summary-label">Medium</div>
      </div>
      <div class="summary-card low">
        <div class="summary-count" id="low-count">0</div>
        <div class="summary-label">Low</div>
      </div>
    </div>

    <div id="sections"></div>

    <div class="footer">
      Generated by DevCompass • ${new Date().toLocaleString()}
    </div>
  </div>

  <script>
    const graphData = ${graphDataJSON};
    const categorized = graphData.categorized;

    // Update counts
    document.getElementById('critical-count').textContent = categorized.critical.length;
    document.getElementById('high-count').textContent = categorized.high.length;
    document.getElementById('medium-count').textContent = categorized.medium.length;
    document.getElementById('low-count').textContent = categorized.low.length;

    // Generate sections
    const sections = [
      { key: 'critical', title: 'Critical Issues', color: 'var(--critical)' },
      { key: 'high', title: 'High Priority', color: 'var(--high)' },
      { key: 'medium', title: 'Medium Priority', color: 'var(--medium)' },
      { key: 'low', title: 'Low Priority', color: 'var(--low)' }
    ];

    const container = document.getElementById('sections');

    sections.forEach(section => {
      const packages = categorized[section.key];
      if (packages.length === 0) return;

      const sectionEl = document.createElement('div');
      sectionEl.className = 'severity-section';
      sectionEl.innerHTML = \`
        <div class="severity-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <div class="severity-indicator" style="background: \${section.color};"></div>
          <div class="severity-title">\${section.title}</div>
          <div class="severity-count">\${packages.length} package\${packages.length !== 1 ? 's' : ''}</div>
          <div class="severity-toggle">▼</div>
        </div>
        <div class="severity-content">
          <div class="package-grid">
            \${packages.map(pkg => renderPackageCard(pkg, section.color)).join('')}
          </div>
        </div>
      \`;
      container.appendChild(sectionEl);
    });

    function renderPackageCard(pkg, color) {
      const issues = pkg.issues || [];
      const score = pkg.healthScore || 5;
      
      return \`
        <div class="package-card">
          <div class="package-name">
            <span style="color: \${color};">●</span>
            \${pkg.name || pkg.id}
          </div>
          <div class="package-version">v\${pkg.version || 'unknown'}</div>
          <div class="package-issues">
            \${issues.map(i => \`<span class="issue-tag \${i.type || ''}">\${i.title || i.type || 'Issue'}</span>\`).join('')}
            \${issues.length === 0 ? '<span class="issue-tag">Low health score</span>' : ''}
          </div>
          <div class="package-score">
            <span class="score-label">Health Score</span>
            <span class="score-value" style="color: \${color};">\${score}/10</span>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
}

/**
 * Generate HTML for when no conflicts are found
 */
function generateNoConflictsHTML(projectName, projectVersion, totalDeps) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass - No Conflicts</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-card {
      text-align: center;
      padding: 60px 80px;
      background: rgba(30, 41, 59, 0.95);
      border-radius: 24px;
      border: 1px solid #475569;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .success-icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .success-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #10b981;
    }

    .success-subtitle {
      font-size: 16px;
      color: #94a3b8;
      margin-bottom: 30px;
    }

    .stats {
      display: flex;
      gap: 40px;
      justify-content: center;
      padding-top: 24px;
      border-top: 1px solid #475569;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #06b6d4;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="success-card">
    <div class="success-icon">🎉</div>
    <div class="success-title">No Conflicts Found!</div>
    <div class="success-subtitle">
      All dependencies in ${projectName} v${projectVersion} are healthy
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${totalDeps}</div>
        <div class="stat-label">Dependencies</div>
      </div>
      <div class="stat">
        <div class="stat-value">0</div>
        <div class="stat-label">Issues</div>
      </div>
      <div class="stat">
        <div class="stat-value">✓</div>
        <div class="stat-label">All Healthy</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateConflictLayoutHTML
};