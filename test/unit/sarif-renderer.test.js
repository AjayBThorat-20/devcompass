// test/unit/sarif-renderer.test.js
// FT-03: SARIF output must be valid enough for GitHub's code-scanning
// upload — a single driver.rules entry per distinct rule id, one result
// per finding, and a level derived from severity.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderSarifOutput } = require('../../src/features/analyze/renderers/sarif.renderer');

function captureStdout(fn) {
  const original = console.log;
  let output = '';
  console.log = (...args) => { output += args.join(' '); };
  try { fn(); } finally { console.log = original; }
  return output;
}

test('renderSarifOutput() produces valid SARIF 2.1.0 JSON on stdout', () => {
  const issues = [
    { name: 'minimist', version: '1.2.5', type: 'security', severity: 'HIGH', message: 'Prototype pollution', safeFix: true },
    { name: 'left-pad', version: '1.0.0', type: 'unused', severity: 'LOW', message: 'Looks unused', safeFix: false }
  ];
  const output = captureStdout(() => renderSarifOutput(issues, { projectName: 'demo' }));

  let sarif;
  assert.doesNotThrow(() => { sarif = JSON.parse(output); });
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs.length, 1);
  assert.equal(sarif.runs[0].tool.driver.name, 'DevCompass');
  assert.equal(sarif.runs[0].results.length, 2);

  const ruleIds = sarif.runs[0].tool.driver.rules.map(r => r.id).sort();
  assert.deepEqual(ruleIds, ['unused', 'vuln']);

  const vulnResult = sarif.runs[0].results.find(r => r.ruleId === 'vuln');
  assert.equal(vulnResult.level, 'error');
  assert.match(vulnResult.message.text, /minimist@1\.2\.5/);

  const unusedResult = sarif.runs[0].results.find(r => r.ruleId === 'unused');
  assert.equal(unusedResult.level, 'note');
});

test('renderSarifOutput() with no issues still produces a valid empty run', () => {
  const output = captureStdout(() => renderSarifOutput([], { projectName: 'demo' }));
  const sarif = JSON.parse(output);
  assert.deepEqual(sarif.runs[0].results, []);
  assert.deepEqual(sarif.runs[0].tool.driver.rules, []);
});

test('a typosquat finding gets its own rule id, distinct from a plain vulnerability', () => {
  const issues = [{ name: 'preact', version: '10.0.0', type: 'security', severity: 'HIGH', message: 'Possible typosquatting', source: 'Typosquat' }];
  const output = captureStdout(() => renderSarifOutput(issues, {}));
  const sarif = JSON.parse(output);
  assert.equal(sarif.runs[0].results[0].ruleId, 'typosquat');
});
