const fs = require('fs');

class FileCache {
  constructor() {
    this.cache = new Map();
    this.mtimes = new Map();
  }

  read(filepath, encoding = 'utf8') {
    try {
      const stats = fs.statSync(filepath);
      const cachedMtime = this.mtimes.get(filepath);

      if (cachedMtime && cachedMtime.getTime() === stats.mtime.getTime()) {
        return this.cache.get(filepath);
      }

      const content = fs.readFileSync(filepath, encoding);
      this.cache.set(filepath, content);
      this.mtimes.set(filepath, stats.mtime);

      return content;
    } catch (error) {
      throw error;
    }
  }

  readJSON(filepath) {
    const content = this.read(filepath, 'utf8');
    return JSON.parse(content);
  }

  has(filepath) {
    return this.cache.has(filepath);
  }

  invalidate(filepath) {
    this.cache.delete(filepath);
    this.mtimes.delete(filepath);
  }

  clear() {
    this.cache.clear();
    this.mtimes.clear();
  }

  get size() {
    return this.cache.size;
  }
}

module.exports = new FileCache();