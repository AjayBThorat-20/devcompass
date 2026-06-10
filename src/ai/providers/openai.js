const BaseProvider = require('./base-provider');
const axios = require('axios');

class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
    this.pricing = {
      'gpt-4o-mini': { input: 0.15 / 1000, output: 0.60 / 1000 },
      'gpt-4o': { input: 2.50 / 1000, output: 10.00 / 1000 },
      'gpt-4-turbo': { input: 10.00 / 1000, output: 30.00 / 1000 }
    };
  }

  _getHeaders() {
    const apiKey = this._getDecryptedKey ? this._getDecryptedKey() : this.config.api_key;
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async sendPrompt(messages, options = {}) {
    const controller = this.createAbortController();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000
        },
        {
          headers: this._getHeaders(),
          signal: controller.signal
        }
      );
      
      this.clearAbortController();
      
      return {
        content: response.data.choices[0].message.content,
        usage: {
          inputTokens: response.data.usage.prompt_tokens,
          outputTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
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
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || this.model,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          stream: true
        },
        {
          headers: this._getHeaders(),
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
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                onChunk(content);
              }
              
              if (parsed.usage) {
                usage = {
                  inputTokens: parsed.usage.prompt_tokens,
                  outputTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens
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
    const pricing = this.pricing[this.model] || this.pricing['gpt-4o-mini'];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }
}

module.exports = OpenAIProvider;