// src/cli/commands/clean.cmd.js

module.exports = function registerCleanCommand(program) {
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
    .action(async (options) => {
      const cleanCommand = require('../../features/clean');
      await cleanCommand(options);
    });
};