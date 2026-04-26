#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { analyze } = require('../src/commands/analyze');
const fix = require('../src/commands/fix');
const backup = require('../src/commands/backup');
const config = require('../src/commands/config');
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
  .option('--no-history', 'Skip saving snapshot to history database')
  .addHelpText('after', `

${chalk.bold('Analysis Examples:')}
  ${chalk.cyan('devcompass analyze')}                 Analyze current project & save snapshot
  ${chalk.cyan('devcompass analyze --no-history')}    Analyze without saving to history
  ${chalk.cyan('devcompass analyze --json')}          Output as JSON
  ${chalk.cyan('devcompass analyze --ci')}            CI mode with exit codes

${chalk.bold('History Tracking:')}
  • Snapshots auto-saved to SQLite database
  • Compare changes over time
  • View dependency evolution
  • Use ${chalk.cyan('--no-history')} to disable
  `)
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

// ===========================
// NEW v3.2.1 - History command with FLEXIBLE DATE FORMATS
// ===========================
program
  .command('history <subcommand>')
  .description('Manage analysis history and snapshots')
  .option('--limit <number>', 'Limit number of results', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('--keep <number>', 'Number of snapshots to keep (cleanup only)', parseInt, 30)
  // ✅ UPDATED: Flexible date filtering options
  .option('--date <date>', 'Specific date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--from <date>', 'Start date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--to <date>', 'End date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--after <date>', 'After date (alias for --from)')
  .option('--before <date>', 'Before date (alias for --to)')
  .option('--month <month>', 'Specific month (MM-YYYY or YYYY-MM)')
  .option('--year <year>', 'Specific year (YYYY)')
  .addHelpText('after', `

${chalk.bold('History Subcommands:')}
  ${chalk.cyan('list')}      List all saved snapshots
  ${chalk.cyan('show')}      Show snapshot details
  ${chalk.cyan('summary')}   Show monthly summary
  ${chalk.cyan('cleanup')}   Delete old snapshots
  ${chalk.cyan('stats')}     Show history statistics

${chalk.bold('📅 Supported Date Formats:')}
  ${chalk.cyan('DD-MM-YYYY')}    Day: ${chalk.white('25-04-2026')} ${chalk.dim('(April 25, 2026)')}
  ${chalk.cyan('MM-YYYY')}       Month: ${chalk.white('04-2026')} ${chalk.dim('(April 2026)')}
  ${chalk.cyan('YYYY')}          Year: ${chalk.white('2026')} ${chalk.dim('(Full year 2026)')}
  ${chalk.cyan('YYYY-MM-DD')}    ISO date: ${chalk.white('2026-04-25')} ${chalk.dim('(April 25, 2026)')}
  ${chalk.cyan('YYYY-MM')}       ISO month: ${chalk.white('2026-04')} ${chalk.dim('(April 2026)')}

${chalk.bold('Basic Examples:')}
  ${chalk.gray('devcompass history list')}                     List all snapshots
  ${chalk.gray('devcompass history list --limit 50')}          List last 50 snapshots
  ${chalk.gray('devcompass history show 5')}                   Show snapshot #5 details
  ${chalk.gray('devcompass history summary')}                  Monthly breakdown
  ${chalk.gray('devcompass history cleanup --keep 20')}        Keep only last 20 snapshots
  ${chalk.gray('devcompass history stats')}                    Show overall statistics

${chalk.bold('Date Filtering Examples:')}
  ${chalk.gray('devcompass history list --date 25-04-2026')}           ${chalk.dim('# Specific day')}
  ${chalk.gray('devcompass history list --month 04-2026')}             ${chalk.dim('# Specific month')}
  ${chalk.gray('devcompass history list --year 2026')}                 ${chalk.dim('# Specific year')}
  ${chalk.gray('devcompass history list --from 01-04-2026 --to 30-04-2026')}  ${chalk.dim('# Date range')}
  ${chalk.gray('devcompass history list --after 15-04-2026')}          ${chalk.dim('# After date')}
  ${chalk.gray('devcompass history summary --year 2026')}              ${chalk.dim('# Year summary')}

${chalk.bold('Advanced Features:')}
  • Auto-groups snapshots by month when >20 results
  • Shows average health per month in grouped view
  • Filters work with all subcommands (list, summary)
  • Combine --project and date filters for targeted queries
  • Supports both European (DD-MM-YYYY) and ISO (YYYY-MM-DD) formats

${chalk.bold('Database Location:')}
  ${chalk.dim('~/.devcompass/history.db')}

${chalk.bold('Note:')}
  Snapshots are automatically saved when running ${chalk.cyan('devcompass analyze')}
  Use ${chalk.cyan('--no-history')} flag to skip snapshot saving
  `)
  .action(async (subcommand, options) => {
    const historyCommand = require('../src/commands/history');
    await historyCommand({ ...options, _: ['history', subcommand] });
  });

// NEW v3.2.1 - Compare command
program
  .command('compare <id1> <id2>')
  .description('Compare two analysis snapshots')
  .option('-o, --output <file>', 'Save comparison report to file')
  .option('--verbose', 'Show detailed comparison', false)
  .addHelpText('after', `

${chalk.bold('Compare Examples:')}
  ${chalk.cyan('devcompass compare 5 8')}                    Compare snapshots #5 and #8
  ${chalk.cyan('devcompass compare 5 8 --verbose')}          Detailed comparison
  ${chalk.cyan('devcompass compare 5 8 -o report.md')}       Save to markdown file

${chalk.bold('What Gets Compared:')}
  • Added/removed packages
  • Version changes
  • Health score changes
  • Vulnerability status changes
  • Deprecated status changes

${chalk.bold('Workflow:')}
  1. Run ${chalk.cyan('devcompass history list')} to see snapshot IDs
  2. Choose two snapshots to compare
  3. Run ${chalk.cyan('devcompass compare <id1> <id2>')}
  4. View side-by-side diff with changes highlighted
  `)
  .action(async (id1, id2, options) => {
    const compareCommand = require('../src/commands/compare');
    await compareCommand({ ...options, _: ['compare', id1, id2] });
  });

// NEW v3.2.1 - Timeline command
program
  .command('timeline')
  .description('View dependency evolution timeline')
  .option('--days <number>', 'Number of days to include', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('-o, --open', 'Open interactive timeline in browser', false)
  .option('--output <file>', 'Output file path', 'devcompass-timeline.html')
  .addHelpText('after', `

${chalk.bold('Timeline Examples:')}
  ${chalk.cyan('devcompass timeline')}                Show last 30 days
  ${chalk.cyan('devcompass timeline --days 60')}      Show last 60 days
  ${chalk.cyan('devcompass timeline --open')}         Open interactive chart
  ${chalk.cyan('devcompass timeline --days 90 --open')} 90-day interactive timeline

${chalk.bold('Timeline Visualizations:')}
  • Health score trend over time
  • Dependency count changes
  • Vulnerability trends
  • Package quality evolution

${chalk.bold('Interactive Features:')}
  • Zoom and pan
  • Click points for details
  • Compare date ranges
  • Export as PNG

${chalk.bold('Note:')}
  Timeline requires multiple snapshots over time
  Run ${chalk.cyan('devcompass analyze')} regularly to build history
  `)
  .action(async (options) => {
    const timelineCommand = require('../src/commands/timeline');
    await timelineCommand(options);
  });

// Config command
program
  .command('config')
  .description('Configure DevCompass settings')
  .option('--github-token <token>', 'Set GitHub Personal Access Token')
  .option('--remove-github-token', 'Remove GitHub token')
  .option('--show', 'Show current configuration')
  .addHelpText('after', `

${chalk.bold('GitHub Token Configuration:')}
  ${chalk.cyan('devcompass config --github-token <token>')}  Set GitHub token
  ${chalk.cyan('devcompass config --show')}                  Show current token (masked)
  ${chalk.cyan('devcompass config --remove-github-token')}   Remove GitHub token

${chalk.bold('Why Configure a Token?')}
  • Avoid GitHub API rate limits (60 → 5,000 requests/hour)
  • Enable full package health monitoring
  • Track 500+ popular npm packages

${chalk.bold('How to Get a Token:')}
  1. Go to: ${chalk.cyan('https://github.com/settings/tokens/new')}
  2. Select: "Classic" token
  3. Description: "DevCompass CLI"
  4. Expiration: 90 days (or your preference)
  5. Scopes: Select "${chalk.green('public_repo')}" (read access only)
  6. Click "Generate token"
  7. Copy the token (starts with ghp_)
  8. Run: ${chalk.cyan('devcompass config --github-token <your-token>')}

${chalk.bold('Security:')}
  • Token stored locally in ${chalk.dim('~/.devcompass/github-token')}
  • Only you have access to this file
  • Never committed to git
  • Optional - DevCompass works without it (with rate limits)
  `)
  .action(config);
  
program.parse();