// test/unit/cli-policy.test.js
// Policy gates end to end through the real CLI: exit codes, messages, and
// devcompass.config.json. Every run is --offline, so no network is touched;
// the license gate reads licenses from the lockfile.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BIN = path.join(__dirname, '../../bin/devcompass.js');

function makeFixtureProject(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-cli-policy-test-'));
  const dependencies = { 'gpl-lib': '1.0.0', 'mit-lib': '1.0.0' };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.0.0', dependencies }, null, 2));
  fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({
    name: 'fixture',
    version: '1.0.0',
    lockfileVersion: 3,
    packages: {
      '': { name: 'fixture', version: '1.0.0', dependencies },
      'node_modules/gpl-lib': { version: '1.0.0', license: 'GPL-3.0-only' },
      'node_modules/mit-lib': { version: '1.0.0', license: 'MIT', dependencies: { 'deep-mpl': '1.0.0' } },
      'node_modules/deep-mpl': { version: '1.0.0', license: 'MPL-2.0' }
    }
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'index.js'), "require('gpl-lib');\nrequire('mit-lib');\n");
  if (config) fs.writeFileSync(path.join(dir, 'devcompass.config.json'), JSON.stringify(config, null, 2));
  return dir;
}

// Resolves with the exit code instead of rejecting on a non-zero one.
function run(projectPath, args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN, 'analyze', '--path', projectPath, '--no-history', ...args], { timeout: 60000 }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
}

async function withProject(config, fn) {
  const dir = makeFixtureProject(config);
  try { await fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('--fail-on-license exits 1 and names the package, from the lockfile, offline', async () => {
  await withProject(null, async (dir) => {
    const { code, stderr } = await run(dir, ['--offline', '--fail-on-license', 'GPL-3.0']);
    assert.equal(code, 1);
    assert.match(stderr, /gpl-lib@1\.0\.0: GPL-3\.0-only license/);
  });
});

test('--fail-on-license covers transitive packages unless --only-direct', async () => {
  await withProject(null, async (dir) => {
    assert.equal((await run(dir, ['--offline', '--fail-on-license', 'MPL-2.0'])).code, 1);
    assert.equal((await run(dir, ['--offline', '--fail-on-license', 'MPL-2.0', '--only-direct'])).code, 0);
  });
});

test('an unknown --fail-on level exits 3 with the valid choices, before scanning', async () => {
  await withProject(null, async (dir) => {
    const { code, stderr } = await run(dir, ['--offline', '--fail-on', 'severe']);
    assert.equal(code, 3);
    assert.match(stderr, /--fail-on must be one of: critical, high, medium, low, kev/);
  });
});

test('--offline with --fail-on-incomplete exits 2: skipped checks are not a clean scan', async () => {
  await withProject(null, async (dir) => {
    const { code, stderr } = await run(dir, ['--offline', '--fail-on', 'high', '--fail-on-incomplete']);
    assert.equal(code, 2);
    assert.match(stderr, /Offline: skipped the cve, license, quality, security, outdated checks/);
  });
});

test('devcompass.config.json failOn applies with no flag, and an ignore with a reason suppresses it', async () => {
  await withProject({ failOn: { licenses: ['GPL-3.0'] } }, async (dir) => {
    assert.equal((await run(dir, ['--offline'])).code, 1);
  });
  await withProject({
    failOn: { licenses: ['GPL-3.0'] },
    ignore: [{ package: 'gpl-lib', reason: 'Internal tool, never distributed' }]
  }, async (dir) => {
    assert.equal((await run(dir, ['--offline'])).code, 0);
  });
});

test('an expired ignore stops suppressing its finding', async () => {
  await withProject({
    failOn: { licenses: ['GPL-3.0'] },
    ignore: [{ package: 'gpl-lib', reason: 'Until the rewrite lands', expires: '2020-01-01' }]
  }, async (dir) => {
    assert.equal((await run(dir, ['--offline'])).code, 1);
  });
});

test('an invalid devcompass.config.json exits 3 with a clear message', async () => {
  await withProject({ failon: { severity: 'high' } }, async (dir) => {
    const { code, stderr } = await run(dir, ['--offline']);
    assert.equal(code, 3);
    assert.match(stderr, /devcompass\.config\.json: unknown key "failon"/);
  });
});

test('--json carries the policy result and the skipped checks, and stays valid JSON', async () => {
  await withProject(null, async (dir) => {
    const { code, stdout } = await run(dir, ['--offline', '--json', '--fail-on-license', 'GPL-3.0']);
    assert.equal(code, 1);
    const output = JSON.parse(stdout);
    assert.deepEqual(output.metadata.policy.matched.map(m => m.package), ['gpl-lib']);
    assert.deepEqual(output.metadata.skippedChecks, ['cve', 'license', 'quality', 'security', 'outdated']);
  });
});

function runBaseline(projectPath, args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN, 'baseline', ...args, '--path', projectPath], { timeout: 60000 }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
}

function addDependency(dir, name, license) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  pkg.dependencies[name] = '1.0.0';
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
  const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'));
  lock.packages[''].dependencies[name] = '1.0.0';
  lock.packages[`node_modules/${name}`] = { version: '1.0.0', license };
  fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify(lock, null, 2));
}

test('--baseline: known findings pass the gate, a new one fails it and is the only one listed', async () => {
  await withProject(null, async (dir) => {
    addDependency(dir, 'unused-a', 'MIT'); // never required: an unused (LOW) finding
    const saved = await runBaseline(dir, ['save', '--offline', '--allow-incomplete']);
    assert.equal(saved.code, 0, saved.stderr);
    assert.match(saved.stdout, /Saved 1 finding\(s\)/);

    assert.equal((await run(dir, ['--offline', '--fail-on', 'low'])).code, 1, 'without --baseline the known finding still fails');
    assert.equal((await run(dir, ['--offline', '--fail-on', 'low', '--baseline'])).code, 0);

    addDependency(dir, 'unused-b', 'MIT');
    const { code, stderr } = await run(dir, ['--offline', '--fail-on', 'low', '--baseline']);
    assert.equal(code, 1);
    assert.match(stderr, /unused-b@1\.0\.0/);
    assert.doesNotMatch(stderr, /unused-a@1\.0\.0/);
  });
});

test('baseline save refuses a partial scan unless asked, so missed findings don\'t look new later', async () => {
  await withProject(null, async (dir) => {
    const { code, stderr } = await runBaseline(dir, ['save', '--offline']);
    assert.equal(code, 1);
    assert.match(stderr, /Not saved: the cve, license, quality, security, outdated checks didn't complete/);
    assert.equal(fs.existsSync(path.join(dir, '.devcompass-baseline.json')), false);
  });
});

test('a finding gets its version from the lockfile when nothing is installed', async () => {
  await withProject(null, async (dir) => {
    addDependency(dir, 'unused-a', 'MIT');
    const { stdout } = await run(dir, ['--offline', '--json']);
    const unused = JSON.parse(stdout).issues.find(i => i.name === 'unused-a');
    assert.equal(unused.version, '1.0.0');
    assert.equal(unused.id, 'unused:unused-a@1.0.0');
  });
});
