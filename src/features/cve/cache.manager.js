// src/features/cve/cache.manager.js

const { db, CACHE_VERSION } = require('./database');

class CacheManager {
  constructor() {
    this.CACHE_TTL = 24 * 60 * 60 * 1000;
  }

  get(packageName, version, ecosystem = 'npm') {
    try {
      const result = db.prepare(`
        SELECT vulnerabilities FROM vulnerability_cache
        WHERE package_name = ? AND package_version = ? AND ecosystem = ?
          AND cache_version = ? AND datetime(expires_at) > datetime('now')
      `).get(packageName, version, ecosystem, CACHE_VERSION);
      return result ? JSON.parse(result.vulnerabilities) : null;
    } catch (error) {
      if (process.env.DEBUG) console.error('Cache get error:', error.message);
      return null;
    }
  }

  set(packageName, version, vulnerabilities, ecosystem = 'npm') {
    try {
      const expiresAt = new Date(Date.now() + this.CACHE_TTL).toISOString();
      db.prepare(`
        INSERT INTO vulnerability_cache (package_name, package_version, ecosystem, vulnerabilities, cache_version, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(package_name, package_version, ecosystem) DO UPDATE SET
          vulnerabilities = excluded.vulnerabilities, cache_version = excluded.cache_version,
          cached_at = CURRENT_TIMESTAMP, expires_at = excluded.expires_at
      `).run(packageName, version, ecosystem, JSON.stringify(vulnerabilities), CACHE_VERSION, expiresAt);
    } catch (error) {
      if (process.env.DEBUG) console.error('Cache set error:', error.message);
    }
  }

  delete(packageName, version, ecosystem = 'npm') {
    try {
      return db.prepare('DELETE FROM vulnerability_cache WHERE package_name = ? AND package_version = ? AND ecosystem = ?')
        .run(packageName, version, ecosystem).changes;
    } catch (error) {
      return 0;
    }
  }

  clearExpired() {
    try {
      return db.prepare('DELETE FROM vulnerability_cache WHERE datetime(expires_at) <= datetime(\'now\')').run().changes;
    } catch (error) {
      return 0;
    }
  }

  clearAll() {
    try {
      return db.prepare('DELETE FROM vulnerability_cache').run().changes;
    } catch (error) {
      return 0;
    }
  }

  getStats() {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM vulnerability_cache').get();
      const expired = db.prepare('SELECT COUNT(*) as count FROM vulnerability_cache WHERE datetime(expires_at) <= datetime(\'now\')').get();
      const outdated = db.prepare('SELECT COUNT(*) as count FROM vulnerability_cache WHERE cache_version < ?').get(CACHE_VERSION);
      // A row can be both expired AND outdated at once, so subtracting both
      // counts from total double-counts the overlap. Count "active" directly
      // (neither expired nor outdated) instead of by subtraction.
      const active = db.prepare('SELECT COUNT(*) as count FROM vulnerability_cache WHERE datetime(expires_at) > datetime(\'now\') AND cache_version >= ?').get(CACHE_VERSION);
      return { total: total.count, expired: expired.count, outdated: outdated.count, active: active.count };
    } catch (error) {
      return { total: 0, expired: 0, outdated: 0, active: 0 };
    }
  }
}

module.exports = new CacheManager();