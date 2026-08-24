// src/features/ai/providers/local.provider.js

const BaseProvider = require('./base.provider');
const axios = require('axios');

class LocalProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseURL = config.baseURL || config.base_url || 'http://localhost:11434';
    this.model = config.model || 'llama2';
  }

  async sendPrompt(messages, options = {}) {
    const controller = this.createAbortController();
    try {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: options.model || this.model,
        prompt,
        stream: false,
        options: { temperature: options.temperature || 0.7, num_predict: options.maxTokens || 2000 }
      }, { headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
      this.clearAbortController();
      return { content: response.data.response, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } };
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  async streamPrompt(messages, onChunk, options = {}) {
    const controller = this.createAbortController();
    try {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: options.model || this.model,
        prompt,
        stream: true,
        options: { temperature: options.temperature || 0.7, num_predict: options.maxTokens || 2000 }
      }, { headers: { 'Content-Type': 'application/json' }, responseType: 'stream', signal: controller.signal });

      for await (const line of this.streamLines(response.data)) {
        try { const parsed = JSON.parse(line); if (parsed.response) onChunk(parsed.response); } catch (e) { /* skip */ }
      }
      this.clearAbortController();
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  estimateCost() { return 0; }
}

module.exports = LocalProvider;