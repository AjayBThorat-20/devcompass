// src/shared/utils/ci-handler.js

const chalk = require('chalk');

function handleCiMode(score, config, alerts, unusedDeps) {
  const minScore = config?.minScore || 7;
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeUnused = Array.isArray(unusedDeps) ? unusedDeps : [];

  if (score.total < minScore) {
    console.log(chalk.red(`\n❌ CI CHECK FAILED`));
    console.log(chalk.red(`Health score ${score.total}/10 is below minimum ${minScore}/10\n`));

    const criticalAlerts = safeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    if (criticalAlerts.length > 0) console.log(chalk.red(`Critical issues: ${criticalAlerts.length}`));
    if (safeUnused.length > 0) console.log(chalk.yellow(`Unused dependencies: ${safeUnused.length}`));

    process.exit(1);
  } else {
    console.log(chalk.green(`\n✅ CI CHECK PASSED`));
    console.log(chalk.green(`Health score ${score.total}/10 meets minimum ${minScore}/10\n`));
    process.exit(0);
  }
}

module.exports = { handleCiMode };