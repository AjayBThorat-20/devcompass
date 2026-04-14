// src/commands/backup.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const BackupManager = require('../utils/backup-manager');
const BackupRestorer = require('../utils/backup-restorer');

async function backup(action, options = {}) {
  const projectPath = options.path || process.cwd();
  const backupManager = new BackupManager(projectPath);
  const backupRestorer = new BackupRestorer(projectPath);

  try {
    switch (action) {
      case 'list':
        await listBackups(backupManager);
        break;
      
      case 'restore':
        await restoreBackup(backupRestorer, options);
        break;
      
      case 'clean':
        await cleanBackups(backupManager, options);
        break;
      
      case 'info':
        await showBackupInfo(backupManager, options);
        break;
      
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Backup operation failed:'), error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function listBackups(backupManager) {
  console.log(chalk.bold.cyan('\n💾 DevCompass Backups\n'));

  const backups = await backupManager.listBackups();

  if (backups.length === 0) {
    console.log(chalk.gray('No backups found.\n'));
    console.log(chalk.gray('💡 TIP: Backups are created automatically when you run'), chalk.cyan('devcompass fix\n'));
    return;
  }

  console.log(chalk.bold(`Found ${chalk.cyan(backups.length)} backup(s):\n`));

  backups.forEach((backup, index) => {
    const metadata = backup.metadata;
    const timestamp = new Date(metadata.timestamp);
    const age = getTimeAgo(timestamp);
    
    console.log(chalk.bold(`${index + 1}. ${chalk.cyan(backup.name)}`));
    console.log(`   ${chalk.gray('Created:')} ${formatDate(timestamp)} ${chalk.gray(`(${age})`)}`);
    
    if (metadata.filesBackedUp) {
      console.log(`   ${chalk.gray('Files:')} ${metadata.filesBackedUp.join(', ')}`);
    }
    
    if (metadata.reason) {
      console.log(`   ${chalk.gray('Reason:')} ${metadata.reason}`);
    }
    
    if (metadata.fixesPending) {
      console.log(`   ${chalk.gray('Fixes pending:')} ${metadata.fixesPending}`);
    }
    
    if (metadata.healthScore !== undefined) {
      console.log(`   ${chalk.gray('Health score:')} ${metadata.healthScore}/10`);
    }
    
    console.log('');
  });

  console.log(chalk.gray('━'.repeat(70)));
  console.log(chalk.gray('\n💡 COMMANDS:'));
  console.log(chalk.gray('   Restore:'), chalk.cyan(`devcompass backup restore --name ${backups[0].name}`));
  console.log(chalk.gray('   Info:'), chalk.cyan(`devcompass backup info --name ${backups[0].name}`));
  console.log(chalk.gray('   Clean:'), chalk.cyan('devcompass backup clean\n'));
}

async function restoreBackup(backupRestorer, options) {
  const backupName = options.name;
  
  if (!backupName) {
    console.error(chalk.red('\n❌ Please specify a backup name'));
    console.log(chalk.gray('\nUsage:'), chalk.cyan('devcompass backup restore --name <backup-name>'));
    console.log(chalk.gray('\nTIP: Run'), chalk.cyan('devcompass backup list'), chalk.gray('to see available backups\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n🔄 DevCompass Backup Restore\n'));

  const force = options.force || false;

  // Check if backup exists
  const backupExists = await backupRestorer.backupExists(backupName);
  if (!backupExists) {
    console.error(chalk.red(`❌ Backup not found: ${backupName}`));
    console.log(chalk.gray('\nRun'), chalk.cyan('devcompass backup list'), chalk.gray('to see available backups\n'));
    process.exit(1);
  }

  // Show backup info
  const backupInfo = await backupRestorer.getBackupInfo(backupName);
  console.log(chalk.bold('Backup details:'));
  console.log(`  ${chalk.gray('Name:')} ${backupName}`);
  console.log(`  ${chalk.gray('Created:')} ${formatDate(new Date(backupInfo.metadata.timestamp))}`);
  
  if (backupInfo.metadata.filesBackedUp) {
    console.log(`  ${chalk.gray('Files:')} ${backupInfo.metadata.filesBackedUp.join(', ')}`);
  }

  // Warn about current state
  console.log(chalk.yellow('\n⚠️  WARNING: This will overwrite your current package.json and package-lock.json'));

  // Confirmation (unless forced)
  if (!force) {
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question(chalk.yellow('\nContinue with restore? (y/N): '), resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('\nRestore cancelled.\n'));
        return;
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Input error:'), error.message);
      return;
    }
  }

  // Create a backup of current state before restoring
  console.log(chalk.bold('\nStep 1: Creating backup of current state...\n'));
  const backupManager = new BackupManager(backupRestorer.projectPath);
  const currentBackupPath = await backupManager.createBackup('Before restore');
  
  if (currentBackupPath) {
    console.log(chalk.green(`✓ Current state backed up: ${path.basename(currentBackupPath)}\n`));
  }

  // Restore the backup
  console.log(chalk.bold('Step 2: Restoring from backup...\n'));
  const result = await backupRestorer.restore(backupName);

  if (result.success) {
    console.log(chalk.green.bold('\n✓ Backup restored successfully!\n'));
    
    if (result.filesRestored) {
      console.log(chalk.bold('Files restored:'));
      result.filesRestored.forEach(file => {
        console.log(`  ${chalk.green('✓')} ${file}`);
      });
    }

    console.log(chalk.yellow('\n⚠️  IMPORTANT: Run'), chalk.cyan('npm install'), chalk.yellow('to sync node_modules\n'));
  } else {
    console.error(chalk.red('\n❌ Restore failed:'), result.error);
    
    if (currentBackupPath) {
      console.log(chalk.yellow('\n💡 Your current state was backed up to:'));
      console.log(chalk.cyan(`   ${path.basename(currentBackupPath)}\n`));
    }
    
    process.exit(1);
  }
}

async function cleanBackups(backupManager, options) {
  console.log(chalk.bold.cyan('\n🧹 DevCompass Backup Cleanup\n'));

  const keep = options.keep || 5;
  const force = options.force || false;

  const backups = await backupManager.listBackups();

  if (backups.length === 0) {
    console.log(chalk.gray('No backups to clean.\n'));
    return;
  }

  const toDelete = backups.length - keep;

  if (toDelete <= 0) {
    console.log(chalk.green(`✓ Only ${backups.length} backup(s) found. Keeping all (configured to keep ${keep}).\n`));
    return;
  }

  console.log(chalk.bold(`Found ${chalk.cyan(backups.length)} backup(s)`));
  console.log(chalk.bold(`Will delete ${chalk.yellow(toDelete)} oldest backup(s), keeping latest ${chalk.cyan(keep)}\n`));

  const backupsToDelete = backups.slice(keep);

  console.log(chalk.bold('Backups to delete:'));
  backupsToDelete.forEach((backup, index) => {
    const timestamp = new Date(backup.metadata.timestamp);
    console.log(`  ${index + 1}. ${chalk.yellow(backup.name)} ${chalk.gray(`(${formatDate(timestamp)})`)}`);
  });

  // Confirmation (unless forced)
  if (!force) {
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question(chalk.yellow('\nDelete these backups? (y/N): '), resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('\nCleanup cancelled.\n'));
        return;
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Input error:'), error.message);
      return;
    }
  }

  // Delete backups
  console.log('');
  let deleted = 0;
  let errors = 0;

  for (const backup of backupsToDelete) {
    try {
      await backupManager.deleteBackup(backup.name);
      console.log(chalk.green(`✓ Deleted: ${backup.name}`));
      deleted++;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to delete ${backup.name}:`), error.message);
      errors++;
    }
  }

  console.log('');
  
  if (errors === 0) {
    console.log(chalk.green.bold(`✓ Successfully deleted ${deleted} backup(s)!\n`));
  } else {
    console.log(chalk.yellow(`⚠️  Deleted ${deleted} backup(s), ${errors} error(s) occurred\n`));
  }
}

async function showBackupInfo(backupManager, options) {
  const backupName = options.name;
  
  if (!backupName) {
    console.error(chalk.red('\n❌ Please specify a backup name'));
    console.log(chalk.gray('\nUsage:'), chalk.cyan('devcompass backup info --name <backup-name>'));
    console.log(chalk.gray('\nTIP: Run'), chalk.cyan('devcompass backup list'), chalk.gray('to see available backups\n'));
    process.exit(1);
  }

  console.log(chalk.bold.cyan('\n📋 DevCompass Backup Info\n'));

  const backup = await backupManager.getBackupInfo(backupName);

  if (!backup) {
    console.error(chalk.red(`❌ Backup not found: ${backupName}\n`));
    process.exit(1);
  }

  const metadata = backup.metadata;
  const timestamp = new Date(metadata.timestamp);

  console.log(chalk.bold('Backup Details:'));
  console.log(chalk.gray('━'.repeat(70)));
  console.log(`${chalk.bold('Name:')}          ${chalk.cyan(backupName)}`);
  console.log(`${chalk.bold('Created:')}       ${formatDate(timestamp)}`);
  console.log(`${chalk.bold('Age:')}           ${getTimeAgo(timestamp)}`);
  console.log(`${chalk.bold('Location:')}      ${backup.path}`);

  if (metadata.filesBackedUp && metadata.filesBackedUp.length > 0) {
    console.log(`${chalk.bold('Files backed up:')}`);
    metadata.filesBackedUp.forEach(file => {
      console.log(`  ${chalk.gray('•')} ${file}`);
    });
  }

  if (metadata.reason) {
    console.log(`${chalk.bold('Reason:')}        ${metadata.reason}`);
  }

  if (metadata.fixesPending !== undefined) {
    console.log(`${chalk.bold('Fixes pending:')} ${metadata.fixesPending}`);
  }

  if (metadata.healthScore !== undefined) {
    console.log(`${chalk.bold('Health score:')}  ${metadata.healthScore}/10`);
  }

  if (metadata.projectVersion) {
    console.log(`${chalk.bold('Project ver:')}   ${metadata.projectVersion}`);
  }
  
  if (metadata.devcompassVersion) {
    console.log(`${chalk.bold('DevCompass:')}    v${metadata.devcompassVersion}`);
  }

  console.log(chalk.gray('━'.repeat(70)));

  // File sizes
  if (backup.files) {
    console.log(chalk.bold('\nFile Details:'));
    
    for (const [filename, filepath] of Object.entries(backup.files)) {
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${chalk.cyan(filename.padEnd(20))} ${chalk.gray(`${sizeKB} KB`)}`);
      }
    }
  }

  console.log(chalk.gray('\n💡 RESTORE THIS BACKUP:'));
  console.log(chalk.cyan(`   devcompass backup restore --name ${backupName}\n`));
}

