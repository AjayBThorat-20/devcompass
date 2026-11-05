// test/unit/nvd-alias.test.js
// C-10: OSV identifies npm advisories with GHSA-* ids, but NVD's queryCVE
// only accepts CVE-* ids. Passing the GHSA id straight through (the old
// behavior) meant NVD enrichment practically never matched. The CVE id is
// already available in the OSV record's `aliases`.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const nvdClient = require('../../src/features/cve/nvd.client');
const osvClient = require('../../src/features/cve/osv.client');
const cacheManager = require('../../src/features/cve/cache.manager');
const vulnerabilityChecker = require('../../src/features/cve/vulnerability-checker');
const exploitRisk = require('../../src/features/cve/exploit-risk.service');

// A CVE alias now also reaches the CISA KEV / FIRST EPSS lookup; keep these
// tests off the network.
exploitRisk.getKevSet = async () => new Set();
exploitRisk.getEpssScores = async () => new Map();

const packageJson = { dependencies: { 'devcompass-nvd-alias-test-pkg': '^1.0.0' } };

test('checkProject queries NVD with the CVE id from aliases, not the GHSA id', async () => {
  cacheManager.delete('devcompass-nvd-alias-test-pkg', '1.0.0');

  const originalBatchQuery = osvClient.batchQuery;
  const originalQueryCVE = nvdClient.queryCVE;
  const queriedIds = [];

  osvClient.batchQuery = async (packages) => packages.map(p => ({
    package: p.name,
    version: p.version,
    vulnerabilities: [{ id: 'GHSA-xxxx-xxxx-xxxx', aliases: ['CVE-2021-44906'], severity: 'high' }]
  }));
  nvdClient.queryCVE = async (cveId) => { queriedIds.push(cveId); return { cvssScore: 9.8, severity: 'CRITICAL' }; };

  try {
    const result = await vulnerabilityChecker.checkProject('/fake/path', packageJson);
    assert.deepEqual(queriedIds, ['CVE-2021-44906'], 'NVD must be queried with the CVE id, never the GHSA id');
    assert.equal(result.vulnerabilities[0].enriched, true);
    assert.equal(result.vulnerabilities[0].cvss, 9.8);
  } finally {
    osvClient.batchQuery = originalBatchQuery;
    nvdClient.queryCVE = originalQueryCVE;
    cacheManager.delete('devcompass-nvd-alias-test-pkg', '1.0.0');
  }
});

test('checkProject skips NVD enrichment entirely when no CVE alias exists', async () => {
  cacheManager.delete('devcompass-nvd-alias-test-pkg', '1.0.0');

  const originalBatchQuery = osvClient.batchQuery;
  const originalQueryCVE = nvdClient.queryCVE;
  let queryCVECalls = 0;

  osvClient.batchQuery = async (packages) => packages.map(p => ({
    package: p.name,
    version: p.version,
    vulnerabilities: [{ id: 'GHSA-yyyy-yyyy-yyyy', aliases: [], severity: 'medium' }]
  }));
  nvdClient.queryCVE = async () => { queryCVECalls++; return null; };

  try {
    const result = await vulnerabilityChecker.checkProject('/fake/path', packageJson);
    assert.equal(queryCVECalls, 0, 'no NVD call should be made when there is no CVE id to query with');
    assert.equal(result.vulnerabilities[0].enriched, undefined);
  } finally {
    osvClient.batchQuery = originalBatchQuery;
    nvdClient.queryCVE = originalQueryCVE;
    cacheManager.delete('devcompass-nvd-alias-test-pkg', '1.0.0');
  }
});

test('checkPackage() also resolves a CVE alias before querying NVD', async () => {
  const originalQueryPackage = osvClient.queryPackage;
  const originalQueryCVE = nvdClient.queryCVE;
  const queriedIds = [];

  osvClient.queryPackage = async () => ({
    vulnerabilities: [{ id: 'GHSA-zzzz-zzzz-zzzz', aliases: ['CVE-2020-8203'], severity: 'high' }]
  });
  nvdClient.queryCVE = async (cveId) => { queriedIds.push(cveId); return { cvssScore: 7.4 }; };

  try {
    const results = await vulnerabilityChecker.checkPackage('lodash', '4.17.15');
    assert.deepEqual(queriedIds, ['CVE-2020-8203']);
    assert.equal(results[0].enriched, true);
  } finally {
    osvClient.queryPackage = originalQueryPackage;
    nvdClient.queryCVE = originalQueryCVE;
  }
});
