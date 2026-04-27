// src/ai/prompt-templates.js

const SYSTEM_PROMPTS = {
  /**
   * System prompt for analyze command
   */
  analyze: `You are DevCompass AI. Give SHORT, actionable insights.

Rules:
- Maximum 3-4 sentences per issue
- Focus ONLY on critical items
- Provide specific commands
- No long explanations

Be direct and concise.`,

  /**
   * System prompt for recommendations
   */
  recommend: `You are DevCompass AI. Provide a SHORT prioritized list.

FORMAT (keep it brief):

🔴 CRITICAL (1-2 items max):
- [Issue name]: [One sentence why] → [Command]

🟡 HIGH (1-2 items max):
- [Issue name]: [One sentence why] → [Command]

🟢 MEDIUM (1-2 items max):
- [Issue name]: [One sentence why] → [Command]

Keep EACH item to ONE line. No long paragraphs.`,

  /**
   * System prompt for alternatives
   */
  alternatives: `You are DevCompass AI. List exactly 3 alternatives. Be BRIEF.

Format:
1. **[Package]** (~[size]KB): [One sentence]
2. **[Package]** (~[size]KB): [One sentence]
3. **[Package]** (~[size]KB): [One sentence]

Recommendation: Use [package name]

Migration (5 lines max):
\`\`\`javascript
// Brief example
\`\`\`

NO long explanations. Keep it SHORT.`,

  /**
   * System prompt for Q&A
   */
  qa: `You are DevCompass AI. Answer in 2-4 sentences MAX.

Rules:
- Be direct and specific
- Use data from the project analysis
- Provide ONE command if applicable
- NO long explanations

Keep responses SHORT and actionable.`,

  /**
   * System prompt for chat
   */
  chat: `You are DevCompass AI. Keep responses SHORT (2-4 sentences).

Rules:
- Answer directly, no fluff
- Use project data when available
- Provide specific commands
- Be conversational but concise

Maximum 4 sentences per response.`
};

/**
 * Build context from analysis results - OPTIMIZED
 */
function buildAnalysisContext(analysisData) {
  // Handle both direct results and wrapped data
  const results = analysisData.results || analysisData;
  const metadata = analysisData.metadata || {};

  // Safety check
  if (!results) {
    return 'No analysis data available.';
  }

  const context = {
    projectName: metadata.projectName || results.projectName || 'Unknown',
    healthScore: results.healthScore || 0,
    totalDependencies: results.dependencies?.length || results.totalDependencies || 0,
    dependencies: results.dependencies || [],
    vulnerabilities: results.vulnerabilities || [],
    outdated: results.outdated || [],
    unused: results.unused || [],
    ecosystemAlerts: results.ecosystemAlerts || []
  };

  const parts = [];

  parts.push(`Project: ${context.projectName}`);
  parts.push(`Health: ${context.healthScore.toFixed(1)}/10`);
  parts.push(`Dependencies: ${context.totalDependencies}\n`);

  // Security vulnerabilities (brief)
  if (context.vulnerabilities.length > 0) {
    const bySeverity = {
      critical: context.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: context.vulnerabilities.filter(v => v.severity === 'high').length,
      moderate: context.vulnerabilities.filter(v => v.severity === 'moderate').length,
      low: context.vulnerabilities.filter(v => v.severity === 'low').length
    };

    parts.push(`VULNERABILITIES: ${context.vulnerabilities.length} total`);
    if (bySeverity.critical) parts.push(`  Critical: ${bySeverity.critical}`);
    if (bySeverity.high) parts.push(`  High: ${bySeverity.high}`);
    if (bySeverity.moderate) parts.push(`  Moderate: ${bySeverity.moderate}`);
    if (bySeverity.low) parts.push(`  Low: ${bySeverity.low}`);
    parts.push('');
  }

  // Outdated packages (top 5 only)
  if (context.outdated.length > 0) {
    parts.push(`OUTDATED: ${context.outdated.length}`);
    context.outdated.slice(0, 5).forEach(pkg => {
      const current = pkg.current || pkg.version;
      const latest = pkg.latest || pkg.wanted;
      parts.push(`  ${pkg.name}: ${current} → ${latest}`);
    });
    if (context.outdated.length > 5) {
      parts.push(`  ... and ${context.outdated.length - 5} more`);
    }
    parts.push('');
  }

  // Unused (brief list)
  if (context.unused.length > 0) {
    const unusedList = context.unused.map(pkg => 
      typeof pkg === 'string' ? pkg : pkg.name
    ).join(', ');
    parts.push(`UNUSED: ${unusedList}\n`);
  }

  // Ecosystem alerts (top 3 only)
  if (context.ecosystemAlerts.length > 0) {
    parts.push(`ALERTS: ${context.ecosystemAlerts.length}`);
    context.ecosystemAlerts.slice(0, 3).forEach(alert => {
      parts.push(`  ${alert.package || alert.name}: ${(alert.issue || alert.message).substring(0, 50)}...`);
    });
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Build context from snapshot comparison
 */
function buildComparisonContext(comparison) {
  return `
SNAPSHOT COMPARISON:
From: Snapshot #${comparison.snapshot1.id} (${comparison.snapshot1.timestamp})
To: Snapshot #${comparison.snapshot2.id} (${comparison.snapshot2.timestamp})

HEALTH SCORE CHANGE:
${comparison.snapshot1.healthScore}/10 → ${comparison.snapshot2.healthScore}/10 (${comparison.healthDelta > 0 ? '+' : ''}${comparison.healthDelta})

CHANGES:
- Added Packages: ${comparison.added.length}
- Removed Packages: ${comparison.removed.length}
- Updated Packages: ${comparison.updated.length}

DETAILS:
${JSON.stringify(comparison, null, 2)}
`;
}

/**
 * Build context from timeline
 */
function buildTimelineContext(timeline) {
  return `
TIMELINE ANALYSIS:
Period: ${timeline.period}
Total Snapshots: ${timeline.snapshots.length}

TRENDS:
- Health Score: ${timeline.trend.direction} (${timeline.trend.percentage}%)
- Average Health: ${timeline.averageHealth}/10
- Dependency Growth: ${timeline.dependencyGrowth}

TIMELINE DATA:
${JSON.stringify(timeline, null, 2)}
`;
}

module.exports = {
  SYSTEM_PROMPTS,
  buildAnalysisContext,
  buildComparisonContext,
  buildTimelineContext
};