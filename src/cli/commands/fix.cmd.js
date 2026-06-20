// src/cli/commands/fix.cmd.js

const chalk = require('chalk');

module.exports = function registerFixCommand(program) {
  program
    .command('fix')
    .description('Fix issues automatically with safe defaults')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('--all', 'Apply all fixes including risky ones')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .option('--dry-run', 'Show what would be fixed without making changes')
    .option('--dry', 'Alias for --dry-run')
    .option('--preview', 'Preview fixes without applying')
    .option('--batch', 'Interactive batch mode')
    .option('--batch-mode <mode>', 'Preset batch mode: critical, high, all')
    .option('--only <categories>', 'Fix only specific categories')
    .option('--skip <categories>', 'Skip specific categories')
    .option('--verbose', 'Show detailed output')
    .action(async (options) => {
      try {
        const { runFix } = require('../../features/fix');
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
};