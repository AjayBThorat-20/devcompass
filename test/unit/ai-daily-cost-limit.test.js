// test/unit/ai-daily-cost-limit.test.js
// Regression test: the daily AI cost limit used to live in an in-memory
// object (`costLimiter` in ai.command.js) initialized fresh on every module
// load. Since each `depvora ai ask` invocation is a brand new CLI
// process, the counter reset to $0 every single command and never actually
// stopped anyone from blowing past the $10/day limit across separate calls
// — it only "worked" within one long-lived `depvora ai chat` session.
//
// The fix persists each request's cost to ai_conversations (which askQuestion
// previously never wrote to, despite the DB method already existing) and
// reads today's real total back from there, so the limit holds across
// process boundaries.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const aiDatabase = require('../../src/features/ai/ai.database');

const TEST_SESSION = 'depvora-test-daily-cost-session';

function cleanup() {
  aiDatabase.db.prepare('DELETE FROM ai_conversations WHERE session_id = ?').run(TEST_SESSION);
}

test('getTodaySpend sums costs persisted today, across separate saveConversation calls', () => {
  cleanup();
  try {
    aiDatabase.saveConversation(TEST_SESSION, null, 'ask', null, 'question 1', 'answer 1', 100, 0.05);
    aiDatabase.saveConversation(TEST_SESSION, null, 'ask', null, 'question 2', 'answer 2', 200, 0.12);

    const total = aiDatabase.getTodaySpend();
    assert.ok(total >= 0.17 - 1e-9, `expected at least 0.17 from this test's own rows, got ${total}`);
  } finally {
    cleanup();
  }
});

test('getTodaySpend reflects a fresh $0 baseline once this test\'s rows are removed', () => {
  cleanup();
  const before = aiDatabase.getTodaySpend();

  aiDatabase.saveConversation(TEST_SESSION, null, 'ask', null, 'question', 'answer', 50, 1.23);
  const after = aiDatabase.getTodaySpend();

  assert.ok(after >= before + 1.23 - 1e-9, 'spend must increase by the persisted cost');
  cleanup();
});
