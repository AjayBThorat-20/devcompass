// test/unit/fix-planner.test.js
// A package can independently be flagged 'unused' (by the unused-deps
// collector) and 'security'/'outdated' (by the CVE/npm-outdated collectors)
// since those collectors don't know about each other. Left undeduped, the
// plan queues both a 'remove' and an 'update' action for the same package —
// this covers the planner collapsing that down to just 'remove'.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixPlan } = require('../../src/features/fix/planners/fix.planner');

function baseIssue(overrides) {
  return {
    id: `${overrides.name}@${overrides.version || 'x'}`,
    version: '1.0.0',
    severity: 'HIGH',
    score: 7,
    message: 'issue',
    risk: 'risk',
    fix: 'Update to 2.0.0',
    safeFix: false,
    source: 'test',
    metadata: {},
    ...overrides
  };
}

test('a package flagged both unused and security-vulnerable only gets a remove action', () => {
  const issues = [
    baseIssue({ name: 'lodash', type: 'unused', version: null }),
    baseIssue({ name: 'lodash', type: 'security' })
  ];

  const plan = createFixPlan(issues);
  const allActions = [...plan.safe, ...plan.moderate, ...plan.risky];
  const lodashActions = allActions.filter(a => a.package === 'lodash');

  assert.equal(lodashActions.length, 1);
  assert.equal(lodashActions[0].action, 'remove');
  assert.equal(plan.summary.totalIssues, 2, 'totalIssues should still reflect both underlying findings');
});

test('a package flagged both unused and outdated only gets a remove action', () => {
  const issues = [
    baseIssue({ name: 'moment', type: 'unused', version: null }),
    baseIssue({ name: 'moment', type: 'outdated', metadata: { updateType: 'major' } })
  ];

  const plan = createFixPlan(issues);
  const allActions = [...plan.safe, ...plan.moderate, ...plan.risky];
  const momentActions = allActions.filter(a => a.package === 'moment');

  assert.equal(momentActions.length, 1);
  assert.equal(momentActions[0].action, 'remove');
});

test('an unrelated package with only a security issue is untouched by the dedupe', () => {
  const issues = [
    baseIssue({ name: 'lodash', type: 'unused', version: null }),
    baseIssue({ name: 'express', type: 'security' })
  ];

  const plan = createFixPlan(issues);
  const allActions = [...plan.safe, ...plan.moderate, ...plan.risky];
  const expressActions = allActions.filter(a => a.package === 'express');

  assert.equal(expressActions.length, 1);
  assert.equal(expressActions[0].action, 'update');
});

test('a package with both security and outdated issues (no unused) keeps both actions', () => {
  const issues = [
    baseIssue({ name: 'webpack', type: 'security' }),
    baseIssue({ name: 'webpack', type: 'outdated', metadata: { updateType: 'patch' } })
  ];

  const plan = createFixPlan(issues);
  const allActions = [...plan.safe, ...plan.moderate, ...plan.risky];
  const webpackActions = allActions.filter(a => a.package === 'webpack');

  assert.equal(webpackActions.length, 2, 'dedupe only applies to unused vs. update, not security vs. outdated');
});
