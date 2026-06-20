// src/features/history/snapshot.command.js

const chalk = require('chalk');
const snapshotLoader = require('./snapshot-loader');
const snapshotSaver = require('./snapshot-saver');
const path = require('path');
const fs = require('fs');

async function saveSnapshot(options = {}) {
  console.log(chalk.yellow('💡 Snapshots are auto-saved when running "devcompass analyze"\n'));
}

async function listSnapshots(options = {}) {
  try {
    console.log(chalk.bold.cyan('\n📋 Dependency Snapshots\n'));
    const snapshots = snapshotLoader.listSnapshots(options.project, options.limit || 20);

    if (!snapshots?.length) {
      console.log(chalk.yellow('No snapshots found.\n'));
      console.log(chalk.gray('   devcompass analyze (auto-saves snapshot)\n'));
      return;
    }

    console.log(chalk.bold('ID'.padEnd(6)) + chalk.bold('Project'.padEnd(25)) + chalk.bold('Version'.padEnd(12)) + chalk.bold('Health'.padEnd(10)) + chalk.bold('Deps'.padEnd(8)) + chalk.bold('Date'));
    console.log('─'.repeat(90));

    snapshots.forEach(snapshot => {
      const healthColor = snapshot.health_score >= 7 ? chalk.green : snapshot.health_score >= 5 ? chalk.yellow : chalk.red;
      console.log(
        chalk.cyan(String(snapshot.id).padEnd(6)) +
        chalk.white(String(snapshot.project_name).substring(0, 23).padEnd(25)) +
        chalk.gray(String(snapshot.project_version || 'N/A').substring(0, 10).padEnd(12)) +
        healthColor((snapshot.health_score || 0).toFixed(1).padEnd(10)) +
        chalk.gray(String(snapshot.total_dependencies || 0).padEnd(8)) +
        chalk.dim(new Date(snapshot.timestamp).toLocaleString())
      );
    });

    console.log('─'.repeat(90));
    console.log(chalk.gray(`\nTotal: ${snapshots.length} snapshot(s)\n`));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to list snapshots\n'), chalk.gray(error.message));
    if (process.env.DEBUG) console.error(chalk.dim(error.stack));
    process.exit(1);
  }
}

async function viewSnapshot(snapshotId, options = {}) {
  try {
    console.log(chalk.bold.cyan(`\n📸 Snapshot #${snapshotId}\n`));
    let data;
    try {
      data = snapshotLoader.getSnapshot(snapshotId);
    } catch (error) {
      console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`));
      console.log(chalk.gray('💡 List all snapshots: devcompass snapshot list\n'));
      const recent = snapshotLoader.listSnapshots(null, 5);
      if (recent?.length) {
        console.log(chalk.bold('Recent snapshots:'));
        recent.forEach(s => console.log(chalk.gray(`   #${s.id} - ${s.project_name} (${new Date(s.timestamp).toLocaleDateString()})`)));
      }
      process.exit(1);
    }

    if (!data?.snapshot) { console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`)); process.exit(1); }

    const { snapshot, packages = [] } = data;
    console.log(chalk.bold('Project Information:'));
    console.log(chalk.gray(`  Name: ${snapshot.project_name || 'Unknown'}`));
    console.log(chalk.gray(`  Version: ${snapshot.project_version || 'Unknown'}`));
    console.log(chalk.gray(`  Date: ${new Date(snapshot.timestamp).toLocaleString()}\n`));

    console.log(chalk.bold('Health Metrics:'));
    const healthScore = snapshot.health_score || 0;
    const healthColor = healthScore >= 7 ? chalk.green : healthScore >= 5 ? chalk.yellow : chalk.red;
    console.log(chalk.gray(`  Health Score: `) + healthColor(`${healthScore.toFixed(1)}/10`));
    console.log(chalk.gray(`  Total Dependencies: ${snapshot.total_dependencies || 0}\n`));

    if (packages.length > 0) {
      console.log(chalk.bold('Package Summary:'));
      const vulnerable = packages.filter(p => p.isVulnerable).length;
      const deprecated = packages.filter(p => p.isDeprecated).length;
      const outdated = packages.filter(p => p.isOutdated).length;
      const unused = packages.filter(p => p.isUnused).length;
      if (vulnerable > 0) console.log(chalk.red(`  🔴 Vulnerable: ${vulnerable}`));
      if (deprecated > 0) console.log(chalk.yellow(`  ⚠️  Deprecated: ${deprecated}`));
      if (outdated > 0) console.log(chalk.yellow(`  📦 Outdated: ${outdated}`));
      if (unused > 0) console.log(chalk.gray(`  🗑️  Unused: ${unused}`));
      if (!vulnerable && !deprecated && !outdated && !unused) console.log(chalk.green('  ✅ All packages healthy'));
      console.log('');
    }

    console.log(chalk.bold('💡 Available Actions:'));
    console.log(chalk.gray('  Compare: devcompass compare <id1> <id2>'));
    console.log(chalk.gray('  Delete: devcompass snapshot delete ' + snapshotId + '\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to view snapshot\n'), chalk.gray(error.message));
    if (process.env.DEBUG) console.error(chalk.dim(error.stack));
    process.exit(1);
  }
}

async function deleteSnapshot(snapshotId, options = {}) {
  try {
    let snapshot;
    try {
      const data = snapshotLoader.getSnapshot(snapshotId);
      snapshot = data.snapshot;
    } catch (error) {
      console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`));
      process.exit(1);
    }

    if (!options.yes) {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise(resolve => {
        rl.question(chalk.yellow(`⚠️  Delete snapshot #${snapshotId} (${snapshot.project_name || 'Unknown'})? [y/N] `), answer => { rl.close(); resolve(answer); });
      });
      if (answer.toLowerCase() !== 'y') { console.log(chalk.gray('\nCancelled.\n')); process.exit(0); }
    }

    const db = require('./history.database');
    const database = db.connect();
    database.transaction(() => {
      database.prepare('DELETE FROM packages WHERE snapshot_id = ?').run(snapshotId);
      database.prepare('DELETE FROM dependencies WHERE snapshot_id = ?').run(snapshotId);
      database.prepare('DELETE FROM snapshots WHERE id = ?').run(snapshotId);
    })();

    console.log(chalk.green('\n✅ Snapshot deleted successfully!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to delete snapshot\n'), chalk.gray(error.message));
    if (process.env.DEBUG) console.error(chalk.dim(error.stack));
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.bold.cyan('\n📸 DevCompass Snapshot Command\n'));
  console.log('  devcompass snapshot save');
  console.log('  devcompass snapshot list');
  console.log('  devcompass snapshot view <id>');
  console.log('  devcompass snapshot delete <id>\n');
}

module.exports = { saveSnapshot, listSnapshots, viewSnapshot, deleteSnapshot, showHelp };