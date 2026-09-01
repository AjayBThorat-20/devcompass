// test/unit/ai-provider-base-url.test.js
// Regression test: `depvora llm add --base-url ...` persists the URL under
// the DB column `base_url` (ai.database.js), but the OpenAI/Anthropic/Google
// provider constructors only ever read `config.baseURL` (camelCase) — so a
// configured custom base URL (e.g. a proxy/gateway) was silently ignored and
// requests went to the real vendor API instead. LocalProvider had already
// been patched to check both; TokenManager.getProvider now normalizes
// baseURL/base_url once for every provider instead of relying on each
// provider constructor to know about the DB's naming.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const aiDatabase = require('../../src/features/ai/ai.database');
const tokenManager = require('../../src/features/ai/token.manager');

test('a base_url stored under the DB column name reaches the provider as config.baseURL', () => {
  const originalGetProvider = aiDatabase.getProvider;
  aiDatabase.getProvider = () => ({
    id: 1,
    provider: 'openai',
    api_key: 'encrypted-placeholder',
    model: 'gpt-4o-mini',
    base_url: 'https://my-proxy.example.com/v1',
    is_active: 1
  });

  try {
    const instance = tokenManager.getProvider('openai');
    assert.equal(instance.baseURL, 'https://my-proxy.example.com/v1');
  } finally {
    aiDatabase.getProvider = originalGetProvider;
  }
});

test('providers still fall back to their default base URL when none is configured', () => {
  const originalGetProvider = aiDatabase.getProvider;
  aiDatabase.getProvider = () => ({
    id: 1,
    provider: 'anthropic',
    api_key: 'encrypted-placeholder',
    model: 'claude-sonnet-4-20250514',
    base_url: null,
    is_active: 1
  });

  try {
    const instance = tokenManager.getProvider('anthropic');
    assert.equal(instance.baseURL, 'https://api.anthropic.com/v1');
  } finally {
    aiDatabase.getProvider = originalGetProvider;
  }
});
