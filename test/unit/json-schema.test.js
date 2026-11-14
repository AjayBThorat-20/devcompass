// test/unit/json-schema.test.js
// AR-02: `analyze --json`'s output carries a schemaVersion so a CI pipeline
// parsing it can detect an incompatible future change. This pins down the
// shape schema/analysis-result-v1.json documents, without adding a JSON
// Schema validator library as a real dependency just for one test file.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { renderJSONOutput, SCHEMA_VERSION } = require('../../src/features/analyze/renderers/json.renderer');

function captureStdout(fn) {
  const original = console.log;
  let output = '';
  console.log = (...args) => { output += args.join(' '); };
  try { fn(); } finally { console.log = original; }
  return output;
}

test('SCHEMA_VERSION is 1, matching schema/analysis-result-v1.json', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../../schema/analysis-result-v1.json'), 'utf8'));
  assert.equal(SCHEMA_VERSION, 1);
  assert.equal(schema.properties.schemaVersion.const, 1);
});

test('renderJSONOutput() includes schemaVersion and every field schema/analysis-result-v1.json requires', () => {
  const issues = [{
    id: 'vuln:lodash@4.17.15:GHSA-x', ruleId: 'vuln', name: 'lodash', version: '4.17.15',
    type: 'security', severity: 'HIGH', confidence: 'high', advisoryIds: ['GHSA-x'],
    score: 7, message: 'msg', risk: 'risk', fix: 'fix', safeFix: false, source: 'CVE', metadata: {}
  }];
  const output = captureStdout(() => renderJSONOutput(issues, { projectName: 'demo', projectVersion: '1.0.0', projectPath: '/tmp/demo', healthScore: 6.4 }));
  const parsed = JSON.parse(output);

  for (const field of ['schemaVersion', 'version', 'timestamp', 'project', 'healthScore', 'summary', 'issues', 'metadata']) {
    assert.ok(field in parsed, `top-level field "${field}" is required by the schema`);
  }
  assert.equal(parsed.schemaVersion, 1);

  const issue = parsed.issues[0];
  for (const field of ['id', 'ruleId', 'name', 'type', 'severity', 'confidence']) {
    assert.ok(field in issue, `issue field "${field}" is required by the schema`);
  }
});
