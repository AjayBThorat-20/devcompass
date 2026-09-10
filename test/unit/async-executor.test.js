// test/unit/async-executor.test.js
// Regression coverage for the shell-injection fix in AsyncExecutor.exec:
// it used to spawn with `{ shell: true }`, so metacharacters in a caller-
// supplied arg (e.g. a package name) were interpreted by the shell instead
// of passed through as a literal argv element.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const AsyncExecutor = require('../../src/shared/utils/async-executor');

test('a shell-metacharacter payload in an arg is passed through literally, not interpreted', async () => {
  const canaryFile = path.join(os.tmpdir(), `async-executor-canary-${process.pid}`);
  fs.rmSync(canaryFile, { force: true });

  const executor = new AsyncExecutor();
  const payload = `; touch ${canaryFile} ; echo `;

  // `echo` just prints whatever argv it receives; if the payload were ever
  // handed to a shell, the `;`s would split it into three separate commands
  // and the middle one would create canaryFile.
  const result = await executor.exec('echo', [payload]);

  assert.equal(fs.existsSync(canaryFile), false, 'the injected command must not have run');
  assert.ok(result.stdout.includes(payload.trim()), 'the payload should appear verbatim in stdout as a single argument');

  fs.rmSync(canaryFile, { force: true });
});

test('exec resolves with stdout/stderr/code on a normal successful command', async () => {
  const executor = new AsyncExecutor();
  const result = await executor.exec('node', ['-e', 'console.log("hello")']);
  assert.equal(result.code, 0);
  assert.ok(result.stdout.includes('hello'));
});

test('exec rejects with a non-zero exit code on failure', async () => {
  const executor = new AsyncExecutor();
  await assert.rejects(
    () => executor.exec('node', ['-e', 'process.exit(3)']),
    (error) => error.code === 3
  );
});
