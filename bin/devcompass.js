#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

const isLocalInstall = __dirname.includes('node_modules');
if (isLocalInstall && process.argv.includes('analyze')) {
  console.log(chalk.yellow('\n⚠️  DevCompass is installed locally as a dependency.'));
  console.log(chalk.yellow('   For best results, install globally:'));
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
${chalk.gray('New in v3.2.6:')} 🚀 Architecture improvements & performance optimizations
${chalk.gray('New in v3.2.5:')} 🎯 Improved UX & workflow refinement
${chalk.gray('New in v3.2.4:')} 🛡️  CVE vulnerability detection (OSV + NVD)
${chalk.gray('New in v3.2.3:')} 🎯 All 10 commands now working!
${chalk.gray('New in v3.2.2:')} 🤖 AI-powered dependency analysis
  `);

program
  .command('analyze')
  .description('Analyze your project dependencies with CVE detection')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--deep', 'Show detailed analysis (all issues)')
  .option('--json', 'Output results as JSON')
  .option('--ci', 'CI mode - exit with error code if score below threshold')
  .option('--threshold <score>', 'Health score threshold for CI mode (default: 7.0)', '7.0')
  .option('--silent', 'Silent mode - no output')
  .option('--no-history', 'Skip saving snapshot to history database')
  .option('--ai', '🤖 Get AI-powered insights and recommendations')
  .option('--ai-provider <provider>', 'AI provider to use (openai, anthropic, google, local)')
  .addHelpText('after', `

${chalk.bold('Analysis Examples:')}
  ${chalk.cyan('devcompass')}                          Quick health check (Top 3 issues)
  ${chalk.cyan('devcompass analyze')}                  Same as above
  ${chalk.cyan('devcompass analyze --deep')}           Full detailed report
  ${chalk.cyan('devcompass analyze --ai')}             Analyze with AI insights 🤖
  ${chalk.cyan('devcompass analyze --json')}           Output as JSON
  ${chalk.cyan('devcompass analyze --ci --threshold 8.0')} CI mode with custom threshold

${chalk.bold('🆕 v3.2.6 Changes:')}
  • Performance optimizations
  • Better memory management
  • Improved error handling
  • Enhanced caching

${chalk.bold('🛡️  CVE Vulnerability Detection:')}
  • Real-time CVE database checking (OSV + NVD)
  • CVSS severity scores
  • Official vulnerability IDs
  • 24-hour caching for performance

${chalk.bold('🤖 AI-Powered Analysis:')}
  • Get intelligent recommendations
  • Understand why packages are outdated
  • Learn about breaking changes
  • See migration paths

${chalk.bold('History Tracking:')}
  • Snapshots auto-saved to SQLite database
  • Compare changes over time
  • View dependency evolution
  `)
  .action(async (options) => {
    try {
      // Validate threshold if CI mode is enabled
      if (options.ci && options.threshold) {
        const threshold = parseFloat(options.threshold);
        if (isNaN(threshold)) {
          console.error(chalk.red('\n❌ Invalid threshold value'));
          console.error(chalk.gray('   Threshold must be a number (e.g., 7.0, 8.5, 10.0)'));
          console.error(chalk.yellow(`   You provided: "${options.threshold}"`));
          console.error(chalk.gray('\nExample:'), chalk.cyan('devcompass analyze --ci --threshold 8.0\n'));
          process.exit(1);
        }
        if (threshold < 0 || threshold > 10) {
          console.error(chalk.red('\n❌ Threshold must be between 0 and 10'));
          console.error(chalk.yellow(`   You provided: ${threshold}\n`));
          process.exit(1);
        }
        options.ciThreshold = threshold;
      }

      const { runAnalyze } = require('../src/commands/analyze');
      await runAnalyze({
        mode: options.deep ? 'deep' : 'default',
        projectPath: options.path,
        json: options.json,
        aiEnabled: options.ai,
        saveHistory: options.history !== false,
        ci: options.ci,
        ciThreshold: options.ciThreshold || 7.0,
        silent: options.silent
      });
    } catch (error) {
      console.error(chalk.red('\n❌ Analysis failed:'), error.message);
      if (process.env.DEBUG) console.error(error.stack);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Fix issues automatically with safe defaults')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--safe', 'Only apply safe fixes (default)', true)
  .option('--all', 'Apply all fixes including risky ones')
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--dry', 'Alias for --dry-run')
  .option('--preview', 'Preview fixes without applying (same as --dry-run)')
  .option('--batch', 'Interactive batch mode - select which categories to fix')
  .option('--batch-mode <mode>', 'Preset batch mode: critical, high, all')
  .option('--only <categories>', 'Fix only specific categories')
  .option('--skip <categories>', 'Skip specific categories')
  .option('--verbose', 'Show detailed output')
  .addHelpText('after', `

${chalk.bold('🆕 v3.2.6 Fix Command:')}
  • Shows preview before applying changes
  • Safe mode by default
  • Clear risk classification
  • Automatic backups

${chalk.bold('Basic Examples:')}
  ${chalk.cyan('devcompass fix')}                     Preview & apply safe fixes
  ${chalk.cyan('devcompass fix --yes')}               Skip confirmation
  ${chalk.cyan('devcompass fix --all')}               Include risky fixes (asks confirmation)
  ${chalk.cyan('devcompass fix --preview')}           Preview only, no changes
  ${chalk.cyan('devcompass fix --dry-run')}           Same as --preview

${chalk.bold('Batch Mode Examples:')}
  ${chalk.cyan('devcompass fix --batch')}                    Interactive batch selection
  ${chalk.cyan('devcompass fix --batch-mode critical')}      Fix critical issues only
  ${chalk.cyan('devcompass fix --batch-mode high')}          Fix high-priority issues
  ${chalk.cyan('devcompass fix --only supply-chain,license')} Fix specific categories

${chalk.bold('Available Categories:')}
  ${chalk.red('supply-chain')} - Malicious packages, typosquatting
  ${chalk.yellow('license')}      - GPL/AGPL/LGPL conflicts
  ${chalk.blue('quality')}      - Abandoned/deprecated packages
  ${chalk.red('security')}     - npm audit vulnerabilities
  ${chalk.yellow('ecosystem')}    - Known package issues
  ${chalk.cyan('unused')}       - Unused dependencies
  ${chalk.green('updates')}      - Safe version updates

${chalk.bold('Safety Features:')}
  ✓ Preview all changes before applying
  ✓ Automatic backup creation
  ✓ Risk classification (safe/moderate/risky)
  ✓ Rollback support
  `)
  .action(async (options) => {
    try {
      const { runFix } = require('../src/commands/fix');
      await runFix({
        mode: options.all ? 'all' : 'safe',
        projectPath: options.path,
        skipConfirm: options.yes,
        dryRun: options.dryRun || options.dry || options.preview,
        preview: options.preview,
        batch: options.batch,
        batchMode: options.batchMode,
        only: options.only,
        skip: options.skip,
        verbose: options.verbose
      });
    } catch (error) {
      console.error(chalk.red('\n❌ Fix failed:'), error.message);
      if (process.env.DEBUG) console.error(error.stack);
      process.exit(1);
    }
  });

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
  ${chalk.cyan('devcompass backup clean')}                         Remove old backups

${chalk.bold('What Gets Backed Up:')}
  • package.json
  • package-lock.json
  • Metadata (timestamp, reason, health score)

${chalk.bold('Backup Location:')}
  .devcompass-backups/ (in project directory)
  `)
  .action((action, options) => {
    const backup = require('../src/commands/backup');
    backup(action, options);
  });

