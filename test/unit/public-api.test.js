// test/unit/public-api.test.js
// AR-07: src/index.js is the public programmatic API (package.json's
// "exports" points here). Its shape is part of the semver promise, so a
// test pins down what it exports.

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('the package entry point exports the documented public API', () => {
  const api = require('../../src/index');
  assert.equal(typeof api.analyze, 'function');
  assert.equal(typeof api.createFixPlan, 'function');
  assert.equal(typeof api.loadProjectConfig, 'function');
  assert.equal(typeof api.applyIgnores, 'function');
  assert.equal(typeof api.evaluatePolicy, 'function');
  assert.equal(typeof api.saveBaseline, 'function');
  assert.equal(typeof api.loadBaseline, 'function');
  assert.equal(typeof api.applyBaseline, 'function');
  assert.equal(typeof api.HealthCalculator.calculate, 'function');
  assert.equal(typeof api.loadDependencyGraph, 'function');
  assert.equal(typeof api.why, 'function');
});

test("require('devcompass') resolves through package.json's main field the same way", () => {
  const viaMain = require('../../package.json').main;
  assert.equal(viaMain, 'src/index.js');
});
