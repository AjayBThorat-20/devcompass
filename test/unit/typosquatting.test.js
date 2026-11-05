// test/unit/typosquatting.test.js
// Guards against false positives where a legitimate, widely-used package gets
// flagged as typosquatting purely because it's edit-distance 1 from a popular
// package name (e.g. "mysql2" vs "mysql"). Found via dogfooding against a
// real project.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const dynamicSecurity = require('../../src/features/quality/dynamic-security.service');
const { checkTyposquatting, checkTyposquattingRisk } = dynamicSecurity;

function stubDownloads(counts) {
  const original = dynamicSecurity.fetchDownloadsLastMonth;
  dynamicSecurity.fetchDownloadsLastMonth = async (name) => (name in counts ? counts[name] : null);
  return () => { dynamicSecurity.fetchDownloadsLastMonth = original; };
}

test('checkTyposquatting does not flag mysql2 as a typosquat of mysql', () => {
  assert.equal(checkTyposquatting('mysql2'), null);
});

test('checkTyposquatting still flags a real one-character typo', () => {
  const result = checkTyposquatting('expres');
  assert.ok(result);
  assert.equal(result.similarTo, 'express');
});

test('checkTyposquatting counts two swapped adjacent letters as one typo', () => {
  assert.equal(checkTyposquatting('loadsh')?.similarTo, 'lodash');
  assert.equal(checkTyposquatting('axois')?.similarTo, 'axios');
});

// A name match alone also fires on real packages (cuid/uuid, preact/react);
// download counts decide. Figures below are close to npm's real ones.
test('checkTyposquattingRisk flags a rare look-alike of a far more popular package', async () => {
  const restore = stubDownloads({ expres: 21937, express: 598035551 });
  try {
    const result = await checkTyposquattingRisk('expres');
    assert.equal(result.similarTo, 'express');
    assert.equal(result.downloads, 21937);
    assert.equal(result.popularDownloads, 598035551);
    assert.equal(result.unverified, undefined);
  } finally { restore(); }
});

test('checkTyposquattingRisk flags a look-alike npm has never heard of', async () => {
  const restore = stubDownloads({ expres: 0, express: 598035551 });
  try {
    assert.ok(await checkTyposquattingRisk('expres'));
  } finally { restore(); }
});

test('checkTyposquattingRisk does not flag a widely used package, however much more popular its look-alike is', async () => {
  const restore = stubDownloads({ expres: 3500000, express: 598035551 });
  try {
    assert.equal(await checkTyposquattingRisk('expres'), null);
  } finally { restore(); }
});

test('checkTyposquattingRisk does not flag a package with comparable popularity', async () => {
  const restore = stubDownloads({ expres: 50000, express: 1000000 });
  try {
    assert.equal(await checkTyposquattingRisk('expres'), null, '20x more popular is under the 50x threshold');
  } finally { restore(); }
});

test('checkTyposquattingRisk marks the match unverified when download counts cannot be fetched', async () => {
  const restore = stubDownloads({});
  try {
    const result = await checkTyposquattingRisk('expres');
    assert.equal(result.unverified, true);
  } finally { restore(); }
});

test('checkTyposquattingRisk makes no network call for a name with no look-alike', async () => {
  let calls = 0;
  const original = dynamicSecurity.fetchDownloadsLastMonth;
  dynamicSecurity.fetchDownloadsLastMonth = async () => { calls++; return 0; };
  try {
    assert.equal(await checkTyposquattingRisk('a-perfectly-ordinary-name'), null);
    assert.equal(calls, 0);
  } finally { dynamicSecurity.fetchDownloadsLastMonth = original; }
});
