// src/cli/commands/history.cmd.js

module.exports = function registerHistoryCommand(program) {
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
    .action(async (subcommand, options) => {
      const historyCommand = require('../../features/history/history.command');
      await historyCommand({ ...options, _: ['history', subcommand] });
    });
};