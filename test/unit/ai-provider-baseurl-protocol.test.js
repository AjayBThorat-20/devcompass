// test/unit/ai-provider-baseurl-protocol.test.js
// Regression coverage for BaseProvider.resolveBaseURL: a stored `baseURL`
// config value (set via `devcompass llm add --base-url ...`) went straight
// into axios.post(`${baseURL}/...`) with no validation, so a config value
// using a non-http(s) scheme (file:, gopher:, etc.) would reach axios
// unchanged. resolveBaseURL now rejects anything that isn't http/https.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const OpenAIProvider = require('../../src/features/ai/providers/openai.provider');
const LocalProvider = require('../../src/features/ai/providers/local.provider');

test('a non-http(s) configured base URL is rejected', () => {
  for (const scheme of ['file:///etc/passwd', 'gopher://internal:70/', 'javascript:alert(1)']) {
    assert.throws(() => new OpenAIProvider({ baseURL: scheme }), /must use http:\/\/ or https:\/\//);
  }
});

test('a malformed configured base URL is rejected', () => {
  assert.throws(() => new OpenAIProvider({ baseURL: 'not a url' }), /Invalid AI provider base URL/);
});

test('a valid https base URL (proxy/gateway) is accepted', () => {
  const provider = new OpenAIProvider({ baseURL: 'https://my-proxy.example.com/v1' });
  assert.equal(provider.baseURL, 'https://my-proxy.example.com/v1');
});

test('no configured base URL falls back to the provider default', () => {
  const provider = new OpenAIProvider({});
  assert.equal(provider.baseURL, 'https://api.openai.com/v1');
});

test('LocalProvider still allows a plain http://localhost base URL', () => {
  const provider = new LocalProvider({});
  assert.equal(provider.baseURL, 'http://localhost:11434');
});
