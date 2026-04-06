// src/utils/backup-manager.js
const fs = require('fs');
const path = require('path');

class BackupManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupDir = path.join(projectPath, '.devcompass-backups');
  }

  async createBackup(reason = 'Manual backup', metadata = {}) {
    try {
      // ✅ ADDED: Validate project has package.json
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('No package.json found in project directory');
      }

      // Create backup directory if it doesn't exist
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      // Generate backup folder name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Create backup folder
      fs.mkdirSync(backupPath, { recursive: true });

      // Files to backup
      const filesToBackup = [
        'package.json',
        'package-lock.json'
      ];

      const backedUpFiles = [];

      // Copy files
      for (const file of filesToBackup) {
        const sourcePath = path.join(this.projectPath, file);
        const destPath = path.join(backupPath, file);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          backedUpFiles.push(file);
        }
      }

      // Read package.json for additional metadata
      let projectVersion = 'unknown';
      try {
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          projectVersion = packageJson.version || 'unknown';
        }
      } catch (error) {
        // Ignore errors reading package.json
      }

      // Create metadata file with enhanced information
      const metadataContent = {
        timestamp: new Date().toISOString(),
        reason: reason,
        filesBackedUp: backedUpFiles,
        projectVersion: projectVersion,
        devcompassVersion: require('../../package.json').version,
        ...metadata // Include any additional metadata passed
      };

      fs.writeFileSync(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadataContent, null, 2)
      );

      // Clean old backups (keep last 5)
      await this.cleanOldBackups(5);

      return backupPath;

    } catch (error) {
      console.error('Failed to create backup:', error.message);
      return null;
    }
  }

  async cleanOldBackups(keepCount = 5) {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return;
      }

      const backups = await this.listBackups();

      // Sort by timestamp (oldest first)
      backups.sort((a, b) => {
        const timeA = new Date(a.metadata.timestamp).getTime();
        const timeB = new Date(b.metadata.timestamp).getTime();
        return timeA - timeB;
      });

      // Delete old backups
      const toDelete = backups.length - keepCount;
      if (toDelete > 0) {
        for (let i = 0; i < toDelete; i++) {
          const backupPath = path.join(this.backupDir, backups[i].name);
          fs.rmSync(backupPath, { recursive: true, force: true });
        }
      }

    } catch (error) {
      // Silently fail - cleanup is not critical
    }
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const entries = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const entry of entries) {
        const backupPath = path.join(this.backupDir, entry);
        const metadataPath = path.join(backupPath, 'metadata.json');

        if (fs.statSync(backupPath).isDirectory()) {
          let metadata = {};

          if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          }

          backups.push({
            name: entry,
            path: backupPath,
            metadata
          });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => {
        const timeA = new Date(a.metadata.timestamp || 0).getTime();
        const timeB = new Date(b.metadata.timestamp || 0).getTime();
        return timeB - timeA;
      });

      return backups;

    } catch (error) {
      return [];
    }
  }

  async getBackupInfo(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        return null;
      }

      const metadataPath = path.join(backupPath, 'metadata.json');
      let metadata = {};

      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }

      // Get file list
      const files = {};
      const backupFiles = fs.readdirSync(backupPath);
      
      for (const file of backupFiles) {
        if (file !== 'metadata.json') {
          files[file] = path.join(backupPath, file);
        }
      }

      return {
        name: backupName,
        path: backupPath,
        metadata,
        files
      };

    } catch (error) {
      return null;
    }
  }

  async deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
        return true;
      }
      
      return false;

    } catch (error) {
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }
}

module.exports = BackupManager;