program
  .command('graph')
  .description('Generate dependency graph visualization')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <file>', 'Output file', 'dependency-graph.html')
  .option('-f, --format <format>', 'Output format: html, svg, json, png')
  .option('-l, --layout <type>', 'Layout: tree, force, radial, conflict, analytics', 'tree')
  .option('-d, --depth <number>', 'Maximum depth to traverse', parseInt, Infinity)
  .option('--filter <filter>', 'Filter: all, vulnerable, outdated, unused', 'all')
  .option('-w, --width <number>', 'Graph width in pixels', parseInt, 1200)
  .option('-h, --height <number>', 'Graph height in pixels', parseInt, 800)
  .option('--open', 'Open in browser (HTML only)', false)
  .addHelpText('after', `

${chalk.bold('🆕 v3.2.6 Graph Features:')}
  • Top Issues Panel (synced with CLI)
  • Focus Mode (show only problems)
  • Click → Action Panel
  • Dependency path visualization

${chalk.bold('Graph Examples:')}
  ${chalk.cyan('devcompass graph')}                            Generate interactive graph
  ${chalk.cyan('devcompass graph --layout force')}             Force-directed layout
  ${chalk.cyan('devcompass graph --filter vulnerable')}        Show only vulnerable packages
  ${chalk.cyan('devcompass graph --open')}                     Open in browser

${chalk.bold('Available Layouts:')}
  • tree - Hierarchical tree layout
  • force - Force-directed graph
  • radial - Radial tree layout
  • conflict - Highlight conflicting dependencies
  • analytics - Statistical overview

${chalk.bold('Interactive Features:')}
  • Switch layouts dynamically
  • Apply filters in real-time
  • Search for packages
  • Zoom and pan navigation
  • Export as PNG or JSON
  `)
  .action(async (options) => {
    const graphCommand = require('../src/commands/graph');
    await graphCommand(options);
  });

