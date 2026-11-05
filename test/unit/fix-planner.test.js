// test/unit/fix-planner.test.js
// A package can independently be flagged 'unused' (by the unused-deps
// collector) and 'security'/'outdated' (by the CVE/npm-outdated collectors)
// since those collectors don't know about each other. Left undeduped, the
// plan queues both a 'remove' and an 'update' action for the same package —
// this covers the planner collapsing that down to just 'remove' when
// removals will run (--remove-unused).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixPlan, selectActions } = require('../../src/features/fix/planners/fix.planner');

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

  const plan = createFixPlan(issues, { removeUnused: true });
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

  const plan = createFixPlan(issues, { removeUnused: true });
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

  const plan = createFixPlan(issues, { removeUnused: true });
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

// A vulnerable transitive package (not declared in package.json) must
// never become an 'update' action — running `npm install qs@latest` would
// add a new direct dependency and leave the parent's own nested, vulnerable
// copy in place. It becomes a 'review' item instead.
test('transitive vulnerabilities become review items, never installs', () => {
  const plan = createFixPlan(
    [{ id: 'qs@6.7.0', name: 'qs', version: '6.7.0', type: 'security', severity: 'HIGH', safeFix: true, fix: 'Run npm audit fix', metadata: {} }],
    { directDependencies: new Set(['express']) }
  );
  const all = [...plan.safe, ...plan.moderate, ...plan.risky];
  assert.equal(plan.safe.length, 0);
  assert.equal(all[0].action, 'review');
});

test('a security finding for a package declared in package.json still becomes an update action', () => {
  const plan = createFixPlan(
    [{ id: 'express@4.17.1', name: 'express', version: '4.17.1', type: 'security', severity: 'HIGH', safeFix: true, fix: 'Update to 4.18.0', metadata: {} }],
    { directDependencies: new Set(['express']) }
  );
  const all = [...plan.safe, ...plan.moderate, ...plan.risky];
  assert.equal(all[0].action, 'update');
});

test('with directDependencies not provided (null), every package is treated as direct', () => {
  const plan = createFixPlan([
    { id: 'qs@6.7.0', name: 'qs', version: '6.7.0', type: 'security', severity: 'HIGH', safeFix: true, fix: 'Update to 6.9.0', metadata: {} }
  ]);
  const all = [...plan.safe, ...plan.moderate, ...plan.risky];
  assert.equal(all[0].action, 'update');
});

// `--all` used to sweep up unused-package removals along
// with everything else. Unused detection is a heuristic (dynamic requires,
// CLI-only deps, framework conventions), so removal is now always an
// explicit choice via --remove-unused, whatever the mode.
function planWithUnusedAndRisky() {
  return createFixPlan([
    baseIssue({ name: 'left-pad', type: 'unused', version: null }),
    baseIssue({ name: 'express', type: 'outdated', metadata: { updateType: 'major' } }),
    baseIssue({ name: 'axios', type: 'outdated', metadata: { updateType: 'patch' } })
  ]);
}

test('selectActions: safe mode applies no removals', () => {
  const actions = selectActions(planWithUnusedAndRisky(), 'safe');
  assert.equal(actions.some(a => a.action === 'remove'), false);
});

test('selectActions: --all still applies no removals without --remove-unused', () => {
  const actions = selectActions(planWithUnusedAndRisky(), 'all');
  assert.equal(actions.some(a => a.action === 'remove'), false, '--all must not remove packages on its own');
  assert.ok(actions.some(a => a.package === 'express'), 'other risky fixes are still included');
});

test('selectActions: --remove-unused includes removals even without --all', () => {
  const actions = selectActions(planWithUnusedAndRisky(), 'safe', { removeUnused: true });
  const removals = actions.filter(a => a.action === 'remove');
  assert.equal(removals.length, 1);
  assert.equal(removals[0].package, 'left-pad');
});

test('selectActions: --all --remove-unused includes both risky fixes and removals', () => {
  const actions = selectActions(planWithUnusedAndRisky(), 'all', { removeUnused: true });
  assert.ok(actions.some(a => a.action === 'remove' && a.package === 'left-pad'));
  assert.ok(actions.some(a => a.package === 'express'));
});

test('selectActions: a removal is never listed twice when --all and --remove-unused combine', () => {
  const actions = selectActions(planWithUnusedAndRisky(), 'all', { removeUnused: true });
  const removals = actions.filter(a => a.action === 'remove');
  assert.equal(removals.length, 1);
});

test('selectActions: an unknown mode selects nothing', () => {
  assert.deepEqual(selectActions(planWithUnusedAndRisky(), 'nonsense'), []);
});

// npm audit's own fix text ("Run npm audit fix") carries no version, and the
// planner used to fall back to installing @latest — a major-version jump
// (axios 0.21 -> 1.x), even in safe mode.
test('a security fix with no concrete target version becomes a review item, never an install of @latest', () => {
  const plan = createFixPlan(
    [{ id: 'axios@0.21.1', name: 'axios', version: '0.21.1', type: 'security', severity: 'HIGH', confidence: 'high', safeFix: true, fix: 'Run npm audit fix', metadata: {} }],
    { directDependencies: new Set(['axios']) }
  );
  const all = [...plan.safe, ...plan.moderate, ...plan.risky];
  assert.equal(all[0].action, 'review');
  assert.equal(all[0].targetVersion, null);
  assert.equal(selectActions(plan, 'all').filter(a => a.action === 'update').length, 0);
});

test('selectActions installs a package once, at the highest selected version', () => {
  const plan = createFixPlan([
    baseIssue({ name: 'minimist', version: '1.2.5', type: 'security', confidence: 'high', safeFix: true, fix: 'Update to 1.2.6' }),
    baseIssue({ name: 'minimist', version: '1.2.5', type: 'outdated', fix: 'Update to 1.2.8', metadata: { updateType: 'patch' } })
  ]);
  const updates = selectActions(plan, 'safe').filter(a => a.package === 'minimist');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].targetVersion, '1.2.8');
});

test('a typosquat finding on an unused package is kept for review, not dropped with the update dedupe', () => {
  const plan = createFixPlan([
    baseIssue({ name: 'loadsh', version: '0.0.4', type: 'unused', fix: 'Remove package' }),
    baseIssue({ name: 'loadsh', version: '0.0.4', type: 'security', confidence: 'medium', fix: 'Review before using — confirm this is the package you meant to install, not "lodash"' })
  ]);
  const all = [...plan.safe, ...plan.moderate, ...plan.risky];
  assert.ok(all.some(a => a.package === 'loadsh' && a.type === 'security' && a.action === 'review'));
});

test('without --remove-unused, a vulnerable package flagged unused keeps its update', () => {
  const plan = createFixPlan([
    baseIssue({ name: 'lodash', type: 'unused', version: null }),
    baseIssue({ name: 'lodash', type: 'security', fix: 'Update to 4.17.21' })
  ]);
  const actions = selectActions(plan, 'all');
  assert.deepEqual(actions.filter(a => a.package === 'lodash').map(a => a.action), ['update']);
});

test('with --remove-unused, an unused package is removed, not also replaced', () => {
  const plan = createFixPlan([
    baseIssue({ name: 'left-pad', type: 'unused', version: null, fix: 'Remove package' }),
    baseIssue({ name: 'left-pad', type: 'quality', fix: 'Replace with string.prototype.padstart', metadata: { alternative: { replacement: 'string.prototype.padstart' } } })
  ], { removeUnused: true });
  const actions = selectActions(plan, 'all', { removeUnused: true });
  assert.deepEqual(actions.filter(a => a.package === 'left-pad').map(a => a.action), ['remove']);
});
