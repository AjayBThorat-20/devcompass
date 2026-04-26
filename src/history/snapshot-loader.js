// src/history/snapshot-loader.js
const db = require('./database');

class SnapshotLoader {
  
  /**
   * List snapshots with optional limit
   */
  listSnapshots(projectName = null, limit = 30) {
    const database = db.connect();
    
    let query = 'SELECT * FROM snapshots';
    const params = [];
    
    if (projectName) {
      query += ' WHERE project_name = ?';
      params.push(projectName);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    const stmt = database.prepare(query);
    return stmt.all(...params);
  }

  /**
   * NEW: Get snapshots within a date range
   */
  getSnapshotsInRange(startDate, endDate, projectName = null) {
    const database = db.connect();
    
    let query = `
      SELECT * FROM snapshots 
      WHERE timestamp BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (projectName) {
      query += ' AND project_name = ?';
      params.push(projectName);
    }
    
    query += ' ORDER BY timestamp ASC';
    
    const stmt = database.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get single snapshot with packages and dependencies
   */
  getSnapshot(snapshotId) {
    const database = db.connect();
    
    // Get snapshot metadata
    const snapshotStmt = database.prepare('SELECT * FROM snapshots WHERE id = ?');
    const snapshot = snapshotStmt.get(snapshotId);
    
    if (!snapshot) {
      throw new Error(`Snapshot #${snapshotId} not found`);
    }
    
    // Get packages
    const packagesStmt = database.prepare(`
      SELECT 
        name, version, depth, health_score,
        is_vulnerable as isVulnerable,
        is_deprecated as isDeprecated,
        is_outdated as isOutdated,
        is_unused as isUnused,
        issues
      FROM packages 
      WHERE snapshot_id = ?
      ORDER BY name
    `);
    
    let packages = packagesStmt.all(snapshotId);
    
    // Parse JSON fields
    packages = packages.map(p => ({
      ...p,
      isVulnerable: Boolean(p.isVulnerable),
      isDeprecated: Boolean(p.isDeprecated),
      isOutdated: Boolean(p.isOutdated),
      isUnused: Boolean(p.isUnused),
      issues: p.issues ? JSON.parse(p.issues) : []
    }));
    
    // Get dependencies
    const depsStmt = database.prepare(`
      SELECT source_package, target_package 
      FROM dependencies 
      WHERE snapshot_id = ?
    `);
    
    const dependencies = depsStmt.all(snapshotId);
    
    return {
      snapshot,
      packages,
      dependencies
    };
  }

  /**
   * NEW: Get monthly statistics
   */
  getMonthlyStats(projectName = null, year = null) {
    const database = db.connect();
    
    let query = `
      SELECT 
        strftime('%Y-%m', timestamp) as month,
        COUNT(*) as count,
        AVG(health_score) as avg_health,
        AVG(total_dependencies) as avg_deps,
        MIN(health_score) as min_health,
        MAX(health_score) as max_health
      FROM snapshots
    `;
    
    const params = [];
    const conditions = [];
    
    if (projectName) {
      conditions.push('project_name = ?');
      params.push(projectName);
    }
    
    if (year) {
      conditions.push("strftime('%Y', timestamp) = ?");
      params.push(String(year));
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY month ORDER BY month DESC';
    
    const stmt = database.prepare(query);
    return stmt.all(...params);
  }

  /**
   * NEW: Find snapshot closest to a specific date
   */
  getClosestToDate(targetDate, projectName = null) {
    const database = db.connect();
    
    let query = `
      SELECT *, 
        ABS(julianday(timestamp) - julianday(?)) as date_diff
      FROM snapshots
    `;
    
    const params = [targetDate];
    
    if (projectName) {
      query += ' WHERE project_name = ?';
      params.push(projectName);
    }
    
    query += ' ORDER BY date_diff ASC LIMIT 1';
    
    const stmt = database.prepare(query);
    const result = stmt.get(...params);
    
    if (!result) return null;
    
    return this.getSnapshot(result.id);
  }

  /**
   * Get overall statistics
   */
  getStats(projectName = null) {
    const database = db.connect();
    
    let query = `
      SELECT 
        COUNT(*) as total_snapshots,
        MIN(timestamp) as first_snapshot,
        MAX(timestamp) as last_snapshot,
        AVG(health_score) as avg_health,
        AVG(total_dependencies) as avg_dependencies
      FROM snapshots
    `;
    
    const params = [];
    
    if (projectName) {
      query += ' WHERE project_name = ?';
      params.push(projectName);
    }
    
    const stmt = database.prepare(query);
    return stmt.get(...params);
  }

  /**
   * Cleanup old snapshots
   */
  cleanup(keepLast = 30, projectName = null) {
    const database = db.connect();
    
    // Get IDs to delete
    let query = `
      SELECT id FROM snapshots
    `;
    
    const params = [];
    
    if (projectName) {
      query += ' WHERE project_name = ?';
      params.push(projectName);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT -1 OFFSET ?`;
    params.push(keepLast);
    
    const stmt = database.prepare(query);
    const toDelete = stmt.all(...params);
    
    if (toDelete.length === 0) {
      return 0;
    }
    
    // Delete snapshots (CASCADE will handle packages and dependencies)
    const deleteStmt = database.prepare('DELETE FROM snapshots WHERE id = ?');
    
    const deleteTransaction = database.transaction((ids) => {
      for (const { id } of ids) {
        deleteStmt.run(id);
      }
      return ids.length;
    });
    
    return deleteTransaction(toDelete);
  }

  /**
   * NEW: Get snapshots count by date range
   */
  getCountByDateRange(startDate, endDate, projectName = null) {
    const database = db.connect();
    
    let query = `
      SELECT COUNT(*) as count
      FROM snapshots 
      WHERE timestamp BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (projectName) {
      query += ' AND project_name = ?';
      params.push(projectName);
    }
    
    const stmt = database.prepare(query);
    const result = stmt.get(...params);
    return result.count;
  }

  /**
   * NEW: Get health score trend over time
   */
  getHealthTrend(days = 30, projectName = null) {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const snapshots = this.getSnapshotsInRange(startDate, endDate, projectName);
    
    if (snapshots.length < 2) {
      return { trend: 'insufficient_data', snapshots: snapshots.length };
    }
    
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const diff = last.health_score - first.health_score;
    
    return {
      trend: diff > 0.5 ? 'improving' : diff < -0.5 ? 'declining' : 'stable',
      from: first.health_score,
      to: last.health_score,
      change: diff,
      snapshots: snapshots.length,
      days
    };
  }
}

module.exports = new SnapshotLoader();