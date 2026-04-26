// src/history/snapshot-saver.js
const db = require('./database');
const path = require('path');

class SnapshotSaver {
  
  saveSnapshot(analysisData, graphData) {
    const database = db.connect();
    
    const startTime = Date.now();
    
    // Start transaction for atomic operation
    const saveTransaction = database.transaction(() => {
      // 1. Insert snapshot metadata
      const snapshotStmt = database.prepare(`
        INSERT INTO snapshots (
          project_name, project_version, project_path,
          node_count, total_dependencies, health_score, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const metadata = {
        devcompass_version: '3.2.1',
        analysis_date: new Date().toISOString(),
        command: process.argv.slice(2).join(' ')
      };
      
      const result = snapshotStmt.run(
        graphData.metadata?.projectName || 'unknown',
        graphData.metadata?.projectVersion || '1.0.0',
        process.cwd(),
        graphData.nodes?.length || 0,
        analysisData.dependencies?.length || 0,
        this.calculateOverallHealth(graphData.nodes),
        JSON.stringify(metadata)
      );
      
      const snapshotId = result.lastInsertRowid;
      
      // 2. Insert packages (batch insert for performance)
      const packageStmt = database.prepare(`
        INSERT INTO packages (
          snapshot_id, name, version, depth, health_score,
          is_vulnerable, is_deprecated, is_outdated, is_unused, issues
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertManyPackages = database.transaction((packages) => {
        for (const pkg of packages) {
          packageStmt.run(
            snapshotId,
            pkg.name || pkg.id,
            pkg.version || 'unknown',
            pkg.depth || 0,
            pkg.healthScore || 8.0,
            pkg.isVulnerable ? 1 : 0,
            pkg.isDeprecated ? 1 : 0,
            pkg.isOutdated ? 1 : 0,
            pkg.isUnused ? 1 : 0,
            JSON.stringify(pkg.issues || [])
          );
        }
      });
      
      insertManyPackages(graphData.nodes || []);
      
      // 3. Insert dependencies (batch insert)
      const depStmt = database.prepare(`
        INSERT INTO dependencies (snapshot_id, source_package, target_package)
        VALUES (?, ?, ?)
      `);
      
      const insertManyDeps = database.transaction((dependencies) => {
        for (const dep of dependencies) {
          const source = typeof dep.source === 'object' ? dep.source.id : dep.source;
          const target = typeof dep.target === 'object' ? dep.target.id : dep.target;
          depStmt.run(snapshotId, source, target);
        }
      });
      
      insertManyDeps(graphData.links || []);
      
      return snapshotId;
    });
    
    const snapshotId = saveTransaction();
    const duration = Date.now() - startTime;
    
    return {
      snapshotId,
      duration,
      nodes: graphData.nodes?.length || 0,
      links: graphData.links?.length || 0
    };
  }

  calculateOverallHealth(nodes) {
    if (!nodes || nodes.length === 0) return 8.0;
    
    const scores = nodes
      .filter(n => n.type !== 'root')
      .map(n => n.healthScore || 8.0);
    
    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 8.0;
  }
}

module.exports = new SnapshotSaver();