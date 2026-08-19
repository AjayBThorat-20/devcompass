// test/unit/typosquatting.test.js
// Guards against false positives where a legitimate, widely-used package gets
// flagged as typosquatting purely because it's edit-distance 1 from a popular
// package name (e.g. "mysql2" vs "mysql"). Found via dogfooding against a
// real project.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkTyposquatting } = require('../../src/features/quality/dynamic-security.service');

test('checkTyposquatting does not flag mysql2 as a typosquat of mysql', () => {
  assert.equal(checkTyposquatting('mysql2'), null);
});

test('checkTyposquatting still flags a real one-character typo', () => {
  const result = checkTyposquatting('expres');
  assert.ok(result);
  assert.equal(result.similarTo, 'express');
});
