// src/config/github-token.js
const fs = require('fs');
const path = require('path');
const os = require('os');

class GitHubTokenManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.devcompass');
    this.tokenFile = path.join(this.configDir, 'github-token');
  }

  /**
   * Get stored GitHub token
   */
  getToken() {
    try {
      if (fs.existsSync(this.tokenFile)) {
        const token = fs.readFileSync(this.tokenFile, 'utf8').trim();
        return token || null;
      }
    } catch (error) {
      // Silent fail - token is optional
    }
    return null;
  }

  /**
   * Save GitHub token
   */
  saveToken(token) {
    try {
      // Create config directory if it doesn't exist
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Save token
      fs.writeFileSync(this.tokenFile, token.trim(), { mode: 0o600 });
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
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
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
    console.log('  • Token is stored locally in ~/.devcompass/github-token');
    console.log('  • Only you have access to this file');
    console.log('  • Never commit or share your token');
    console.log('  • Token is optional - DevCompass works without it');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }
}

module.exports = GitHubTokenManager;