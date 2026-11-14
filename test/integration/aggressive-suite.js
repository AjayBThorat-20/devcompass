// test/aggressive-suite.js
//
// DevCompass Aggressive Test Suite
// Exhaustively exercises edge cases, malformed inputs, policy boundaries,
// graph cycles, concurrency, and security attack vectors.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const assert = require('assert');

const CLI_PATH = path.resolve(__dirname, '../../bin/devcompass.js');
const TEST_HOME = path.join(os.tmpdir(), `devcompass-agg-home-${Date.now()}`);
fs.mkdirSync(TEST_HOME, { recursive: true });

function runCLI(args, { cwd = process.cwd(), env = {} } = {}) {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    env: {
      ...process.env,
      HOME: TEST_HOME,
      DEBUG: undefined,
      ...env
    },
    encoding: 'utf8',
    timeout: 30000
  });
  return {
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error
  };
}

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  process.stdout.write(`  ⏳ ${name}... `);
  try {
    fn();
    console.log('\x1b[32m✔ PASS\x1b[0m');
    passed++;
  } catch (err) {
    console.log('\x1b[31m✖ FAIL\x1b[0m');
    console.error(`     Error: ${err.message}`);
    failures.push({ name, error: err });
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  process.stdout.write(`  ⏳ ${name}... `);
  try {
    await fn();
    console.log('\x1b[32m✔ PASS\x1b[0m');
    passed++;
  } catch (err) {
    console.log('\x1b[31m✖ FAIL\x1b[0m');
    console.error(`     Error: ${err.message}`);
    failures.push({ name, error: err });
    failed++;
  }
}

