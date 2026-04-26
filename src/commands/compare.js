// src/commands/compare.js
const chalk = require('chalk');
const ora = require('ora');
const comparator = require('../history/comparator');
const fs = require('fs');
const path = require('path');

async function compareCommand(options) {
  const id1 = options._[1];
  const id2 = options._[2];
  
  if (!id1 || !id2) {
    console.error(chalk.red('Error: Two snapshot IDs required'));
    console.log(chalk.gray('Usage: devcompass compare <id1> <id2>'));
    console.log(chalk.gray('Example: devcompass compare 5 8\n'));
    process.exit(1);
  }
  
  const spinner = ora('Comparing snapshots...').start();
  
  try {
    // Perform comparison
    const result = comparator.compare(parseInt(id1), parseInt(id2));
    
    spinner.succeed(`Comparison complete (${result.duration}ms)`);
    
    // Display results
    displayComparison(result, options);
    
    // Save report if requested
    if (options.output || options.o) {
      saveReport(result, options.output || options.o);
    }
    
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function displayComparison(result, options) {
  const { summary, added, removed, updated } = result;
  
  console.log('\n' + chalk.bold('📊 Snapshot Comparison\n'));
  
  // Summary
  console.log(chalk.bold('Snapshots:'));
  console.log(`  #${summary.snapshot1.id} → #${summary.snapshot2.id}`);
  console.log(`  ${chalk.gray(summary.snapshot1.timestamp)} → ${chalk.gray(summary.snapshot2.timestamp)}`);
  console.log();
  
  console.log(chalk.bold('Changes:'));
  console.log(`  Total Packages: ${summary.snapshot1.totalPackages} → ${summary.snapshot2.totalPackages} (${summary.snapshot2.totalPackages - summary.snapshot1.totalPackages > 0 ? '+' : ''}${summary.snapshot2.totalPackages - summary.snapshot1.totalPackages})`);
  
  const healthChange = parseFloat(summary.changes.healthScoreChange);
  const healthColor = healthChange > 0 ? chalk.green : healthChange < 0 ? chalk.red : chalk.gray;
  console.log(`  Health Score: ${summary.snapshot1.healthScore.toFixed(2)} → ${summary.snapshot2.healthScore.toFixed(2)} (${healthColor(healthChange > 0 ? '+' : '')}${healthColor(healthChange.toFixed(2))}${chalk.reset()})`);
  console.log();
  
  console.log(`  ${chalk.green('Added:')} ${summary.changes.added}`);
  console.log(`  ${chalk.red('Removed:')} ${summary.changes.removed}`);
  console.log(`  ${chalk.yellow('Updated:')} ${summary.changes.updated}`);
  console.log(`  ${chalk.gray('Unchanged:')} ${summary.changes.unchanged}`);
  console.log();
  
  // Added packages
  if (added.length > 0) {
    console.log(chalk.bold.green(`\n✨ Added Packages (${added.length}):\n`));
    const showLimit = options.verbose ? added.length : Math.min(10, added.length);
    
    added.slice(0, showLimit).forEach(pkg => {
      // ✅ FIX: Add null check for healthScore
      const healthScore = pkg.healthScore || 0;
      const healthColor = healthScore >= 7 ? chalk.green 
                        : healthScore >= 5 ? chalk.yellow 
                        : chalk.red;
      console.log(`  + ${chalk.white(pkg.name)} (${pkg.version}) - Health: ${healthColor(healthScore.toFixed(1))}`);
    });
    
    if (added.length > showLimit) {
      console.log(chalk.gray(`  ... and ${added.length - showLimit} more (use --verbose to see all)`));
    }
  }
  
  // Removed packages
  if (removed.length > 0) {
    console.log(chalk.bold.red(`\n🗑️  Removed Packages (${removed.length}):\n`));
    const showLimit = options.verbose ? removed.length : Math.min(10, removed.length);
    
    removed.slice(0, showLimit).forEach(pkg => {
      console.log(`  - ${chalk.white(pkg.name)} (${pkg.version})`);
    });
    
    if (removed.length > showLimit) {
      console.log(chalk.gray(`  ... and ${removed.length - showLimit} more (use --verbose to see all)`));
    }
  }
  
  // Updated packages
  if (updated.length > 0) {
    console.log(chalk.bold.yellow(`\n🔄 Updated Packages (${updated.length}):\n`));
    const showLimit = options.verbose ? updated.length : Math.min(15, updated.length);
    
    updated.slice(0, showLimit).forEach(pkg => {
      console.log(`  ⟳ ${chalk.white(pkg.name)}`);
      
      if (pkg.changes.version) {
        console.log(`     Version: ${chalk.gray(pkg.changes.version.from)} → ${chalk.cyan(pkg.changes.version.to)}`);
      }
      
      if (pkg.changes.healthScore) {
        const diff = pkg.changes.healthScore.diff;
        const color = diff > 0 ? chalk.green : chalk.red;
        console.log(`     Health: ${pkg.changes.healthScore.from.toFixed(1)} → ${pkg.changes.healthScore.to.toFixed(1)} (${color(diff > 0 ? '+' : '')}${color(diff.toFixed(1))}${chalk.reset()})`);
      }
      
      if (pkg.changes.vulnerabilities) {
        const icon = pkg.changes.vulnerabilities.to ? '🔴' : '✅';
        console.log(`     ${icon} ${pkg.changes.vulnerabilities.status}`);
      }
      
      if (pkg.changes.deprecated && pkg.changes.deprecated.to) {
        console.log(`     ⚠️  Now deprecated`);
      }
    });
    
    if (updated.length > showLimit) {
      console.log(chalk.gray(`  ... and ${updated.length - showLimit} more (use --verbose to see all)`));
    }
  }
  
  console.log();
}

function saveReport(result, outputPath) {
  try {
    const report = comparator.generateReport(result);
    const fullPath = path.resolve(outputPath);
    
    fs.writeFileSync(fullPath, report, 'utf8');
    console.log(chalk.green(`✓ Report saved to: ${fullPath}\n`));
    
  } catch (error) {
    console.error(chalk.red(`Failed to save report: ${error.message}`));
  }
}

module.exports = compareCommand;