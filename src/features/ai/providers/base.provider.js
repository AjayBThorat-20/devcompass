// src/features/ai/providers/base.provider.js

class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.activeRequest = null;
  }

  async sendPrompt(messages, options = {}) { throw new Error('sendPrompt must be implemented by subclass'); }
  async streamPrompt(messages, onChunk, options = {}) { throw new Error('streamPrompt must be implemented by subclass'); }
  estimateCost(inputTokens, outputTokens) { throw new Error('estimateCost must be implemented by subclass'); }

  // Shared by all providers so `devcompass llm test` actually exercises the
  // configured credentials/base URL instead of reporting success just because
  // a provider row exists in the database.
  async test() {
    try {
      const result = await this.sendPrompt(
        [{ role: 'user', content: 'Reply with exactly: OK' }],
        { maxTokens: 10, temperature: 0 }
      );
      if (!result || !result.content) return { success: false, message: 'Provider returned an empty response' };
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  cancel() { if (this.activeRequest) { this.activeRequest.abort(); this.activeRequest = null; } }
  createAbortController() { const controller = new AbortController(); this.activeRequest = controller; return controller; }
  clearAbortController() { this.activeRequest = null; }

  // Every provider's sendPrompt/streamPrompt catch block did this same 4 lines
  // — clear the controller, translate an aborted request into a user-facing
  // message, rethrow anything else unchanged. Always throws; callers use it as
  // `catch (error) { this.handleRequestError(error); }`.
  handleRequestError(error) {
    this.clearAbortController();
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') throw new Error('Request cancelled by user');
    throw error;
  }

  // Shared by every SSE-based provider's streamPrompt: split each incoming
  // chunk into non-empty lines. What a line *means* (an OpenAI/Anthropic/Google
  // "data: {...}" line vs. Ollama's raw JSON-per-line) still varies per
  // provider, so only this common chunk-splitting boilerplate is factored out.
  async *streamLines(stream) {
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      for (const line of lines) yield line;
    }
  }

  // tokenManager.getProvider() always attaches _getDecryptedKey; falling back to
  // this.config.api_key here would silently use the still-encrypted ciphertext.
  getApiKey() {
    if (typeof this._getDecryptedKey === 'function') return this._getDecryptedKey();
    throw new Error('No API key resolver configured for this provider instance');
  }

  // A configured base URL (custom proxy/gateway) is only restricted to
  // http/https here — the local Ollama provider legitimately needs
  // http://localhost, so this can't also block private/loopback hosts.
  // It exists to stop a stored config value like "file:///etc/passwd" or
  // "gopher://..." from ever reaching axios, not to fully sandbox the request.
  resolveBaseURL(configured, fallback) {
    if (!configured) return fallback;
    let parsed;
    try {
      parsed = new URL(configured);
    } catch (error) {
      throw new Error(`Invalid AI provider base URL: ${configured}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`AI provider base URL must use http:// or https:// (got "${parsed.protocol}"): ${configured}`);
    }
    return configured;
  }
}

module.exports = BaseProvider;