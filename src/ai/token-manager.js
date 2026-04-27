// src/ai/token-manager.js
const aiDatabase = require('./database');
const { encrypt, decrypt, maskToken } = require('../utils/encryption');
const OpenAIProvider = require('./providers/openai');
const AnthropicProvider = require('./providers/anthropic');
const GoogleProvider = require('./providers/google');
const LocalProvider = require('./providers/local');

class TokenManager {
  /**
   * Add a new LLM provider
   */
  addProvider(provider, apiKey, model, baseUrl = null) {
    try {
      // Encrypt API key
      const encryptedKey = encrypt(apiKey);
      
      // Add to database
      aiDatabase.addProvider(provider, encryptedKey, model, baseUrl);
      
      // If it's the first provider, make it default
      const providers = aiDatabase.getAllProviders();
      if (providers.length === 1) {
        aiDatabase.setDefaultProvider(provider);
      }
      
      return { success: true, message: `Provider "${provider}" added successfully` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get provider instance with decrypted key
   */
  getProvider(providerName = null) {
    try {
      let config;
      
      if (providerName) {
        config = aiDatabase.getProvider(providerName);
      } else {
        config = aiDatabase.getDefaultProvider();
      }
      
      if (!config) {
        throw new Error(providerName 
          ? `Provider "${providerName}" not found` 
          : 'No default provider configured. Add one with: devcompass llm add'
        );
      }
      
      if (!config.is_active) {
        throw new Error(`Provider "${config.provider}" is disabled`);
      }
      
      // Decrypt API key
      const decryptedKey = decrypt(config.api_key);
      const providerConfig = {
        ...config,
        api_key: decryptedKey
      };
      
      // Return appropriate provider instance
      switch (config.provider) {
        case 'openai':
          return new OpenAIProvider(providerConfig);
        case 'anthropic':
          return new AnthropicProvider(providerConfig);
        case 'google':
          return new GoogleProvider(providerConfig);
        case 'local':
          return new LocalProvider(providerConfig);
        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all providers
   */
  listProviders() {
    const providers = aiDatabase.getAllProviders();
    
    return providers.map(p => ({
      provider: p.provider,
      model: p.model,
      baseUrl: p.base_url,
      isDefault: p.is_default === 1,
      isActive: p.is_active === 1,
      apiKey: maskToken(decrypt(p.api_key)),
      createdAt: p.created_at
    }));
  }

  /**
   * Set default provider
   */
  setDefault(provider) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) {
        throw new Error(`Provider "${provider}" not found`);
      }
      
      aiDatabase.setDefaultProvider(provider);
      return { success: true, message: `Default provider set to "${provider}"` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Update provider
   */
  updateProvider(provider, updates) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) {
        throw new Error(`Provider "${provider}" not found`);
      }
      
      // Encrypt API key if updating
      if (updates.api_key) {
        updates.api_key = encrypt(updates.api_key);
      }
      
      aiDatabase.updateProvider(provider, updates);
      return { success: true, message: `Provider "${provider}" updated` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove provider
   */
  removeProvider(provider) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) {
        throw new Error(`Provider "${provider}" not found`);
      }
      
      aiDatabase.removeProvider(provider);
      return { success: true, message: `Provider "${provider}" removed` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Enable/disable provider
   */
  toggleProvider(provider, enabled) {
    try {
      aiDatabase.updateProvider(provider, { is_active: enabled ? 1 : 0 });
      const status = enabled ? 'enabled' : 'disabled';
      return { success: true, message: `Provider "${provider}" ${status}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test provider connection
   */
  async testProvider(provider) {
    try {
      const providerInstance = this.getProvider(provider);
      const result = await providerInstance.test();
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new TokenManager();