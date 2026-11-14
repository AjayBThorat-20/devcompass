// test/unit/baseline.test.js
// A baseline records today's findings so a --fail-on gate only fails on new
// ones. Findings match by what they are (package + advisory, or package +
// rule), not by version or by the order advisories are listed in.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { saveBaseline, loadBaseline, applyBaseline, baselineKeys, BASELINE_FILENAME } = require('../../src/core/services/baseline');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-baseline-test-'));
}

const vuln = (name, version, advisoryIds) => ({ id: `vuln:${name}@${version}:${[...advisoryIds].sort()[0]}`, name, version, type: 'security', ruleId: 'vuln', severity: 'HIGH', advisoryIds });
const other = (name, version, ruleId) => ({ id: `${ruleId}:${name}@${version}`, name, version, type: ruleId.split('/')[0], ruleId, severity: 'LOW' });

test('a vulnerability is keyed per advisory, anything else by rule and package', () => {
  assert.deepEqual(baselineKeys(vuln('lodash', '4.17.15', ['GHSA-b', 'GHSA-a'])), ['vuln:lodash:GHSA-a', 'vuln:lodash:GHSA-b']);
  assert.deepEqual(baselineKeys(other('left-pad', '1.3.0', 'unused')), ['unused:left-pad']);
});

test('save then load round-trips, sorted by id', () => {
  const dir = tempDir();
  try {
    saveBaseline([other('b-pkg', '1.0.0', 'unused'), vuln('a-pkg', '1.0.0', ['GHSA-1'])], dir);
    const data = loadBaseline(dir);
    assert.equal(data.version, 1);
    assert.deepEqual(data.findings.map(f => f.id), ['unused:b-pkg@1.0.0', 'vuln:a-pkg@1.0.0:GHSA-1']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('loadBaseline() returns null when there is no baseline yet', () => {
  const dir = tempDir();
  try { assert.equal(loadBaseline(dir), null); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// Treating a broken file as "no baseline" would quietly turn every known
// finding back into a new one.
test('loadBaseline() throws on a corrupt or unrecognized file instead of ignoring it', () => {
  const dir = tempDir();
  try {
    fs.writeFileSync(path.join(dir, BASELINE_FILENAME), '{ nope');
    assert.throws(() => loadBaseline(dir), /not valid JSON.*baseline save/);
    fs.writeFileSync(path.join(dir, BASELINE_FILENAME), JSON.stringify({ findingIds: ['a'] }));
    assert.throws(() => loadBaseline(dir), /isn't a baseline this version/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an upgraded package with the same accepted advisory stays known', () => {
  const baseline = { version: 1, findings: [{ keys: baselineKeys(vuln('lodash', '4.17.15', ['GHSA-a', 'GHSA-b'])) }] };
  const { known, new: fresh } = applyBaseline([vuln('lodash', '4.17.19', ['GHSA-b'])], baseline);
  assert.equal(known.length, 1);
  assert.equal(fresh.length, 0);
});

test('a newly published advisory against a known package is new', () => {
  const baseline = { version: 1, findings: [{ keys: baselineKeys(vuln('lodash', '4.17.15', ['GHSA-a'])) }] };
  const { new: fresh } = applyBaseline([vuln('lodash', '4.17.15', ['GHSA-a', 'GHSA-new'])], baseline);
  assert.equal(fresh.length, 1);
});

test('advisory order does not matter', () => {
  const baseline = { version: 1, findings: [{ keys: baselineKeys(vuln('qs', '6.7.0', ['GHSA-x', 'GHSA-y'])) }] };
  const { known } = applyBaseline([vuln('qs', '6.7.0', ['GHSA-y', 'GHSA-x'])], baseline);
  assert.equal(known.length, 1);
});

test('with no baseline every finding is new', () => {
  const issues = [other('a', '1.0.0', 'unused')];
  assert.deepEqual(applyBaseline(issues, null), { known: [], new: issues });
});
