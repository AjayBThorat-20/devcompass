// src/config/database.js
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CONFIG_DIR = path.join(os.homedir(), '.devcompass');
const DB_PATH = path.join(CONFIG_DIR, 'config.db');

/**
 * Initialize config database
 */
function initDatabase() {
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Open database
  const db = new Database(DB_PATH);
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Create config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      encrypted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}

/**
 * Get database instance
 */
function getDatabase() {
  return initDatabase();
}

module.exports = {
  getDatabase,
  initDatabase,
  DB_PATH,
  CONFIG_DIR
};