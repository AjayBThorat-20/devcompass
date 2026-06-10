const chalk = require('chalk');
const fs = require('fs');
const OutputManager = require('../utils/output-manager');

async function cleanCommand(options = {}) {
  const {
    projectPath = process.cwd(),
    all = false,
    cache = false,
    backups = false,
    temp = false,
    graphs = false,
    reports = false,
    force = false
  } = options;

  const outputManager = new OutputManager(projectPath);

  if (!outputManager.exists('root')) {
    console.log(chalk.yellow('\n⚠️  No .devcompass directory found'));
    console.log(chalk.gray('   Nothing to clean.\n'));
    return;
  }

  const summary = outputManager.getSummary();

  console.log(chalk.cyan('\n📁 DevCompass Output Directory\n'));
  console.log(`Location: ${chalk.white(summary.relativePath)}\n`);

  // Display current state
  let totalFiles = 0;
  let totalSize = 0;

  summary.directories.forEach(dir => {
    if (dir.exists && dir.type !== 'root') {
      const sizeMB = (dir.size / (1024 * 1024)).toFixed(2);
      console.log(`  ${dir.type.padEnd(10)} ${String(dir.files).padStart(3)} files  ${String(sizeMB).padStart(6)} MB`);
      totalFiles += dir.files;
      totalSize += dir.size;
    }
  });

  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(chalk.gray('  ' + '─'.repeat(35)));
  console.log(chalk.bold(`  Total      ${String(totalFiles).padStart(3)} files  ${String(totalSizeMB).padStart(6)} MB`));
  console.log('');

  // If no options specified, just show summary
  if (!force && !all && !cache && !backups && !temp && !graphs && !reports) {
    console.log(chalk.yellow('💡 Use one of these options to clean:\n'));
    console.log(chalk.white('  --all       ') + chalk.gray('Clean everything'));
    console.log(chalk.white('  --cache     ') + chalk.gray('Clean cache only'));
    console.log(chalk.white('  --backups   ') + chalk.gray('Clean backups only'));
    console.log(chalk.white('  --temp      ') + chalk.gray('Clean temp files only'));
    console.log(chalk.white('  --graphs    ') + chalk.gray('Clean generated graphs'));
    console.log(chalk.white('  --reports   ') + chalk.gray('Clean reports'));
    console.log(chalk.white('  --force     ') + chalk.gray('Skip confirmation\n'));
    return;
  }

  // Determine what to clean
  const toClean = [];
  if (all) {
    toClean.push('cache', 'backups', 'temp', 'graphs', 'reports');
  } else {
    if (cache) toClean.push('cache');
    if (backups) toClean.push('backups');
    if (temp) toClean.push('temp');
    if (graphs) toClean.push('graphs');
    if (reports) toClean.push('reports');
  }

  if (toClean.length === 0) {
    console.log(chalk.yellow('⚠️  No directories specified for cleaning\n'));
    return;
  }

  // Show what will be cleaned
  console.log(chalk.bold('Will clean:\n'));
  toClean.forEach(type => {
    const dir = summary.directories.find(d => d.type === type);
    if (dir && dir.exists) {
      const sizeMB = (dir.size / (1024 * 1024)).toFixed(2);
      console.log(`  ${chalk.yellow('✗')} ${type.padEnd(10)} ${dir.files} files (${sizeMB} MB)`);
    }
  });
  console.log('');

  // Confirmation
  if (!force) {
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question(chalk.yellow('Continue? (y/N): '), resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('\nCancelled.\n'));
        return;
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      return;
    }
  }

  // Clean directories
  let cleaned = 0;
  let errors = 0;

  console.log('');
  for (const type of toClean) {
    try {
      const dir = outputManager.getPath(type);
      
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = `${dir}/${file}`;
          try {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            // Ignore individual file errors
          }
        }
        
        console.log(chalk.green(`✓ Cleaned ${type}`));
        cleaned++;
      }
    } catch (error) {
      console.error(chalk.red(`✗ Failed to clean ${type}:`), error.message);
      errors++;
    }
  }

  console.log('');
  
  if (errors === 0) {
    console.log(chalk.green.bold(`✓ Successfully cleaned ${cleaned} director${cleaned === 1 ? 'y' : 'ies'}!\n`));
  } else {
    console.log(chalk.yellow(`⚠️  Cleaned ${cleaned} director${cleaned === 1 ? 'y' : 'ies'}, ${errors} error(s) occurred\n`));
  }

  // Show final state
  const finalSummary = outputManager.getSummary();
  let finalFiles = 0;
  let finalSize = 0;

  finalSummary.directories.forEach(dir => {
    if (dir.exists && dir.type !== 'root') {
      finalFiles += dir.files;
      finalSize += dir.size;
    }
  });

  const finalSizeMB = (finalSize / (1024 * 1024)).toFixed(2);
  const savedMB = ((totalSize - finalSize) / (1024 * 1024)).toFixed(2);

  console.log(chalk.cyan('📊 Result:\n'));
  console.log(`  Files remaining: ${finalFiles}`);
  console.log(`  Space remaining: ${finalSizeMB} MB`);
  console.log(`  ${chalk.green('Space freed:')}    ${chalk.bold(savedMB + ' MB')}\n`);
}

function showHelp() {
  console.log(chalk.bold.cyan('\n🧹 DevCompass Clean Command\n'));
  
  console.log(chalk.bold('USAGE:'));
  console.log('  devcompass clean [options]\n');
  
  console.log(chalk.bold('OPTIONS:'));
  console.log(`  ${chalk.cyan('--all')}          Clean all directories`);
  console.log(`  ${chalk.cyan('--cache')}        Clean cache only`);
  console.log(`  ${chalk.cyan('--backups')}      Clean backups only`);
  console.log(`  ${chalk.cyan('--temp')}         Clean temporary files`);
  console.log(`  ${chalk.cyan('--graphs')}       Clean generated graphs`);
  console.log(`  ${chalk.cyan('--reports')}      Clean reports`);
  console.log(`  ${chalk.cyan('--force')}        Skip confirmation\n`);
  
  console.log(chalk.bold('EXAMPLES:'));
  console.log(chalk.gray('  # Show summary'));
  console.log(chalk.cyan('  devcompass clean\n'));
  
  console.log(chalk.gray('  # Clean temp files'));
  console.log(chalk.cyan('  devcompass clean --temp\n'));
  
  console.log(chalk.gray('  # Clean cache and temp'));
  console.log(chalk.cyan('  devcompass clean --cache --temp\n'));
  
  console.log(chalk.gray('  # Clean everything'));
  console.log(chalk.cyan('  devcompass clean --all\n'));
  
  console.log(chalk.gray('  # Clean without confirmation'));
  console.log(chalk.cyan('  devcompass clean --temp --force\n'));
}

module.exports = cleanCommand;
module.exports.showHelp = showHelp;