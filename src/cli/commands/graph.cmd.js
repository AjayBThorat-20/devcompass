// src/cli/commands/graph.cmd.js

// Commander invokes an option's parser as parseArg(value, previousValue), where
// previousValue defaults to whatever default was passed as the 3rd arg here.
// Passing the bare `parseInt` function meant that default became parseInt's
// radix argument (e.g. parseInt('1600', 1200) — 1200 is not a valid radix), so
// any explicitly-passed value parsed to NaN. Wrap it to always parse base 10.
const parseIntOption = (value) => parseInt(value, 10);

module.exports = function registerGraphCommand(program) {
  program
    .command('graph')
    .description('Generate dependency graph visualization')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('-o, --output <file>', 'Output file', 'dependency-graph.html')
    .option('-f, --format <format>', 'Output format: html, json')
    .option('-l, --layout <type>', 'Layout: tree, force, radial, conflict, analytics', 'tree')
    .option('-d, --depth <number>', 'Maximum depth to traverse', parseIntOption, Infinity)
    .option('--filter <filter>', 'Filter: all, vulnerable, outdated, unused', 'all')
    .option('-w, --width <number>', 'Graph width in pixels', parseIntOption, 1200)
    .option('-h, --height <number>', 'Graph height in pixels', parseIntOption, 800)
    .option('--open', 'Open in browser (HTML only)', false)
    .action(async (options) => {
      const graphCommand = require('../../features/graph');
      await graphCommand(options);
    });
};