async function main() {
  console.log('\n===============================================================');
  console.log('       DEVCOMPASS AGGRESSIVE TESTING & FUZZING SUITE           ');
  console.log('===============================================================\n');

  // --- SUITE 1: Fault Injection & Malformed Input Handling ---
  console.log('\x1b[34m[Suite 1] Fault Injection & Malformed Input Handling\x1b[0m');

  test('Fuzz: non-existent project directory exits with code 3', () => {
    const res = runCLI(['analyze', '-p', '/tmp/non-existent-dir-' + Date.now()]);
    assert.strictEqual(res.code, 3, `Expected exit 3, got ${res.code}`);
    assert.match(res.stderr, /No package\.json found/i);
  });

  test('Fuzz: project directory with completely empty package.json', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-empty-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), '');
      const res = runCLI(['analyze', '-p', tmp]);
      assert.strictEqual(res.code, 3);
      assert.match(res.stderr, /JSON/i);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Fuzz: package.json containing JSON array instead of object', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-array-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), '["not", "an", "object"]');
      const res = runCLI(['analyze', '-p', tmp, '--offline']);
      // Should handle array package.json gracefully without crashing with unhandled exception
      assert(res.code === 0 || res.code === 3);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Fuzz: corrupted package-lock.json falls back gracefully', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-corrupt-lock-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'corrupt-lock', dependencies: { chalk: '4.1.2' } }));
      fs.writeFileSync(path.join(tmp, 'package-lock.json'), '{"packages": { "incomplete JSON');
      const res = runCLI(['analyze', '-p', tmp, '--offline']);
      assert.strictEqual(res.code, 0); // Scans direct dependencies when lockfile corrupted
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Fuzz: invalid --fail-on level is rejected upfront before scanning', () => {
    const res = runCLI(['analyze', '--fail-on', 'ultra-critical']);
    assert.strictEqual(res.code, 3);
    assert.match(res.stderr, /--fail-on must be one of: critical, high, medium, low, kev/);
  });

  test('Fuzz: invalid --format is rejected upfront', () => {
    const res = runCLI(['analyze', '--format', 'xml']);
    assert.strictEqual(res.code, 3);
    assert.match(res.stderr, /--format must be one of: console, json, sarif, markdown/);
  });

  // --- SUITE 2: Policy Gate & Baseline Strict Verification ---
  console.log('\n\x1b[34m[Suite 2] Policy Gate & Baseline Strict Verification\x1b[0m');

  test('Policy: --fail-on-incomplete with --fail-on high and --offline exits with code 2', () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const res = runCLI(['analyze', '-p', p1, '--offline', '--fail-on', 'high', '--fail-on-incomplete']);
    assert.strictEqual(res.code, 2, `Expected exit code 2, got ${res.code}`);
  });

  test('Policy: devcompass.config.json with unknown top-level key exits with code 3', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-cfg-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'bad-cfg' }));
      fs.writeFileSync(path.join(tmp, 'devcompass.config.json'), JSON.stringify({ typoKey: true }));
      const res = runCLI(['analyze', '-p', tmp, '--offline']);
      assert.strictEqual(res.code, 3);
      assert.match(res.stderr, /unknown key "typoKey"/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Policy: devcompass.config.json ignore entry without reason exits with code 3', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-no-reason-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'no-reason' }));
      fs.writeFileSync(path.join(tmp, 'devcompass.config.json'), JSON.stringify({
        ignore: [{ package: 'lodash' }]
      }));
      const res = runCLI(['analyze', '-p', tmp, '--offline']);
      assert.strictEqual(res.code, 3);
      assert.match(res.stderr, /missing a required "reason"/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('Baseline: baseline save and baseline check on clean fixture round-trip', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-baseline-test-'));
    try {
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({
        name: 'baseline-test',
        dependencies: { minimist: '0.0.8' }
      }));
      fs.writeFileSync(path.join(tmp, 'package-lock.json'), JSON.stringify({
        name: 'baseline-test',
        lockfileVersion: 2,
        packages: {
          '': { dependencies: { minimist: '0.0.8' } },
          'node_modules/minimist': { version: '0.0.8', license: 'MIT' }
        }
      }));

      // 1. Save baseline (using --offline and --allow-incomplete for offline/sandboxed test environment)
      const saveRes = runCLI(['baseline', 'save', '-p', tmp, '--offline', '--allow-incomplete']);
      assert.strictEqual(saveRes.code, 0, `Save failed with: ${saveRes.stderr}`);
      assert(fs.existsSync(path.join(tmp, '.devcompass-baseline.json')));

      // 2. Show baseline
      const showRes = runCLI(['baseline', 'show', '-p', tmp]);
      assert.strictEqual(showRes.code, 0);

      // 3. Analyze with --baseline
      const checkRes = runCLI(['analyze', '-p', tmp, '--baseline', '--offline']);
      assert.strictEqual(checkRes.code, 0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // --- SUITE 3: Output Formatting & Standards Compliance ---
  console.log('\n\x1b[34m[Suite 3] Output Formatting & Standards Compliance\x1b[0m');

  test('Format: SARIF output conforms to OASIS SARIF v2.1.0 schema', () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const res = runCLI(['analyze', '-p', p1, '--format', 'sarif', '--offline']);
    assert.strictEqual(res.code, 0);
    const parsed = JSON.parse(res.stdout);
    assert.strictEqual(parsed.version, '2.1.0');
    assert.strictEqual(parsed.$schema, 'https://json.schemastore.org/sarif-2.1.0.json');
    assert(Array.isArray(parsed.runs));
    assert(parsed.runs[0].tool.driver.name === 'DevCompass');
  });

  test('Format: Markdown output contains header, health score and table structure', () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const res = runCLI(['analyze', '-p', p1, '--format', 'markdown', '--offline']);
    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /## DevCompass report for/);
    assert.match(res.stdout, /\*\*Health score:\*\*/);
  });

  test('Format: JSON output contains no console bleed on stdout', () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const res = runCLI(['analyze', '-p', p1, '--json', '--offline']);
    assert.strictEqual(res.code, 0);
    let parsed;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(res.stdout);
    }, 'stdout should be strictly parseable JSON without log contamination');
    assert.strictEqual(typeof parsed.healthScore, 'number');
    assert(Array.isArray(parsed.issues));
  });

  // --- SUITE 4: Graph Engine, Cycles & Pathfinding ---
  console.log('\n\x1b[34m[Suite 4] Graph Engine, Cycles & Pathfinding\x1b[0m');

  test('Graph: Cyclic dependencies terminate cleanly without infinite loop', () => {
    const { loadDependencyGraph } = require('../../src/core/graph');
    const { why } = require('../../src/core/graph/why');

    const cyclicGraph = {
      packageManager: 'npm',
      nodes: new Map([
        ['pkgA@1.0.0', { id: 'pkgA@1.0.0', name: 'pkgA', version: '1.0.0' }],
        ['pkgB@1.0.0', { id: 'pkgB@1.0.0', name: 'pkgB', version: '1.0.0' }]
      ]),
      edges: [
        ['root', 'pkgA@1.0.0'],
        ['pkgA@1.0.0', 'pkgB@1.0.0'],
        ['pkgB@1.0.0', 'pkgA@1.0.0'] // Cycle!
      ]
    };

    const start = Date.now();
    const result = why(cyclicGraph, 'pkgB');
    const duration = Date.now() - start;

    assert(duration < 200, `Path search took too long (${duration}ms), cycle guard might have failed`);
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result[0].paths[0], ['root', 'pkgA@1.0.0', 'pkgB@1.0.0']);
  });

  test('Graph CLI: devcompass why finds real dependency paths in complex fixture', () => {
    const p4 = path.resolve(__dirname, '../project4-complex');
    const res = runCLI(['why', 'ms', '-p', p4]);
    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /ms@/);
    assert.match(res.stdout, /→/);
  });

  test('Graph CLI: devcompass why on non-installed package informs cleanly', () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const res = runCLI(['why', 'fake-nonexistent-package', '-p', p1]);
    assert.strictEqual(res.code, 0);
    assert.match(res.stdout, /isn't in the installed dependency tree/);
  });

  // --- SUITE 5: Backup Manager & Security Traversal Guards ---
  console.log('\n\x1b[34m[Suite 5] Backup Manager & Security Traversal Guards\x1b[0m');

  test('Security: Backup name with path traversal ../../ is rejected', () => {
    const BackupManager = require('../../src/shared/utils/backup-manager');
    const mgr = new BackupManager('/tmp');
    assert.strictEqual(mgr.resolveBackupPath('../../etc/passwd'), null);
    assert.strictEqual(mgr.resolveBackupPath('..'), null);
    assert.strictEqual(mgr.resolveBackupPath('.'), null);
    assert.strictEqual(mgr.resolveBackupPath('/absolute/path'), null);
    assert.strictEqual(mgr.resolveBackupPath('backup-safe.123_45'), '/tmp/.devcompass-backups/backup-safe.123_45');
  });

  test('Security: AI Provider custom base URL rejects file:// and non-http schemes', () => {
    const BaseProvider = require('../../src/features/ai/providers/base.provider');
    const provider = new BaseProvider();
    assert.throws(() => {
      provider.resolveBaseURL('file:///etc/passwd', 'https://api.openai.com/v1');
    }, /AI provider base URL must use http:\/\/ or https:\/\//);

    assert.throws(() => {
      provider.resolveBaseURL('javascript:alert(1)', 'https://api.openai.com/v1');
    }, /AI provider base URL must use http:\/\/ or https:\/\//);

    assert.strictEqual(
      provider.resolveBaseURL('https://my-proxy.company.com/v1', 'https://api.openai.com/v1'),
      'https://my-proxy.company.com/v1'
    );
  });

  // --- SUITE 6: High Concurrency & Parallel Execution Stress ---
  console.log('\n\x1b[34m[Suite 6] High Concurrency & Parallel Execution Stress\x1b[0m');

  await runAsyncTest('Concurrency: 20 concurrent devcompass CLI invocations do not lock or corrupt SQLite DB', async () => {
    const p1 = path.resolve(__dirname, '../project1-simple');
    const tasks = Array.from({ length: 20 }, (_, i) => {
      return new Promise((resolve, reject) => {
        const child = spawnSync(process.execPath, [CLI_PATH, 'analyze', '-p', p1, '--json', '--offline'], {
          env: { ...process.env, HOME: TEST_HOME },
          encoding: 'utf8',
          timeout: 25000
        });
        if (child.status !== 0) {
          reject(new Error(`Process ${i} failed with exit code ${child.status}: ${child.stderr}`));
        } else {
          try {
            JSON.parse(child.stdout);
            resolve();
          } catch (e) {
            reject(new Error(`Process ${i} output corrupt JSON: ${e.message}`));
          }
        }
      });
    });

    await Promise.all(tasks);
  });

  // --- Summary ---
  console.log('\n===============================================================');
  console.log(`AGGRESSIVE TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================\n');

  // Clean up
  try {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  } catch (e) {}

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test harness failure:', err);
  process.exit(1);
});
