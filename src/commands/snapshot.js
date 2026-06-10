// src/commands/snapshot.js
const chalk = require('chalk');
const snapshotSaver = require('../history/snapshot-saver');
const snapshotLoader = require('../history/snapshot-loader');
const path = require('path');
const fs = require('fs');

async function saveSnapshot(options = {}) {
  try {
    console.log(chalk.bold.cyan('\n📸 Saving Snapshot...\n'));

    // Load current analysis data
    const cacheFile = path.join(process.cwd(), '.devcompass-cache.json');
    if (!fs.existsSync(cacheFile)) {
      console.log(chalk.red('❌ No analysis data found.'));
      console.log(chalk.yellow('\n💡 Run analysis first:'));
      console.log(chalk.gray('   devcompass analyze\n'));
      process.exit(1);
    }

    const analysisData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

    // Build graph data from analysis
    const graphData = {
      nodes: buildNodesFromAnalysis(analysisData),
      links: buildLinksFromAnalysis(analysisData),
      metadata: {
        projectName: analysisData.projectName || 'Unknown',
        projectVersion: analysisData.version || '1.0.0',
        healthScore: analysisData.healthScore || 8.0
      }
    };

    // Save snapshot using your API
    const result = snapshotSaver.saveSnapshot(analysisData, graphData);

    console.log(chalk.green('✅ Snapshot saved successfully!\n'));
    console.log(chalk.bold('📸 Snapshot Info:'));
    console.log(chalk.gray(`   ID: ${result.snapshotId}`));
    console.log(chalk.gray(`   Packages: ${result.nodes}`));
    console.log(chalk.gray(`   Dependencies: ${result.links}`));
    console.log(chalk.gray(`   Duration: ${result.duration}ms\n`));
    console.log(chalk.bold('💡 Next Steps:'));
    console.log(chalk.gray('   View all: devcompass snapshot list'));
    console.log(chalk.gray('   Compare: devcompass compare <id1> <id2>\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Failed to save snapshot\n'));
    console.error(chalk.gray(`Error: ${error.message}\n`));
    
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

async function listSnapshots(options = {}) {
  try {
    console.log(chalk.bold.cyan('\n📋 Dependency Snapshots\n'));

    // Use your actual API: listSnapshots(projectName, limit)
    const snapshots = snapshotLoader.listSnapshots(options.project, options.limit || 20);

    if (!snapshots || snapshots.length === 0) {
      console.log(chalk.yellow('No snapshots found.'));
      console.log(chalk.gray('\n💡 Create your first snapshot:'));
      console.log(chalk.gray('   devcompass analyze (auto-saves snapshot)\n'));
      return;
    }

    // Display as table
    console.log(chalk.bold('ID'.padEnd(6)) + 
                chalk.bold('Project'.padEnd(25)) + 
                chalk.bold('Version'.padEnd(12)) + 
                chalk.bold('Health'.padEnd(10)) + 
                chalk.bold('Deps'.padEnd(8)) + 
                chalk.bold('Date'));
    console.log('─'.repeat(90));

    snapshots.forEach(snapshot => {
      const healthColor = snapshot.health_score >= 7 ? chalk.green : 
                         snapshot.health_score >= 5 ? chalk.yellow : chalk.red;
      
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
    console.error(chalk.red('\n❌ Failed to list snapshots\n'));
    console.error(chalk.gray(`Error: ${error.message}\n`));
    
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

async function viewSnapshot(snapshotId, options = {}) {
  try {
    if (!snapshotId) {
      console.log(chalk.red('❌ Snapshot ID is required\n'));
      console.log(chalk.gray('Usage: devcompass snapshot view <id>\n'));
      process.exit(1);
    }

    console.log(chalk.bold.cyan(`\n📸 Snapshot #${snapshotId}\n`));

    // Use your actual API: getSnapshot returns { snapshot, packages, dependencies }
    let data;
    try {
      data = snapshotLoader.getSnapshot(snapshotId);
    } catch (error) {
      console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`));
      console.log(chalk.gray('💡 List all snapshots: devcompass snapshot list\n'));
      
      // Show recent snapshots as a helpful hint
      const recent = snapshotLoader.listSnapshots(null, 5);
      if (recent && recent.length > 0) {
        console.log(chalk.bold('Recent snapshots:'));
        recent.forEach(s => {
          console.log(chalk.gray(`   #${s.id} - ${s.project_name} (${new Date(s.timestamp).toLocaleDateString()})`));
        });
        console.log('');
      }
      
      process.exit(1);
    }

    if (!data || !data.snapshot) {
      console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`));
      console.log(chalk.gray('💡 List all snapshots: devcompass snapshot list\n'));
      process.exit(1);
    }

    const snapshot = data.snapshot;
    const packages = data.packages || [];

    // Display snapshot details
    console.log(chalk.bold('Project Information:'));
    console.log(chalk.gray(`  Name: ${snapshot.project_name || 'Unknown'}`));
    console.log(chalk.gray(`  Version: ${snapshot.project_version || 'Unknown'}`));
    console.log(chalk.gray(`  Path: ${snapshot.project_path || 'Unknown'}`));
    console.log(chalk.gray(`  Date: ${new Date(snapshot.timestamp).toLocaleString()}\n`));

    console.log(chalk.bold('Health Metrics:'));
    const healthScore = snapshot.health_score || 0;
    const healthColor = healthScore >= 7 ? chalk.green : 
                       healthScore >= 5 ? chalk.yellow : chalk.red;
    console.log(chalk.gray(`  Health Score: `) + healthColor(`${healthScore.toFixed(1)}/10`));
    console.log(chalk.gray(`  Total Dependencies: ${snapshot.total_dependencies || 0}`));
    console.log(chalk.gray(`  Node Count: ${snapshot.node_count || 0}\n`));

    // Package summary
    if (packages && packages.length > 0) {
      console.log(chalk.bold('Package Summary:'));
      
      const vulnerable = packages.filter(p => p.isVulnerable).length;
      const deprecated = packages.filter(p => p.isDeprecated).length;
      const outdated = packages.filter(p => p.isOutdated).length;
      const unused = packages.filter(p => p.isUnused).length;

      if (vulnerable > 0) console.log(chalk.red(`  🔴 Vulnerable: ${vulnerable}`));
      if (deprecated > 0) console.log(chalk.yellow(`  ⚠️  Deprecated: ${deprecated}`));
      if (outdated > 0) console.log(chalk.yellow(`  📦 Outdated: ${outdated}`));
      if (unused > 0) console.log(chalk.gray(`  🗑️  Unused: ${unused}`));
      
      if (vulnerable === 0 && deprecated === 0 && outdated === 0 && unused === 0) {
        console.log(chalk.green('  ✅ All packages healthy'));
      }
      console.log('');
    }

    // Top packages by health
    if (options.verbose && packages && packages.length > 0) {
      console.log(chalk.bold('Top 10 Packages:\n'));
      packages
        .sort((a, b) => (a.health_score || 0) - (b.health_score || 0))
        .slice(0, 10)
        .forEach(pkg => {
          const pkgHealth = pkg.health_score || 0;
          const healthColor = pkgHealth >= 7 ? chalk.green : 
                            pkgHealth >= 5 ? chalk.yellow : chalk.red;
          console.log(`  ${healthColor(pkgHealth.toFixed(1))} ${chalk.cyan(pkg.name)} ${chalk.gray(`@${pkg.version}`)}`);
        });
      console.log('');
    }

    console.log(chalk.bold('💡 Available Actions:'));
    console.log(chalk.gray('  Compare: devcompass compare <id1> <id2>'));
    console.log(chalk.gray('  Delete: devcompass snapshot delete ' + snapshotId + '\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Failed to view snapshot\n'));
    console.error(chalk.gray(`Error: ${error.message}\n`));
    
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

async function deleteSnapshot(snapshotId, options = {}) {
  try {
    if (!snapshotId) {
      console.log(chalk.red('❌ Snapshot ID is required\n'));
      console.log(chalk.gray('Usage: devcompass snapshot delete <id>\n'));
      process.exit(1);
    }

    // Check if snapshot exists
    let snapshot;
    try {
      const data = snapshotLoader.getSnapshot(snapshotId);
      snapshot = data.snapshot;
    } catch (error) {
      console.log(chalk.red(`❌ Snapshot #${snapshotId} not found\n`));
      process.exit(1);
    }

    // Confirmation prompt (unless --yes flag)
    if (!options.yes) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question(
          chalk.yellow(`⚠️  Delete snapshot #${snapshotId} (${snapshot.project_name || 'Unknown'})? [y/N] `),
          answer => {
            rl.close();
            resolve(answer);
          }
        );
      });

      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.gray('\nCancelled.\n'));
        process.exit(0);
      }
    }

    // Delete snapshot - your API uses cleanup method
    // We need to manually delete via database
    const db = require('../history/database');
    const database = db.connect();
    
    const deleteTransaction = database.transaction(() => {
      // Delete packages
      database.prepare('DELETE FROM packages WHERE snapshot_id = ?').run(snapshotId);
      
      // Delete dependencies
      database.prepare('DELETE FROM dependencies WHERE snapshot_id = ?').run(snapshotId);
      
      // Delete snapshot
      database.prepare('DELETE FROM snapshots WHERE id = ?').run(snapshotId);
    });
    
    deleteTransaction();

    console.log(chalk.green('\n✅ Snapshot deleted successfully!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Failed to delete snapshot\n'));
    console.error(chalk.gray(`Error: ${error.message}\n`));
    
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    
    process.exit(1);
  }
}

