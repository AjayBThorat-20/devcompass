// test/unit/run-npm.test.js
// execFileSync('npm', ...) can't start npm.cmd on Windows (Node refuses to
// spawn a .cmd file without a shell), so `fix` couldn't install or remove
// anything there. runNpm() goes through cross-spawn, which resolves npm or
// npm.cmd itself and still passes arguments without shell interpretation.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runNpm } = require('../../src/shared/utils/run-npm');

test('runNpm() runs npm and returns its stdout', () => {
  const output = runNpm(['--version']).trim();
  assert.match(output, /^\d+\.\d+\.\d+/);
});

test('runNpm() throws with the exit code and output when npm fails', () => {
  assert.throws(
    () => runNpm(['this-is-not-an-npm-command']),
    error => typeof error.code === 'number' && error.code !== 0 && typeof error.stderr === 'string'
  );
});

test('runNpm() passes an argument with shell metacharacters through literally', () => {
  // Through a shell this would run a second command and print INJECTED;
  // as one literal argument, npm just reports the unknown config key.
  const output = runNpm(['config', 'get', 'devcompass-test-key; echo INJECTED']);
  assert.ok(!output.includes('INJECTED'), `the "; echo" part must not run: ${JSON.stringify(output)}`);
});
