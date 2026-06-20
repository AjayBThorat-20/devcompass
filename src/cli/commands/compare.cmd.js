// src/cli/commands/compare.cmd.js

module.exports = function registerCompareCommand(program) {
  program
    .command('compare <id1> <id2>')
    .description('Compare two analysis snapshots')
    .option('-o, --output <file>', 'Save comparison report to file')
    .option('--verbose', 'Show detailed comparison', false)
    .action(async (id1, id2, options) => {
      const compareCommand = require('../../features/history/compare.command');
      await compareCommand({ ...options, _: ['compare', id1, id2] });
    });
};