// src/ai/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DB_DIR = path.join(os.homedir(), '.devcompass');
const DB_PATH = path.join(DB_DIR, 'ai.db');

class AIDatabase {
  constructor() {
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  initSchema() {
    // LLM providers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS llm_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        api_key TEXT,
        base_url TEXT,
        model TEXT NOT NULL,
        is_default BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        max_tokens INTEGER DEFAULT 4096,
        temperature REAL DEFAULT 0.7,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider)
      );
    `);

    // Conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        provider_id INTEGER,
        command TEXT NOT NULL,
        command_output TEXT,
        user_prompt TEXT,
        ai_response TEXT,
        tokens_used INTEGER DEFAULT 0,
        cost REAL DEFAULT 0.0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES llm_providers(id) ON DELETE SET NULL
      );
    `);

    // Cost tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_tokens INTEGER DEFAULT 0,
        total_cost REAL DEFAULT 0.0,
        request_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (provider_id) REFERENCES llm_providers(id) ON DELETE CASCADE,
        UNIQUE(provider_id, year, month)
      );
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_session ON ai_conversations(session_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON ai_conversations(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_usage_date ON ai_usage(year, month);
    `);
  }

  // Provider methods
  addProvider(provider, apiKey, model, baseUrl = null) {
    const stmt = this.db.prepare(`
      INSERT INTO llm_providers (provider, api_key, model, base_url)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(provider, apiKey, model, baseUrl);
  }

  getProvider(provider) {
    return this.db.prepare('SELECT * FROM llm_providers WHERE provider = ?').get(provider);
  }

  getDefaultProvider() {
    return this.db.prepare('SELECT * FROM llm_providers WHERE is_default = 1 LIMIT 1').get();
  }

  getAllProviders() {
    return this.db.prepare('SELECT * FROM llm_providers ORDER BY is_default DESC, provider ASC').all();
  }

  setDefaultProvider(provider) {
    this.db.exec('UPDATE llm_providers SET is_default = 0');
    this.db.prepare('UPDATE llm_providers SET is_default = 1 WHERE provider = ?').run(provider);
  }

  updateProvider(provider, updates) {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), provider];
    this.db.prepare(`UPDATE llm_providers SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE provider = ?`).run(...values);
  }

  removeProvider(provider) {
    this.db.prepare('DELETE FROM llm_providers WHERE provider = ?').run(provider);
  }

  // Conversation methods
  saveConversation(sessionId, providerId, command, commandOutput, userPrompt, aiResponse, tokensUsed, cost) {
    const stmt = this.db.prepare(`
      INSERT INTO ai_conversations (session_id, provider_id, command, command_output, user_prompt, ai_response, tokens_used, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(sessionId, providerId, command, commandOutput, userPrompt, aiResponse, tokensUsed, cost);
  }

  getConversationHistory(sessionId, limit = 10) {
    return this.db.prepare(`
      SELECT * FROM ai_conversations 
      WHERE session_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(sessionId, limit);
  }

  // Usage tracking
  trackUsage(providerId, tokens, cost) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    this.db.prepare(`
      INSERT INTO ai_usage (provider_id, year, month, total_tokens, total_cost, request_count)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(provider_id, year, month) DO UPDATE SET
        total_tokens = total_tokens + ?,
        total_cost = total_cost + ?,
        request_count = request_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `).run(providerId, year, month, tokens, cost, tokens, cost);
  }

  getUsageStats(year, month) {
    const query = month 
      ? 'SELECT * FROM ai_usage WHERE year = ? AND month = ?'
      : 'SELECT * FROM ai_usage WHERE year = ?';
    
    const params = month ? [year, month] : [year];
    return this.db.prepare(query).all(...params);
  }

  close() {
    this.db.close();
  }
}

module.exports = new AIDatabase();