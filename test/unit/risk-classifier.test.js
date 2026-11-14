// test/unit/risk-classifier.test.js
// risk-classifier.js decides which fixes `devcompass fix` applies automatically
// (safe) vs. requires `--all`/manual review for (moderate/risky) — it had zero
// test coverage despite gating every automated change this tool ever makes.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyFixRisk, categorizeFixes } = require('../../src/core/services/risk-classifier');

test('unused dependencies are never auto-classified safe (detection is heuristic)', () => {
  const result = classifyFixRisk({ type: 'unused' });
  assert.notEqual(result.risk, 'safe');
});

test('a security issue marked safeFix with high confidence is classified safe', () => {
  const result = classifyFixRisk({ type: 'security', safeFix: true, confidence: 'high' });
  assert.equal(result.risk, 'safe');
});

test('a security issue without safeFix is not auto-classified safe', () => {
  const result = classifyFixRisk({ type: 'security', safeFix: false, confidence: 'high' });
  assert.equal(result.risk, 'moderate');
});

// Confidence gates "safe" independently of safeFix — a heuristic
// match (e.g. typosquat) must never auto-apply without --all, even if
// something upstream mistakenly marked it safeFix: true.
test('a security issue marked safeFix but without high confidence is not auto-classified safe', () => {
  assert.equal(classifyFixRisk({ type: 'security', safeFix: true, confidence: 'medium' }).risk, 'moderate');
  assert.equal(classifyFixRisk({ type: 'security', safeFix: true }).risk, 'moderate');
});

test('outdated packages are classified by updateType: patch=safe, minor=moderate, major=risky', () => {
  assert.equal(classifyFixRisk({ type: 'outdated', metadata: { updateType: 'patch' } }).risk, 'safe');
  assert.equal(classifyFixRisk({ type: 'outdated', metadata: { updateType: 'minor' } }).risk, 'moderate');
  assert.equal(classifyFixRisk({ type: 'outdated', metadata: { updateType: 'major' } }).risk, 'risky');
});

test('outdated packages with an unrecognized updateType fall back to moderate', () => {
  const result = classifyFixRisk({ type: 'outdated', metadata: { updateType: 'unknown' } });
  assert.equal(result.risk, 'moderate');
});

test('a quality or license issue with a suggested alternative package is risky (replacement required)', () => {
  assert.equal(classifyFixRisk({ type: 'quality', metadata: { alternative: 'some-package' } }).risk, 'risky');
  assert.equal(classifyFixRisk({ type: 'license', metadata: { alternative: 'some-package' } }).risk, 'risky');
});

test('anything unmatched defaults to moderate rather than being silently skipped', () => {
  const result = classifyFixRisk({ type: 'something-new' });
  assert.equal(result.risk, 'moderate');
  assert.equal(result.reason, 'Manual review recommended');
});

test('categorizeFixes() buckets issues into safe/moderate/risky and preserves original fields', () => {
  const issues = [
    { name: 'left-pad', type: 'unused' },
    { name: 'axios', type: 'security', safeFix: true, confidence: 'high' },
    { name: 'express', type: 'outdated', metadata: { updateType: 'major' } },
    { name: 'moment', type: 'outdated', metadata: { updateType: 'minor' } }
  ];

  const { safe, moderate, risky } = categorizeFixes(issues);

  assert.deepEqual(safe.map(i => i.name), ['axios']);
  assert.deepEqual(moderate.map(i => i.name), ['moment']);
  assert.deepEqual(risky.map(i => i.name), ['left-pad', 'express']);

  // original issue fields survive alongside the added riskInfo
  assert.equal(risky[0].type, 'unused');
  assert.ok(risky[0].riskInfo);
  assert.equal(risky[0].riskInfo.risk, 'risky');
});

test('categorizeFixes() on an empty list returns empty buckets', () => {
  const { safe, moderate, risky } = categorizeFixes([]);
  assert.deepEqual(safe, []);
  assert.deepEqual(moderate, []);
  assert.deepEqual(risky, []);
});
