// src/cli/commands/snapshot.cmd.js

const chalk = require('chalk');

// See graph.cmd.js for why parseInt can't be passed to commander bare.
const parseIntOption = (value) => parseInt(value, 10);

module.exports = function registerSnapshotCommand(program) {
  program
    .command('snapshot <subcommand> [id]')
    .description('Manage dependency snapshots')
    .option('--project <name>', 'Filter by project name')
    .option('--limit <number>', 'Limit results', parseIntOption, 20)
    .option('-v, --verbose', 'Show detailed information', false)
    .option('-y, --yes', 'Skip confirmation', false)
    .action(async (subcommand, id, options) => {
      const snapshotCommand = require('../../features/history/snapshot.command');
      switch (subcommand) {
        case 'save': await snapshotCommand.saveSnapshot(options); break;
        case 'list': await snapshotCommand.listSnapshots(options); break;
        case 'view':
          if (!id) { console.log(chalk.red('❌ Snapshot ID is required')); process.exit(1); }
          await snapshotCommand.viewSnapshot(id, options);
          break;
        case 'delete':
          if (!id) { console.log(chalk.red('❌ Snapshot ID is required')); process.exit(1); }
          await snapshotCommand.deleteSnapshot(id, options);
          break;
        default: snapshotCommand.showHelp();
      }
    });
};