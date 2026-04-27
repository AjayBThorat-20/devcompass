// src/ai/providers/openai.js
const BaseProvider = require('./base-provider');

class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.apiUrl = this.baseUrl || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Send a prompt to OpenAI
   */
  async sendPrompt(prompt, systemPrompt = null, options = {}) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: false
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens || 0,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        model: data.model,
        finishReason: data.choices[0].finish_reason
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Stream a response from OpenAI
   */
  async streamPrompt(prompt, systemPrompt = null, onChunk, options = {}) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: true
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
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
            
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                totalTokens += this.countTokens(content);
                onChunk(content);
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
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }

  /**
   * Estimate cost for OpenAI models
   */
  estimateCost(tokens, isInput = true) {
    // Pricing per 1K tokens (as of 2024)
    const pricing = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };

    const modelPricing = pricing[this.model] || pricing['gpt-3.5-turbo'];
    const costPer1k = isInput ? modelPricing.input : modelPricing.output;
    
    return (tokens / 1000) * costPer1k;
  }
}

module.exports = OpenAIProvider;