// test/unit/issue-collector.test.js
// Guards against double-counting: quality.collector.js, ecosystem.collector.js,
// and predictive.collector.js can all emit a `type: 'quality'` issue for the
// same package. mergeGroup used to only dedupe same-package `security` entries,
// so two quality issues for one package survived into getAll() and got the
// health-score penalty applied twice.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createIssueCollector } = require('../../src/core/services/issue-collector');

test('duplicate quality issues for the same package are merged into one', () => {
  const collector = createIssueCollector();

  collector.addQualityIssues([
    { package: 'left-pad', version: '1.0.0', status: 'deprecated', healthScore: 2 }
  ]);
  collector.addEcosystemIssues([
    { package: 'left-pad', affected: '1.0.0', severity: 'high', title: 'Known issue', source: 'Ecosystem' }
  ]);

  const issues = collector.getAll();
  const quality = issues.filter(i => i.name === 'left-pad' && i.type === 'quality');

  assert.equal(quality.length, 1);
});

test('duplicate security issues for the same package are still merged (existing behavior)', () => {
  const collector = createIssueCollector();

  collector.addCVEIssues([
    { package: 'axios', version: '0.21.1', severity: 'high', source: 'OSV' }
  ]);
  collector.addSecurityIssues([
    { package: 'axios', version: '0.21.1', type: 'vulnerability', severity: 'high', autoFixable: true }
  ]);

  const issues = collector.getAll();
  const security = issues.filter(i => i.name === 'axios' && i.type === 'security');

  assert.equal(security.length, 1);
});

test('different-typed issues for the same package are kept separate', () => {
  const collector = createIssueCollector();

  collector.addCVEIssues([
    { package: 'lodash', version: '4.17.15', severity: 'high', source: 'OSV' }
  ]);
  collector.addUnusedIssues(['lodash']);

  const issues = collector.getAll().filter(i => i.name === 'lodash');
  const types = issues.map(i => i.type).sort();

  assert.deepEqual(types, ['security', 'unused']);
});

// One finding model — ruleId, confidence and a stable id format.
test('a CVE finding gets ruleId "vuln", confidence "high", and an id that includes the advisory', () => {
  const collector = createIssueCollector();
  collector.addCVEIssues([{ package: 'lodash', version: '4.17.15', severity: 'high', id: 'GHSA-jf85-cpcp-j695' }]);

  const issue = collector.getAll().find(i => i.name === 'lodash');
  assert.equal(issue.ruleId, 'vuln');
  assert.equal(issue.confidence, 'high');
  assert.deepEqual(issue.advisoryIds, ['GHSA-jf85-cpcp-j695']);
  assert.equal(issue.id, 'vuln:lodash@4.17.15:GHSA-jf85-cpcp-j695');
});

test('an unused finding gets ruleId "unused" and confidence "low" (it is a heuristic)', () => {
  const collector = createIssueCollector();
  collector.addUnusedIssues(['left-pad']);
  const issue = collector.getAll().find(i => i.name === 'left-pad');
  assert.equal(issue.ruleId, 'unused');
  assert.equal(issue.confidence, 'low');
});

test('a typosquat finding gets ruleId "typosquat", distinct from ruleId "vuln"', () => {
  const collector = createIssueCollector();
  collector.addSecurityIssues([{ package: 'preact', type: 'typosquatting', similarTo: 'react', distance: 1 }]);
  const issue = collector.getAll().find(i => i.name === 'preact');
  assert.equal(issue.ruleId, 'typosquat');
  assert.equal(issue.confidence, 'medium');
});

// Merging two advisories for the same package keeps every advisory id
// (previously advisoryCount was computed and then discarded), and the
// merged finding's confidence is that of its most-trustworthy source.
test('merging two CVE findings for the same package keeps every advisory id', () => {
  const collector = createIssueCollector();
  collector.addCVEIssues([
    { package: 'axios', version: '0.21.1', severity: 'high', id: 'GHSA-aaaa-aaaa-aaaa' },
    { package: 'axios', version: '0.21.1', severity: 'critical', id: 'GHSA-bbbb-bbbb-bbbb' }
  ]);

  const issue = collector.getAll().find(i => i.name === 'axios');
  assert.deepEqual(issue.advisoryIds.sort(), ['GHSA-aaaa-aaaa-aaaa', 'GHSA-bbbb-bbbb-bbbb']);
  assert.equal(issue.confidence, 'high');
  assert.match(issue.risk, /2 advisories/);
});

test('merging only low-confidence findings stays low instead of being inflated to medium', () => {
  const collector = createIssueCollector();
  collector.addPredictiveIssues([
    { package: 'request', severity: 'low', title: 'Slowing maintenance' },
    { package: 'request', severity: 'medium', title: 'Rising open issues' }
  ]);
  const issue = collector.getAll().find(i => i.name === 'request');
  assert.equal(issue.confidence, 'low');
});
