// test/unit/analyze-pipeline.test.js
//
// CI-05: a deterministic, full-pipeline integration test. The bash scripts
// under test/integration/ drive the real CLI against live OSV/npm-registry/
// GitHub APIs — genuinely valuable (it catches real API-shape assumptions
// unit tests can't), but that also means it can fail for reasons that have
// nothing to do with this repo, so it stays informational
// (continue-on-error in ci.yml). This test exercises the same pipeline
// end-to-end — real collectors, real merge/scoring/rendering logic — but
// with every network call stubbed, so it's fast, deterministic, and safe to
// make a required merge gate.
//
// "outdated" is disabled via devcompass.config.json in the fixture: it goes
// through npm-check-updates' own internal networking (CL-03), which has no
// injection point in this codebase the way the OSV/NVD/npm-audit/KEV/EPSS
// singletons below do.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const osvClient = require('../../src/features/cve/osv.client');
const nvdClient = require('../../src/features/cve/nvd.client');
const dynamicSecurity = require('../../src/features/quality/dynamic-security.service');
const exploitRisk = require('../../src/features/cve/exploit-risk.service');
const registryClient = require('../../src/shared/services/registry-client');
const cacheManager = require('../../src/features/cve/cache.manager');

// Mirrors the plan's own review fixture: axios 0.21.1, lodash 4.17.15,
// minimist 1.2.5, express 4.17.1 — all genuinely vulnerable versions.
const FIXTURE_DEPENDENCIES = { axios: '0.21.1', lodash: '4.17.15', minimist: '1.2.5', express: '4.17.1' };

function makeFixtureProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-pipeline-test-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: 'pipeline-fixture', version: '1.0.0', dependencies: FIXTURE_DEPENDENCIES
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'devcompass.config.json'), JSON.stringify({
    checks: { outdated: { enabled: false } }
  }, null, 2));
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.js'), Object.keys(FIXTURE_DEPENDENCIES).map(n => `require('${n}');`).join('\n') + '\n');

  for (const [name, version] of Object.entries(FIXTURE_DEPENDENCIES)) {
    const pkgDir = path.join(dir, 'node_modules', name);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name, version, license: 'MIT' }, null, 2));
  }
  fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({
    name: 'pipeline-fixture', version: '1.0.0', lockfileVersion: 3,
    packages: {
      '': { name: 'pipeline-fixture', version: '1.0.0', dependencies: FIXTURE_DEPENDENCIES },
      ...Object.fromEntries(Object.entries(FIXTURE_DEPENDENCIES).map(([name, version]) => [`node_modules/${name}`, { version, license: 'MIT' }]))
    }
  }, null, 2));

  return dir;
}

function stubNetwork() {
  const originals = {
    osvBatchQuery: osvClient.batchQuery,
    nvdQueryCVE: nvdClient.queryCVE,
    runNpmAudit: dynamicSecurity.runNpmAudit,
    getKevSet: exploitRisk.getKevSet,
    getEpssScores: exploitRisk.getEpssScores,
    fetchBatch: registryClient.fetchBatch,
    fetchPackage: registryClient.fetchPackage,
    cacheGet: cacheManager.get,
    cacheSet: cacheManager.set
  };

  // The CVE cache is a real SQLite table in ~/.devcompass that persists
  // between runs, so without neutralizing it these tests would pass or fail
  // depending on whatever a previous real scan happened to leave there —
  // and a cache hit means osvClient.batchQuery is never called at all.
  cacheManager.get = () => null;
  cacheManager.set = () => {};

  // One real, well-known CVE (Prototype Pollution in minimist 1.2.5,
  // CVE-2021-44906 / GHSA-9c47-m6qq-7p4h) so the KEV/EPSS/NVD-alias steps
  // have something realistic to enrich, plus a plain OSV-only finding.
  osvClient.batchQuery = async (packages) => packages.map(p => {
    if (p.name === 'minimist') {
      return { package: p.name, version: p.version, vulnerabilities: [{ id: 'GHSA-9c47-m6qq-7p4h', aliases: ['CVE-2021-44906'], summary: 'Prototype Pollution in minimist', severity: 'critical' }] };
    }
    if (p.name === 'lodash') {
      return { package: p.name, version: p.version, vulnerabilities: [{ id: 'GHSA-p6mc-m468-83gw', aliases: [], summary: 'Prototype Pollution in lodash', severity: 'high' }] };
    }
    return { package: p.name, version: p.version, vulnerabilities: [] };
  });

  nvdClient.queryCVE = async (cveId) => (cveId === 'CVE-2021-44906' ? { cvssScore: 9.8, severity: 'CRITICAL' } : null);
  exploitRisk.getKevSet = async () => new Set(['CVE-2021-44906']);
  exploitRisk.getEpssScores = async () => new Map([['CVE-2021-44906', 0.93]]);
  dynamicSecurity.runNpmAudit = async () => ({ vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } });
  registryClient.fetchBatch = async () => new Map();
  registryClient.fetchPackage = async () => null;

  return () => {
    osvClient.batchQuery = originals.osvBatchQuery;
    nvdClient.queryCVE = originals.nvdQueryCVE;
    dynamicSecurity.runNpmAudit = originals.runNpmAudit;
    exploitRisk.getKevSet = originals.getKevSet;
    exploitRisk.getEpssScores = originals.getEpssScores;
    registryClient.fetchBatch = originals.fetchBatch;
    registryClient.fetchPackage = originals.fetchPackage;
    cacheManager.get = originals.cacheGet;
    cacheManager.set = originals.cacheSet;
  };
}

