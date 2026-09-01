// src/features/history/compare.command.js

const chalk = require('chalk');
const ora = require('ora');
const comparator = require('./snapshot-comparator');
const loader = require('./snapshot-loader');
const fs = require('fs');
const path = require('path');

async function compareCommand(options) {
  const id1 = options._[1];
  const id2 = options._[2];

  if (!id1 || !id2) {
    console.error(chalk.red('❌ Error: Two snapshot IDs required'));
    console.log(chalk.gray('\nUsage: devcompass compare <id1> <id2>\n'));
    process.exit(1);
  }

  const parsedId1 = parseInt(id1);
  const parsedId2 = parseInt(id2);

  if (isNaN(parsedId1) || isNaN(parsedId2)) {
    console.error(chalk.red('❌ Invalid snapshot IDs. Must be numbers.\n'));
    process.exit(1);
  }

  let snap1, snap2;
  try {
    snap1 = loader.getSnapshot(parsedId1);
    snap2 = loader.getSnapshot(parsedId2);
    if (!snap1) { console.error(chalk.red(`❌ Snapshot #${parsedId1} not found\n`)); process.exit(1); }
    if (!snap2) { console.error(chalk.red(`❌ Snapshot #${parsedId2} not found\n`)); process.exit(1); }
  } catch (error) {
    console.error(chalk.red('❌ Failed to load snapshots\n'), chalk.gray(error.message));
    process.exit(1);
  }

  const spinner = ora('Comparing snapshots...').start();

  try {
    const result = comparator.compare(parsedId1, parsedId2, snap1, snap2);
    if (!result) { spinner.fail('Comparison failed'); process.exit(1); }

    spinner.succeed(`Comparison complete (${result.duration}ms)`);
    displayComparison(result, options);

    if (options.output || options.o) {
      const reportPath = options.output || options.o;
      const report = comparator.generateReport(result);
      fs.writeFileSync(path.resolve(reportPath), report, 'utf8');
      console.log(chalk.green(`✓ Report saved to: ${path.resolve(reportPath)}\n`));
    }
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(chalk.red('❌ Error:'), error.message);
    if (process.env.DEBUG) console.error(chalk.dim(error.stack));
    process.exit(1);
  }
}

function displayComparison(result, options) {
  const { summary, added, removed, updated } = result;
  console.log('\n' + chalk.bold('📊 Snapshot Comparison\n'));
  console.log(chalk.bold('Snapshots:'));
  console.log(`  #${summary.snapshot1.id} → #${summary.snapshot2.id}`);
  console.log(`  ${chalk.gray(summary.snapshot1.timestamp)} → ${chalk.gray(summary.snapshot2.timestamp)}\n`);

  console.log(chalk.bold('Changes:'));
  console.log(`  Total Packages: ${summary.snapshot1.totalPackages} → ${summary.snapshot2.totalPackages} (${summary.snapshot2.totalPackages - summary.snapshot1.totalPackages > 0 ? '+' : ''}${summary.snapshot2.totalPackages - summary.snapshot1.totalPackages})`);
  const hc = parseFloat(summary.changes.healthScoreChange);
  const hColor = hc > 0 ? chalk.green : hc < 0 ? chalk.red : chalk.gray;
  console.log(`  Health Score: ${summary.snapshot1.healthScore.toFixed(2)} → ${summary.snapshot2.healthScore.toFixed(2)} (${hColor(hc > 0 ? '+' : '')}${hColor(hc.toFixed(2))})`);
  console.log(`\n  ${chalk.green('Added:')} ${summary.changes.added}  ${chalk.red('Removed:')} ${summary.changes.removed}  ${chalk.yellow('Updated:')} ${summary.changes.updated}  ${chalk.gray('Unchanged:')} ${summary.changes.unchanged}\n`);

  if (added.length > 0) {
    console.log(chalk.bold.green(`\n✨ Added Packages (${added.length}):\n`));
    const showLimit = options.verbose ? added.length : Math.min(10, added.length);
    added.slice(0, showLimit).forEach(pkg => {
      const hs = pkg.healthScore || 0;
      const hc = hs >= 7 ? chalk.green : hs >= 5 ? chalk.yellow : chalk.red;
      console.log(`  + ${chalk.white(pkg.name)} (${pkg.version}) - Health: ${hc(hs.toFixed(1))}`);
    });
    if (added.length > showLimit) console.log(chalk.gray(`  ... and ${added.length - showLimit} more`));
  }

  if (removed.length > 0) {
    console.log(chalk.bold.red(`\n🗑️  Removed Packages (${removed.length}):\n`));
    const showLimit = options.verbose ? removed.length : Math.min(10, removed.length);
    removed.slice(0, showLimit).forEach(pkg => console.log(`  - ${chalk.white(pkg.name)} (${pkg.version})`));
    if (removed.length > showLimit) console.log(chalk.gray(`  ... and ${removed.length - showLimit} more`));
  }

  if (updated.length > 0) {
    console.log(chalk.bold.yellow(`\n🔄 Updated Packages (${updated.length}):\n`));
    const showLimit = options.verbose ? updated.length : Math.min(15, updated.length);
    updated.slice(0, showLimit).forEach(pkg => {
      console.log(`  ⟳ ${chalk.white(pkg.name)}`);
      if (pkg.changes.version) console.log(`     Version: ${chalk.gray(pkg.changes.version.from)} → ${chalk.cyan(pkg.changes.version.to)}`);
      if (pkg.changes.healthScore) {
        const diff = pkg.changes.healthScore.diff;
        const c = diff > 0 ? chalk.green : chalk.red;
        console.log(`     Health: ${pkg.changes.healthScore.from.toFixed(1)} → ${pkg.changes.healthScore.to.toFixed(1)} (${c(diff > 0 ? '+' : '')}${c(diff.toFixed(1))})`);
      }
      if (pkg.changes.vulnerabilities) console.log(`     ${pkg.changes.vulnerabilities.to ? '🔴' : '✅'} ${pkg.changes.vulnerabilities.status}`);
    });
    if (updated.length > showLimit) console.log(chalk.gray(`  ... and ${updated.length - showLimit} more`));
  }
  console.log();
}

module.exports = compareCommand;