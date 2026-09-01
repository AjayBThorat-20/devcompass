// src/cli/commands/timeline.cmd.js

// See graph.cmd.js for why parseInt can't be passed to commander bare.
const parseIntOption = (value) => parseInt(value, 10);

module.exports = function registerTimelineCommand(program) {
  program
    .command('timeline')
    .description('View dependency evolution timeline')
    .option('--days <number>', 'Number of days to include', parseIntOption, 30)
    .option('--project <name>', 'Filter by project name')
    .option('-o, --open', 'Open interactive timeline in browser', false)
    .option('--output <file>', 'Output file path', 'depvora-timeline.html')
    .action(async (options) => {
      const timelineCommand = require('../../features/history/timeline.command');
      await timelineCommand(options);
    });
};