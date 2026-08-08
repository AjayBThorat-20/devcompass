#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

const isLocalInstall = __dirname.includes('node_modules');
if (isLocalInstall && process.argv.includes('analyze')) {
  console.log(chalk.yellow('\n⚠️  DevCompass is installed locally.'));
  console.log(chalk.cyan('   npm install -g devcompass\n'));
}

const program = new Command();

program
  .name('devcompass')
  .description('Dependency health checker with AI-powered insights & CVE detection')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
${chalk.gray(`New in v${packageJson.version}:`)} 🔒 Dependency security update (axios, form-data)
  `);

require('../src/cli/commands/analyze.cmd')(program);
require('../src/cli/commands/fix.cmd')(program);
require('../src/cli/commands/backup.cmd')(program);
require('../src/cli/commands/graph.cmd')(program);
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
      if (process.env.DEBUG) console.error(error.stack);
      process.exit(1);
    }
  })();
} else {
  program.parse(process.argv);
}