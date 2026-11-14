// src/cli/commands/analyze.cmd.js

const chalk = require('chalk');
const logger = require('../../shared/utils/logger').default;

// Exit codes: 0 pass; 1 a policy gate or --ci threshold failed; 2 the scan
// didn't complete and --fail-on-incomplete is set; 3 DevCompass itself
// couldn't run (bad flag or config, unreadable package.json) — so a CI
// pipeline can tell "your dependencies failed the policy" from "the check
// broke".
const EXIT_ERROR = 3;

module.exports = function registerAnalyzeCommand(program) {
  program
    .command('analyze')
    .description('Analyze your project dependencies with CVE detection')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('--deep', 'Show detailed analysis (all issues)')
    .option('--json', 'Output results as JSON (shorthand for --format json)')
    .option('--format <format>', 'Output format: console, json, sarif, markdown')
    .option('--fail-on <level>', 'Exit 1 if any finding is at or above this severity: critical, high, medium, low — or kev for known-exploited vulnerabilities only')
    .option('--fail-on-license <licenses>', 'Exit 1 if any installed package uses one of these licenses (comma-separated SPDX ids, e.g. GPL-3.0,AGPL-3.0)')
    .option('--only-direct', 'Policy gates ignore packages not declared in package.json')
    .option('--baseline', 'Policy gates ignore findings recorded in .devcompass-baseline.json (see `devcompass baseline save`)')
    .option('--fail-on-incomplete', 'Exit 2 if a check could not complete or was skipped (network error, --offline)')
    .option('--ci', 'CI mode - exit with error code if score below threshold')
    .option('--threshold <score>', 'Health score threshold for CI mode (default: 7.0)', '7.0')
    .option('--ecosystem', 'Also run the ecosystem/predictive checks (they call GitHub\'s API: 60 requests an hour without GITHUB_TOKEN)')
    .option('--offline', 'Skip every check that needs the network')
    .option('--silent', 'Silent mode - no output')
    .option('--no-history', 'Skip saving snapshot to history database')
    .action(async (options) => {
      try {
        if (options.ci && options.threshold) {
          const threshold = parseFloat(options.threshold);
          if (isNaN(threshold) || threshold < 0 || threshold > 10) {
            console.error(chalk.red('\n❌ Threshold must be a number between 0 and 10\n'));
            process.exit(EXIT_ERROR);
          }
          options.ciThreshold = threshold;
        }
        const format = options.format || (options.json ? 'json' : null);
        if (format && !['console', 'json', 'sarif', 'markdown'].includes(format)) {
          console.error(chalk.red('\n❌ --format must be one of: console, json, sarif, markdown\n'));
          process.exit(EXIT_ERROR);
        }

        const failOnLicenses = options.failOnLicense
          ? options.failOnLicense.split(',').map(s => s.trim()).filter(Boolean)
          : null;

        const { runAnalyze } = require('../../features/analyze');
        const result = await runAnalyze({
          mode: options.deep ? 'deep' : 'default',
          projectPath: options.path,
          json: options.json,
          format,
          saveHistory: options.history !== false,
          ci: options.ci,
          ciThreshold: options.ciThreshold !== undefined ? options.ciThreshold : 7.0,
          silent: options.silent,
          failOn: options.failOn || null,
          failOnLicenses,
          onlyDirect: !!options.onlyDirect,
          failOnIncomplete: !!options.failOnIncomplete,
          baseline: !!options.baseline,
          includeEcosystem: !!options.ecosystem,
          offline: !!options.offline
        });
        // A policy gate (a flag, or devcompass.config.json's failOn) sets the
        // exit code on its own, with or without --ci.
        if (options.ci || result.metadata?.policy) process.exitCode = result.exitCode;
      } catch (error) {
        console.error(chalk.red('\n❌ Analysis failed:'), error.message);
        logger.debug(error.stack);
        process.exit(EXIT_ERROR);
      }
    });
};
