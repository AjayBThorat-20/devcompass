// test/unit/severity.test.js
// Guards against the copy-paste bug fixed in this repo where validators.js's
// contents got appended into severity.js and shadowed its real module.exports.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const severity = require('../../src/core/utils/severity');

test('severity module exports exactly the severity API (no leftover exports)', () => {
  assert.deepEqual(Object.keys(severity).sort(), [
    'SEVERITY_COLORS', 'SEVERITY_ICONS', 'SEVERITY_LABELS', 'SEVERITY_LEVELS', 'SEVERITY_TERMINAL_COLORS',
    'compareSeverity', 'getSeverityColor', 'getSeverityIcon', 'getSeverityLabel', 'getSeverityTerminalColor', 'getSeverityWeight', 'normalizeSeverity'
  ].sort());
});

test('normalizeSeverity maps "moderate" to MEDIUM and unknowns to MEDIUM', () => {
  assert.equal(severity.normalizeSeverity('moderate'), 'MEDIUM');
  assert.equal(severity.normalizeSeverity('MODERATE'), 'MEDIUM');
  assert.equal(severity.normalizeSeverity('critical'), 'CRITICAL');
  assert.equal(severity.normalizeSeverity('bogus'), 'MEDIUM');
  assert.equal(severity.normalizeSeverity(null), 'MEDIUM');
});

test('compareSeverity sorts highest severity first', () => {
  const items = ['LOW', 'CRITICAL', 'MEDIUM', 'HIGH'];
  assert.deepEqual([...items].sort(severity.compareSeverity), ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
});

test('getSeverityWeight/Color/Label fall back gracefully for unknown severities', () => {
  assert.equal(severity.getSeverityWeight('NOT_REAL'), 0);
  assert.equal(severity.getSeverityColor('NOT_REAL'), '#6b7280');
  assert.equal(severity.getSeverityLabel('NOT_REAL'), 'Unknown');
});

// CL-07: severity.js is now the one source every other severity-order table
// (health-calculator's penalties, issue-ranker's priority score, issue.model's
// re-exported SEVERITY_WEIGHTS) is built from or must agree with. This test
// would have caught the pre-CL-07 bug where issue.model.js's own copy had
// MEDIUM mapped to a different color than every other table.
test('health-calculator penalties and issue-ranker priority scores agree with severity.js on ordering', () => {
  const { HealthCalculator } = require('../../src/core/services/health-calculator');
  const { IssueRanker } = require('../../src/core/services/issue-ranker');
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < order.length - 1; i++) {
    const higher = order[i];
    const lower = order[i + 1];

    assert.ok(
      severity.getSeverityWeight(higher) > severity.getSeverityWeight(lower),
      `severity.js must rank ${higher} above ${lower}`
    );
    assert.ok(
      HealthCalculator.getPenalty({ severity: higher }) > HealthCalculator.getPenalty({ severity: lower }),
      `HealthCalculator must penalize ${higher} more than ${lower}`
    );

    const ranker = new IssueRanker([]);
    const higherPriority = ranker.calculatePriority({ severity: higher, type: 'security', score: 0 });
    const lowerPriority = ranker.calculatePriority({ severity: lower, type: 'security', score: 0 });
    assert.ok(higherPriority > lowerPriority, `IssueRanker must prioritize ${higher} above ${lower}`);
  }
});

test("issue.model.js's SEVERITY_WEIGHTS is the same object severity.js exports as SEVERITY_LEVELS, not a separate copy", () => {
  const { SEVERITY_WEIGHTS } = require('../../src/core/models/issue.model');
  assert.deepEqual(SEVERITY_WEIGHTS, severity.SEVERITY_LEVELS);
});
