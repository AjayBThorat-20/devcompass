// src/cve/database.js
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DB_DIR = path.join(os.homedir(), '.devcompass');
const DB_PATH = path.join(DB_DIR, 'cve.db');

// Cache version - increment when parser logic changes to invalidate old cache
const CACHE_VERSION = 5; // ✅ INCREMENTED for new severity parser

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT UNIQUE NOT NULL,
    api_key TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vulnerability_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    package_version TEXT NOT NULL,
    ecosystem TEXT DEFAULT 'npm',
    vulnerabilities TEXT,
    cache_version INTEGER DEFAULT 1,
    cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    UNIQUE(package_name, package_version, ecosystem)
  );

  CREATE INDEX IF NOT EXISTS idx_cache_lookup 
    ON vulnerability_cache(package_name, package_version, ecosystem);

  CREATE INDEX IF NOT EXISTS idx_cache_expiry 
    ON vulnerability_cache(expires_at);

  CREATE TABLE IF NOT EXISTS cache_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Automatic cache migration - clear old cache if version mismatch
const getCurrentVersion = db.prepare('SELECT value FROM cache_metadata WHERE key = ?').pluck();
const setVersion = db.prepare('INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)');
const clearOldCache = db.prepare('DELETE FROM vulnerability_cache WHERE cache_version < ?');

const storedVersion = getCurrentVersion.get('cache_version');

if (!storedVersion || parseInt(storedVersion) < CACHE_VERSION) {
  if (process.env.DEBUG) {
    console.log(`Migrating CVE cache from v${storedVersion || 1} to v${CACHE_VERSION}...`);
  }
  clearOldCache.run(CACHE_VERSION);
  setVersion.run('cache_version', CACHE_VERSION.toString());
  if (process.env.DEBUG) {
    console.log('✓ CVE cache migrated successfully');
  }
}

module.exports = {
  db,
  DB_PATH,
  CACHE_VERSION
};