function buildNodesFromAnalysis(analysisData) {
  const nodes = [];
  
  if (analysisData.dependencies) {
    analysisData.dependencies.forEach(dep => {
      nodes.push({
        name: dep.name,
        version: dep.version || 'unknown',
        healthScore: 8.0,
        type: 'dependency'
      });
    });
  }
  
  return nodes;
}

function buildLinksFromAnalysis(analysisData) {
  const links = [];
  const rootName = analysisData.projectName || 'root';
  
  if (analysisData.dependencies) {
    analysisData.dependencies.forEach(dep => {
      links.push({
        source: rootName,
        target: dep.name
      });
    });
  }
  
  return links;
}

function showHelp() {
  console.log(chalk.bold.cyan('\n📸 DevCompass Snapshot Command\n'));
  console.log(chalk.bold('Usage:'));
  console.log(chalk.gray('  devcompass snapshot <subcommand> [options]\n'));
  console.log(chalk.bold('Subcommands:'));
  console.log(chalk.cyan('  save                  ') + chalk.gray('Save current state as snapshot'));
  console.log(chalk.cyan('  list                  ') + chalk.gray('List all snapshots'));
  console.log(chalk.cyan('  view <id>             ') + chalk.gray('View snapshot details'));
  console.log(chalk.cyan('  delete <id>           ') + chalk.gray('Delete a snapshot\n'));
  console.log(chalk.bold('Options:'));
  console.log(chalk.cyan('  --project <name>      ') + chalk.gray('Filter by project name (list)'));
  console.log(chalk.cyan('  --limit <n>           ') + chalk.gray('Limit results (default: 20)'));
  console.log(chalk.cyan('  --verbose, -v         ') + chalk.gray('Show detailed information (view)'));
  console.log(chalk.cyan('  --yes, -y             ') + chalk.gray('Skip confirmation (delete)'));
  console.log(chalk.cyan('  --help                ') + chalk.gray('Show this help message\n'));
  console.log(chalk.bold('Examples:'));
  console.log(chalk.gray('  devcompass snapshot save'));
  console.log(chalk.gray('  devcompass snapshot list'));
  console.log(chalk.gray('  devcompass snapshot list --project myapp'));
  console.log(chalk.gray('  devcompass snapshot view 123'));
  console.log(chalk.gray('  devcompass snapshot view 123 --verbose'));
  console.log(chalk.gray('  devcompass snapshot delete 123'));
  console.log(chalk.gray('  devcompass snapshot delete 123 --yes\n'));
}

module.exports = {
  saveSnapshot,
  listSnapshots,
  viewSnapshot,
  deleteSnapshot,
  showHelp
};