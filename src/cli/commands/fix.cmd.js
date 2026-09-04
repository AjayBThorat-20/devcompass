// src/cli/commands/fix.cmd.js

const chalk = require('chalk');

module.exports = function registerFixCommand(program) {
  program
    .command('fix [action]')
    .description('Fix issues automatically with safe defaults (or `fix undo` to revert the last --migrate-syntax run)')
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
    .option('--migrate-syntax', 'On major-version fixes, also rewrite source call-sites (built-in codemods, falling back to your configured AI provider) — nothing is committed; verify with your tests, or run `devcompass fix undo`')
    .action(async (action, options) => {
      try {
        if (action === 'undo') {
          const { runFixUndo } = require('../../features/fix');
          await runFixUndo({ projectPath: options.path });
          return;
        }
        if (action) {
          console.error(chalk.red(`\n❌ Unknown fix action "${action}". Did you mean: devcompass fix undo?`));
          process.exit(1);
        }

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
          verbose: options.verbose,
          migrateSyntax: options.migrateSyntax
        });
      } catch (error) {
        console.error(chalk.red('\n❌ Fix failed:'), error.message);
        if (process.env.DEBUG) console.error(error.stack);
        process.exit(1);
      }
    });
};