// src/commands/compare.js
const chalk = require('chalk');
const ora = require('ora');
const comparator = require('../history/comparator');
const snapshotLoader = require('../history/snapshot-loader');
const fs = require('fs');
const path = require('path');

async function compareCommand(options) {
  const id1 = options._[1];
  const id2 = options._[2];
  
  // ====== VALIDATION ======
  if (!id1 || !id2) {
    console.error(chalk.red('❌ Error: Two snapshot IDs required'));
    console.log(chalk.gray('\nUsage: devcompass compare <id1> <id2>'));
    console.log(chalk.gray('Example: devcompass compare 5 8\n'));
    console.log(chalk.gray('💡 TIP: Run'), chalk.cyan('devcompass snapshot list'), chalk.gray('to see available snapshots\n'));
    process.exit(1);
  }
  
  // Parse and validate IDs
  const parsedId1 = parseInt(id1);
  const parsedId2 = parseInt(id2);
  
  if (isNaN(parsedId1) || isNaN(parsedId2)) {
    console.error(chalk.red('❌ Error: Invalid snapshot IDs. Must be numbers.'));
    console.log(chalk.gray('\nExample: devcompass compare 5 8\n'));
    process.exit(1);
  }
  
  // Check if snapshots exist
  try {
    const snapshot1 = snapshotLoader.getSnapshot(parsedId1);
    const snapshot2 = snapshotLoader.getSnapshot(parsedId2);
    
    if (!snapshot1) {
      console.error(chalk.red(`❌ Error: Snapshot #${parsedId1} not found`));
      console.log(chalk.gray('\n💡 TIP: Run'), chalk.cyan('devcompass snapshot list'), chalk.gray('to see available snapshots\n'));
      process.exit(1);
    }
    
    if (!snapshot2) {
      console.error(chalk.red(`❌ Error: Snapshot #${parsedId2} not found`));
      console.log(chalk.gray('\n💡 TIP: Run'), chalk.cyan('devcompass snapshot list'), chalk.gray('to see available snapshots\n'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error: Failed to load snapshots'));
    console.error(chalk.gray(`   ${error.message}\n`));
    process.exit(1);
  }
  
  const spinner = ora('Comparing snapshots...').start();
  
  try {
    // ====== COMPARISON ======
    // Perform comparison
    const result = comparator.compare(parsedId1, parsedId2);
    
    if (!result) {
      spinner.fail('Comparison failed');
      console.error(chalk.red('❌ Could not compare snapshots\n'));
      process.exit(1);
    }
    
    spinner.succeed(`Comparison complete (${result.duration}ms)`);
    
    // ====== OUTPUT ======
    // Display results
    displayComparison(result, options);
    
    // Save report if requested
    if (options.output || options.o) {
      saveReport(result, options.output || options.o);
    }
    
  } catch (error) {
    spinner.fail('Comparison failed');
    console.error(chalk.red('❌ Error:'), error.message);
    
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    
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

function showHelp() {
  console.log(chalk.bold.cyan('\n📊 DevCompass Compare Command\n'));
  console.log(chalk.bold('Usage:'));
  console.log(chalk.gray('  devcompass compare <snapshot-id-1> <snapshot-id-2> [options]\n'));
  console.log(chalk.bold('Options:'));
  console.log(chalk.cyan('  --output, -o <path>   ') + chalk.gray('Save comparison report to file'));
  console.log(chalk.cyan('  --verbose, -v         ') + chalk.gray('Show all packages (no truncation)'));
  console.log(chalk.cyan('  --help                ') + chalk.gray('Show this help message\n'));
  console.log(chalk.bold('Examples:'));
  console.log(chalk.gray('  devcompass compare 5 8'));
  console.log(chalk.gray('  devcompass compare 5 8 --verbose'));
  console.log(chalk.gray('  devcompass compare 5 8 --output report.md'));
  console.log(chalk.gray('  devcompass compare 5 8 -o report.md -v\n'));
  console.log(chalk.bold('Prerequisites:'));
  console.log(chalk.gray('  List snapshots: devcompass snapshot list\n'));
}

module.exports = compareCommand;
module.exports.showHelp = showHelp;