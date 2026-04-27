// src/ai/providers/anthropic.js
const BaseProvider = require('./base-provider');

class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.apiUrl = this.baseUrl || 'https://api.anthropic.com/v1/messages';
    this.apiVersion = '2023-06-01';
  }

  /**
   * Send a prompt to Anthropic Claude
   */
  async sendPrompt(prompt, systemPrompt = null, options = {}) {
    const requestBody = {
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.content[0].text,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        model: data.model,
        finishReason: data.stop_reason
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  /**
   * Stream a response from Anthropic Claude
   */
  async streamPrompt(prompt, systemPrompt = null, onChunk, options = {}) {
    const requestBody = {
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: true
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                if (content) {
                  fullContent += content;
                  totalTokens += this.countTokens(content);
                  onChunk(content);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        content: fullContent,
        tokensUsed: totalTokens,
        model: this.model
      };
    } catch (error) {
      throw new Error(`Anthropic streaming error: ${error.message}`);
    }
  }

  /**
   * Estimate cost for Anthropic models
   */
  estimateCost(tokens, isInput = true) {
    // Pricing per 1K tokens (as of 2024)
    const pricing = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };

    const modelPricing = pricing[this.model] || pricing['claude-3-haiku-20240307'];
    const costPer1k = isInput ? modelPricing.input : modelPricing.output;
    
    return (tokens / 1000) * costPer1k;
  }
}

module.exports = AnthropicProvider;