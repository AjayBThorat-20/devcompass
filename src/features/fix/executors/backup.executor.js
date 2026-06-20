// src/features/fix/executors/backup.executor.js

const BackupManager = require('../../../shared/utils/backup-manager');

class BackupExecutor {
  constructor(projectPath) {
    this.backupManager = new BackupManager(projectPath);
  }

  async createBackup(metadata = {}) {
    try {
      const backupPath = await this.backupManager.createBackup('Pre-fix backup', {
        fixMode: metadata.mode || 'safe',
        issueCount: metadata.issueCount || 0,
        timestamp: new Date().toISOString(),
        ...metadata
      });
      return { success: true, path: backupPath, message: 'Backup created successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listBackups() {
    try {
      const backups = await this.backupManager.listBackups();
      return { success: true, backups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { BackupExecutor };