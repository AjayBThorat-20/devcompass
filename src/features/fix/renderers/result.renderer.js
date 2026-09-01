// src/features/fix/renderers/result.renderer.js

const chalk = require('chalk');

function renderFixResult(executor, beforeScore, afterScore) {
  const summary = executor.getSummary();
  const line = '━'.repeat(60);

  console.log('');
  console.log(chalk.dim(line));
  console.log(chalk.bold.green('✅ Fix Complete'));
  console.log(chalk.dim(line));
  console.log('');

  console.log(chalk.green(`✔ ${summary.successful} package(s) fixed`));
  if (summary.failed > 0) console.log(chalk.red(`✗ ${summary.failed} fix(es) failed`));
  if (summary.skipped > 0) console.log(chalk.yellow(`⚠️ ${summary.skipped} issue(s) require manual action`));

  console.log('');

  if (beforeScore !== undefined && afterScore !== undefined) {
    const improvement = afterScore - beforeScore;
    const arrow = improvement > 0 ? '↑' : improvement < 0 ? '↓' : '→';
    const color = improvement > 0 ? 'green' : improvement < 0 ? 'red' : 'gray';
    console.log(chalk[color](`🧠 Health Score: ${beforeScore.toFixed(1)} ${arrow} ${afterScore.toFixed(1)} (${improvement > 0 ? '+' : ''}${improvement.toFixed(1)})`));
    console.log('');
  }

  if (executor.results.failed.length > 0) {
    console.log(chalk.bold.red('Failed Fixes:\n'));
    executor.results.failed.forEach((fail, i) => {
      console.log(chalk.red(`${i + 1}. ${fail.package}`));
      console.log(chalk.gray(`   Error: ${fail.error}`));
      console.log('');
    });
  }

  console.log(chalk.bold('Next Steps:\n'));
  console.log(chalk.cyan('→ Run: ') + chalk.white('depvora analyze'));
  console.log(chalk.cyan('→ Or open dashboard: ') + chalk.white('depvora graph'));
  console.log('');
}

module.exports = { renderFixResult };