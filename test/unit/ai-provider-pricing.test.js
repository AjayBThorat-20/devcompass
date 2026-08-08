// test/unit/ai-provider-pricing.test.js
// Regression test for the cost-estimate bug: pricing tables were priced
// per-1000-tokens instead of per-1,000,000-tokens, making every estimate
// 1000x too high.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const AnthropicProvider = require('../../src/features/ai/providers/anthropic.provider');
const OpenAIProvider = require('../../src/features/ai/providers/openai.provider');
const GoogleProvider = require('../../src/features/ai/providers/google.provider');

test('Anthropic sonnet cost for 1M in / 1M out tokens matches published per-million pricing', () => {
  const provider = new AnthropicProvider({ model: 'claude-sonnet-4-20250514' });
  const cost = provider.estimateCost(1_000_000, 1_000_000);
  assert.equal(cost, 3.00 + 15.00);
});

test('a realistic small prompt costs cents, not dollars', () => {
  const provider = new AnthropicProvider({ model: 'claude-sonnet-4-20250514' });
  // ~500 input tokens, ~200 output tokens — a typical single question/answer
  const cost = provider.estimateCost(500, 200);
  assert.ok(cost < 0.01, `expected a fraction of a cent, got $${cost}`);
});

test('OpenAI and Google pricing tables are also per-million, not per-thousand', () => {
  const openai = new OpenAIProvider({ model: 'gpt-4o-mini' });
  assert.ok(openai.estimateCost(1000, 1000) < 0.01);

  const google = new GoogleProvider({ model: 'gemini-1.5-flash' });
  assert.ok(google.estimateCost(1000, 1000) < 0.01);
});

test('getApiKey throws a clear error instead of silently using ciphertext', () => {
  // No _getDecryptedKey attached (that's normally done by token.manager.js) —
  // must fail loudly rather than fall back to the still-encrypted config value.
  const provider = new AnthropicProvider({ model: 'claude-sonnet-4-20250514', api_key: 'ENCRYPTED:abc123' });
  assert.throws(() => provider.getApiKey(), /No API key resolver configured/);
});

test('getApiKey uses the decrypted key when a resolver is attached', () => {
  const provider = new AnthropicProvider({ model: 'claude-sonnet-4-20250514' });
  provider._getDecryptedKey = () => 'sk-real-decrypted-key';
  assert.equal(provider.getApiKey(), 'sk-real-decrypted-key');
});
