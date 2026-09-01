// src/cli/commands/config.cmd.js

module.exports = function registerConfigCommand(program) {
  program
    .command('config')
    .description('Configure Depvora settings')
    .option('--github-token <token>', 'Set GitHub Personal Access Token')
    .option('--remove-github-token', 'Remove GitHub token')
    .option('--show', 'Show current configuration')
    .action((options) => {
      const config = require('../../features/config');
      config(options);
    });
};