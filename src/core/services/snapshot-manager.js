const snapshotSaver = require('../../history/snapshot-saver');

async function saveSnapshot(data) {
  try {
    if (!data || !data.issues) {
      return { success: false, error: 'No data to save' };
    }

    const graphData = {
      nodes: data.issues.map(issue => ({
        id: issue.id,
        name: issue.name,
        version: issue.version,
        type: issue.type,
        healthScore: 10 - (issue.score || 0),
        issues: [{
          type: issue.type,
          severity: issue.severity,
          message: issue.message
        }],
        isVulnerable: issue.type === 'security',
        isDeprecated: issue.type === 'quality',
        isOutdated: issue.type === 'outdated',
        isUnused: issue.type === 'unused'
      })),
      links: [],
      metadata: {
        projectName: data.metadata?.projectName || 'unknown',
        projectVersion: data.metadata?.projectVersion || '1.0.0',
        totalDependencies: data.issues.length,
        generatedAt: new Date().toISOString()
      }
    };

    const analysisData = {
      dependencies: data.issues.map(i => i.name),
      healthScore: data.metadata?.healthScore || 0
    };

    const result = snapshotSaver.saveSnapshot(analysisData, graphData);
    
    return {
      success: true,
      snapshotId: result.snapshotId,
      duration: result.duration
    };
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Snapshot save failed:', error.message);
    }
    return { success: false, error: error.message };
  }
}

module.exports = {
  saveSnapshot
};