// src/features/cve/api-key.manager.js

const { db } = require('./database');
const encryption = require('../../shared/utils/encryption');

class APIKeyManager {
  setAPIKey(service, apiKey) {
    try {
      const encryptedKey = encryption.encrypt(apiKey);
      if (!encryptedKey) throw new Error('Failed to encrypt API key');
      db.prepare(`
        INSERT INTO api_keys (service, api_key, is_active, updated_at)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(service) DO UPDATE SET api_key = excluded.api_key, is_active = 1, updated_at = CURRENT_TIMESTAMP
      `).run(service, encryptedKey);
      return true;
    } catch (error) {
      if (process.env.DEBUG) console.error('Error setting API key:', error.message);
      return false;
    }
  }

  getAPIKey(service) {
    try {
      const result = db.prepare('SELECT api_key FROM api_keys WHERE service = ? AND is_active = 1').get(service);
      return result ? encryption.decrypt(result.api_key) : null;
    } catch (error) {
      if (process.env.DEBUG) console.error('Error getting API key:', error.message);
      return null;
    }
  }

  removeAPIKey(service) {
    try {
      const result = db.prepare('DELETE FROM api_keys WHERE service = ?').run(service);
      return result.changes > 0;
    } catch (error) {
      if (process.env.DEBUG) console.error('Error removing API key:', error.message);
      return false;
    }
  }

  listAPIKeys() {
    try {
      return db.prepare('SELECT service, is_active, created_at, updated_at FROM api_keys ORDER BY created_at DESC').all();
    } catch (error) {
      if (process.env.DEBUG) console.error('Error listing API keys:', error.message);
      return [];
    }
  }

  async testAPIKey(service) {
    const apiKey = this.getAPIKey(service);
    if (!apiKey) return { success: false, message: 'API key not found' };
    if (service === 'nvd') {
      const axios = require('axios');
      try {
        const response = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-44228', {
          headers: { apiKey },
          timeout: 10000
        });
        if (response.status === 200) return { success: true, message: 'NVD API key is valid ✓' };
        return { success: false, message: 'Unexpected response from NVD' };
      } catch (error) {
        if (error.response?.status === 403) return { success: false, message: 'Invalid or expired API key' };
        if (error.response?.status === 429) return { success: false, message: 'Rate limit reached (key is valid)' };
        return { success: false, message: error.message };
      }
    }
    return { success: false, message: 'Unknown service' };
  }

  hasAPIKey(service) {
    try {
      const result = db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE service = ? AND is_active = 1').get(service);
      return result.count > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new APIKeyManager();