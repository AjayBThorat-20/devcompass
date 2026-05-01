// src/cve/cache-manager.js
const { db, CACHE_VERSION } = require('./database');

class CacheManager {
  constructor() {
    this.CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get cached vulnerability data
   */
  get(packageName, version, ecosystem = 'npm') {
    try {
      const stmt = db.prepare(`
        SELECT vulnerabilities, cached_at, expires_at
        FROM vulnerability_cache
        WHERE package_name = ? 
          AND package_version = ? 
          AND ecosystem = ?
          AND cache_version = ?
          AND datetime(expires_at) > datetime('now')
      `);

      const result = stmt.get(packageName, version, ecosystem, CACHE_VERSION);

      if (result) {
        return JSON.parse(result.vulnerabilities);
      }

      return null;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Cache get error:', error.message);
      }
      return null;
    }
  }

  /**
   * Set cache
   */
  set(packageName, version, vulnerabilities, ecosystem = 'npm') {
    try {
      const expiresAt = new Date(Date.now() + this.CACHE_TTL).toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO vulnerability_cache 
          (package_name, package_version, ecosystem, vulnerabilities, cache_version, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(package_name, package_version, ecosystem) 
        DO UPDATE SET 
          vulnerabilities = excluded.vulnerabilities,
          cache_version = excluded.cache_version,
          cached_at = CURRENT_TIMESTAMP,
          expires_at = excluded.expires_at
      `);

      stmt.run(
        packageName,
        version,
        ecosystem,
        JSON.stringify(vulnerabilities),
        CACHE_VERSION,
        expiresAt
      );
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Cache set error:', error.message);
      }
    }
  }

  /**
   * Clear expired cache
   */
  clearExpired() {
    try {
      const stmt = db.prepare(`
        DELETE FROM vulnerability_cache
        WHERE datetime(expires_at) <= datetime('now')
      `);

      const result = stmt.run();
      return result.changes;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Cache clear expired error:', error.message);
      }
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    try {
      const stmt = db.prepare('DELETE FROM vulnerability_cache');
      const result = stmt.run();
      return result.changes;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Cache clear all error:', error.message);
      }
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM vulnerability_cache').get();
      const expired = db.prepare(`
        SELECT COUNT(*) as count FROM vulnerability_cache 
        WHERE datetime(expires_at) <= datetime('now')
      `).get();
      const outdated = db.prepare(`
        SELECT COUNT(*) as count FROM vulnerability_cache 
        WHERE cache_version < ?
      `).get(CACHE_VERSION);

      return {
        total: total.count,
        expired: expired.count,
        outdated: outdated.count,
        active: total.count - expired.count - outdated.count
      };
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Cache stats error:', error.message);
      }
      return {
        total: 0,
        expired: 0,
        outdated: 0,
        active: 0
      };
    }
  }
}

module.exports = new CacheManager();