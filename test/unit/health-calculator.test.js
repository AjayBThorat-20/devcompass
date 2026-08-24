// test/unit/health-calculator.test.js
// health-calculator.js decides the headline health score shown on every
// `analyze` run and drives `--ci --threshold` pass/fail — it had zero test
// coverage despite being one of the two most decision-critical algorithms
// in the codebase (the other being risk-classifier.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HealthCalculator } = require('../../src/core/services/health-calculator');

test('calculate() returns a perfect 10.0 for no issues', () => {
  assert.equal(HealthCalculator.calculate([]), 10.0);
});

test('calculate() returns 10.0 for non-array input rather than throwing', () => {
  assert.equal(HealthCalculator.calculate(null), 10.0);
  assert.equal(HealthCalculator.calculate(undefined), 10.0);
});

test('getPenalty() multiplies severity weight by type weight', () => {
  // CRITICAL (2.0) * security (1.2) = 2.4
  assert.equal(HealthCalculator.getPenalty({ severity: 'CRITICAL', type: 'security' }), 2.4);
  // LOW (0.5) * unused (0.3) = 0.15
  assert.equal(HealthCalculator.getPenalty({ severity: 'LOW', type: 'unused' }), 0.15);
});

test('getPenalty() falls back to a 1.0 multiplier for unknown severity/type', () => {
  assert.equal(HealthCalculator.getPenalty({ severity: 'NOT_REAL', type: 'also-not-real' }), 1.0);
});

test('calculate() subtracts the summed penalty from a base of 10', () => {
  const issues = [
    { severity: 'HIGH', type: 'security' },  // 1.5 * 1.2 = 1.8
    { severity: 'LOW', type: 'outdated' }    // 0.5 * 0.5 = 0.25
  ];
  assert.equal(HealthCalculator.calculate(issues), 10 - 1.8 - 0.25);
});

test('calculate() clamps at 0 instead of going negative for many severe issues', () => {
  const issues = Array.from({ length: 10 }, () => ({ severity: 'CRITICAL', type: 'security' }));
  assert.equal(HealthCalculator.calculate(issues), 0);
});

test('getHealthLabel() boundaries match the documented score bands', () => {
  assert.equal(HealthCalculator.getHealthLabel(10), 'Excellent');
  assert.equal(HealthCalculator.getHealthLabel(9), 'Excellent');
  assert.equal(HealthCalculator.getHealthLabel(8.9), 'Good');
  assert.equal(HealthCalculator.getHealthLabel(7), 'Good');
  assert.equal(HealthCalculator.getHealthLabel(6.9), 'Fair');
  assert.equal(HealthCalculator.getHealthLabel(5), 'Fair');
  assert.equal(HealthCalculator.getHealthLabel(4.9), 'Poor');
  assert.equal(HealthCalculator.getHealthLabel(3), 'Poor');
  assert.equal(HealthCalculator.getHealthLabel(2.9), 'Critical');
  assert.equal(HealthCalculator.getHealthLabel(0), 'Critical');
});

test('getHealthColor() boundaries match the documented score bands', () => {
  assert.equal(HealthCalculator.getHealthColor(10), 'green');
  assert.equal(HealthCalculator.getHealthColor(8), 'green');
  assert.equal(HealthCalculator.getHealthColor(7.9), 'yellow');
  assert.equal(HealthCalculator.getHealthColor(6), 'yellow');
  assert.equal(HealthCalculator.getHealthColor(5.9), 'red');
  assert.equal(HealthCalculator.getHealthColor(0), 'red');
});
