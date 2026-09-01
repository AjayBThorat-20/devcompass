// test/unit/unused-deps-fallback.test.js
// Regression test for the shell-injection fix in fallbackUnusedCheck: it used
// to build `grep -r "${dep}" ...` as a shell string, so a crafted dependency
// name in the scanned project's own package.json could break out of the
// quotes and run arbitrary commands. It now uses execFileSync (no shell), so
// the dependency name is always a literal argv element.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fallbackUnusedCheck } = require('../../src/features/analyze/collectors/unused-deps.collector');

function makeProject(indexSource) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'depvora-unused-'));
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.js'), indexSource);
  return dir;
}

test('a crafted dependency name cannot execute injected shell commands', async () => {
  const dir = makeProject("require('express');\n");
  // deliberately avoids the substring "depvora" — it's in this project's own
  // skipPackages list and would make the malicious dep name get filtered out
  // before reaching the injection check, unrelated to what this test verifies
  const canaryFile = path.join(os.tmpdir(), `injection-canary-${process.pid}`);
  fs.rmSync(canaryFile, { force: true });

  const maliciousName = `lodash" ; touch ${canaryFile} ; echo "`;
  const dependencies = { [maliciousName]: '1.0.0', express: '1.0.0' };

  const unused = await fallbackUnusedCheck(dir, dependencies);

  assert.equal(fs.existsSync(canaryFile), false, 'the injected command must not have run');
  assert.ok(unused.includes(maliciousName), 'the malicious string is just an unmatched grep pattern -> unused');
  assert.ok(!unused.includes('express'), 'express is required in source, so it must not be flagged unused');

  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(canaryFile, { force: true });
});

test('correctly classifies used vs. unused dependencies', async () => {
  const dir = makeProject("const lodash = require('lodash');\nlodash.noop();\n");
  const unused = await fallbackUnusedCheck(dir, { lodash: '1.0.0', chalk: '1.0.0' });

  assert.ok(!unused.includes('lodash'));
  assert.ok(unused.includes('chalk'));

  fs.rmSync(dir, { recursive: true, force: true });
});
