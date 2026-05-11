function renderJSONOutput(issues, metadata) {
  const output = {
    version: '3.2.5',
    timestamp: new Date().toISOString(),
    project: {
      name: metadata.projectName,
      version: metadata.projectVersion,
      path: metadata.projectPath
    },
    healthScore: metadata.healthScore,
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length,
      safeFixes: issues.filter(i => i.safeFix).length,
      riskyFixes: issues.filter(i => !i.safeFix).length
    },
    issues: issues.map(issue => issue.toJSON()),
    metadata: metadata
  };

  console.log(JSON.stringify(output, null, 2));
}

module.exports = { renderJSONOutput };