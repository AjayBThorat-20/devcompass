// src/cli/commands/baseline.cmd.js
//
// `devcompass baseline save` records today's findings so
// `devcompass analyze --baseline --fail-on high` only fails on new ones.

const chalk = require('chalk');
const logger = require('../../shared/utils/logger').default;

module.exports = function registerBaselineCommand(program) {
  program
    .command('baseline [action]')
    .description('Record today\'s findings so --baseline gates only fail on new ones (save | show)')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('--offline', 'Run only the local checks (needs --allow-incomplete to save)')
    .option('--allow-incomplete', 'Save even if some checks could not complete')
    .action(async (action, options) => {
      const projectPath = options.path;
      const { saveBaseline, loadBaseline, BASELINE_FILENAME } = require('../../core/services/baseline');

      try {
        if (!action || action === 'save') {
          const { runAnalyze } = require('../../features/analyze');
          const result = await runAnalyze({ projectPath, mode: 'silent', silent: true, saveHistory: false, offline: !!options.offline });

          // A finding a partial scan missed would look "new" on the next
          // full run and fail the gate, so a partial baseline is opt-in.
          const incomplete = [
            ...Object.entries(result.metadata.scanIncomplete || {}).filter(([, value]) => value).map(([id]) => id),
            ...(result.metadata.skippedChecks || [])
          ];
          if (incomplete.length > 0 && !options.allowIncomplete) {
            console.error(chalk.red(`\n❌ Not saved: the ${incomplete.join(', ')} check${incomplete.length > 1 ? 's' : ''} didn't complete.`));
            console.error(chalk.gray('   Anything those checks would have found would look new on the next run. Retry, or pass --allow-incomplete.\n'));
            process.exitCode = 1;
            return;
          }

          const data = saveBaseline(result.issues, projectPath);
          console.log(chalk.green(`\n✔ Saved ${data.findings.length} finding(s) to ${BASELINE_FILENAME}`));
          if (incomplete.length > 0) console.log(chalk.yellow(`  (without the ${incomplete.join(', ')} check${incomplete.length > 1 ? 's' : ''})`));
          console.log(chalk.gray('  Commit it, then gate CI with: devcompass analyze --baseline --fail-on high\n'));
          return;
        }

        if (action === 'show') {
          const data = loadBaseline(projectPath);
          if (!data) {
            console.log(chalk.yellow('\n⚠️  No baseline yet. Run: devcompass baseline save\n'));
            return;
          }
          console.log(chalk.bold.cyan(`\n📌 Baseline saved ${data.savedAt}: ${data.findings.length} finding(s)\n`));
          data.findings.forEach(finding => console.log(`  ${chalk.gray('•')} ${finding.id}${finding.severity ? chalk.gray(` (${finding.severity})`) : ''}`));
          console.log('');
          return;
        }

        console.error(chalk.red(`\n❌ Unknown baseline action "${action}". Use: devcompass baseline save | show\n`));
        process.exitCode = 1;
      } catch (error) {
        console.error(chalk.red('\n❌ Baseline command failed:'), error.message);
        logger.debug(error.stack);
        process.exitCode = 1;
      }
    });
};