function showHelp() {
  console.log(chalk.bold.cyan('\n💾 DevCompass Backup Manager\n'));
  
  console.log(chalk.bold('USAGE:'));
  console.log('  devcompass backup <command> [options]\n');
  
  console.log(chalk.bold('COMMANDS:'));
  console.log(`  ${chalk.cyan('list')}                    List all available backups`);
  console.log(`  ${chalk.cyan('restore')}                 Restore from a specific backup`);
  console.log(`  ${chalk.cyan('clean')}                   Clean old backups (keeps latest 5)`);
  console.log(`  ${chalk.cyan('info')}                    Show detailed backup information\n`);
  
  console.log(chalk.bold('OPTIONS:'));
  console.log(`  ${chalk.cyan('-p, --path <dir>')}        Project directory (default: current)`);
  console.log(`  ${chalk.cyan('-n, --name <name>')}       Backup name (for restore/info)`);
  console.log(`  ${chalk.cyan('-f, --force')}             Skip confirmation prompts`);
  console.log(`  ${chalk.cyan('--keep <n>')}              Number of backups to keep (default: 5)\n`);
  
  console.log(chalk.bold('EXAMPLES:'));
  console.log(chalk.gray('  # List all backups'));
  console.log(chalk.cyan('  devcompass backup list\n'));
  
  console.log(chalk.gray('  # Restore from a backup'));
  console.log(chalk.cyan('  devcompass backup restore --name backup-2026-04-06T12-00-00-000Z\n'));
  
  console.log(chalk.gray('  # Show backup details'));
  console.log(chalk.cyan('  devcompass backup info --name backup-2026-04-06T12-00-00-000Z\n'));
  
  console.log(chalk.gray('  # Clean old backups'));
  console.log(chalk.cyan('  devcompass backup clean\n'));
  
  console.log(chalk.gray('  # Clean keeping only 3 backups'));
  console.log(chalk.cyan('  devcompass backup clean --keep 3\n'));
  
  console.log(chalk.gray('  # Force restore without confirmation'));
  console.log(chalk.cyan('  devcompass backup restore --name <backup-name> --force\n'));
}

// Helper functions

function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
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