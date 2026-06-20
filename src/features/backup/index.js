// src/features/backup/index.js

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const BackupManager = require('../../shared/utils/backup-manager');
const BackupRestorer = require('../../shared/utils/backup-restorer');
const OutputManager = require('../../shared/utils/output-manager');

async function backup(action, options = {}) {
  const projectPath = options.path || process.cwd();
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('\n❌ No package.json found in project directory\n'));
    process.exit(1);
  }

  const outputManager = new OutputManager(projectPath);
  const backupDir = outputManager.getBackupPath();
  const backupManager = new BackupManager(backupDir);
  const backupRestorer = new BackupRestorer(backupDir);

  try {
    switch (action) {
      case 'list': await listBackups(backupManager, outputManager); break;
      case 'restore': await restoreBackup(backupRestorer, outputManager, options); break;
      case 'clean': await cleanBackups(backupManager, options); break;
      case 'info': await showBackupInfo(backupManager, outputManager, options); break;
      default: showHelp(); break;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Backup operation failed:'), error.message);
    if (process.env.DEBUG) console.error(chalk.dim(error.stack));
    process.exit(1);
  }
}

async function listBackups(backupManager, outputManager) {
  console.log(chalk.bold.cyan('\n💾 DevCompass Backups\n'));
  const backups = await backupManager.listBackups();

  if (backups.length === 0) {
    console.log(chalk.gray('No backups found.'));
    console.log(chalk.gray('💡 Backups are created automatically when you run "devcompass fix"\n'));
    return;
  }

  console.log(chalk.bold(`Found ${chalk.cyan(backups.length)} backup(s)\n`));

  backups.forEach((backup, index) => {
    const metadata = backup.metadata;
    const timestamp = new Date(metadata.timestamp);
    console.log(chalk.bold(`${index + 1}. ${chalk.cyan(backup.name)}`));
    console.log(`   ${chalk.gray('Created:')} ${formatDate(timestamp)} ${chalk.gray(`(${getTimeAgo(timestamp)})`)}`);
    if (metadata.filesBackedUp) console.log(`   ${chalk.gray('Files:')} ${metadata.filesBackedUp.join(', ')}`);
    if (metadata.reason) console.log(`   ${chalk.gray('Reason:')} ${metadata.reason}`);
    if (metadata.healthScore !== undefined) console.log(`   ${chalk.gray('Health score:')} ${metadata.healthScore}/10`);
    console.log('');
  });

  console.log(chalk.gray('─'.repeat(70)));
  console.log(chalk.gray('\n💡 COMMANDS:'));
  console.log(chalk.gray('   Restore:'), chalk.cyan(`devcompass backup restore --name ${backups[0].name}`));
  console.log(chalk.gray('   Clean:'), chalk.cyan('devcompass backup clean\n'));
}

async function restoreBackup(backupRestorer, outputManager, options) {
  const backupName = options.name;
  if (!backupName) {
    console.error(chalk.red('\n❌ Please specify a backup name'));
    console.log(chalk.gray('\n  devcompass backup restore --name <backup-name>\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🔄 DevCompass Backup Restore\n'));

  const backupExists = await backupRestorer.backupExists(backupName);
  if (!backupExists) {
    console.error(chalk.red(`❌ Backup not found: ${backupName}`));
    console.log(chalk.gray('\nRun "devcompass backup list" to see available backups\n'));
    process.exit(1);
  }

  const backupInfo = await backupRestorer.getBackupInfo(backupName);
  console.log(chalk.bold('Backup details:'));
  console.log(`  ${chalk.gray('Name:')} ${backupName}`);
  console.log(`  ${chalk.gray('Created:')} ${formatDate(new Date(backupInfo.metadata.timestamp))}`);

  console.log(chalk.yellow('\n⚠️  WARNING: This will overwrite your current package.json and package-lock.json'));

  if (!options.force) {
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => { readline.question(chalk.yellow('\nContinue with restore? (y/N): '), resolve); });
    readline.close();
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') { console.log(chalk.gray('\nRestore cancelled.\n')); return; }
  }

  console.log(chalk.bold('\nStep 1: Creating backup of current state...\n'));
  const backupManager = new BackupManager(outputManager.getBackupPath());
  const currentBackupPath = await backupManager.createBackup('Before restore');
  if (currentBackupPath) console.log(chalk.green(`✓ Current state backed up: ${path.basename(currentBackupPath)}\n`));

  console.log(chalk.bold('Step 2: Restoring from backup...\n'));
  const result = await backupRestorer.restore(backupName);

  if (result.success) {
    console.log(chalk.green.bold('\n✓ Backup restored successfully!\n'));
    if (result.filesRestored) { console.log(chalk.bold('Files restored:')); result.filesRestored.forEach(file => console.log(`  ${chalk.green('✓')} ${file}`)); }
    console.log(chalk.yellow('\n⚠️  IMPORTANT: Run "npm install" to sync node_modules\n'));
  } else {
    console.error(chalk.red('\n❌ Restore failed:'), result.error);
    process.exit(1);
  }
}

