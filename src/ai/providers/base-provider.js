// src/ai/providers/base-provider.js
class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.activeRequest = null;
  }

  async sendPrompt(messages, options = {}) {
    throw new Error('sendPrompt must be implemented by subclass');
  }

  async streamPrompt(messages, onChunk, options = {}) {
    throw new Error('streamPrompt must be implemented by subclass');
  }

  estimateCost(inputTokens, outputTokens) {
    throw new Error('estimateCost must be implemented by subclass');
  }

  cancel() {
    if (this.activeRequest) {
      this.activeRequest.abort();
      this.activeRequest = null;
    }
  }

  createAbortController() {
    const controller = new AbortController();
    this.activeRequest = controller;
    return controller;
  }

  clearAbortController() {
    this.activeRequest = null;
  }
}

module.exports = BaseProvider;