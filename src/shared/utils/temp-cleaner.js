// src/shared/utils/temp-cleaner.js

const fs = require('fs');
const path = require('path');
const os = require('os');

class TempCleaner {
  constructor() {
    this.tempFiles = new Set();
    this.tempDirs = new Set();
    this.setupCleanup();
  }

  setupCleanup() {
    process.once('exit', () => this.cleanAll());
    process.once('SIGINT', () => { this.cleanAll(); process.exit(0); });
    process.once('SIGTERM', () => { this.cleanAll(); process.exit(0); });
  }

  registerFile(filepath) { this.tempFiles.add(filepath); return filepath; }
  registerDir(dirpath) { this.tempDirs.add(dirpath); return dirpath; }

  createTempFile(prefix = 'depvora', ext = '.tmp') {
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    const filepath = path.join(os.tmpdir(), filename);
    return this.registerFile(filepath);
  }

  createTempDir(prefix = 'depvora') {
    const dirname = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dirpath = path.join(os.tmpdir(), dirname);
    fs.mkdirSync(dirpath, { recursive: true });
    return this.registerDir(dirpath);
  }

  cleanFile(filepath) {
    try {
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      this.tempFiles.delete(filepath);
    } catch (error) {
      if (process.env.DEBUG) console.error(`Failed to clean temp file: ${filepath}`, error.message);
    }
  }

  cleanDir(dirpath) {
    try {
      if (fs.existsSync(dirpath)) fs.rmSync(dirpath, { recursive: true, force: true });
      this.tempDirs.delete(dirpath);
    } catch (error) {
      if (process.env.DEBUG) console.error(`Failed to clean temp dir: ${dirpath}`, error.message);
    }
  }

  cleanAll() {
    for (const file of this.tempFiles) this.cleanFile(file);
    for (const dir of this.tempDirs) this.cleanDir(dir);
  }

  get count() { return { files: this.tempFiles.size, dirs: this.tempDirs.size }; }
}

module.exports = new TempCleaner();