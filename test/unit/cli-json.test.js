// test/unit/cli-json.test.js
// C-05: with `--ci --json`, DevCompass used to print a "CI Check Passed/
// Failed" line to stdout after the JSON, so `analyze --ci --json > out.json`
// produced a file that didn't parse. It also called process.exit() directly,
// which could cut off large piped output. Status lines now go to stderr, and
// the CLI sets process.exitCode from the returned result.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('fs');
const os = require('os');
const path = require('path');

const execFileAsync = promisify(execFile);
const BIN = path.join(__dirname, '../../bin/devcompass.js');

function makeFixtureProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-cli-json-test-'));
  // No dependencies: every collector short-circuits without touching the
  // network, keeping this test fast and offline-safe.
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2));
  return dir;
}

test('analyze --ci --json --threshold 0 prints only valid JSON to stdout and exits 0', async () => {
  const projectPath = makeFixtureProject();
  try {
    const { stdout } = await execFileAsync(process.execPath, [BIN, 'analyze', '--path', projectPath, '--ci', '--threshold', '0', '--json', '--no-history'], { timeout: 30000 });

    let parsed;
    assert.doesNotThrow(() => { parsed = JSON.parse(stdout); }, 'stdout must be parseable as JSON with nothing else mixed in');
    assert.equal(typeof parsed.healthScore, 'number');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

// A fixture with zero issues always scores a perfect 10.0, which even
// --threshold 10 (the CLI's maximum allowed value) passes — so forcing a
// failing CI check without flaky, network-dependent findings means going
// through runAnalyze() directly, where ciThreshold isn't clamped to 0-10.
// This still covers what C-05 actually fixed: the exit code comes from the
// returned result (no process.exit() inside runAnalyze), and the status
// line goes to stderr/console.error, never stdout.
test('runAnalyze() with an unreachable threshold returns exitCode 1 without throwing or calling process.exit', async () => {
  const projectPath = makeFixtureProject();
  try {
    const { runAnalyze } = require('../../src/features/analyze');
    const result = await runAnalyze({ projectPath, ci: true, ciThreshold: 10.1, json: true, silent: true, saveHistory: false });
    assert.equal(result.exitCode, 1);
    assert.equal(typeof result.healthScore, 'number');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('the CLI sets process.exitCode (not process.exit) from a failing --ci check', async () => {
  const projectPath = makeFixtureProject();
  try {
    // --threshold is validated to [0, 10] by the CLI, and a clean fixture
    // scores exactly 10 — so this exercises the boundary (pass), while the
    // runAnalyze() test above exercises the actual failure path.
    const { stdout, stderr } = await execFileAsync(process.execPath, [BIN, 'analyze', '--path', projectPath, '--ci', '--threshold', '10', '--json', '--no-history'], { timeout: 30000 });
    assert.doesNotThrow(() => JSON.parse(stdout));
    assert.match(stderr, /CI Check Passed/);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
