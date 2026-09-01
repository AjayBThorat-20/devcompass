// src/features/config/github-token.manager.js

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDatabase } = require('./config.database');
const encryption = require('../../shared/utils/encryption');

class GitHubTokenManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.devcompass');
    this.legacyTokenFile = path.join(this.configDir, 'github-token');
    this.db = null;
  }

  getDb() {
    if (!this.db) this.db = getDatabase();
    return this.db;
  }

  migrateLegacyToken() {
    try {
      if (fs.existsSync(this.legacyTokenFile)) {
        const token = fs.readFileSync(this.legacyTokenFile, 'utf8').trim();
        if (token) {
          this.saveToken(token);
          fs.unlinkSync(this.legacyTokenFile);
          console.log('✓ Migrated GitHub token to encrypted database');
        }
      }
    } catch (error) {
      if (process.env.DEBUG) console.error('Token migration failed:', error.message);
    }
  }

  getToken() {
    try {
      this.migrateLegacyToken();
      const db = this.getDb();
      const row = db.prepare('SELECT value, encrypted FROM config WHERE key = ?').get('github_token');
      if (!row) return null;
      if (row.encrypted === 1) {
        try { return encryption.decrypt(row.value); } catch (error) { if (process.env.DEBUG) console.error('Failed to decrypt GitHub token:', error.message); return null; }
      }
      return row.value;
    } catch (error) {
      if (process.env.DEBUG) console.error('Failed to get GitHub token:', error.message);
      return null;
    }
  }

  saveToken(token) {
    try {
      const db = this.getDb();
      const encrypted = encryption.encrypt(token.trim());
      db.prepare(`INSERT INTO config (key, value, encrypted, updated_at) VALUES (?, ?, 1, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, encrypted = excluded.encrypted, updated_at = datetime('now')`).run('github_token', encrypted);
      return true;
    } catch (error) {
      if (process.env.DEBUG) console.error('Failed to save GitHub token:', error.message);
      return false;
    }
  }

  hasToken() { return this.getToken() !== null; }

  removeToken() {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM config WHERE key = ?').run('github_token');
      if (fs.existsSync(this.legacyTokenFile)) fs.unlinkSync(this.legacyTokenFile);
      return true;
    } catch (error) {
      if (process.env.DEBUG) console.error('Failed to remove GitHub token:', error.message);
      return false;
    }
  }

  static showTokenInstructions() {
    console.log('');
    console.log('━'.repeat(70));
    console.log('🔑 GitHub Personal Access Token');
    console.log('━'.repeat(70));
    console.log('');
    console.log('1. Go to: https://github.com/settings/tokens/new');
    console.log('2. Select: "Classic" token, Scope: "public_repo"');
    console.log('3. Click "Generate token"');
    console.log('4. Run: devcompass config --github-token <your-token>');
    console.log('');
    console.log('Benefits:');
    console.log('  • 60 → 5,000 requests/hour');
    console.log('  • Token is encrypted with AES-256-GCM');
    console.log('  • Optional - DevCompass works without it');
    console.log('');
    console.log('━'.repeat(70));
    console.log('');
  }
}

module.exports = GitHubTokenManager;