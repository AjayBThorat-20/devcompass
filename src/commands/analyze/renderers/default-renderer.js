const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');
const { getTopIssues } = require('../../../core/services/issue-ranker');

function renderDefaultOutput(issues, metadata) {
  const topIssues = getTopIssues(issues, 3);
  
  ConsoleFormatter.header('DevCompass v3.2.5', metadata.projectInfo);
  
  if (metadata.healthScore !== undefined) {
    ConsoleFormatter.healthScore(metadata.healthScore);
  }

  if (topIssues.length > 0) {
    ConsoleFormatter.section('🔥 Top Issues', topIssues.length);
    ConsoleFormatter.issueList(topIssues);
  } else {
    console.log('');
    ConsoleFormatter.box('✅ No critical issues found!\n\nYour dependencies look healthy.', '🎉 Great News');
    console.log('');
  }

  ConsoleFormatter.section('📊 Summary');
  const stats = calculateStats(issues);
  ConsoleFormatter.summary(stats);

  if (metadata.aiInsight) {
    console.log('');
    ConsoleFormatter.section('🤖 AI Insight');
    console.log(metadata.aiInsight);
    console.log('');
  }

  const actions = [
    { icon: '✔', label: 'Fix safe issues', command: 'devcompass fix --safe' },
    { icon: '🔍', label: 'See full report', command: 'devcompass analyze --deep' },
    { icon: '📊', label: 'Open dashboard', command: 'devcompass graph' }
  ];
  
  if (issues.length > 0) {
    ConsoleFormatter.actions(actions);
  }
}

function calculateStats(issues) {
  return {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    high: issues.filter(i => i.severity === 'HIGH').length,
    medium: issues.filter(i => i.severity === 'MEDIUM').length,
    low: issues.filter(i => i.severity === 'LOW').length
  };
}

module.exports = { renderDefaultOutput };