// src/utils/ci-handler.js
const chalk = require('chalk');

/**
 * Handle CI mode - exit with error code if score below threshold
 */
function handleCiMode(score, config, alerts, unusedDeps) {
  const minScore = config.minScore || 7;
  
  if (score.total < minScore) {
    console.log(chalk.red(`\n❌ CI CHECK FAILED`));
    console.log(chalk.red(`Health score ${score.total}/10 is below minimum ${minScore}/10\n`));
    
    // Show critical issues
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    
    if (criticalAlerts.length > 0) {
      console.log(chalk.red(`Critical issues: ${criticalAlerts.length}`));
    }
    
    if (unusedDeps.length > 0) {
      console.log(chalk.yellow(`Unused dependencies: ${unusedDeps.length}`));
    }
    
    process.exit(1); // Fail CI
  } else {
    console.log(chalk.green(`\n✅ CI CHECK PASSED`));
    console.log(chalk.green(`Health score ${score.total}/10 meets minimum ${minScore}/10\n`));
    process.exit(0);
  }
}

module.exports = { handleCiMode };