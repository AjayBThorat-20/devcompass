// src/commands/history.js
const chalk = require('chalk');
const ora = require('ora');
const db = require('../history/database');
const loader = require('../history/snapshot-loader');
const saver = require('../history/snapshot-saver');
const DateParser = require('../utils/date-parser');

async function historyCommand(options) {
  const subcommand = options._[1]; // history <subcommand>
  
  switch (subcommand) {
    case 'list':
      return listSnapshots(options);
    case 'show':
      return showSnapshot(options);
    case 'save':
      return saveSnapshot(options);
    case 'cleanup':
      return cleanupSnapshots(options);
    case 'stats':
      return showStats(options);
    case 'summary':
      return showMonthlySummary(options);
    default:
      showHelp();
  }
}

/**
 * List all snapshots with date filtering
 */
function listSnapshots(options) {
  const spinner = ora('Loading snapshots...').start();
  
  try {
    const limit = options.limit || 30;
    const projectName = options.project || null;
    
    // NEW: Flexible date options
    const fromDate = options.from || options.after || null;
    const toDate = options.to || options.before || null;
    const month = options.month || null;
    const year = options.year || null;
    const date = options.date || null; // NEW: Single date option
    
    let snapshots;
    let filterDescription = '';
    
    try {
      // ✅ NEW: Smart date parsing
      if (date) {
        // Single date filter: --date 25-04-2026
        const parsed = DateParser.parse(date);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
        
      } else if (month) {
        // Month filter: --month 04-2026 or --month 2026-04
        const parsed = DateParser.parse(month);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
        
      } else if (year) {
        // Year filter: --year 2026
        const parsed = DateParser.parse(year);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
        
      } else if (fromDate || toDate) {
        // Date range: --from 25-04-2026 --to 30-04-2026
        let start, end;
        
        if (fromDate) {
          const parsed = DateParser.parse(fromDate);
          start = parsed.start;
        } else {
          start = new Date('1970-01-01').toISOString();
        }
        
        if (toDate) {
          const parsed = DateParser.parse(toDate);
          end = parsed.end;
        } else {
          const now = new Date();
          now.setHours(23, 59, 59, 999);
          end = now.toISOString();
        }
        
        snapshots = loader.getSnapshotsInRange(start, end, projectName);
        filterDescription = `from ${fromDate || 'beginning'} to ${toDate || 'now'}`;
        
      } else {
        // Default: list all (with limit)
        snapshots = loader.listSnapshots(projectName, limit);
        filterDescription = limit < 100 ? `(showing last ${limit})` : '';
      }
      
    } catch (dateError) {
      spinner.fail('Invalid date format');
      console.error(chalk.red(dateError.message));
      console.log();
      console.log(chalk.bold('Supported date formats:'));
      console.log(chalk.gray('  DD-MM-YYYY  ') + 'Day format (e.g., 25-04-2026)');
      console.log(chalk.gray('  MM-YYYY     ') + 'Month format (e.g., 04-2026)');
      console.log(chalk.gray('  YYYY        ') + 'Year format (e.g., 2026)');
      console.log(chalk.gray('  YYYY-MM-DD  ') + 'ISO date (e.g., 2026-04-25)');
      console.log(chalk.gray('  YYYY-MM     ') + 'ISO month (e.g., 2026-04)');
      console.log();
      process.exit(1);
    }
    
    spinner.succeed(`Found ${snapshots.length} snapshot(s) ${filterDescription}`);
    
    if (snapshots.length === 0) {
      console.log(chalk.yellow('\nNo snapshots found for the specified criteria.'));
      if (fromDate || toDate || month || year || date) {
        console.log(chalk.gray('Try adjusting your date range or use "devcompass history list" to see all.\n'));
      } else {
        console.log(chalk.gray('Run "devcompass analyze" to create the first one.\n'));
      }
      return;
    }
    
    // Display results grouped by month if many snapshots
    if (snapshots.length > 20 && !month && !date) {
      displayGroupedSnapshots(snapshots, options);
    } else {
      displaySnapshotTable(snapshots);
    }
    
  } catch (error) {
    spinner.fail('Failed to load snapshots');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}


/**
 * Display snapshots grouped by month
 */
function displayGroupedSnapshots(snapshots, options) {
  console.log('\n' + chalk.bold('📊 Snapshot History (Grouped by Month)\n'));
  
  // Group by year-month
  const grouped = {};
  snapshots.forEach(s => {
    const date = new Date(s.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(s);
  });
  
  // Display each group
  Object.keys(grouped).sort().reverse().forEach(monthKey => {
    const [year, month] = monthKey.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const monthData = grouped[monthKey];
    const avgHealth = monthData.reduce((sum, s) => sum + s.health_score, 0) / monthData.length;
    
    console.log(chalk.cyan.bold(`\n📅 ${monthName} (${monthData.length} snapshots, Avg Health: ${avgHealth.toFixed(2)})`));
    console.log(chalk.gray('─'.repeat(80)));
    
    monthData.forEach(s => {
      const healthColor = s.health_score >= 7 ? chalk.green 
                        : s.health_score >= 5 ? chalk.yellow 
                        : chalk.red;
      
      const date = new Date(s.timestamp);
      const timeStr = date.toLocaleString('en-US', { 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log(
        `  ${chalk.cyan('#' + String(s.id).padEnd(4))} ` +
        `${timeStr.padEnd(16)} ` +
        `Deps: ${String(s.total_dependencies).padStart(3)} ` +
        `Health: ${healthColor(s.health_score.toFixed(1))}`
      );
    });
  });
  
  console.log('\n' + chalk.gray(`Total: ${snapshots.length} snapshots`));
  console.log(chalk.gray('Use "devcompass history show <id>" to view details'));
  console.log(chalk.gray('Use "devcompass history list --month YYYY-MM" to see a specific month\n'));
}

/**
 * Display snapshot table (existing function)
 */
function displaySnapshotTable(snapshots) {
  console.log('\n' + chalk.bold('📊 Snapshot History\n'));
  
  // Table header
  console.log(
    chalk.gray('ID'.padEnd(6)) +
    chalk.gray('Date & Time'.padEnd(22)) +
    chalk.gray('Project'.padEnd(25)) +
    chalk.gray('Deps'.padEnd(8)) +
    chalk.gray('Health')
  );
  console.log(chalk.gray('─'.repeat(80)));
  
  // Table rows
  snapshots.forEach(s => {
    const healthColor = s.health_score >= 7 ? chalk.green 
                      : s.health_score >= 5 ? chalk.yellow 
                      : chalk.red;
    
    console.log(
      chalk.cyan(String(s.id).padEnd(6)) +
      chalk.white(formatDate(s.timestamp).padEnd(22)) +
      chalk.white(s.project_name.substring(0, 23).padEnd(25)) +
      chalk.white(String(s.total_dependencies).padEnd(8)) +
      healthColor(s.health_score.toFixed(1))
    );
  });
  
  console.log('\n' + chalk.gray('Use "devcompass history show <id>" to view details'));
  console.log(chalk.gray('Use "devcompass compare <id1> <id2>" to compare snapshots\n'));
}

/**
 * Show snapshot details
 */
function showSnapshot(options) {
  const snapshotId = options._[2];
  
  if (!snapshotId) {
    console.error(chalk.red('Error: Snapshot ID required'));
    console.log(chalk.gray('Usage: devcompass history show <id>'));
    process.exit(1);
  }
  
  const spinner = ora('Loading snapshot...').start();
  
  try {
    const data = loader.getSnapshot(snapshotId);
    
    spinner.succeed('Snapshot loaded');
    
    console.log('\n' + chalk.bold(`📦 Snapshot #${snapshotId} Details\n`));
    
    // Snapshot metadata
    console.log(chalk.bold('Metadata:'));
    console.log(`  Date: ${chalk.cyan(formatDate(data.snapshot.timestamp))}`);
    console.log(`  Project: ${chalk.cyan(data.snapshot.project_name)} v${data.snapshot.project_version}`);
    console.log(`  Path: ${chalk.gray(data.snapshot.project_path)}`);
    console.log(`  Total Dependencies: ${chalk.cyan(data.snapshot.total_dependencies)}`);
    
    const healthColor = getHealthColor(data.snapshot.health_score);
    console.log(`  Health Score: ${healthColor(data.snapshot.health_score.toFixed(2))}/10`);
    console.log();
    
    // Package summary
    const vulnerable = data.packages.filter(p => p.isVulnerable).length;
    const deprecated = data.packages.filter(p => p.isDeprecated).length;
    const outdated = data.packages.filter(p => p.isOutdated).length;
    const healthy = data.packages.filter(p => p.health_score >= 7 && !p.isVulnerable && !p.isDeprecated).length;
    
    console.log(chalk.bold('Package Summary:'));
    console.log(`  Total: ${chalk.cyan(data.packages.length)}`);
    console.log(`  Healthy: ${chalk.green(healthy)}`);
    console.log(`  Outdated: ${chalk.yellow(outdated)}`);
    console.log(`  Deprecated: ${chalk.magenta(deprecated)}`);
    console.log(`  Vulnerable: ${chalk.red(vulnerable)}`);
    console.log();
    
    // Show problematic packages
    if (vulnerable > 0 || deprecated > 0) {
      console.log(chalk.bold('⚠️  Issues:'));
      
      data.packages
        .filter(p => p.isVulnerable || p.isDeprecated)
        .slice(0, 10)
        .forEach(p => {
          const badges = [];
          if (p.isVulnerable) badges.push(chalk.red('VULN'));
          if (p.isDeprecated) badges.push(chalk.magenta('DEPR'));
          
          console.log(`  ${badges.join(' ')} ${chalk.white(p.name)} (${p.version})`);
        });
      
      if (vulnerable + deprecated > 10) {
        console.log(chalk.gray(`  ... and ${vulnerable + deprecated - 10} more`));
      }
      console.log();
    }
    
  } catch (error) {
    spinner.fail('Failed to load snapshot');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Save current analysis as snapshot
 */
async function saveSnapshot(options) {
  console.log(chalk.yellow('💡 Snapshots are now automatically saved when running "devcompass analyze"'));
  console.log(chalk.gray('Run "devcompass analyze" to create a new snapshot\n'));
}

/**
 * Cleanup old snapshots
 */
function cleanupSnapshots(options) {
  const keepLast = options.keep || 30;
  const projectName = options.project || null;
  
  const spinner = ora('Cleaning up old snapshots...').start();
  
  try {
    const deleted = loader.cleanup(keepLast, projectName);
    
    spinner.succeed(`Cleanup complete`);
    console.log(chalk.green(`✓ Deleted ${deleted} old snapshot(s)`));
    console.log(chalk.gray(`✓ Kept last ${keepLast} snapshot(s)\n`));
    
  } catch (error) {
    spinner.fail('Cleanup failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Show statistics
 */
function showStats(options) {
  const spinner = ora('Calculating statistics...').start();
  
  try {
    const projectName = options.project || null;
    const stats = loader.getStats(projectName);
    
    spinner.succeed('Statistics loaded');
    
    console.log('\n' + chalk.bold('📊 History Statistics\n'));
    console.log(`  Total Snapshots: ${chalk.cyan(stats.total_snapshots)}`);
    console.log(`  First Snapshot: ${chalk.gray(formatDate(stats.first_snapshot))}`);
    console.log(`  Last Snapshot: ${chalk.gray(formatDate(stats.last_snapshot))}`);
    
    const healthColor = getHealthColor(stats.avg_health);
    console.log(`  Average Health: ${healthColor(stats.avg_health.toFixed(2))}/10`);
    console.log(`  Average Dependencies: ${chalk.cyan(Math.round(stats.avg_dependencies))}`);
    console.log();
    
  } catch (error) {
    spinner.fail('Failed to calculate statistics');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * NEW: Show monthly summary
 */
function showMonthlySummary(options) {
  const spinner = ora('Calculating monthly summary...').start();
  
  try {
    const projectName = options.project || null;
    const year = options.year || null;
    
    const monthlyStats = loader.getMonthlyStats(projectName, year);
    
    if (!monthlyStats || monthlyStats.length === 0) {
      spinner.warn('No snapshots found');
      console.log(chalk.yellow('\nNo snapshot data available.\n'));
      return;
    }
    
    spinner.succeed('Monthly summary generated');
    
    console.log('\n' + chalk.bold('📊 Monthly Snapshot Summary\n'));
    
    monthlyStats.forEach(stat => {
      const [year, month] = stat.month.split('-');
      const monthName = new Date(year, month - 1).toLocaleString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const healthColor = getHealthColor(stat.avg_health);
      
      console.log(
        chalk.cyan(monthName.padEnd(20)) +
        `  ${chalk.white(stat.count + ' snapshots').padEnd(15)}  ` +
        `Avg Health: ${healthColor(stat.avg_health.toFixed(2))}/10  ` +
        `Avg Deps: ${chalk.gray(Math.round(stat.avg_deps))}`
      );
    });
    
    console.log('\n' + chalk.gray('Use "devcompass history list --month YYYY-MM" to see details\n'));
    
  } catch (error) {
    spinner.fail('Failed to generate summary');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.bold('\n📚 DevCompass History Commands\n'));
  console.log('Usage: devcompass history <command> [options]\n');
  console.log(chalk.bold('Commands:'));
  console.log('  list              List all snapshots');
  console.log('  show <id>         Show snapshot details');
  console.log('  summary           Show monthly summary');
  console.log('  cleanup           Delete old snapshots (keep last 30)');
  console.log('  stats             Show history statistics');
  console.log();
  console.log(chalk.bold('Options:'));
  console.log('  --limit <n>       Limit number of results (default: 30)');
  console.log('  --project <name>  Filter by project name');
  console.log('  --keep <n>        Number of snapshots to keep (cleanup only)');
  console.log('  --from <date>     Start date (YYYY-MM-DD)');
  console.log('  --to <date>       End date (YYYY-MM-DD)');
  console.log('  --month <YYYY-MM> Filter by specific month');
  console.log('  --year <YYYY>     Filter by specific year');
  console.log();
  console.log(chalk.bold('Examples:'));
  console.log(chalk.gray('  devcompass history list'));
  console.log(chalk.gray('  devcompass history list --limit 50'));
  console.log(chalk.gray('  devcompass history list --month 2025-06'));
  console.log(chalk.gray('  devcompass history list --year 2025'));
  console.log(chalk.gray('  devcompass history list --from 2025-01-01 --to 2025-06-30'));
  console.log(chalk.gray('  devcompass history show 5'));
  console.log(chalk.gray('  devcompass history summary'));
  console.log(chalk.gray('  devcompass history summary --year 2025'));
  console.log(chalk.gray('  devcompass history cleanup --keep 20'));
  console.log(chalk.gray('  devcompass history stats\n'));
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getHealthColor(score) {
  if (score >= 7) return chalk.green;
  if (score >= 5) return chalk.yellow;
  return chalk.red;
}

module.exports = historyCommand;