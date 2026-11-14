// test/unit/project-config.test.js
// devcompass.config.json: load + validate the file, and apply its `ignore`
// list to a set of findings.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadProjectConfig, applyIgnores, CONFIG_FILENAME } = require('../../src/core/config/project-config');

function makeProject(configContents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-project-config-test-'));
  if (configContents !== undefined) {
    fs.writeFileSync(path.join(dir, CONFIG_FILENAME), typeof configContents === 'string' ? configContents : JSON.stringify(configContents));
  }
  return dir;
}

test('loadProjectConfig() returns defaults when no config file exists', () => {
  const dir = makeProject();
  try {
    const config = loadProjectConfig(dir);
    assert.equal(config.path, null);
    assert.deepEqual(config.failOn, { severity: null, licenses: [] });
    assert.deepEqual(config.ignore, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadProjectConfig() throws a clear error for invalid JSON', () => {
  const dir = makeProject('{ not valid json');
  try {
    assert.throws(() => loadProjectConfig(dir), /not valid JSON/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadProjectConfig() reads failOn, ignore and checks', () => {
  const dir = makeProject({
    failOn: { severity: 'high', licenses: ['AGPL-3.0-only'] },
    ignore: [{ package: 'left-pad', rule: 'unused', reason: 'Loaded by a plugin at runtime' }],
    checks: { unused: { enabled: false } }
  });
  try {
    const config = loadProjectConfig(dir);
    assert.equal(config.failOn.severity, 'high');
    assert.deepEqual(config.failOn.licenses, ['AGPL-3.0-only']);
    assert.equal(config.ignore.length, 1);
    assert.equal(config.checks.unused.enabled, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every ignore entry must have a reason', () => {
  const dir = makeProject({ ignore: [{ package: 'left-pad' }] });
  try {
    assert.throws(() => loadProjectConfig(dir), /reason/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('every ignore entry needs an id or a package', () => {
  const dir = makeProject({ ignore: [{ reason: 'no target' }] });
  try {
    assert.throws(() => loadProjectConfig(dir), /"id".*"package"|id.*package/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('applyIgnores() suppresses a finding matched by id', () => {
  const config = { ignore: [{ id: 'vuln:lodash@4.17.15:GHSA-xxxx', reason: 'accepted' }] };
  const issues = [{ id: 'vuln:lodash@4.17.15:GHSA-xxxx', name: 'lodash' }, { id: 'other', name: 'axios' }];

  const { kept, ignored, expired } = applyIgnores(issues, config);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].name, 'axios');
  assert.equal(ignored.length, 1);
  assert.equal(expired.length, 0);
});

test('applyIgnores() suppresses every finding for a package, optionally scoped to a rule', () => {
  const config = { ignore: [{ package: 'left-pad', rule: 'unused', reason: 'plugin' }] };
  const issues = [
    { id: '1', name: 'left-pad', type: 'unused' },
    { id: '2', name: 'left-pad', type: 'outdated' }
  ];

  const { kept, ignored } = applyIgnores(issues, config);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].type, 'outdated');
  assert.equal(ignored.length, 1);
});

test('applyIgnores() lets an expired ignore\'s finding reappear', () => {
  const config = { ignore: [{ id: 'x', reason: 'was fine', expires: '2020-01-01' }] };
  const issues = [{ id: 'x', name: 'pkg' }];

  const { kept, ignored, expired } = applyIgnores(issues, config, new Date('2026-01-01'));
  assert.equal(kept.length, 1, 'the finding must reappear once its ignore has expired');
  assert.equal(ignored.length, 0);
  assert.equal(expired.length, 1);
});

test('applyIgnores() with no ignore list keeps every issue', () => {
  const issues = [{ id: '1' }, { id: '2' }];
  const { kept } = applyIgnores(issues, { ignore: [] });
  assert.equal(kept.length, 2);
});

// A typo must not quietly switch a CI gate off.
test('unknown keys are an error, not silently ignored', () => {
  const cases = [
    [{ failon: { severity: 'high' } }, /unknown key "failon"/],
    [{ failOn: { severity: 'severe' } }, /failOn.severity must be one of/],
    [{ failOn: { licenses: 'GPL-3.0' } }, /failOn.licenses must be an array/],
    [{ checks: { unused: { enabled: 'no' } } }, /checks.unused.enabled must be true or false/],
    [{ checks: { unused: { enabled: true, allow: ['x'] } } }, /checks.unused only supports "enabled"/],
    [{ ignore: [{ package: 'x', reason: 'r', expire: '2027-01-01' }] }, /ignore\[0\] has unknown key "expire"/]
  ];
  for (const [config, pattern] of cases) {
    const dir = makeProject(config);
    try {
      assert.throws(() => loadProjectConfig(dir), pattern);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

// An unparseable date never compares as expired, so the ignore would last
// forever.
test('an ignore with an unparseable expiry date is rejected', () => {
  const dir = makeProject({ ignore: [{ package: 'left-pad', reason: 'r', expires: 'next year' }] });
  try {
    assert.throws(() => loadProjectConfig(dir), /expires must be a date/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Advisories are listed by exploit risk, which shifts as EPSS scores update;
// the id an ignore entry targets must not shift with them.
test('a finding id does not depend on the order its advisories are listed in', () => {
  const { createIssue } = require('../../src/core/models/issue.model');
  const base = { name: 'lodash', version: '4.17.15', type: 'security', severity: 'HIGH', source: 'OSV' };
  const a = createIssue({ ...base, advisoryIds: ['GHSA-p6mc', 'GHSA-35jh', 'GHSA-29mw'] });
  const b = createIssue({ ...base, advisoryIds: ['GHSA-29mw', 'GHSA-p6mc', 'GHSA-35jh'] });
  assert.equal(a.id, 'vuln:lodash@4.17.15:GHSA-29mw');
  assert.equal(a.id, b.id);
});
