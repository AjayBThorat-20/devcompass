// src/shared/utils/backup-restorer.js

const fs = require('fs');
const path = require('path');

class BackupRestorer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupDir = path.join(projectPath, '.devcompass-backups');
  }

  resolveBackupPath(backupName) {
    if (typeof backupName !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(backupName)) return null;
    const resolved = path.join(this.backupDir, backupName);
    const relative = path.relative(this.backupDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
    return resolved;
  }

  async backupExists(backupName) {
    const backupPath = this.resolveBackupPath(backupName);
    return !!backupPath && fs.existsSync(backupPath);
  }

  async getBackupInfo(backupName) {
    const backupPath = this.resolveBackupPath(backupName);
    if (!backupPath || !fs.existsSync(backupPath)) return null;
    const metadataPath = path.join(backupPath, 'metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) { try { metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')); } catch (e) { /* skip */ } }
    const files = {};
    fs.readdirSync(backupPath).forEach(file => { if (file !== 'metadata.json') files[file] = path.join(backupPath, file); });
    return { name: backupName, path: backupPath, metadata, files };
  }

  async restore(backupName) {
    try {
      const backupInfo = await this.getBackupInfo(backupName);
      if (!backupInfo) return { success: false, error: 'Backup not found' };

      const filesRestored = [];
      for (const [filename, filepath] of Object.entries(backupInfo.files)) {
        const targetPath = path.join(this.projectPath, filename);
        fs.copyFileSync(filepath, targetPath);
        filesRestored.push(filename);
      }
      return { success: true, filesRestored };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = BackupRestorer;
