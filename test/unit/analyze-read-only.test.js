// test/unit/analyze-read-only.test.js
// `analyze` used to create six .devcompass/ subfolders in the scanned
// project, write its cache there, and append to (or create) the project's
// .gitignore — on every run. It is meant to be read-only.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runAnalyze } = require('../../src/features/analyze');
const { getCachePath } = require('../../src/shared/utils/analysis-cache');

function makeProject(pkg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-readonly-test-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
  return dir;
}

test('runAnalyze() leaves the project directory exactly as it found it', async () => {
  const projectPath = makeProject({ name: 'fixture', version: '1.0.0' });
  try {
    await runAnalyze({ projectPath, silent: true, saveHistory: false });
    assert.deepEqual(fs.readdirSync(projectPath), ['package.json'], 'no .devcompass/, .gitignore or temp files may be created');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
    fs.rmSync(getCachePath(projectPath), { force: true });
  }
});

test('the analysis cache lives under ~/.devcompass/cache, keyed by project path', () => {
  const a = getCachePath('/some/project/a');
  const b = getCachePath('/some/project/b');
  assert.ok(a.startsWith(path.join(os.homedir(), '.devcompass', 'cache')));
  assert.notEqual(a, b, 'two projects must not share a cache file');
  assert.equal(getCachePath('/some/project/a/'), a, 'the same project path must map to the same file');
});
