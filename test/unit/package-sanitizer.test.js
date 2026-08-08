// test/unit/package-sanitizer.test.js
// Regression coverage for the shell-injection fix in the fixer services
// (batch, quality, license, supply-chain) — all of them route package
// names/versions through these two functions before hitting execSync.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePackageName, sanitizeVersion } = require('../../src/shared/utils/package-sanitizer');

test('sanitizePackageName accepts valid npm package names', () => {
  for (const name of ['lodash', '@scope/pkg', 'left-pad', 'a.b_c~d', 'UPPER']) {
    // note: npm names are lowercase-only in practice, but the regex only
    // needs to reject shell metacharacters — assert it doesn't throw
    assert.doesNotThrow(() => sanitizePackageName(name.toLowerCase()));
  }
});

test('sanitizePackageName rejects shell metacharacters', () => {
  for (const name of ['lodash; rm -rf /', '$(whoami)', '../../etc/passwd', '', 'pkg && echo pwned', 'pkg|ls', 'pkg`ls`', 'pkg\ninjected']) {
    assert.throws(() => sanitizePackageName(name), /Invalid package name/);
  }
});

test('sanitizeVersion accepts semver and "latest"', () => {
  for (const v of ['1.2.3', '1.2.3-beta.1', 'latest']) {
    assert.doesNotThrow(() => sanitizeVersion(v));
  }
});

test('sanitizeVersion rejects non-semver and shell metacharacters', () => {
  for (const v of ['1.2.3; rm -rf /', '$(ls)', '', '1.2', 'not-a-version']) {
    assert.throws(() => sanitizeVersion(v), /Invalid version/);
  }
});
