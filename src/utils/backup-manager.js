// src/utils/backup-manager.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class BackupManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupDir = path.join(projectPath, '.devcompass-backups');
  }

  async createBackup() {
    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}`);

      // Create backup subdirectory
      fs.mkdirSync(backupPath, { recursive: true });

      // Backup package.json
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        fs.copyFileSync(
          packageJsonPath,
          path.join(backupPath, 'package.json')
        );
      }

      // Backup package-lock.json
      const packageLockPath = path.join(this.projectPath, 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        fs.copyFileSync(
          packageLockPath,
          path.join(backupPath, 'package-lock.json')
        );
      }

      // Save metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        path: backupPath
      };
      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Clean old backups (keep last 5)
      this.cleanOldBackups();

      return backupPath;
    } catch (error) {
      console.error(chalk.yellow('Warning: Failed to create backup:'), error.message);
      return null;
    }
  }

  cleanOldBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return;

      const backups = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only the 5 most recent backups
      const backupsToDelete = backups.slice(5);
      backupsToDelete.forEach(backup => {
        fs.rmSync(backup.path, { recursive: true, force: true });
      });
    } catch (error) {
      // Silently fail - backup cleanup is not critical
    }
  }

  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];

      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-'))
        .map(file => {
          const metadataPath = path.join(this.backupDir, file, 'metadata.json');
          let metadata = { timestamp: 'Unknown' };
          
          if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          }

          return {
            name: file,
            path: path.join(this.backupDir, file),
            timestamp: metadata.timestamp
          };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      return [];
    }
  }
}

module.exports = BackupManager;