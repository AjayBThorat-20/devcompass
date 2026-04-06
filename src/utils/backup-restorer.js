// src/utils/backup-restorer.js
const fs = require('fs');
const path = require('path');

class BackupRestorer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupDir = path.join(projectPath, '.devcompass-backups');
  }

  async backupExists(backupName) {
    const backupPath = path.join(this.backupDir, backupName);
    return fs.existsSync(backupPath);
  }

  async getBackupInfo(backupName) {
    const backupPath = path.join(this.backupDir, backupName);
    
    if (!fs.existsSync(backupPath)) {
      return null;
    }

    const metadataPath = path.join(backupPath, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return {
        name: backupName,
        path: backupPath,
        metadata: {}
      };
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    // Find all files in backup
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
  }

  async restore(backupName) {
    try {
      const backupInfo = await this.getBackupInfo(backupName);
      
      if (!backupInfo) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      const filesRestored = [];

      // Restore each file
      for (const [filename, filepath] of Object.entries(backupInfo.files)) {
        const targetPath = path.join(this.projectPath, filename);
        
        // Copy file from backup to project
        fs.copyFileSync(filepath, targetPath);
        filesRestored.push(filename);
      }

      return {
        success: true,
        filesRestored
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BackupRestorer;