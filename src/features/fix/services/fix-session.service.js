// src/features/fix/services/fix-session.service.js
//
// Dedicated undo trail for `devcompass fix --migrate-syntax`, independent of
// the general `devcompass backup` system (which only ever covers
// package.json/package-lock.json). A session snapshots the *original*
// content of every file this fix run is about to rewrite — package.json,
// package-lock.json, and any source file touched by a syntax migration —
// so `devcompass fix undo` can put the project back exactly as it was.

const fs = require('fs');
const path = require('path');

class FixSessionManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.sessionsDir = path.join(projectPath, '.devcompass-backups', 'fix-sessions');
    this.sessionId = null;
    this.sessionDir = null;
    this.snapshotted = new Map(); // relativePath -> true, so a file is only ever snapshotted once per session (first write wins as "original")
    this.files = [];
  }

  start(metadata = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.sessionId = `fix-${timestamp}`;
    this.sessionDir = path.join(this.sessionsDir, this.sessionId);
    fs.mkdirSync(this.sessionDir, { recursive: true });
    this.metadata = { ...metadata, startedAt: new Date().toISOString() };
    return this.sessionId;
  }

  // Call this with the file's current on-disk (pre-fix) path, before it gets
  // overwritten. Safe to call more than once for the same file.
  snapshotFile(absoluteFilePath) {
    if (!this.sessionDir) throw new Error('FixSessionManager.start() must be called before snapshotFile()');

    const relativePath = path.relative(this.projectPath, absoluteFilePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return false; // outside the project — refuse
    if (this.snapshotted.has(relativePath)) return true;
    if (!fs.existsSync(absoluteFilePath)) return false;

    const destPath = path.join(this.sessionDir, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(absoluteFilePath, destPath);

    this.snapshotted.set(relativePath, true);
    this.files.push(relativePath);
    return true;
  }

  finalize() {
    if (!this.sessionDir) return null;
    const metadataPath = path.join(this.sessionDir, 'session.json');
    fs.writeFileSync(metadataPath, JSON.stringify({ ...this.metadata, files: this.files, finishedAt: new Date().toISOString() }, null, 2));

    fs.mkdirSync(this.sessionsDir, { recursive: true });
    fs.writeFileSync(path.join(this.sessionsDir, 'latest.json'), JSON.stringify({ sessionId: this.sessionId }, null, 2));

    return this.sessionId;
  }

  hasSnapshots() {
    return this.files.length > 0;
  }
}

function resolveSessionPath(projectPath, sessionId) {
  if (typeof sessionId !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(sessionId)) return null;
  const sessionsDir = path.join(projectPath, '.devcompass-backups', 'fix-sessions');
  const resolved = path.join(sessionsDir, sessionId);
  const relative = path.relative(sessionsDir, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function getLatestSessionId(projectPath) {
  try {
    const latestPath = path.join(projectPath, '.devcompass-backups', 'fix-sessions', 'latest.json');
    if (!fs.existsSync(latestPath)) return null;
    return JSON.parse(fs.readFileSync(latestPath, 'utf8')).sessionId || null;
  } catch (error) {
    return null;
  }
}

// Restores every file recorded in the session back to its pre-fix content.
function restoreSession(projectPath, sessionId) {
  const sessionDir = resolveSessionPath(projectPath, sessionId);
  if (!sessionDir || !fs.existsSync(sessionDir)) return { success: false, error: 'Fix session not found' };

  const metadataPath = path.join(sessionDir, 'session.json');
  if (!fs.existsSync(metadataPath)) return { success: false, error: 'Fix session is missing its metadata' };

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    return { success: false, error: 'Fix session metadata is corrupted' };
  }

  const restored = [];
  const failed = [];
  for (const relativePath of metadata.files || []) {
    try {
      const source = path.join(sessionDir, relativePath);
      const target = path.join(projectPath, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
      restored.push(relativePath);
    } catch (error) {
      failed.push({ file: relativePath, error: error.message });
    }
  }

  return { success: failed.length === 0, restored, failed, metadata };
}

function restoreLatestSession(projectPath) {
  const sessionId = getLatestSessionId(projectPath);
  if (!sessionId) return { success: false, error: 'No fix session found — `devcompass fix --migrate-syntax` has not run yet in this project' };
  return { sessionId, ...restoreSession(projectPath, sessionId) };
}

module.exports = { FixSessionManager, restoreSession, restoreLatestSession, getLatestSessionId };
