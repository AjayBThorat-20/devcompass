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
      // BackupManager.createBackup swallows its own errors and returns null
      // rather than throwing, so this must be checked explicitly — otherwise a
      // failed backup (permission denied, disk full, unreadable package.json)
      // reports success with path: null and the caller proceeds to run
      // destructive npm operations with no actual backup in place.
      if (!backupPath) return { success: false, error: 'Backup could not be created (see DEBUG output for details)' };
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