test('the full analyze pipeline merges OSV findings, enriches with NVD/KEV/EPSS, and scores correctly — fully deterministic', async () => {
  const dir = makeFixtureProject();
  const restore = stubNetwork();
  try {
    const { runAnalyze } = require('../../src/features/analyze');
    const result = await runAnalyze({ projectPath: dir, mode: 'silent', silent: true, saveHistory: false });

    const minimistIssue = result.issues.find(i => i.name === 'minimist');
    assert.ok(minimistIssue, 'the minimist vulnerability must survive the whole pipeline');
    assert.equal(minimistIssue.severity, 'CRITICAL');
    assert.deepEqual(minimistIssue.advisoryIds, ['GHSA-9c47-m6qq-7p4h']);
    assert.equal(minimistIssue.metadata.knownExploited, true, 'CVE-2021-44906 was stubbed as KEV-listed');
    assert.equal(minimistIssue.metadata.epssScore, 0.93);
    assert.equal(minimistIssue.confidence, 'high');
    assert.equal(minimistIssue.id, 'vuln:minimist@1.2.5:GHSA-9c47-m6qq-7p4h');

    const lodashIssue = result.issues.find(i => i.name === 'lodash');
    assert.ok(lodashIssue);
    assert.equal(lodashIssue.metadata.knownExploited, false);

    // A CRITICAL vulnerability must cap the score below 4 (C-09).
    assert.ok(result.healthScore < 4, `expected healthScore < 4 for a CRITICAL finding, got ${result.healthScore}`);

    // outdated was disabled via devcompass.config.json — nothing from it.
    assert.equal(result.issues.some(i => i.type === 'outdated'), false);
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the same fixture produces valid --fail-on kev behavior end-to-end', async () => {
  const dir = makeFixtureProject();
  const restore = stubNetwork();
  try {
    const { runAnalyze } = require('../../src/features/analyze');
    const result = await runAnalyze({ projectPath: dir, mode: 'silent', silent: true, saveHistory: false, failOn: 'kev' });
    assert.equal(result.exitCode, 1, 'a KEV-listed finding must fail a --fail-on kev gate');
    assert.equal(result.metadata.policy.matched.length, 1);
  } finally {
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// AR-01's whole point. Before the lockfile graph was wired into the CVE
// collector, OSV was only ever handed package.json's declared dependencies,
// so a CRITICAL vulnerability in a transitive package was invisible unless
// npm audit happened to also flag it — and npm audit's results are filtered
// to HIGH/CRITICAL. Measured on a real fixture, the identical project scored
// 9.2/10 "Excellent" before this and 3.9/10 "Critical" after.
test('a vulnerability in a transitive-only package is found (not just direct dependencies)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-transitive-test-'));
  const restoreNetwork = stubNetwork();
  const queriedPackages = [];

  // minimist is nested under express and never declared in package.json.
  osvClient.batchQuery = async (packages) => {
    packages.forEach(p => queriedPackages.push(`${p.name}@${p.version}`));
    return packages.map(p => (p.name === 'minimist'
      ? { package: p.name, version: p.version, vulnerabilities: [{ id: 'GHSA-9c47-m6qq-7p4h', aliases: ['CVE-2021-44906'], summary: 'Prototype Pollution in minimist', severity: 'critical' }] }
      : { package: p.name, version: p.version, vulnerabilities: [] }));
  };

  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'transitive-fixture', version: '1.0.0', dependencies: { express: '4.17.1' }
    }, null, 2));
    fs.writeFileSync(path.join(dir, 'devcompass.config.json'), JSON.stringify({ checks: { outdated: { enabled: false } } }, null, 2));
    fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({
      name: 'transitive-fixture', version: '1.0.0', lockfileVersion: 3,
      packages: {
        '': { name: 'transitive-fixture', version: '1.0.0', dependencies: { express: '4.17.1' } },
        'node_modules/express': { version: '4.17.1', dependencies: { minimist: '1.2.5' } },
        'node_modules/express/node_modules/minimist': { version: '1.2.5' }
      }
    }, null, 2));
    fs.mkdirSync(path.join(dir, 'node_modules/express/node_modules/minimist'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules/express/package.json'), JSON.stringify({ name: 'express', version: '4.17.1' }));
    fs.writeFileSync(path.join(dir, 'node_modules/express/node_modules/minimist/package.json'), JSON.stringify({ name: 'minimist', version: '1.2.5' }));

    const { runAnalyze } = require('../../src/features/analyze');
    const result = await runAnalyze({ projectPath: dir, mode: 'silent', silent: true, saveHistory: false });

    assert.ok(queriedPackages.includes('minimist@1.2.5'), `the transitive package must be queried; queried: ${queriedPackages.join(', ')}`);
    const finding = result.issues.find(i => i.name === 'minimist');
    assert.ok(finding, 'the transitive vulnerability must appear as a finding');
    assert.equal(finding.severity, 'CRITICAL');
    assert.ok(result.healthScore < 4, `a CRITICAL transitive vulnerability must cap the score below 4, got ${result.healthScore}`);
  } finally {
    restoreNetwork();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('with no lockfile, the CVE check falls back to direct dependencies rather than reporting nothing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-nolock-test-'));
  const restoreNetwork = stubNetwork();
  const queriedPackages = [];

  osvClient.batchQuery = async (packages) => {
    packages.forEach(p => queriedPackages.push(`${p.name}@${p.version}`));
    return packages.map(p => ({ package: p.name, version: p.version, vulnerabilities: [] }));
  };

  try {
    // No package-lock.json at all — the graph reports incomplete.
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'nolock-fixture', version: '1.0.0', dependencies: { express: '4.17.1' }
    }, null, 2));
    fs.writeFileSync(path.join(dir, 'devcompass.config.json'), JSON.stringify({ checks: { outdated: { enabled: false } } }, null, 2));
    fs.mkdirSync(path.join(dir, 'node_modules/express'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules/express/package.json'), JSON.stringify({ name: 'express', version: '4.17.1' }));

    const { runAnalyze } = require('../../src/features/analyze');
    await runAnalyze({ projectPath: dir, mode: 'silent', silent: true, saveHistory: false });

    assert.ok(queriedPackages.includes('express@4.17.1'), `direct dependencies must still be checked without a lockfile; queried: ${queriedPackages.join(', ')}`);
  } finally {
    restoreNetwork();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the same fixture renders valid, complete JSON end-to-end (--json)', async () => {
  const dir = makeFixtureProject();
  const restore = stubNetwork();
  const originalLog = console.log;
  let stdout = '';
  console.log = (...args) => { stdout += args.join(' '); };
  try {
    const { runAnalyze } = require('../../src/features/analyze');
    await runAnalyze({ projectPath: dir, json: true, saveHistory: false });
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.schemaVersion, 1);
    assert.ok(parsed.issues.some(i => i.name === 'minimist'));
  } finally {
    console.log = originalLog;
    restore();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
