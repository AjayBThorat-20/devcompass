// test/unit/env-api-keys.test.js
// API keys and tokens can come from the environment, so CI never has to
// write one to disk (where they're only obfuscated, not protected).

const { test } = require('node:test');
const assert = require('node:assert/strict');

function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map(k => [k, process.env[k]]));
  Object.assign(process.env, vars);
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('NVD_API_KEY is used before any stored key', () => {
  const nvdClient = require('../../src/features/cve/nvd.client');
  withEnv({ NVD_API_KEY: 'env-nvd-key' }, () => {
    assert.equal(nvdClient.getAPIKey(), 'env-nvd-key');
  });
});

test('GITHUB_TOKEN (or GH_TOKEN) is used before any stored token', () => {
  const GitHubTokenManager = require('../../src/features/config/github-token.manager');
  const manager = new GitHubTokenManager();
  withEnv({ GITHUB_TOKEN: 'env-github-token', GH_TOKEN: '' }, () => {
    assert.equal(manager.getToken(), 'env-github-token');
  });
  withEnv({ GITHUB_TOKEN: '', GH_TOKEN: 'env-gh-token' }, () => {
    assert.equal(manager.getToken(), 'env-gh-token');
  });
});
