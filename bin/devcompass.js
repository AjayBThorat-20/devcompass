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
  .description('Dependency health checker with ecosystem intelligence')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
  `);

// Analyze command
program
  .command('analyze')
  .description('Analyze your project dependencies')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--json', 'Output results as JSON')
  .option('--ci', 'CI mode - exit with error code if score below threshold')
  .option('--silent', 'Silent mode - no output')
  .action(analyze);

// Fix command with batch mode support
program
  .command('fix')
  .description('Fix issues automatically (remove unused, update safe packages)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--dry', 'Alias for --dry-run')
  .option('--batch', 'Interactive batch mode - select which categories to fix')
  .option('--batch-mode <mode>', 'Preset batch mode: critical, high, all')
  .option('--only <categories>', 'Fix only specific categories (comma-separated: supply-chain,license,quality,security,ecosystem,unused,updates)')
  .option('--skip <categories>', 'Skip specific categories (comma-separated)')
  .option('--verbose', 'Show detailed output')
  .addHelpText('after', `

${chalk.bold('Batch Mode Examples:')}
  ${chalk.cyan('devcompass fix --batch')}                    Interactive batch selection
  ${chalk.cyan('devcompass fix --batch-mode critical')}      Fix critical issues only
  ${chalk.cyan('devcompass fix --batch-mode high')}          Fix high-priority issues
  ${chalk.cyan('devcompass fix --batch-mode all')}           Fix all safe issues
  ${chalk.cyan('devcompass fix --only supply-chain,license')} Fix specific categories
  ${chalk.cyan('devcompass fix --skip updates')}             Skip updates category

${chalk.bold('Available Categories:')}
  ${chalk.red('supply-chain')} - Malicious packages, typosquatting
  ${chalk.yellow('license')}      - GPL/AGPL/LGPL conflicts
  ${chalk.blue('quality')}      - Abandoned/deprecated packages
  ${chalk.red('security')}     - npm audit vulnerabilities
  ${chalk.yellow('ecosystem')}    - Known package issues
  ${chalk.cyan('unused')}       - Unused dependencies
  ${chalk.green('updates')}      - Safe version updates
  `)
  .action(fix);

// Backup command
program
  .command('backup <action>')
  .description('Manage backups (list, restore, clean, info)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-n, --name <name>', 'Backup name (for restore/info commands)')
  .option('-f, --force', 'Skip confirmation prompts', false)
  .option('--keep <number>', 'Number of backups to keep (for clean command)', parseInt, 5)
  .addHelpText('after', `

${chalk.bold('Backup Examples:')}
  ${chalk.cyan('devcompass backup list')}                          List all backups
  ${chalk.cyan('devcompass backup restore --name <backup-name>')}  Restore from backup
  ${chalk.cyan('devcompass backup info --name <backup-name>')}     Show backup details
  ${chalk.cyan('devcompass backup clean')}                         Remove old backups (keeps 5)
  ${chalk.cyan('devcompass backup clean --keep 3')}                Keep only 3 backups
  `)
  .action((action, options) => {
    backup(action, options);
  });

  // Graph command
program
  .command('graph')
  .description('Generate dependency graph visualization')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <file>', 'Output file', 'dependency-graph.html')
  .option('-f, --format <format>', 'Output format: html, svg, json, png')
  .option('-l, --layout <type>', 'Layout: tree, force, radial, conflict', 'tree')
  .option('-d, --depth <number>', 'Maximum depth to traverse', parseInt, Infinity)
  .option('--filter <filter>', 'Filter: all, vulnerable, outdated, unused', 'all')
  .option('-w, --width <number>', 'Graph width in pixels', parseInt, 1200)
  .option('-h, --height <number>', 'Graph height in pixels', parseInt, 800)
  .option('--open', 'Open in browser (HTML only)', false)
  .action(async (options) => {
    const graphCommand = require('../src/commands/graph');
    await graphCommand(options);
  });
  
program.parse();