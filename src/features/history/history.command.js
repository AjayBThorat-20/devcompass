// src/features/history/history.command.js

const chalk = require('chalk');
const ora = require('ora');
const loader = require('./snapshot-loader');
const DateParser = require('../../shared/utils/date-parser');

async function historyCommand(options) {
  const subcommand = options._[1];
  switch (subcommand) {
    case 'list': return listSnapshots(options);
    case 'show': return showSnapshot(options);
    case 'save': return saveSnapshotCmd(options);
    case 'cleanup': return cleanupSnapshots(options);
    case 'stats': return showStats(options);
    case 'summary': return showMonthlySummary(options);
    default: showHelp();
  }
}

function listSnapshots(options) {
  const spinner = ora('Loading snapshots...').start();
  try {
    const { limit = 30, project: projectName = null, from: fromDate = null, to: toDate = null, month = null, year = null, date = null } = options;
    let snapshots, filterDescription = '';

    try {
      if (date) {
        const parsed = DateParser.parse(date);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
      } else if (month) {
        const parsed = DateParser.parse(month);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
      } else if (year) {
        const parsed = DateParser.parse(year);
        snapshots = loader.getSnapshotsInRange(parsed.start, parsed.end, projectName);
        filterDescription = `for ${parsed.description}`;
      } else if (fromDate || toDate) {
        const start = fromDate ? DateParser.parse(fromDate).start : new Date('1970-01-01').toISOString();
        const end = toDate ? DateParser.parse(toDate).end : new Date().toISOString();
        snapshots = loader.getSnapshotsInRange(start, end, projectName);
        filterDescription = `from ${fromDate || 'beginning'} to ${toDate || 'now'}`;
      } else {
        snapshots = loader.listSnapshots(projectName, limit);
        filterDescription = limit < 100 ? `(showing last ${limit})` : '';
      }
    } catch (dateError) {
      spinner.fail('Invalid date format');
      console.error(chalk.red(dateError.message));
      console.log('\nSupported date formats: DD-MM-YYYY, MM-YYYY, YYYY, YYYY-MM-DD, YYYY-MM\n');
      process.exit(1);
    }

    spinner.succeed(`Found ${snapshots.length} snapshot(s) ${filterDescription}`);

    if (snapshots.length === 0) {
      console.log(chalk.yellow('\nNo snapshots found. Run "devcompass analyze" to create one.\n'));
      return;
    }

    if (snapshots.length > 20 && !month && !date) {
      displayGroupedSnapshots(snapshots);
    } else {
      displaySnapshotTable(snapshots);
    }
  } catch (error) {
    spinner.fail('Failed to load snapshots');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function displayGroupedSnapshots(snapshots) {
  console.log('\n' + chalk.bold('📊 Snapshot History (Grouped by Month)\n'));
  const grouped = {};
  snapshots.forEach(s => {
    const date = new Date(s.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  Object.keys(grouped).sort().reverse().forEach(monthKey => {
    const [year, month] = monthKey.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const monthData = grouped[monthKey];
    const avgHealth = monthData.reduce((sum, s) => sum + s.health_score, 0) / monthData.length;

    console.log(chalk.cyan.bold(`\n📅 ${monthName} (${monthData.length} snapshots, Avg Health: ${avgHealth.toFixed(2)})`));
    console.log(chalk.gray('─'.repeat(80)));

    monthData.forEach(s => {
      const healthColor = s.health_score >= 7 ? chalk.green : s.health_score >= 5 ? chalk.yellow : chalk.red;
      const date = new Date(s.timestamp);
      const timeStr = date.toLocaleString('en-US', { day: '2-digit', hour: '2-digit', minute: '2-digit' });
      console.log(`  ${chalk.cyan('#' + String(s.id).padEnd(4))} ${timeStr.padEnd(16)} Deps: ${String(s.total_dependencies).padStart(3)} Health: ${healthColor(s.health_score.toFixed(1))}`);
    });
  });

  console.log('\n' + chalk.gray(`Total: ${snapshots.length} snapshots`));
  console.log(chalk.gray('Use "devcompass history show <id>" to view details\n'));
}

function displaySnapshotTable(snapshots) {
  console.log('\n' + chalk.bold('📊 Snapshot History\n'));
  console.log(chalk.gray('ID'.padEnd(6)) + chalk.gray('Date & Time'.padEnd(22)) + chalk.gray('Project'.padEnd(25)) + chalk.gray('Deps'.padEnd(8)) + chalk.gray('Health'));
  console.log(chalk.gray('─'.repeat(80)));

  snapshots.forEach(s => {
    const healthColor = s.health_score >= 7 ? chalk.green : s.health_score >= 5 ? chalk.yellow : chalk.red;
    console.log(chalk.cyan(String(s.id).padEnd(6)) + chalk.white(formatDate(s.timestamp).padEnd(22)) + chalk.white(s.project_name.substring(0, 23).padEnd(25)) + chalk.white(String(s.total_dependencies).padEnd(8)) + healthColor(s.health_score.toFixed(1)));
  });

  console.log('\n' + chalk.gray('Use "devcompass history show <id>" to view details'));
  console.log(chalk.gray('Use "devcompass compare <id1> <id2>" to compare snapshots\n'));
}

function showSnapshot(options) {
  const snapshotId = options._[2];
  if (!snapshotId) { console.error(chalk.red('Error: Snapshot ID required')); process.exit(1); }

  const spinner = ora('Loading snapshot...').start();
  try {
    const data = loader.getSnapshot(snapshotId);
    spinner.succeed('Snapshot loaded');

    console.log('\n' + chalk.bold(`📦 Snapshot #${snapshotId} Details\n`));
    console.log(chalk.bold('Metadata:'));
    console.log(`  Date: ${chalk.cyan(formatDate(data.snapshot.timestamp))}`);
    console.log(`  Project: ${chalk.cyan(data.snapshot.project_name)} v${data.snapshot.project_version}`);
    console.log(`  Total Dependencies: ${chalk.cyan(data.snapshot.total_dependencies)}`);

    const healthColor = data.snapshot.health_score >= 7 ? chalk.green : data.snapshot.health_score >= 5 ? chalk.yellow : chalk.red;
    console.log(`  Health Score: ${healthColor(data.snapshot.health_score.toFixed(2))}/10\n`);

    const vulnerable = data.packages.filter(p => p.isVulnerable).length;
    const deprecated = data.packages.filter(p => p.isDeprecated).length;
    const outdated = data.packages.filter(p => p.isOutdated).length;

    console.log(chalk.bold('Package Summary:'));
    console.log(`  Total: ${chalk.cyan(data.packages.length)}`);
    console.log(`  Outdated: ${chalk.yellow(outdated)}`);
    console.log(`  Deprecated: ${chalk.magenta(deprecated)}`);
    console.log(`  Vulnerable: ${chalk.red(vulnerable)}\n`);
  } catch (error) {
    spinner.fail('Failed to load snapshot');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function saveSnapshotCmd(options) {
  console.log(chalk.yellow('💡 Snapshots are auto-saved when running "devcompass analyze"\n'));
}

function cleanupSnapshots(options) {
  const { keep: keepLast = 30, project: projectName = null } = options;
  const spinner = ora('Cleaning up old snapshots...').start();
  try {
    const deleted = loader.cleanup(keepLast, projectName);
    spinner.succeed('Cleanup complete');
    console.log(chalk.green(`✓ Deleted ${deleted} old snapshot(s)`));
    console.log(chalk.gray(`✓ Kept last ${keepLast} snapshot(s)\n`));
  } catch (error) {
    spinner.fail('Cleanup failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function showStats(options) {
  const spinner = ora('Calculating statistics...').start();
  try {
    const stats = loader.getStats(options.project || null);
    spinner.succeed('Statistics loaded');
    console.log('\n' + chalk.bold('📊 History Statistics\n'));
    console.log(`  Total Snapshots: ${chalk.cyan(stats.total_snapshots)}`);
    console.log(`  First Snapshot: ${chalk.gray(formatDate(stats.first_snapshot))}`);
    console.log(`  Last Snapshot: ${chalk.gray(formatDate(stats.last_snapshot))}`);
    const healthColor = stats.avg_health >= 7 ? chalk.green : stats.avg_health >= 5 ? chalk.yellow : chalk.red;
    console.log(`  Average Health: ${healthColor(stats.avg_health.toFixed(2))}/10\n`);
  } catch (error) {
    spinner.fail('Failed to calculate statistics');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function showMonthlySummary(options) {
  const spinner = ora('Calculating monthly summary...').start();
  try {
    const monthlyStats = loader.getMonthlyStats(options.project || null, options.year || null);
    if (!monthlyStats?.length) { spinner.warn('No snapshots found'); return; }

    spinner.succeed('Monthly summary generated');
    console.log('\n' + chalk.bold('📊 Monthly Snapshot Summary\n'));
    monthlyStats.forEach(stat => {
      const [year, month] = stat.month.split('-');
      const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const healthColor = stat.avg_health >= 7 ? chalk.green : stat.avg_health >= 5 ? chalk.yellow : chalk.red;
      console.log(`${chalk.cyan(monthName.padEnd(20))}  ${chalk.white(stat.count + ' snapshots').padEnd(15)}  Avg Health: ${healthColor(stat.avg_health.toFixed(2))}/10  Avg Deps: ${chalk.gray(Math.round(stat.avg_deps))}`);
    });
    console.log('');
  } catch (error) {
    spinner.fail('Failed to generate summary');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.bold('\n📚 DevCompass History Commands\n'));
  console.log('Usage: devcompass history <command> [options]\n');
  console.log('Commands: list, show <id>, summary, cleanup, stats\n');
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

module.exports = historyCommand;