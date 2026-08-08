// test/unit/severity.test.js
// Guards against the copy-paste bug fixed in this repo where validators.js's
// contents got appended into severity.js and shadowed its real module.exports.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const severity = require('../../src/core/utils/severity');

test('severity module exports exactly the severity API (no leftover exports)', () => {
  assert.deepEqual(Object.keys(severity).sort(), [
    'SEVERITY_COLORS', 'SEVERITY_LABELS', 'SEVERITY_LEVELS',
    'compareSeverity', 'getSeverityColor', 'getSeverityLabel', 'getSeverityWeight', 'normalizeSeverity'
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
