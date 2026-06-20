// src/features/ai/providers/anthropic.provider.js

const BaseProvider = require('./base.provider');
const axios = require('axios');

class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.pricing = {
      'claude-sonnet-4-20250514': { input: 3.00 / 1000, output: 15.00 / 1000 },
      'claude-opus-4-20250514': { input: 15.00 / 1000, output: 75.00 / 1000 },
      'claude-haiku-4-20250301': { input: 0.80 / 1000, output: 4.00 / 1000 }
    };
  }

  _getHeaders() {
    const apiKey = this._getDecryptedKey ? this._getDecryptedKey() : this.config.api_key;
    return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' };
  }

  async sendPrompt(messages, options = {}) {
    const controller = this.createAbortController();
    try {
      const response = await axios.post(`${this.baseURL}/messages`, {
        model: options.model || this.model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      }, { headers: this._getHeaders(), signal: controller.signal });
      this.clearAbortController();
      return {
        content: response.data.content[0].text,
        usage: { inputTokens: response.data.usage.input_tokens, outputTokens: response.data.usage.output_tokens, totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens }
      };
    } catch (error) {
      this.clearAbortController();
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') throw new Error('Request cancelled by user');
      throw error;
    }
  }

  async streamPrompt(messages, onChunk, options = {}) {
    const controller = this.createAbortController();
    try {
      const response = await axios.post(`${this.baseURL}/messages`, {
        model: options.model || this.model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: true
      }, { headers: this._getHeaders(), responseType: 'stream', signal: controller.signal });

      let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') { const content = parsed.delta?.text; if (content) onChunk(content); }
              if (parsed.type === 'message_delta' && parsed.usage) usage.outputTokens = parsed.usage.output_tokens;
              if (parsed.type === 'message_start' && parsed.message?.usage) usage.inputTokens = parsed.message.usage.input_tokens;
            } catch (e) { /* skip */ }
          }
        }
      }
      usage.totalTokens = usage.inputTokens + usage.outputTokens;
      this.clearAbortController();
      return usage;
    } catch (error) {
      this.clearAbortController();
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') throw new Error('Request cancelled by user');
      throw error;
    }
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = this.pricing[this.model] || this.pricing['claude-sonnet-4-20250514'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }
}

module.exports = AnthropicProvider;