// test/unit/semver-validator.test.js
// Under semver, a change outside the caret range is breaking — including a
// minor bump in 0.x (0.21 -> 0.28) and any bump in 0.0.x. Treating those as
// "minor"/"patch" let `fix` apply them as safe or moderate updates.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const SemverValidator = require('../../src/shared/utils/semver-validator');
const { createIssueCollector } = require('../../src/core/services/issue-collector');

test('getUpdateType() classifies 1.x+ updates by which part changed', () => {
  assert.equal(SemverValidator.getUpdateType('1.0.0', '2.0.0'), 'major');
  assert.equal(SemverValidator.getUpdateType('1.2.3', '1.4.0'), 'minor');
  assert.equal(SemverValidator.getUpdateType('1.2.3', '1.2.9'), 'patch');
});

test('getUpdateType() treats a 0.x minor bump, and any 0.0.x bump, as major', () => {
  assert.equal(SemverValidator.getUpdateType('0.21.1', '0.28.0'), 'major');
  assert.equal(SemverValidator.getUpdateType('0.21.1', '0.21.4'), 'patch');
  assert.equal(SemverValidator.getUpdateType('0.0.3', '0.0.4'), 'major');
});

test('getUpdateType() reports "latest" when nothing newer is available, including a lower "latest"', () => {
  assert.equal(SemverValidator.getUpdateType('4.17.21', '4.17.21'), 'latest');
  assert.equal(SemverValidator.getUpdateType('2.0.0', '1.9.0'), 'latest');
});

test('isSafeUpdate() only accepts a fix version within the caret range', () => {
  const collector = createIssueCollector();
  assert.equal(collector.isSafeUpdate({ version: '4.17.15', fixVersion: '4.17.21' }), true);
  assert.equal(collector.isSafeUpdate({ version: '0.21.1', fixVersion: '0.21.2' }), true);
  assert.equal(collector.isSafeUpdate({ version: '0.21.1', fixVersion: '0.28.0' }), false);
  assert.equal(collector.isSafeUpdate({ version: '0.21.1', fixVersion: '1.6.0' }), false);
  assert.equal(collector.isSafeUpdate({ version: 'unknown', fixVersion: '1.0.0' }), false);
  assert.equal(collector.isSafeUpdate({ version: '1.0.0' }), false);
});

test('a merged security finding is only a safe fix if the chosen fix version is', () => {
  const collector = createIssueCollector();
  collector.addCVEIssues([{ package: 'axios', version: '0.21.1', severity: 'high', id: 'GHSA-aaaa', fixVersion: '0.33.0' }]);
  // npm audit says its own `npm audit fix` is non-breaking...
  collector.addSecurityIssues([{ type: 'vulnerability', package: 'axios', version: '0.21.1', severity: 'high', autoFixable: true }]);
  const issue = collector.getAll().find(i => i.name === 'axios' && i.type === 'security');
  assert.equal(issue.fix, 'Update to 0.33.0');
  // ...but installing 0.33.0 over 0.21.1 is a breaking 0.x jump.
  assert.equal(issue.safeFix, false);
});
