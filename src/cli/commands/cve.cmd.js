// src/cli/commands/cve.cmd.js

module.exports = function registerCveCommand(program) {
  program
    .command('cve')
    .description('Manage CVE vulnerability databases and API keys')
    .argument('[subcommand]', 'CVE subcommand (key, test, cache)')
    .option('--set', 'Set API key')
    .option('--api-key <key>', 'API key value')
    .option('--key <key>', 'API key value (alias)')
    .option('--remove', 'Remove API key')
    .option('--list', 'List all API keys')
    .option('--clear', 'Clear cache')
    .option('--stats', 'Show cache statistics')
    .action(async (subcommand, options) => {
      const cveCommand = require('../../features/cve');
      await cveCommand(subcommand, options);
    });
};