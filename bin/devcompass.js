#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { analyze } = require('../src/commands/analyze');
const { fix } = require('../src/commands/fix');
const packageJson = require('../package.json');

// Check if running from local node_modules
const isLocalInstall = __dirname.includes('node_modules');
if (isLocalInstall && process.argv.includes('analyze')) {
  console.log(chalk.yellow('\n⚠️  DevCompass is installed locally as a dependency.'));
  console.log(chalk.yellow('   For best results, install globally:'));
  console.log(chalk.cyan('   npm install -g devcompass\n'));
}

const program = new Command();

program
  .name('devcompass')
  .description('Health check for your JavaScript project')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
  `);

program
  .command('analyze')
  .description('Analyze your project dependencies')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--json', 'Output results as JSON')
  .option('--ci', 'CI mode - exit with error code if score below threshold')
  .option('--silent', 'Silent mode - no output')
  .action(analyze);

program
  .command('fix')
  .description('Fix issues automatically (remove unused, update safe packages)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .action(fix);

program.parse();

