// src/ai/providers/local.js
const BaseProvider = require('./base-provider');

class LocalProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.apiUrl = this.baseUrl || 'http://localhost:11434';
  }

  /**
   * Send a prompt to local model (Ollama)
   */
  async sendPrompt(prompt, systemPrompt = null, options = {}) {
    const url = `${this.apiUrl}/api/generate`;
    
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const requestBody = {
      model: this.model,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: options.temperature || this.temperature,
        num_predict: options.maxTokens || this.maxTokens
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
        throw new Error(`Local model error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response,
        tokensUsed: this.countTokens(data.response),
        promptTokens: this.countTokens(fullPrompt),
        completionTokens: this.countTokens(data.response),
        model: this.model,
        finishReason: 'stop'
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Local model server not running. Start Ollama with: ollama serve');
      }
      throw new Error(`Local model error: ${error.message}`);
    }
  }

  /**
   * Stream a response from local model
   */
  async streamPrompt(prompt, systemPrompt = null, onChunk, options = {}) {
    const url = `${this.apiUrl}/api/generate`;
    
    let fullPrompt = prompt;
    if (systemPrompt) {
      fullPrompt = `${systemPrompt}\n\n${prompt}`;
    }

    const requestBody = {
      model: this.model,
      prompt: fullPrompt,
      stream: true,
      options: {
        temperature: options.temperature || this.temperature,
        num_predict: options.maxTokens || this.maxTokens
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
        throw new Error(`Local model error: ${response.status}`);
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
            const content = data.response || '';
            
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
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Local model server not running. Start Ollama with: ollama serve');
      }
      throw new Error(`Local streaming error: ${error.message}`);
    }
  }

  /**
   * Local models are free
   */
  estimateCost(tokens, isInput = true) {
    return 0.0; // Local models cost nothing
  }

  /**
   * Test local model connection
   */
  async test() {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }
      
      const data = await response.json();
      const hasModel = data.models?.some(m => m.name === this.model);
      
      if (!hasModel) {
        return {
          success: false,
          message: `Model "${this.model}" not found. Pull it with: ollama pull ${this.model}`
        };
      }
      
      return {
        success: true,
        message: `Connected to Ollama (model: ${this.model})`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = LocalProvider;