program
  .command('history <subcommand>')
  .description('Manage analysis history and snapshots')
  .option('--limit <number>', 'Limit number of results', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('--keep <number>', 'Number of snapshots to keep (cleanup only)', parseInt, 30)
  .option('--date <date>', 'Specific date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--from <date>', 'Start date')
  .option('--to <date>', 'End date')
  .option('--month <month>', 'Specific month (MM-YYYY)')
  .option('--year <year>', 'Specific year (YYYY)')
  .addHelpText('after', `

${chalk.bold('History Subcommands:')}
  ${chalk.cyan('list')}      List all saved snapshots
  ${chalk.cyan('show')}      Show snapshot details
  ${chalk.cyan('summary')}   Show monthly summary
  ${chalk.cyan('cleanup')}   Delete old snapshots
  ${chalk.cyan('stats')}     Show history statistics

${chalk.bold('Examples:')}
  ${chalk.cyan('devcompass history list')}                     List all snapshots
  ${chalk.cyan('devcompass history show 5')}                   Show snapshot #5
  ${chalk.cyan('devcompass history summary')}                  Monthly breakdown
  `)
  .action(async (subcommand, options) => {
    const historyCommand = require('../src/commands/history');
    await historyCommand({ ...options, _: ['history', subcommand] });
  });

program
  .command('compare <id1> <id2>')
  .description('Compare two analysis snapshots')
  .option('-o, --output <file>', 'Save comparison report to file')
  .option('--verbose', 'Show detailed comparison', false)
  .addHelpText('after', `

${chalk.bold('Compare Examples:')}
  ${chalk.cyan('devcompass compare 5 8')}                    Compare snapshots #5 and #8
  ${chalk.cyan('devcompass compare 5 8 --verbose')}          Detailed comparison
  `)
  .action(async (id1, id2, options) => {
    const compareCommand = require('../src/commands/compare');
    await compareCommand({ ...options, _: ['compare', id1, id2] });
  });

program
  .command('snapshot <subcommand> [id]')
  .description('Manage dependency snapshots')
  .option('--project <name>', 'Filter by project name')
  .option('--limit <number>', 'Limit results', parseInt, 20)
  .option('-v, --verbose', 'Show detailed information', false)
  .option('-y, --yes', 'Skip confirmation', false)
  .addHelpText('after', `

${chalk.bold('Snapshot Subcommands:')}
  ${chalk.cyan('save')}      Save current state as snapshot
  ${chalk.cyan('list')}      List all snapshots
  ${chalk.cyan('view')}      View snapshot details
  ${chalk.cyan('delete')}    Delete a snapshot

${chalk.bold('🆕 v3.2.6 Changes:')}
  • Auto-saved after analyze and fix
  • No need to manually save
  • Better performance
  `)
  .action(async (subcommand, id, options) => {
    const snapshotCommand = require('../src/commands/snapshot');
    
    switch (subcommand) {
      case 'save':
        await snapshotCommand.saveSnapshot(options);
        break;
      case 'list':
        await snapshotCommand.listSnapshots(options);
        break;
      case 'view':
        if (!id) {
          console.log(chalk.red('❌ Snapshot ID is required'));
          process.exit(1);
        }
        await snapshotCommand.viewSnapshot(id, options);
        break;
      case 'delete':
        if (!id) {
          console.log(chalk.red('❌ Snapshot ID is required'));
          process.exit(1);
        }
        await snapshotCommand.deleteSnapshot(id, options);
        break;
      default:
        snapshotCommand.showHelp();
    }
  });

program
  .command('timeline')
  .description('View dependency evolution timeline')
  .option('--days <number>', 'Number of days to include', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('-o, --open', 'Open interactive timeline in browser', false)
  .option('--output <file>', 'Output file path', 'devcompass-timeline.html')
  .action(async (options) => {
    const timelineCommand = require('../src/commands/timeline');
    await timelineCommand(options);
  });

program
  .command('cve')
  .description('🛡️  Manage CVE vulnerability databases and API keys')
  .argument('[subcommand]', 'CVE subcommand (key, test, cache)')
  .option('--set', 'Set API key')
  .option('--api-key <key>', 'API key value')
  .option('--key <key>', 'API key value (alias)')
  .option('--remove', 'Remove API key')
  .option('--list', 'List all API keys')
  .option('--clear', 'Clear cache')
  .option('--stats', 'Show cache statistics')
  .addHelpText('after', `

${chalk.bold('CVE Examples:')}
  ${chalk.cyan('devcompass cve key --set --api-key abc123')}  Set NVD API key
  ${chalk.cyan('devcompass cve test')}                        Test connection
  ${chalk.cyan('devcompass cve cache --stats')}               View cache stats

${chalk.bold('Get NVD API Key:')}
  Visit: ${chalk.cyan('https://nvd.nist.gov/developers/request-an-api-key')}
  `)
  .action(async (subcommand, options) => {
    const cveCommand = require('../src/commands/cve');
    await cveCommand(subcommand, options);
  });

program
  .command('llm')
  .description('🤖 Manage AI/LLM providers and settings')
  .argument('[subcommand]', 'LLM subcommand')
  .argument('[provider]', 'Provider name')
  .option('--provider <name>', 'Provider name')
  .option('--token <token>', 'API token/key')
  .option('--model <model>', 'Model name')
  .option('--base-url <url>', 'Base URL (for local models)')
  .addHelpText('after', `

${chalk.bold('LLM Examples:')}
  ${chalk.cyan('devcompass llm add --provider openai --token sk-xxx --model gpt-4')}
  ${chalk.cyan('devcompass llm list')}
  ${chalk.cyan('devcompass llm test openai')}
  `)
  .action(async (subcommand, provider, options) => {
    const llmCommand = require('../src/commands/llm');
    const providerName = provider || options.provider;

    switch (subcommand) {
      case 'add':
        await llmCommand.addProvider(options);
        break;
      case 'list':
        llmCommand.listProviders();
        break;
      case 'default':
        llmCommand.setDefaultProvider(providerName);
        break;
      case 'update':
        llmCommand.updateProvider(providerName, options);
        break;
      case 'remove':
        llmCommand.removeProvider(providerName);
        break;
      case 'test':
        await llmCommand.testProvider(providerName);
        break;
      case 'stats':
        llmCommand.showStats(options);
        break;
      default:
        llmCommand.showHelp();
    }
  });

  program
  .command('clean')
  .description('Clean DevCompass output directories')
  .option('--all', 'Clean all output directories')
  .option('--cache', 'Clean cache only')
  .option('--backups', 'Clean backups only')
  .option('--temp', 'Clean temporary files only')
  .option('--graphs', 'Clean generated graphs')
  .option('--reports', 'Clean generated reports')
  .option('--force', 'Skip confirmation')
  .addHelpText('after', `

${chalk.bold('Clean Examples:')}
  ${chalk.cyan('devcompass clean')}              Show summary
  ${chalk.cyan('devcompass clean --temp')}       Clean temp files
  ${chalk.cyan('devcompass clean --cache')}      Clean cache
  ${chalk.cyan('devcompass clean --all')}        Clean everything
  ${chalk.cyan('devcompass clean --all --force')} Clean without asking
  `)
  .action(async (options) => {
    const cleanCommand = require('../src/commands/clean');
    await cleanCommand(options);
  });

program
  .command('ai')
  .description('🤖 AI-powered dependency analysis')
  .argument('[subcommand]', 'AI subcommand (ask, recommend, alternatives, chat)')
  .argument('[args...]', 'Additional arguments')
  .option('--provider <name>', 'AI provider to use')
  .option('--stream', 'Stream responses in real-time', true)
  .option('--no-stream', 'Wait for complete response')
  .option('--verbose', 'Show detailed information')
  .addHelpText('after', `

${chalk.bold('AI Examples:')}
  ${chalk.cyan('devcompass ai ask "Why is my health score low?"')}
  ${chalk.cyan('devcompass ai alternatives moment')}
  ${chalk.cyan('devcompass ai chat')}
  `)
  .action(async (subcommand, args, options) => {
    const aiCommand = require('../src/commands/ai');
    const projectPath = process.cwd();

    switch (subcommand) {
      case 'ask': {
        const question = args.join(' ');
        if (!question) {
          console.log(chalk.red('❌ Question required'));
          return;
        }
        await aiCommand.askQuestion(question, projectPath, options);
        break;
      }

      case 'recommend': {
        await aiCommand.getRecommendations(projectPath, options);
        break;
      }

      case 'alternatives': {
        const packageName = args[0];
        if (!packageName) {
          console.log(chalk.red('❌ Package name required'));
          return;
        }
        await aiCommand.getAlternatives(packageName, projectPath, options);
        break;
      }

      case 'chat': {
        await aiCommand.startChat(projectPath, options);
        break;
      }

      default:
        console.log(chalk.yellow('\n⚠️ Invalid AI command\n'));
        console.log(chalk.cyan('Available commands:'));
        console.log('  devcompass ai ask "question"');
        console.log('  devcompass ai recommend');
        console.log('  devcompass ai alternatives <package>');
        console.log('  devcompass ai chat\n');
    }
  });

program
  .command('config')
  .description('Configure DevCompass settings')
  .option('--github-token <token>', 'Set GitHub Personal Access Token')
  .option('--remove-github-token', 'Remove GitHub token')
  .option('--show', 'Show current configuration')
  .action((options) => {
    const config = require('../src/commands/config');
    config(options);
  });

if (process.argv.length === 2) {
  (async () => {
    try {
      const { runAnalyze } = require('../src/commands/analyze');
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