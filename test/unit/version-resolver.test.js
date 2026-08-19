// test/unit/version-resolver.test.js
// Regression test: a package whose installed node_modules/<pkg>/package.json
// exists but fails to parse (corrupt install, permission error) used to be
// silently dropped from the result entirely (bare `continue` in the catch),
// hiding it from every downstream alert/ecosystem check with no warning.
// It should fall back to the declared version instead, same as a package
// that isn't installed at all.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveInstalledVersions } = require('../../src/features/alerts/version-resolver.service');

test('a package with a corrupt installed package.json falls back to the declared version', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-resolver-'));
  const pkgDir = path.join(dir, 'node_modules', 'broken-pkg');
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'package.json'), '{ not valid json');

  const result = await resolveInstalledVersions(dir, { 'broken-pkg': '^2.0.0' });

  assert.ok('broken-pkg' in result, 'the package must still appear in the result');
  assert.equal(result['broken-pkg'].version, '2.0.0');
  assert.equal(result['broken-pkg'].declaredVersion, '^2.0.0');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('a genuinely installed package reports its actual installed version', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-resolver-'));
  const pkgDir = path.join(dir, 'node_modules', 'good-pkg');
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ version: '3.1.4' }));

  const result = await resolveInstalledVersions(dir, { 'good-pkg': '^3.0.0' });

  assert.equal(result['good-pkg'].version, '3.1.4');

  fs.rmSync(dir, { recursive: true, force: true });
});
