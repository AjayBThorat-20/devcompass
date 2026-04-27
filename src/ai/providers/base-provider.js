// src/ai/providers/base-provider.js

class BaseProvider {
  constructor(config) {
    this.name = config.provider;
    this.apiKey = config.api_key;
    this.model = config.model;
    this.baseUrl = config.base_url;
    this.maxTokens = config.max_tokens || 4096;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Send a prompt to the LLM
   * Must be implemented by subclasses
   */
  async sendPrompt(prompt, systemPrompt = null, options = {}) {
    throw new Error('sendPrompt() must be implemented by subclass');
  }

  /**
   * Stream a response from the LLM
   * Must be implemented by subclasses
   */
  async streamPrompt(prompt, systemPrompt = null, onChunk, options = {}) {
    throw new Error('streamPrompt() must be implemented by subclass');
  }

  /**
   * Test API connection
   */
  async test() {
    try {
      const response = await this.sendPrompt('Hello! Please respond with "OK" if you can read this.', null, {
        maxTokens: 10
      });
      return {
        success: true,
        message: 'Connection successful',
        response: response.content
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Count tokens (approximate)
   */
  countTokens(text) {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost based on tokens
   */
  estimateCost(tokens, isInput = true) {
    // Default pricing (override in subclasses)
    const inputCostPer1k = 0.01;  // $0.01 per 1K tokens
    const outputCostPer1k = 0.03; // $0.03 per 1K tokens
    
    const costPer1k = isInput ? inputCostPer1k : outputCostPer1k;
    return (tokens / 1000) * costPer1k;
  }
}

module.exports = BaseProvider;