#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');
const logger = require('../src/shared/utils/logger').default;

// CL-08: --verbose (or DEBUG=1) should raise the log level before any
// subcommand action runs. Checked directly against argv (rather than only
// via a Commander preAction hook) so it also takes effect on paths that
// exit before Commander's action lifecycle runs, e.g. `--version`.
// Root-level flag is `--verbose` only (no `-v`) since `-v` is already bound
// to `--version` below, and some subcommands (fix, ai, compare, snapshot)
// declare their own local `-v/--verbose` for bespoke logic.
if (process.argv.includes('--verbose')) {
  logger.setLevel('debug');
}

const program = new Command();

program
  .name('devcompass')
  .description('Checks npm dependencies for vulnerabilities, license risks, unused and outdated packages, with a CI gate')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .option('--verbose', 'Enable verbose/debug logging (same as DEBUG=1)')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
${chalk.gray('Docs:')}   ${chalk.cyan('https://devcompass.ajaythorat.com')}
  `);

require('../src/cli/commands/analyze.cmd')(program);
require('../src/cli/commands/baseline.cmd')(program);
require('../src/cli/commands/fix.cmd')(program);
require('../src/cli/commands/backup.cmd')(program);
require('../src/cli/commands/graph.cmd')(program);
require('../src/cli/commands/why.cmd')(program);
require('../src/cli/commands/history.cmd')(program);
require('../src/cli/commands/compare.cmd')(program);
require('../src/cli/commands/snapshot.cmd')(program);
require('../src/cli/commands/timeline.cmd')(program);
require('../src/cli/commands/cve.cmd')(program);
require('../src/cli/commands/llm.cmd')(program);
require('../src/cli/commands/ai.cmd')(program);
require('../src/cli/commands/config.cmd')(program);
require('../src/cli/commands/clean.cmd')(program);

if (process.argv.length === 2) {
  (async () => {
    try {
      const { runAnalyze } = require('../src/features/analyze');
      await runAnalyze({ mode: 'default' });
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      logger.debug(error.stack);
      process.exit(1);
    }
  })();
} else {
  program.parse(process.argv);
}