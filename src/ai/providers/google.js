// src/ai/providers/google.js
const BaseProvider = require('./base-provider');

class GoogleProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.apiUrl = this.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Send a prompt to Google Gemini
   */
  async sendPrompt(prompt, systemPrompt = null, options = {}) {
    const url = `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const parts = [];
    if (systemPrompt) {
      parts.push({ text: systemPrompt });
    }
    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Google API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text || '';
      
      return {
        content: content,
        tokensUsed: this.countTokens(content),
        promptTokens: this.countTokens(prompt),
        completionTokens: this.countTokens(content),
        model: this.model,
        finishReason: data.candidates[0]?.finishReason
      };
    } catch (error) {
      throw new Error(`Google API error: ${error.message}`);
    }
  }

  /**
   * Stream a response from Google Gemini
   */
  async streamPrompt(prompt, systemPrompt = null, onChunk, options = {}) {
    const url = `${this.apiUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    
    const parts = [];
    if (systemPrompt) {
      parts.push({ text: systemPrompt });
    }
    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Google API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      return {
        content: fullContent,
        tokensUsed: this.countTokens(fullContent),
        model: this.model
      };
    } catch (error) {
      throw new Error(`Google streaming error: ${error.message}`);
    }
  }

  /**
   * Estimate cost for Google models
   */
  estimateCost(tokens, isInput = true) {
    // Pricing per 1K tokens (as of 2024)
    const pricing = {
      'gemini-pro': { input: 0.00025, output: 0.0005 },
      'gemini-pro-vision': { input: 0.00025, output: 0.0005 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.00375 },
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
    };

    const modelPricing = pricing[this.model] || pricing['gemini-pro'];
    const costPer1k = isInput ? modelPricing.input : modelPricing.output;
    
    return (tokens / 1000) * costPer1k;
  }
}

module.exports = GoogleProvider;