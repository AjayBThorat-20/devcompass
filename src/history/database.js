// src/history/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

class HistoryDatabase {
  constructor() {
    const dbDir = path.join(os.homedir(), '.devcompass');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'history.db');
    this.db = null;
  }

  connect() {
    if (this.db) {
      return this.db;
    }

    const isNewDb = !fs.existsSync(this.dbPath);

    try {
      this.db = new Database(this.dbPath, {
        verbose: process.env.DEBUG ? console.log : null
      });

      if (isNewDb) {
        this.initialize();
      }

      this.optimizeDatabase();

      return this.db;
    } catch (error) {
      if (this.db) {
        try {
          this.db.close();
        } catch (closeError) {
          // Ignore close errors
        }
        this.db = null;
      }
      throw error;
    }
  }

  optimizeDatabase() {
    try {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('mmap_size = 67108864');
      this.db.pragma('foreign_keys = ON');

      this.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

      const result = this.db.prepare('PRAGMA freelist_count').get();

      if (result && result.freelist_count > 1000) {
        this.db.exec('PRAGMA incremental_vacuum;');
      }
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Database optimization failed:', error.message);
      }
    }
  }

  initialize() {
    console.log('📦 Initializing DevCompass history database...');

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
        FOREIGN KEY (snapshot_id)
          REFERENCES snapshots(id)
          ON DELETE CASCADE
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_id INTEGER NOT NULL,
        source_package TEXT NOT NULL,
        target_package TEXT NOT NULL,
        FOREIGN KEY (snapshot_id)
          REFERENCES snapshots(id)
          ON DELETE CASCADE
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
      ON snapshots(timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_snapshots_project
      ON snapshots(project_name, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_snapshots_health
      ON snapshots(health_score);

      CREATE INDEX IF NOT EXISTS idx_packages_snapshot
      ON packages(snapshot_id, name);

      CREATE INDEX IF NOT EXISTS idx_packages_health
      ON packages(health_score);

      CREATE INDEX IF NOT EXISTS idx_packages_vulnerable
      ON packages(is_vulnerable) WHERE is_vulnerable = 1;

      CREATE INDEX IF NOT EXISTS idx_packages_deprecated
      ON packages(is_deprecated) WHERE is_deprecated = 1;

      CREATE INDEX IF NOT EXISTS idx_packages_outdated
      ON packages(is_outdated) WHERE is_outdated = 1;

      CREATE INDEX IF NOT EXISTS idx_packages_unused
      ON packages(is_unused) WHERE is_unused = 1;

      CREATE INDEX IF NOT EXISTS idx_dependencies_snapshot
      ON dependencies(snapshot_id);

      CREATE INDEX IF NOT EXISTS idx_dependencies_source
      ON dependencies(source_package);

      CREATE INDEX IF NOT EXISTS idx_dependencies_target
      ON dependencies(target_package);
    `);

    this.db.exec('PRAGMA auto_vacuum = INCREMENTAL;');

    console.log('✅ History database initialized');
  }

  close() {
    if (this.db) {
      try {
        this.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
        this.db.close();
      } catch (error) {
        if (process.env.DEBUG) {
          console.error('Error closing database:', error.message);
        }
      } finally {
        this.db = null;
      }
    }
  }

  vacuum() {
    if (!this.db) {
      return;
    }
    
    try {
      this.db.exec('VACUUM');
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Vacuum failed:', error.message);
      }
    }
  }
}

const instance = new HistoryDatabase();

process.on('exit', () => {
  instance.close();
});

process.on('SIGINT', () => {
  instance.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  instance.close();
  process.exit(0);
});

module.exports = instance;