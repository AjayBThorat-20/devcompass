// src/features/clean/index.js

const chalk = require('chalk');
const fs = require('fs');
const OutputManager = require('../../shared/utils/output-manager');

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
    console.log(chalk.yellow('\n⚠️  No .depvora directory found. Nothing to clean.\n'));
    return;
  }

  const summary = outputManager.getSummary();
  console.log(chalk.cyan('\n📁 Depvora Output Directory\n'));
  console.log(`Location: ${chalk.white(summary.relativePath)}\n`);

  let totalFiles = 0, totalSize = 0;
  summary.directories.forEach(dir => {
    if (dir.exists && dir.type !== 'root') {
      const sizeMB = (dir.size / (1024 * 1024)).toFixed(2);
      console.log(`  ${dir.type.padEnd(10)} ${String(dir.files).padStart(3)} files  ${String(sizeMB).padStart(6)} MB`);
      totalFiles += dir.files;
      totalSize += dir.size;
    }
  });
  console.log(chalk.gray('  ' + '─'.repeat(35)));
  console.log(chalk.bold(`  Total      ${String(totalFiles).padStart(3)} files  ${String((totalSize / (1024 * 1024)).toFixed(2)).padStart(6)} MB`));
  console.log('');

  if (!force && !all && !cache && !backups && !temp && !graphs && !reports) {
    console.log(chalk.yellow('💡 Use one of these options to clean:\n'));
    console.log(chalk.white('  --all       ') + chalk.gray('Clean everything'));
    console.log(chalk.white('  --cache     ') + chalk.gray('Clean cache only'));
    console.log(chalk.white('  --backups   ') + chalk.gray('Clean backups only'));
    console.log(chalk.white('  --temp      ') + chalk.gray('Clean temp files'));
    console.log(chalk.white('  --graphs    ') + chalk.gray('Clean generated graphs'));
    console.log(chalk.white('  --reports   ') + chalk.gray('Clean reports'));
    console.log(chalk.white('  --force     ') + chalk.gray('Skip confirmation\n'));
    return;
  }

  const toClean = all ? ['cache', 'backups', 'temp', 'graphs', 'reports'] : [];
  if (!all) {
    if (cache) toClean.push('cache');
    if (backups) toClean.push('backups');
    if (temp) toClean.push('temp');
    if (graphs) toClean.push('graphs');
    if (reports) toClean.push('reports');
  }

  if (toClean.length === 0) { console.log(chalk.yellow('⚠️  No directories specified for cleaning\n')); return; }

  console.log(chalk.bold('Will clean:\n'));
  toClean.forEach(type => {
    const dir = summary.directories.find(d => d.type === type);
    if (dir?.exists) console.log(`  ${chalk.yellow('✗')} ${type.padEnd(10)} ${dir.files} files (${(dir.size / (1024 * 1024)).toFixed(2)} MB)`);
  });
  console.log('');

  if (!force) {
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => { readline.question(chalk.yellow('Continue? (y/N): '), resolve); });
    readline.close();
    if (answer.toLowerCase() !== 'y') { console.log(chalk.gray('\nCancelled.\n')); return; }
  }

  let cleaned = 0, errors = 0;
  console.log('');
  for (const type of toClean) {
    try {
      const dir = outputManager.getPath(type);
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          try {
            const filePath = `${dir}/${file}`;
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) fs.rmSync(filePath, { recursive: true, force: true });
            else fs.unlinkSync(filePath);
          } catch (err) { /* ignore individual file errors */ }
        });
        console.log(chalk.green(`✓ Cleaned ${type}`));
        cleaned++;
      }
    } catch (error) {
      console.error(chalk.red(`✗ Failed to clean ${type}:`), error.message);
      errors++;
    }
  }

  console.log('');
  if (errors === 0) console.log(chalk.green.bold(`✓ Successfully cleaned ${cleaned} director${cleaned === 1 ? 'y' : 'ies'}!\n`));
  else console.log(chalk.yellow(`⚠️  Cleaned ${cleaned}, ${errors} error(s) occurred\n`));

  const finalSummary = outputManager.getSummary();
  let finalFiles = 0, finalSize = 0;
  finalSummary.directories.forEach(dir => { if (dir.exists && dir.type !== 'root') { finalFiles += dir.files; finalSize += dir.size; } });
  const savedMB = ((totalSize - finalSize) / (1024 * 1024)).toFixed(2);

  console.log(chalk.cyan('📊 Result:\n'));
  console.log(`  Files remaining: ${finalFiles}`);
  console.log(`  ${chalk.green('Space freed:')}    ${chalk.bold(savedMB + ' MB')}\n`);
}

module.exports = cleanCommand;