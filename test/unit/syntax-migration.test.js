// test/unit/syntax-migration.test.js
// Coverage for `devcompass fix --migrate-syntax`: the built-in codemod
// registry, the usage scanner, the fix-session undo trail, and the
// orchestrator that ties them together (with a fake AI provider standing in
// for a real one).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { findBuiltInTransform } = require('../../src/features/fix/migrations/registry');
const { findPackageUsages } = require('../../src/features/fix/migrations/usage-scanner');
const { FixSessionManager, restoreSession } = require('../../src/features/fix/services/fix-session.service');
const { migrateSyntax, isMajorBump } = require('../../src/features/fix/services/syntax-migrator.service');

function makeProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-migrate-'));
  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

test('isMajorBump only flags an actual major-version crossing', () => {
  assert.equal(isMajorBump('3.4.0', '8.0.0'), true);
  assert.equal(isMajorBump('4.16.0', '4.20.0'), false);
  assert.equal(isMajorBump('1.2.3', '1.9.0'), false);
  assert.equal(isMajorBump('not-a-version', '8.0.0'), false);
});

test('findBuiltInTransform: uuid require() deep-import rewritten to named export', () => {
  const entry = findBuiltInTransform('uuid', '3.4.0', '8.3.2');
  assert.ok(entry, 'expected a built-in transform for uuid v3 -> v8');

  const before = "const uuidv4 = require('uuid/v4');\nconsole.log(uuidv4());\n";
  const after = entry.transform(before);
  assert.equal(after, "const { v4: uuidv4 } = require('uuid');\nconsole.log(uuidv4());\n");
});

test('findBuiltInTransform: uuid import statement rewritten', () => {
  const entry = findBuiltInTransform('uuid', '3.4.0', '9.0.0');
  const before = "import uuidv4 from 'uuid/v4';\n";
  const after = entry.transform(before);
  assert.equal(after, "import { v4 as uuidv4 } from 'uuid';\n");
});

test('findBuiltInTransform: returns null for an unregistered package or non-major bump', () => {
  assert.equal(findBuiltInTransform('lodash', '3.0.0', '4.0.0'), null);
  assert.equal(findBuiltInTransform('uuid', '8.0.0', '8.3.2'), null); // not a major bump
});

test('findBuiltInTransform: transform returns null when nothing to rewrite', () => {
  const entry = findBuiltInTransform('uuid', '3.4.0', '8.3.2');
  assert.equal(entry.transform("const { v4 } = require('uuid');\n"), null);
});

test('findPackageUsages: finds require/import usages, ignores node_modules and unrelated substrings', () => {
  const dir = makeProject({
    'src/a.js': "const uuidv4 = require('uuid/v4');\n",
    'src/b.js': "import { v4 } from 'uuid';\n",
    'src/c.js': "const x = require('uuid-extra');\n", // must NOT match "uuid"
    'node_modules/uuid/index.js': "require('uuid/v4');\n" // must be ignored
  });

  const matches = findPackageUsages(dir, 'uuid').map(f => path.relative(dir, f)).sort();
  assert.deepEqual(matches, ['src/a.js', 'src/b.js']);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('FixSessionManager: snapshot + restoreSession round-trips a rewritten file', () => {
  const dir = makeProject({ 'src/a.js': 'original content\n' });
  const filePath = path.join(dir, 'src/a.js');

  const session = new FixSessionManager(dir);
  const sessionId = session.start({ mode: 'safe' });
  session.snapshotFile(filePath);
  fs.writeFileSync(filePath, 'rewritten content\n');
  session.finalize();

  assert.equal(fs.readFileSync(filePath, 'utf8'), 'rewritten content\n');

  const restoreResult = restoreSession(dir, sessionId);
  assert.equal(restoreResult.success, true);
  assert.deepEqual(restoreResult.restored, ['src/a.js']);
  assert.equal(fs.readFileSync(filePath, 'utf8'), 'original content\n');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('FixSessionManager: snapshotting the same file twice keeps the first (original) copy', () => {
  const dir = makeProject({ 'src/a.js': 'v1\n' });
  const filePath = path.join(dir, 'src/a.js');

  const session = new FixSessionManager(dir);
  session.start({});
  session.snapshotFile(filePath);
  fs.writeFileSync(filePath, 'v2\n');
  session.snapshotFile(filePath); // second call — should be a no-op, not overwrite the snapshot with v2

  const snapshotContent = fs.readFileSync(path.join(session.sessionDir, 'src/a.js'), 'utf8');
  assert.equal(snapshotContent, 'v1\n');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('migrateSyntax: applies the built-in codemod and records it as migrated', async () => {
  const dir = makeProject({ 'src/a.js': "const uuidv4 = require('uuid/v4');\n" });
  const session = new FixSessionManager(dir);
  session.start({});

  const actions = [{ action: 'update', package: 'uuid', currentVersion: '3.4.0', targetVersion: '8.3.2' }];
  const result = await migrateSyntax(actions, { projectPath: dir, session, getAIProvider: () => { throw new Error('should not be called'); } });

  assert.equal(result.migrated.length, 1);
  assert.equal(result.migrated[0].via, 'built-in');
  assert.equal(fs.readFileSync(path.join(dir, 'src/a.js'), 'utf8'), "const { v4: uuidv4 } = require('uuid');\n");
  assert.ok(session.hasSnapshots());

  fs.rmSync(dir, { recursive: true, force: true });
});

test('migrateSyntax: falls back to the AI provider when no built-in codemod matches', async () => {
  const dir = makeProject({ 'src/a.js': "const got = require('got');\ngot('https://example.com');\n" });
  const session = new FixSessionManager(dir);
  session.start({});

  const fakeProvider = {
    sendPrompt: async () => ({ content: "const got = require('got');\nawait got('https://example.com');\n" })
  };

  const actions = [{ action: 'update', package: 'got', currentVersion: '11.8.0', targetVersion: '12.0.0' }];
  const result = await migrateSyntax(actions, { projectPath: dir, session, getAIProvider: () => fakeProvider });

  assert.equal(result.migrated.length, 1);
  assert.equal(result.migrated[0].via, 'ai');

  fs.rmSync(dir, { recursive: true, force: true });
});

test('migrateSyntax: skips with a clear reason when no AI provider is configured and no built-in match exists', async () => {
  const dir = makeProject({ 'src/a.js': "const got = require('got');\n" });
  const session = new FixSessionManager(dir);
  session.start({});

  const actions = [{ action: 'update', package: 'got', currentVersion: '11.8.0', targetVersion: '12.0.0' }];
  const result = await migrateSyntax(actions, {
    projectPath: dir,
    session,
    getAIProvider: () => { throw new Error('No default provider configured. Add one with: devcompass llm add'); }
  });

  assert.equal(result.migrated.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.match(result.skipped[0].reason, /No default provider configured/);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('migrateSyntax: a non-major version bump is left untouched entirely', async () => {
  const dir = makeProject({ 'src/a.js': "const uuidv4 = require('uuid/v4');\n" });
  const session = new FixSessionManager(dir);
  session.start({});

  const actions = [{ action: 'update', package: 'uuid', currentVersion: '8.0.0', targetVersion: '8.3.2' }];
  const result = await migrateSyntax(actions, { projectPath: dir, session, getAIProvider: () => { throw new Error('should not be called'); } });

  assert.deepEqual(result, { migrated: [], skipped: [], errors: [] });

  fs.rmSync(dir, { recursive: true, force: true });
});
