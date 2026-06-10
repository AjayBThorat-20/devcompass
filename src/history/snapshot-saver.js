// src/history/snapshot-saver.js
const historyDb = require('./database');

class SnapshotSaver {
  saveSnapshot(analysisData, graphData) {
    const db = historyDb.connect();
    const startTime = Date.now();

    const saveTransaction = db.transaction(() => {
      const metadata = graphData.metadata || {};
      
      const snapshotResult = db.prepare(`
        INSERT INTO snapshots (
          project_name,
          project_version,
          project_path,
          node_count,
          total_dependencies,
          health_score,
          metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        metadata.projectName || 'unknown',
        metadata.projectVersion || '1.0.0',
        process.cwd(),
        graphData.nodes?.length || 0,
        metadata.totalDependencies || 0,
        analysisData.healthScore || this.calculateOverallHealth(graphData.nodes),
        JSON.stringify({
          devcompass_version: '3.2.6',
          analysis_date: new Date().toISOString(),
          command: process.argv.slice(2).join(' ')
        })
      );

      const snapshotId = snapshotResult.lastInsertRowid;

      if (graphData.nodes && Array.isArray(graphData.nodes)) {
        const insertPackage = db.prepare(`
          INSERT INTO packages (
            snapshot_id,
            name,
            version,
            depth,
            health_score,
            is_vulnerable,
            is_deprecated,
            is_outdated,
            is_unused,
            issues
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const node of graphData.nodes) {
          insertPackage.run(
            snapshotId,
            node.name || node.id || 'unknown',
            node.version || '1.0.0',
            node.depth || 0,
            node.healthScore || 8.0,
            node.isVulnerable ? 1 : 0,
            node.isDeprecated ? 1 : 0,
            node.isOutdated ? 1 : 0,
            node.isUnused ? 1 : 0,
            JSON.stringify(node.issues || [])
          );
        }
      }

      if (graphData.links && Array.isArray(graphData.links)) {
        const insertDependency = db.prepare(`
          INSERT INTO dependencies (
            snapshot_id,
            source_package,
            target_package
          ) VALUES (?, ?, ?)
        `);

        for (const link of graphData.links) {
          const source = typeof link.source === 'object' ? link.source.id : link.source;
          const target = typeof link.target === 'object' ? link.target.id : link.target;
          insertDependency.run(snapshotId, source || 'unknown', target || 'unknown');
        }
      }

      return snapshotId;
    });

    try {
      const snapshotId = saveTransaction();
      const duration = Date.now() - startTime;

      return {
        success: true,
        snapshotId,
        duration: `${duration}ms`,
        nodes: graphData.nodes?.length || 0,
        links: graphData.links?.length || 0
      };
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Snapshot transaction failed:', error.message);
      }
      throw error;
    }
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