async function cleanBackups(backupManager, options) {
  console.log(chalk.bold.cyan('\n🧹 DevCompass Backup Cleanup\n'));
  const { keep = 5, force = false } = options;
  const backups = await backupManager.listBackups();

  if (backups.length === 0) { console.log(chalk.gray('No backups to clean.\n')); return; }

  const toDelete = backups.length - keep;
  if (toDelete <= 0) { console.log(chalk.green(`✓ Only ${backups.length} backup(s) found. Keeping all (configured to keep ${keep}).\n`)); return; }

  console.log(chalk.bold(`Found ${chalk.cyan(backups.length)} backup(s)\nWill delete ${chalk.yellow(toDelete)} oldest, keeping latest ${chalk.cyan(keep)}\n`));

  const backupsToDelete = backups.slice(keep);
  console.log(chalk.bold('Backups to delete:'));
  backupsToDelete.forEach((backup, i) => { console.log(`  ${i + 1}. ${chalk.yellow(backup.name)} ${chalk.gray(`(${formatDate(new Date(backup.metadata.timestamp))})`)}`); });

  if (!force) {
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => { readline.question(chalk.yellow('\nDelete these backups? (y/N): '), resolve); });
    readline.close();
    if (answer.toLowerCase() !== 'y') { console.log(chalk.gray('\nCleanup cancelled.\n')); return; }
  }

  let deleted = 0, errors = 0;
  console.log('');
  for (const backup of backupsToDelete) {
    try { await backupManager.deleteBackup(backup.name); console.log(chalk.green(`✓ Deleted: ${backup.name}`)); deleted++; }
    catch (error) { console.error(chalk.red(`✗ Failed: ${backup.name}:`), error.message); errors++; }
  }
  console.log('');
  if (errors === 0) console.log(chalk.green.bold(`✓ Successfully deleted ${deleted} backup(s)!\n`));
  else console.log(chalk.yellow(`⚠️  Deleted ${deleted}, ${errors} error(s) occurred\n`));
}

async function showBackupInfo(backupManager, outputManager, options) {
  const backupName = options.name;
  if (!backupName) {
    console.error(chalk.red('\n❌ Please specify a backup name'));
    console.log(chalk.gray('\n  devcompass backup info --name <backup-name>\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n📋 DevCompass Backup Info\n'));
  const backup = await backupManager.getBackupInfo(backupName);

  if (!backup) { console.error(chalk.red(`❌ Backup not found: ${backupName}\n`)); process.exit(1); }

  const metadata = backup.metadata;
  const timestamp = new Date(metadata.timestamp);
  console.log(chalk.bold('Backup Details:'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log(`${chalk.bold('Name:')}          ${chalk.cyan(backupName)}`);
  console.log(`${chalk.bold('Created:')}       ${formatDate(timestamp)}`);
  console.log(`${chalk.bold('Age:')}           ${getTimeAgo(timestamp)}`);
  if (metadata.filesBackedUp) { console.log(chalk.bold('Files:')); metadata.filesBackedUp.forEach(file => console.log(`  ${chalk.gray('•')} ${file}`)); }
  if (metadata.reason) console.log(`${chalk.bold('Reason:')}        ${metadata.reason}`);
  if (metadata.healthScore !== undefined) console.log(`${chalk.bold('Health score:')}  ${metadata.healthScore}/10`);
  if (metadata.projectVersion) console.log(`${chalk.bold('Project ver:')}   ${metadata.projectVersion}`);
  if (metadata.devcompassVersion) console.log(`${chalk.bold('DevCompass:')}    v${metadata.devcompassVersion}`);
  console.log(chalk.gray('─'.repeat(70)));
  if (backup.files) {
    console.log(chalk.bold('\nFile Details:'));
    for (const [filename, filepath] of Object.entries(backup.files)) {
      if (fs.existsSync(filepath)) {
        const sizeKB = (fs.statSync(filepath).size / 1024).toFixed(2);
        console.log(`  ${chalk.cyan(filename.padEnd(20))} ${chalk.gray(`${sizeKB} KB`)}`);
      }
    }
  }
  console.log(chalk.gray(`\n💡 devcompass backup restore --name ${backupName}\n`));
}

function showHelp() {
  console.log(chalk.bold.cyan('\n💾 DevCompass Backup Manager\n'));
  console.log(chalk.bold('USAGE:'));
  console.log('  devcompass backup <command> [options]\n');
  console.log('Commands: list, restore, clean, info\n');
  console.log('Options:');
  console.log(`  ${chalk.cyan('-n, --name <name>')}   Backup name (for restore/info)`);
  console.log(`  ${chalk.cyan('-f, --force')}         Skip confirmation prompts`);
  console.log(`  ${chalk.cyan('--keep <n>')}          Number of backups to keep (default: 5)\n`);
}

function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

function getTimeAgo(date) {
  const diffMs = Date.now() - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
}

module.exports = backup;
module.exports.showHelp = showHelp;

