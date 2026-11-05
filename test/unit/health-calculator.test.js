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

test('getPenalty() is severity-only; type weighting comes from the category cap', () => {
  assert.equal(HealthCalculator.getPenalty({ severity: 'CRITICAL', type: 'security' }), 3.0);
  assert.equal(HealthCalculator.getPenalty({ severity: 'LOW', type: 'unused' }), 0.3);
});

test('getPenalty() falls back to a 1.0 penalty for an unknown severity', () => {
  assert.equal(HealthCalculator.getPenalty({ severity: 'NOT_REAL', type: 'also-not-real' }), 1.0);
});

test('calculate() never lets a CRITICAL vulnerability hide behind a passing score', () => {
  const issues = [{ severity: 'CRITICAL', type: 'security' }];
  assert.ok(HealthCalculator.calculate(issues) < 4);
});

test('calculate() treats a known-exploited vulnerability as critical, whatever its severity', () => {
  const issues = [{ severity: 'MEDIUM', type: 'security', metadata: { knownExploited: true } }];
  assert.ok(HealthCalculator.calculate(issues) < 4);
});

test('calculate() never lets a HIGH vulnerability hide behind a "Good" score', () => {
  const issues = [{ severity: 'HIGH', type: 'security' }];
  assert.ok(HealthCalculator.calculate(issues) < 6);
});

test('calculate() scores a project with only outdated packages above 7, however many there are', () => {
  const issues = Array.from({ length: 30 }, () => ({ severity: 'LOW', type: 'outdated' }));
  assert.ok(HealthCalculator.calculate(issues) > 7);
});

test('calculate() penalty for one category approaches its cap but never exceeds it', () => {
  const manyUnused = Array.from({ length: 500 }, () => ({ severity: 'CRITICAL', type: 'unused' }));
  // unused's cap is 0.5, so the score can never drop below 9.5 from unused findings alone.
  assert.ok(HealthCalculator.calculate(manyUnused) >= 9.5);
});

test('calculate() clamps at 0 instead of going negative for many severe issues across every category', () => {
  const issues = ['security', 'license', 'quality', 'outdated', 'unused'].flatMap(type =>
    Array.from({ length: 50 }, () => ({ severity: 'CRITICAL', type }))
  );
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
