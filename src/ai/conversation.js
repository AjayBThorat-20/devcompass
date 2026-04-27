// src/ai/conversation.js
const { v4: uuidv4 } = require('uuid');
const aiDatabase = require('./database');

class ConversationManager {
  constructor() {
    this.currentSession = null;
  }

  /**
   * Start a new conversation session
   */
  startSession() {
    this.currentSession = uuidv4();
    return this.currentSession;
  }

  /**
   * Get current session ID
   */
  getCurrentSession() {
    if (!this.currentSession) {
      this.startSession();
    }
    return this.currentSession;
  }

  /**
   * Save conversation turn
   */
  saveConversation(providerId, command, commandOutput, userPrompt, aiResponse, tokensUsed, cost) {
    const sessionId = this.getCurrentSession();
    
    aiDatabase.saveConversation(
      sessionId,
      providerId,
      command,
      commandOutput,
      userPrompt,
      aiResponse,
      tokensUsed,
      cost
    );
  }

  /**
   * Get conversation history
   */
  getHistory(limit = 10) {
    const sessionId = this.getCurrentSession();
    return aiDatabase.getConversationHistory(sessionId, limit);
  }

  /**
   * Build conversation context for AI
   */
  buildContext(limit = 5) {
    const history = this.getHistory(limit);
    
    if (history.length === 0) {
      return null;
    }

    // Reverse to get chronological order
    return history.reverse().map(turn => ({
      user: turn.user_prompt,
      assistant: turn.ai_response
    }));
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.currentSession = null;
  }
}

module.exports = new ConversationManager();