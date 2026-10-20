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
const { collectOutdatedData } = require('../../src/features/analyze/collectors/dependency.collector');

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

test('a failed outdated check is reported as incomplete, not as "everything is up to date"', async () => {
  const projectPath = makeProject({ name: 'fixture', version: '1.0.0', dependencies: { lodash: '^4.17.0' } });
  const originalPath = process.env.PATH;
  process.env.PATH = ''; // npx can't be found, so the check can't run
  try {
    const result = await collectOutdatedData(projectPath);
    assert.equal(result.length, 0);
    assert.equal(result.incomplete, true);
    assert.match(result.incompleteReason, /could not check/);
  } finally {
    process.env.PATH = originalPath;
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('a project with no dependencies needs no outdated check at all (and no network)', async () => {
  const projectPath = makeProject({ name: 'fixture', version: '1.0.0' });
  const originalPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const result = await collectOutdatedData(projectPath);
    assert.deepEqual(result, []);
    assert.equal(result.incomplete, undefined);
  } finally {
    process.env.PATH = originalPath;
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
