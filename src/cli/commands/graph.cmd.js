// src/cli/commands/graph.cmd.js

module.exports = function registerGraphCommand(program) {
  program
    .command('graph')
    .description('Generate dependency graph visualization')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('-o, --output <file>', 'Output file', 'dependency-graph.html')
    .option('-f, --format <format>', 'Output format: html, json')
    .option('-l, --layout <type>', 'Layout: tree, force, radial, conflict, analytics', 'tree')
    .option('-d, --depth <number>', 'Maximum depth to traverse', parseInt, Infinity)
    .option('--filter <filter>', 'Filter: all, vulnerable, outdated, unused', 'all')
    .option('-w, --width <number>', 'Graph width in pixels', parseInt, 1200)
    .option('-h, --height <number>', 'Graph height in pixels', parseInt, 800)
    .option('--open', 'Open in browser (HTML only)', false)
    .action(async (options) => {
      const graphCommand = require('../../features/graph');
      await graphCommand(options);
    });
};