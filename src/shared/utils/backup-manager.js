// src/shared/utils/backup-manager.js

const fs = require('fs');
const path = require('path');

class BackupManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.backupDir = path.join(projectPath, '.depvora-backups');
  }

  resolveBackupPath(backupName) {
    if (typeof backupName !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(backupName)) return null;
    const resolved = path.join(this.backupDir, backupName);
    const relative = path.relative(this.backupDir, resolved);
    // A name of just "." normalizes to the backups directory itself, which
    // produces an empty relative path — not caught by the ".." check below —
    // and would let callers operate (restore/delete) on the whole backups
    // directory instead of getting a clean "not found".
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) return null;
    return resolved;
  }

  async createBackup(reason = 'Manual backup', metadata = {}) {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) throw new Error('No package.json found in project directory');

      if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      fs.mkdirSync(backupPath, { recursive: true });

      const filesToBackup = ['package.json', 'package-lock.json'];
      const backedUpFiles = [];
      for (const file of filesToBackup) {
        const sourcePath = path.join(this.projectPath, file);
        if (fs.existsSync(sourcePath)) { fs.copyFileSync(sourcePath, path.join(backupPath, file)); backedUpFiles.push(file); }
      }

      let projectVersion = 'unknown';
      try { projectVersion = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version || 'unknown'; } catch (e) { /* ignore */ }

      let depvoraVersion = 'unknown';
      try {
        const pkgJsonPath = path.join(__dirname, '../../../package.json');
        if (fs.existsSync(pkgJsonPath)) depvoraVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version || 'unknown';
      } catch (e) { /* ignore */ }

      fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify({ timestamp: new Date().toISOString(), reason, filesBackedUp: backedUpFiles, projectVersion, depvoraVersion, ...metadata }, null, 2));

      await this.cleanOldBackups(5);
      return backupPath;
    } catch (error) {
      if (process.env.DEBUG) console.error('Failed to create backup:', error.message);
      return null;
    }
  }

  async cleanOldBackups(keepCount = 5) {
    try {
      const backups = await this.listBackups();
      backups.sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());
      const toDelete = backups.length - keepCount;
      if (toDelete > 0) {
        for (let i = 0; i < toDelete; i++) {
          fs.rmSync(path.join(this.backupDir, backups[i].name), { recursive: true, force: true });
        }
      }
    } catch (error) { /* silent */ }
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];
      const backups = [];
      for (const entry of fs.readdirSync(this.backupDir)) {
        const backupPath = path.join(this.backupDir, entry);
        const metadataPath = path.join(backupPath, 'metadata.json');
        if (fs.statSync(backupPath).isDirectory()) {
          let metadata = {};
          if (fs.existsSync(metadataPath)) { try { metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')); } catch (e) { /* skip */ } }
          backups.push({ name: entry, path: backupPath, metadata });
        }
      }
      backups.sort((a, b) => new Date(b.metadata.timestamp || 0).getTime() - new Date(a.metadata.timestamp || 0).getTime());
      return backups;
    } catch (error) { return []; }
  }

  async getBackupInfo(backupName) {
    try {
      const backupPath = this.resolveBackupPath(backupName);
      if (!backupPath || !fs.existsSync(backupPath)) return null;
      const metadataPath = path.join(backupPath, 'metadata.json');
      let metadata = {};
      if (fs.existsSync(metadataPath)) { try { metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')); } catch (e) { /* skip */ } }
      const files = {};
      fs.readdirSync(backupPath).forEach(file => { if (file !== 'metadata.json') files[file] = path.join(backupPath, file); });
      return { name: backupName, path: backupPath, metadata, files };
    } catch (error) { return null; }
  }

  async deleteBackup(backupName) {
    try {
      const backupPath = this.resolveBackupPath(backupName);
      if (!backupPath) throw new Error('Invalid backup name');
      if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { recursive: true, force: true });
      return true;
    } catch (error) { throw new Error(`Failed to delete backup: ${error.message}`); }
  }
}

module.exports = BackupManager;
