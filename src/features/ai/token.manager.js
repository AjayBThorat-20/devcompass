// src/features/ai/token.manager.js

const aiDatabase = require('./ai.database');
const { encrypt, decrypt, maskToken } = require('../../shared/utils/encryption');

const OpenAIProvider = require('./providers/openai.provider');
const AnthropicProvider = require('./providers/anthropic.provider');
const GoogleProvider = require('./providers/google.provider');
const LocalProvider = require('./providers/local.provider');

class TokenManager {
  addProvider(provider, apiKey, model, baseUrl = null) {
    try {
      const encryptedKey = encrypt(apiKey);
      aiDatabase.addProvider(provider, encryptedKey, model, baseUrl);
      const providers = aiDatabase.getAllProviders();
      if (providers.length === 1) aiDatabase.setDefaultProvider(provider);
      return { success: true, message: `Provider "${provider}" added successfully` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getProvider(providerName = null) {
    let config;
    if (providerName) {
      config = aiDatabase.getProvider(providerName);
    } else {
      config = aiDatabase.getDefaultProvider();
    }

    if (!config) {
      throw new Error(providerName ? `Provider "${providerName}" not found` : 'No default provider configured. Add one with: devcompass llm add');
    }
    if (!config.is_active) throw new Error(`Provider "${config.provider}" is disabled`);

    const providerConfig = { ...config, id: config.id, provider: config.provider };
    let instance;

    switch (config.provider) {
      case 'openai': instance = new OpenAIProvider(providerConfig); break;
      case 'anthropic': instance = new AnthropicProvider(providerConfig); break;
      case 'google': instance = new GoogleProvider(providerConfig); break;
      case 'local': instance = new LocalProvider(providerConfig); break;
      default: throw new Error(`Unknown provider: ${config.provider}`);
    }

    instance.id = providerConfig.id;
    instance.provider = providerConfig.provider;
    instance.config = providerConfig;
    instance._getDecryptedKey = () => decrypt(config.api_key);

    return instance;
  }

  listProviders() {
    return aiDatabase.getAllProviders().map(p => ({
      id: p.id,
      provider: p.provider,
      model: p.model,
      baseUrl: p.base_url,
      isDefault: p.is_default === 1,
      isActive: p.is_active === 1,
      apiKey: maskToken(decrypt(p.api_key)),
      createdAt: p.created_at
    }));
  }

  setDefault(provider) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) throw new Error(`Provider "${provider}" not found`);
      aiDatabase.setDefaultProvider(provider);
      return { success: true, message: `Default provider set to "${provider}"` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  updateProvider(provider, updates) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) throw new Error(`Provider "${provider}" not found`);
      if (updates.api_key) updates.api_key = encrypt(updates.api_key);
      aiDatabase.updateProvider(provider, updates);
      return { success: true, message: `Provider "${provider}" updated` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  removeProvider(provider) {
    try {
      const config = aiDatabase.getProvider(provider);
      if (!config) throw new Error(`Provider "${provider}" not found`);
      aiDatabase.removeProvider(provider);
      return { success: true, message: `Provider "${provider}" removed` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testProvider(provider) {
    try {
      const instance = this.getProvider(provider);
      if (typeof instance.test === 'function') return await instance.test();
      return { success: true, message: `Provider "${provider}" is configured` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new TokenManager();