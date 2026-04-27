// src/config/github-token.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDatabase } = require('./database');
const encryption = require('../utils/encryption');

class GitHubTokenManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.devcompass');
    this.legacyTokenFile = path.join(this.configDir, 'github-token');
    this.db = null;
  }

  /**
   * Get database instance
   */
  getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  /**
   * Migrate legacy token file to database
   */
  migrateLegacyToken() {
    try {
      if (fs.existsSync(this.legacyTokenFile)) {
        const token = fs.readFileSync(this.legacyTokenFile, 'utf8').trim();
        if (token) {
          // Save to database (encrypted)
          this.saveToken(token);
          
          // Remove legacy file
          fs.unlinkSync(this.legacyTokenFile);
          
          console.log('✓ Migrated GitHub token to encrypted database');
        }
      }
    } catch (error) {
      // Silent fail - migration is optional
      if (process.env.DEBUG) {
        console.error('Token migration failed:', error.message);
      }
    }
  }

  /**
   * Get stored GitHub token
   */
  getToken() {
    try {
      // Migrate legacy token if exists
      this.migrateLegacyToken();
      
      const db = this.getDb();
      const row = db.prepare('SELECT value, encrypted FROM config WHERE key = ?')
        .get('github_token');
      
      if (!row) {
        return null;
      }
      
      // Decrypt if encrypted
      if (row.encrypted === 1) {
        try {
          return encryption.decrypt(row.value);
        } catch (error) {
          console.error('Failed to decrypt GitHub token:', error.message);
          return null;
        }
      }
      
      return row.value;
    } catch (error) {
      // Silent fail - token is optional
      if (process.env.DEBUG) {
        console.error('Failed to get GitHub token:', error.message);
      }
      return null;
    }
  }

  /**
   * Save GitHub token (encrypted)
   */
  saveToken(token) {
    try {
      const db = this.getDb();
      
      // Encrypt token
      const encrypted = encryption.encrypt(token.trim());
      
      // Upsert token
      db.prepare(`
        INSERT INTO config (key, value, encrypted, updated_at)
        VALUES (?, ?, 1, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          encrypted = excluded.encrypted,
          updated_at = datetime('now')
      `).run('github_token', encrypted);
      
      return true;
    } catch (error) {
      console.error('Failed to save GitHub token:', error.message);
      return false;
    }
  }

  /**
   * Check if token is configured
   */
  hasToken() {
    return this.getToken() !== null;
  }

  /**
   * Remove stored token
   */
  removeToken() {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM config WHERE key = ?').run('github_token');
      
      // Also remove legacy file if exists
      if (fs.existsSync(this.legacyTokenFile)) {
        fs.unlinkSync(this.legacyTokenFile);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to remove GitHub token:', error.message);
      return false;
    }
  }

  /**
   * Display instructions for creating a token
   */
  static showTokenInstructions() {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 GitHub Personal Access Token Required');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('DevCompass uses GitHub API to track package health.');
    console.log('To avoid rate limits, configure a Personal Access Token:');
    console.log('');
    console.log('📋 Steps:');
    console.log('  1. Go to: https://github.com/settings/tokens/new');
    console.log('  2. Select: "Classic" token');
    console.log('  3. Description: "DevCompass CLI"');
    console.log('  4. Expiration: 90 days (or your preference)');
    console.log('  5. Scopes: Select "public_repo" (read access to public repos)');
    console.log('  6. Click "Generate token"');
    console.log('  7. Copy the token (starts with ghp_)');
    console.log('  8. Run: devcompass config --github-token <your-token>');
    console.log('');
    console.log('🔒 Security:');
    console.log('  • Token is encrypted with AES-256-GCM');
    console.log('  • Stored in ~/.devcompass/config.db');
    console.log('  • Machine-specific encryption keys');
    console.log('  • Never commit or share your token');
    console.log('  • Token is optional - DevCompass works without it');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }
}

module.exports = GitHubTokenManager;