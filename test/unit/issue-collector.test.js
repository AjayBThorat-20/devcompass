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
