// src/shared/utils/run-npm.js
//
// execFileSync('npm', [...]) without a shell fails on Windows: npm is
// actually npm.cmd there, and Node refuses to spawn a .cmd file without a
// shell. cross-spawn resolves the right executable (npm vs npm.cmd) and
// escapes arguments correctly on both platforms, so callers get the same
// "no shell interpretation of arguments" property execFileSync gives on
// POSIX, everywhere.

const spawn = require('cross-spawn');

function runNpm(args, { cwd, timeout = 120000, maxBuffer = 10 * 1024 * 1024 } = {}) {
  const result = spawn.sync('npm', args, { cwd, encoding: 'utf8', timeout, maxBuffer, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`npm ${args[0]} exited with code ${result.status}`);
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    error.code = result.status;
    throw error;
  }
  return result.stdout;
}

module.exports = { runNpm };
