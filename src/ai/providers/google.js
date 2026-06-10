// src/ai/providers/google.js
const BaseProvider = require('./base-provider');
const axios = require('axios');

class GoogleProvider extends BaseProvider {
  constructor(apiKey, config = {}) {
    super(config);
    this.apiKey = apiKey;
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.0-flash-exp';
    this.pricing = {
      'gemini-2.0-flash-exp': { input: 0, output: 0 },
      'gemini-1.5-pro': { input: 1.25 / 1000, output: 5.00 / 1000 },
      'gemini-1.5-flash': { input: 0.075 / 1000, output: 0.30 / 1000 }
    };
  }

  async sendPrompt(messages, options = {}) {
    const controller = this.createAbortController();
    
    try {
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      const response = await axios.post(
        `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );
      
      this.clearAbortController();
      
      const candidate = response.data.candidates[0];
      const usage = response.data.usageMetadata || {};
      
      return {
        content: candidate.content.parts[0].text,
        usage: {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0
        }
      };
    } catch (error) {
      this.clearAbortController();
      
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        throw new Error('Request cancelled by user');
      }
      throw error;
    }
  }

  async streamPrompt(messages, onChunk, options = {}) {
    const controller = this.createAbortController();
    
    try {
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      const response = await axios.post(
        `${this.baseURL}/models/${this.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
        {
          contents: contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          signal: controller.signal
        }
      );
      
      let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              const candidate = parsed.candidates?.[0];
              
              if (candidate?.content?.parts?.[0]?.text) {
                onChunk(candidate.content.parts[0].text);
              }
              
              if (parsed.usageMetadata) {
                usage = {
                  inputTokens: parsed.usageMetadata.promptTokenCount || 0,
                  outputTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                  totalTokens: parsed.usageMetadata.totalTokenCount || 0
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      this.clearAbortController();
      return usage;
    } catch (error) {
      this.clearAbortController();
      
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        throw new Error('Request cancelled by user');
      }
      throw error;
    }
  }

  estimateCost(inputTokens, outputTokens) {
    const pricing = this.pricing[this.model] || this.pricing['gemini-2.0-flash-exp'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }
}

module.exports = GoogleProvider;