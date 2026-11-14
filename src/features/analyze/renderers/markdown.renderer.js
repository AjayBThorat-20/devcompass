// src/features/analyze/renderers/markdown.renderer.js
//
// FT-03: Markdown output for pull request comments and $GITHUB_STEP_SUMMARY.
// A short table of findings and the score, not the full --deep report.

function renderMarkdownOutput(issues, metadata) {
  const lines = [];
  const score = typeof metadata.healthScore === 'number' ? metadata.healthScore.toFixed(1) : 'n/a';

  lines.push(`## DevCompass report for ${metadata.projectInfo || metadata.projectName || 'this project'}`);
  lines.push('');
  lines.push(`**Health score:** ${score} / 10`);
  lines.push('');

  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  issues.forEach(i => { if (bySeverity[i.severity] !== undefined) bySeverity[i.severity]++; });
  lines.push(`🔴 Critical: ${bySeverity.CRITICAL} · 🟠 High: ${bySeverity.HIGH} · 🟡 Medium: ${bySeverity.MEDIUM} · ⚪ Low: ${bySeverity.LOW}`);
  lines.push('');

  if (issues.length === 0) {
    lines.push('No issues found. ✅');
  } else {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sorted = [...issues].sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));
    const top = sorted.slice(0, 20);

    lines.push('| Severity | Package | Type | Message | Fix |');
    lines.push('|---|---|---|---|---|');
    top.forEach(issue => {
      const pkg = `${issue.name || 'unknown'}@${issue.version || 'unknown'}`;
      const message = (issue.message || '').replace(/\|/g, '\\|');
      const fix = (issue.fix || '').replace(/\|/g, '\\|');
      lines.push(`| ${issue.severity || ''} | \`${pkg}\` | ${issue.type || ''} | ${message} | ${fix} |`);
    });
    if (issues.length > top.length) lines.push('');
    if (issues.length > top.length) lines.push(`_...and ${issues.length - top.length} more. Run \`devcompass analyze --deep\` for the full report._`);
  }

  lines.push('');
  lines.push('Full reference: https://devcompass.ajaythorat.com');

  console.log(lines.join('\n'));
}

module.exports = { renderMarkdownOutput };
