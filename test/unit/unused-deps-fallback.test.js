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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-unused-'));
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.js'), indexSource);
  return dir;
}

test('a crafted dependency name cannot execute injected shell commands', async () => {
  const dir = makeProject("require('express');\n");
  // deliberately avoids the substring "devcompass" — it's in this project's own
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

// The fallback used to shell out to `grep`, which Windows doesn't have by
// default — every dependency then looked "used". It is a JavaScript scan now.
test('the fallback works without grep on PATH', async () => {
  const dir = makeProject("const lodash = require('lodash');\n");
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const unused = await fallbackUnusedCheck(dir, { lodash: '1.0.0', chalk: '1.0.0' });
    assert.deepEqual(unused, ['chalk']);
  } finally {
    process.env.PATH = originalPath;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a package referenced only from config files or stylesheets is not reported unused', async () => {
  const dir = makeProject("console.log('app');\n");
  fs.writeFileSync(path.join(dir, '.babelrc'), JSON.stringify({ presets: ['@babel/preset-env'] }));
  fs.writeFileSync(path.join(dir, 'postcss.config.js'), 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n');
  fs.writeFileSync(path.join(dir, 'src', 'styles.scss'), "@import 'bootstrap/scss/bootstrap';\n");

  const unused = await fallbackUnusedCheck(dir, {
    '@babel/preset-env': '1.0.0', tailwindcss: '1.0.0', autoprefixer: '1.0.0', bootstrap: '1.0.0', express: '1.0.0'
  });
  assert.deepEqual(unused, ['express']);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('a subpath import counts as using the package; a matching substring or variable name does not', async () => {
  const dir = makeProject("const debounce = require('lodash/debounce');\nconst items = []; const ms = 5;\n");
  const unused = await fallbackUnusedCheck(dir, { lodash: '1.0.0', ms: '1.0.0' });
  assert.deepEqual(unused, ['ms']);
  fs.rmSync(dir, { recursive: true, force: true });
});
