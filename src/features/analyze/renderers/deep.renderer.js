// src/features/analyze/renderers/deep.renderer.js

const chalk = require('chalk');
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

  if (metadata.installScripts && metadata.installScripts.length > 0) {
    ConsoleFormatter.section('ℹ️  Packages that run code during install', metadata.installScripts.length);
    metadata.installScripts.forEach(s => console.log(`   ${s.package}@${s.version}${s.direct ? '' : chalk.gray(' (transitive)')}`));
    console.log(chalk.gray('\n   Not a vulnerability by itself — but where a compromised release would run its code.'));
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