// src/features/analyze/renderers/deep.renderer.js

const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');
const { getTopIssues, createRanker } = require('../../../core/services/issue-ranker');
const { version } = require('../../../../package.json');

function renderDeepOutput(issues, metadata) {
  const topIssues = getTopIssues(issues, 3);
  const ranker = createRanker(issues);
  const grouped = ranker.groupByType();

  ConsoleFormatter.header(`DevCompass Deep Analysis v${version}`, metadata.projectInfo);

  if (metadata.healthScore !== undefined) ConsoleFormatter.healthScore(metadata.healthScore);

  if (topIssues.length > 0) {
    ConsoleFormatter.section('🔥 Top Issues', topIssues.length);
    ConsoleFormatter.issueList(topIssues);
  }

  const sections = [
    { key: 'security', label: '🛡️ Security Issues' },
    { key: 'license', label: '⚖️ License Risks' },
    { key: 'quality', label: '📦 Quality Issues' },
    { key: 'outdated', label: '⬆️ Outdated Packages' },
    { key: 'unused', label: '🧹 Unused Dependencies' }
  ];

  sections.forEach(({ key, label }) => {
    if (grouped[key] && grouped[key].length > 0) {
      ConsoleFormatter.section(label, grouped[key].length);
      ConsoleFormatter.issueList(grouped[key], 10);
    }
  });

  ConsoleFormatter.section('📊 Summary');
  const stats = ranker.getStats();
  ConsoleFormatter.summary(stats);

  console.log('');
  console.log(`Total Issues: ${stats.total}`);
  console.log(`Safe Fixes Available: ${stats.safeFixes}`);
  console.log(`Risky Fixes: ${stats.riskyFixes}`);
  console.log('');

  if (metadata.aiInsight) {
    ConsoleFormatter.section('🤖 AI Analysis');
    console.log(metadata.aiInsight);
    console.log('');
  }

  ConsoleFormatter.actions([
    { icon: '✔', label: 'Fix safe issues', command: 'devcompass fix' },
    { icon: '⚠️', label: 'Fix all issues', command: 'devcompass fix --all' },
    { icon: '📊', label: 'Open dashboard', command: 'devcompass graph' },
    { icon: '💾', label: 'Export JSON', command: 'devcompass analyze --json' }
  ]);
}

module.exports = { renderDeepOutput };