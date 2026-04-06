#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { analyze } = require('../src/commands/analyze');
const fix = require('../src/commands/fix');
const backup = require('../src/commands/backup');
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
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--dry', 'Alias for --dry-run')
  .action(fix);

// ✅ FIXED: Backup command with proper options handling
program
  .command('backup <action>')
  .description('Manage backups (list, restore, clean, info)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-n, --name <name>', 'Backup name (for restore/info commands)')
  .option('-f, --force', 'Skip confirmation prompts', false)
  .option('--keep <number>', 'Number of backups to keep (for clean command)', parseInt, 5)
  .action((action, options) => {
    backup(action, options);
  });

program.parse();