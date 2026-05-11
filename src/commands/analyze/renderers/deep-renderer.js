const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');
const { getTopIssues, createRanker } = require('../../../core/services/issue-ranker');

function renderDeepOutput(issues, metadata) {
  const topIssues = getTopIssues(issues, 3);
  const ranker = createRanker(issues);
  const grouped = ranker.groupByType();
  
  ConsoleFormatter.header('DevCompass Deep Analysis v3.2.5', metadata.projectInfo);
  
  if (metadata.healthScore !== undefined) {
    ConsoleFormatter.healthScore(metadata.healthScore);
  }

  if (topIssues.length > 0) {
    ConsoleFormatter.section('🔥 Top Issues', topIssues.length);
    ConsoleFormatter.issueList(topIssues);
  }

  if (grouped.security && grouped.security.length > 0) {
    ConsoleFormatter.section('🛡️ Security Issues', grouped.security.length);
    ConsoleFormatter.issueList(grouped.security, 10);
  }

  if (grouped.license && grouped.license.length > 0) {
    ConsoleFormatter.section('⚖️ License Risks', grouped.license.length);
    ConsoleFormatter.issueList(grouped.license, 10);
  }

  if (grouped.quality && grouped.quality.length > 0) {
    ConsoleFormatter.section('📦 Quality Issues', grouped.quality.length);
    ConsoleFormatter.issueList(grouped.quality, 10);
  }

  if (grouped.outdated && grouped.outdated.length > 0) {
    ConsoleFormatter.section('⬆️ Outdated Packages', grouped.outdated.length);
    ConsoleFormatter.issueList(grouped.outdated, 10);
  }

  if (grouped.unused && grouped.unused.length > 0) {
    ConsoleFormatter.section('🧹 Unused Dependencies', grouped.unused.length);
    ConsoleFormatter.issueList(grouped.unused, 10);
  }

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

  const actions = [
    { icon: '✔', label: 'Fix safe issues', command: 'devcompass fix --safe' },
    { icon: '⚠️', label: 'Fix all issues', command: 'devcompass fix --all' },
    { icon: '📊', label: 'Open dashboard', command: 'devcompass graph' },
    { icon: '💾', label: 'Export JSON', command: 'devcompass analyze --json' }
  ];
  
  ConsoleFormatter.actions(actions);
}

module.exports = { renderDeepOutput };