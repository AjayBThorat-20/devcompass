// src/features/ai/providers/google.provider.js

const BaseProvider = require('./base.provider');
const axios = require('axios');

class GoogleProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.0-flash-exp';
    this.pricing = {
      'gemini-2.0-flash-exp': { input: 0, output: 0 },
      'gemini-1.5-pro': { input: 1.25 / 1000000, output: 5.00 / 1000000 },
      'gemini-1.5-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 }
    };
  }

  async sendPrompt(messages, options = {}) {
    const controller = this.createAbortController();
    const apiKey = this.getApiKey();
    try {
      const contents = messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
      const response = await axios.post(`${this.baseURL}/models/${this.model}:generateContent?key=${apiKey}`, {
        contents,
        generationConfig: { temperature: options.temperature || 0.7, maxOutputTokens: options.maxTokens || 2048 }
      }, { headers: { 'Content-Type': 'application/json' }, signal: controller.signal });
      this.clearAbortController();
      const candidate = response.data.candidates?.[0];
      if (!candidate) throw new Error('Gemini response contained no candidates (likely blocked by safety filters)');
      const text = candidate.content?.parts?.[0]?.text;
      if (typeof text !== 'string') throw new Error('Gemini response contained no text content');
      const usage = response.data.usageMetadata || {};
      return { content: text, usage: { inputTokens: usage.promptTokenCount || 0, outputTokens: usage.candidatesTokenCount || 0, totalTokens: usage.totalTokenCount || 0 } };
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  async streamPrompt(messages, onChunk, options = {}) {
    const controller = this.createAbortController();
    const apiKey = this.getApiKey();
    try {
      const contents = messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
      const response = await axios.post(`${this.baseURL}/models/${this.model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
        contents,
        generationConfig: { temperature: options.temperature || 0.7, maxOutputTokens: options.maxTokens || 2048 }
      }, { headers: { 'Content-Type': 'application/json' }, responseType: 'stream', signal: controller.signal });

      let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      for await (const line of this.streamLines(response.data)) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
          if (parsed.usageMetadata) {
            usage = { inputTokens: parsed.usageMetadata.promptTokenCount || 0, outputTokens: parsed.usageMetadata.candidatesTokenCount || 0, totalTokens: parsed.usageMetadata.totalTokenCount || 0 };
          }
        } catch (e) { /* skip */ }
      }
      this.clearAbortController();
      return usage;
    } catch (error) {
      this.handleRequestError(error);
    }
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = this.pricing[this.model] || this.pricing['gemini-2.0-flash-exp'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }
}

module.exports = GoogleProvider;