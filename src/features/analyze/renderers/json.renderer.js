// src/features/analyze/renderers/json.renderer.js

const { version } = require('../../../../package.json');

// AR-02: a version number on the JSON output, so a CI pipeline parsing it
// can detect a future incompatible change instead of silently breaking.
// Bump this — and schema/analysis-result-v1.json — only for a change that
// isn't purely additive (removing/renaming a field, changing a field's
// type or meaning); adding a new field is not a schemaVersion bump.
const SCHEMA_VERSION = 1;

function renderJSONOutput(issues, metadata) {
  const output = {
    schemaVersion: SCHEMA_VERSION,
    version,
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
    issues: issues.map(issue => (typeof issue.toJSON === 'function' ? issue.toJSON() : issue)),
    metadata
  };
  console.log(JSON.stringify(output, null, 2));
}

module.exports = { renderJSONOutput, SCHEMA_VERSION };