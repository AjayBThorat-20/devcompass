// src/cli/commands/why.cmd.js
//
// FT-06: `devcompass why <package>` — how did this package get into the
// dependency tree, and is it vulnerable?

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = function registerWhyCommand(program) {
  program
    .command('why <package>')
    .description('Show how a package got into the dependency tree')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .action(async (packageName, options) => {
      const projectPath = options.path;
      try {
        const { loadDependencyGraph } = require('../../core/graph');
        const { why } = require('../../core/graph/why');

        const graph = await loadDependencyGraph(projectPath);

        if (graph.incomplete) {
          console.error(chalk.yellow(`\n⚠️  ${graph.incompleteReason}\n`));
          process.exitCode = 1;
          return;
        }

        const results = why(graph, packageName);
        if (results.length === 0) {
          console.log(chalk.yellow(`\n"${packageName}" isn't in the installed dependency tree.\n`));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
        const projectName = packageJson.name || path.basename(projectPath);

        console.log('');
        for (const { node, paths } of results) {
          console.log(chalk.bold.cyan(`${node.id} (${paths.length} path${paths.length === 1 ? '' : 's'})`) + (node.direct ? chalk.gray('  [direct dependency]') : ''));
          paths.forEach(trail => {
            const printable = [projectName, ...trail.slice(1)].join(chalk.gray(' → '));
            console.log(`  ${printable}`);
          });
          if (paths.length === 0 && !node.direct) {
            console.log(chalk.gray('  (no path found from the root — check the lockfile for an inconsistency)'));
          }
          console.log('');
        }

        console.log(chalk.gray('Run `devcompass analyze --deep` for vulnerability/license findings on these packages, and `devcompass fix --dry-run` for suggested overrides.\n'));
      } catch (error) {
        console.error(chalk.red('\n❌ why failed:'), error.message);
        if (process.env.DEBUG) console.error(error.stack);
        process.exitCode = 1;
      }
    });
};
