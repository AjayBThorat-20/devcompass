// test/unit/backup-manager.test.js
// Regression coverage for the path-traversal fix: resolveBackupPath must
// reject any backup name that isn't a plain, contained directory entry.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const BackupManager = require('../../src/shared/utils/backup-manager');

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'depvora-backup-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'p', version: '1.0.0' }));
  fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ name: 'p' }));
  return dir;
}

test('resolveBackupPath rejects traversal and absolute-path payloads', () => {
  const dir = makeProject();
  const manager = new BackupManager(dir);

  for (const malicious of ['../../../etc/passwd', '../secret', '/etc/passwd', 'a/../../b', '']) {
    assert.equal(manager.resolveBackupPath(malicious), null, `should reject: ${JSON.stringify(malicious)}`);
  }

  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolveBackupPath accepts a plain backup name and stays inside backupDir', () => {
  const dir = makeProject();
  const manager = new BackupManager(dir);

  const resolved = manager.resolveBackupPath('backup-2026-01-01T00-00-00-000Z');
  assert.ok(resolved);
  assert.ok(resolved.startsWith(manager.backupDir + path.sep));

  fs.rmSync(dir, { recursive: true, force: true });
});

test('getBackupInfo/deleteBackup refuse a traversal name even though a real backup exists', async () => {
  const dir = makeProject();
  const manager = new BackupManager(dir);

  const backupPath = await manager.createBackup('test backup');
  assert.ok(backupPath, 'backup should be created successfully');

  assert.equal(await manager.getBackupInfo('../../../etc/passwd'), null);
  await assert.rejects(() => manager.deleteBackup('../../../etc/passwd'), /Invalid backup name/);

  // the real backup is still readable through its actual name
  const realName = path.basename(backupPath);
  const info = await manager.getBackupInfo(realName);
  assert.ok(info);
  assert.equal(info.name, realName);

  fs.rmSync(dir, { recursive: true, force: true });
});
