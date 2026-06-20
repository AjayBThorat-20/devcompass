// src/cli/commands/analyze.cmd.js

const chalk = require('chalk');

module.exports = function registerAnalyzeCommand(program) {
  program
    .command('analyze')
    .description('Analyze your project dependencies with CVE detection')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('--deep', 'Show detailed analysis (all issues)')
    .option('--json', 'Output results as JSON')
    .option('--ci', 'CI mode - exit with error code if score below threshold')
    .option('--threshold <score>', 'Health score threshold for CI mode (default: 7.0)', '7.0')
    .option('--silent', 'Silent mode - no output')
    .option('--no-history', 'Skip saving snapshot to history database')
    .option('--ai', 'Get AI-powered insights and recommendations')
    .option('--ai-provider <provider>', 'AI provider to use (openai, anthropic, google, local)')
    .action(async (options) => {
      try {
        if (options.ci && options.threshold) {
          const threshold = parseFloat(options.threshold);
          if (isNaN(threshold) || threshold < 0 || threshold > 10) {
            console.error(chalk.red('\n❌ Threshold must be a number between 0 and 10\n'));
            process.exit(1);
          }
          options.ciThreshold = threshold;
        }
        const { runAnalyze } = require('../../features/analyze');
        await runAnalyze({
          mode: options.deep ? 'deep' : 'default',
          projectPath: options.path,
          json: options.json,
          aiEnabled: options.ai,
          saveHistory: options.history !== false,
          ci: options.ci,
          ciThreshold: options.ciThreshold || 7.0,
          silent: options.silent
        });
      } catch (error) {
        console.error(chalk.red('\n❌ Analysis failed:'), error.message);
        if (process.env.DEBUG) console.error(error.stack);
        process.exit(1);
      }
    });
};