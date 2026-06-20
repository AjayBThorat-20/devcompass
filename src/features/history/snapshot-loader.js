// src/features/history/snapshot-loader.js

const db = require('./history.database');

class SnapshotLoader {
  listSnapshots(projectName = null, limit = 30) {
    const database = db.connect();
    let query = 'SELECT * FROM snapshots';
    const params = [];
    if (projectName) { query += ' WHERE project_name = ?'; params.push(projectName); }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    return database.prepare(query).all(...params);
  }

  getSnapshotsInRange(startDate, endDate, projectName = null) {
    const database = db.connect();
    let query = 'SELECT * FROM snapshots WHERE timestamp BETWEEN ? AND ?';
    const params = [startDate, endDate];
    if (projectName) { query += ' AND project_name = ?'; params.push(projectName); }
    query += ' ORDER BY timestamp ASC';
    return database.prepare(query).all(...params);
  }

  getSnapshot(snapshotId) {
    const database = db.connect();
    const snapshot = database.prepare('SELECT * FROM snapshots WHERE id = ?').get(snapshotId);
    if (!snapshot) throw new Error(`Snapshot #${snapshotId} not found`);

    let packages = database.prepare(`
      SELECT name, version, depth, health_score,
        is_vulnerable as isVulnerable, is_deprecated as isDeprecated,
        is_outdated as isOutdated, is_unused as isUnused, issues
      FROM packages WHERE snapshot_id = ? ORDER BY name
    `).all(snapshotId);

    packages = packages.map(p => ({
      ...p,
      isVulnerable: Boolean(p.isVulnerable),
      isDeprecated: Boolean(p.isDeprecated),
      isOutdated: Boolean(p.isOutdated),
      isUnused: Boolean(p.isUnused),
      issues: p.issues ? JSON.parse(p.issues) : []
    }));

    const dependencies = database.prepare('SELECT source_package, target_package FROM dependencies WHERE snapshot_id = ?').all(snapshotId);
    return { snapshot, packages, dependencies };
  }

  getMonthlyStats(projectName = null, year = null) {
    const database = db.connect();
    let query = `SELECT strftime('%Y-%m', timestamp) as month, COUNT(*) as count, AVG(health_score) as avg_health, AVG(total_dependencies) as avg_deps FROM snapshots`;
    const params = [];
    const conditions = [];
    if (projectName) { conditions.push('project_name = ?'); params.push(projectName); }
    if (year) { conditions.push("strftime('%Y', timestamp) = ?"); params.push(String(year)); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY month ORDER BY month DESC';
    return database.prepare(query).all(...params);
  }

  getStats(projectName = null) {
    const database = db.connect();
    let query = `SELECT COUNT(*) as total_snapshots, MIN(timestamp) as first_snapshot, MAX(timestamp) as last_snapshot, AVG(health_score) as avg_health, AVG(total_dependencies) as avg_dependencies FROM snapshots`;
    const params = [];
    if (projectName) { query += ' WHERE project_name = ?'; params.push(projectName); }
    return database.prepare(query).get(...params);
  }

  cleanup(keepLast = 30, projectName = null) {
    const database = db.connect();
    let query = 'SELECT id FROM snapshots';
    const params = [];
    if (projectName) { query += ' WHERE project_name = ?'; params.push(projectName); }
    query += ' ORDER BY timestamp DESC LIMIT -1 OFFSET ?';
    params.push(keepLast);
    const toDelete = database.prepare(query).all(...params);
    if (toDelete.length === 0) return 0;
    const deleteStmt = database.prepare('DELETE FROM snapshots WHERE id = ?');
    return database.transaction((ids) => { for (const { id } of ids) deleteStmt.run(id); return ids.length; })(toDelete);
  }
}

module.exports = new SnapshotLoader();