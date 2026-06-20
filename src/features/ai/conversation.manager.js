// src/features/ai/conversation.manager.js

const { v4: uuidv4 } = require('uuid');
const aiDatabase = require('./ai.database');

class ConversationManager {
  constructor() {
    this.currentSession = null;
    this.memoryStore = new Map();
    this.sessionLocks = new Map();
  }

  async acquireLock(sessionId) {
    while (this.sessionLocks.get(sessionId)) await new Promise(resolve => setTimeout(resolve, 10));
    this.sessionLocks.set(sessionId, true);
  }

  releaseLock(sessionId) { this.sessionLocks.delete(sessionId); }

  startSession() {
    this.currentSession = uuidv4();
    if (!this.memoryStore.has(this.currentSession)) this.memoryStore.set(this.currentSession, []);
    return this.currentSession;
  }

  getCurrentSession() {
    if (!this.currentSession) this.startSession();
    return this.currentSession;
  }

  clearSession() { this.currentSession = null; }

  async addMessage(conversationId, role, content) {
    await this.acquireLock(conversationId);
    try {
      if (!this.memoryStore.has(conversationId)) this.memoryStore.set(conversationId, []);
      this.memoryStore.get(conversationId).push({ role, content, timestamp: new Date().toISOString() });
      return true;
    } finally {
      this.releaseLock(conversationId);
    }
  }

  getMessages(conversationId) { return this.memoryStore.get(conversationId) || []; }

  async saveConversation(providerId, command, commandOutput, userPrompt, aiResponse, tokensUsed, cost) {
    const sessionId = this.getCurrentSession();
    await this.acquireLock(sessionId);
    try {
      aiDatabase.saveConversation(sessionId, providerId, command, commandOutput, userPrompt, aiResponse, tokensUsed, cost);
    } finally {
      this.releaseLock(sessionId);
    }
  }

  getHistory(limit = 10) { return aiDatabase.getConversationHistory(this.getCurrentSession(), limit); }

  buildContext(limit = 5) {
    const history = this.getHistory(limit);
    if (history.length === 0) return null;
    return history.reverse().map(turn => ({ user: turn.user_prompt, assistant: turn.ai_response }));
  }
}

module.exports = new ConversationManager();