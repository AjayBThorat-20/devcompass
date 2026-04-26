// src/history/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

class HistoryDatabase {
  constructor() {
    const dbDir = path.join(os.homedir(), '.devcompass');
    
    // Create directory if doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'history.db');
    this.db = null;
  }

  connect() {
    if (this.db) return this.db;
    
    const isNewDb = !fs.existsSync(this.dbPath);
    
    this.db = new Database(this.dbPath, {
      verbose: process.env.DEBUG ? console.log : null
    });
    
    // Performance optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');
    
    if (isNewDb) {
      this.initialize();
    }
    
    return this.db;
  }

  initialize() {
    console.log('📦 Initializing DevCompass history database...');
    
    // Create snapshots table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        project_name TEXT NOT NULL,
        project_version TEXT,
        project_path TEXT NOT NULL,
        node_count INTEGER,
        total_dependencies INTEGER,
        health_score REAL,
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create packages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        version TEXT,
        depth INTEGER DEFAULT 0,
        health_score REAL DEFAULT 8.0,
        is_vulnerable BOOLEAN DEFAULT 0,
        is_deprecated BOOLEAN DEFAULT 0,
        is_outdated BOOLEAN DEFAULT 0,
        is_unused BOOLEAN DEFAULT 0,
        issues JSON,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
      );
    `);
    
    // Create dependencies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL,
        source_package TEXT NOT NULL,
        target_package TEXT NOT NULL,
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_project 
      ON snapshots(project_name, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_packages_snapshot 
      ON packages(snapshot_id, name);
      
      CREATE INDEX IF NOT EXISTS idx_packages_health 
      ON packages(health_score);
      
      CREATE INDEX IF NOT EXISTS idx_dependencies_snapshot 
      ON dependencies(snapshot_id);
    `);
    
    console.log('✅ History database initialized');
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  vacuum() {
    this.db.exec('VACUUM');
  }
}

module.exports = new HistoryDatabase();