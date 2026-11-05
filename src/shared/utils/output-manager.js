// src/shared/utils/output-manager.js

const fs = require('fs');
const path = require('path');

class OutputManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.baseDir = path.join(projectPath, '.devcompass');
    this.directories = {
      root: this.baseDir,
      cache: path.join(this.baseDir, 'cache'),
      // Backups actually live in <project>/.devcompass-backups/ (see
      // backup-manager.js / backup-restorer.js) — a separate top-level
      // folder, not <project>/.devcompass/backups/. This used to point at
      // the wrong, unwritten folder, so `clean --backups` cleaned nothing.
      backups: path.join(projectPath, '.devcompass-backups'),
      graphs: path.join(this.baseDir, 'graphs'),
      reports: path.join(this.baseDir, 'reports'),
      exports: path.join(this.baseDir, 'exports'),
      temp: path.join(this.baseDir, 'temp')
    };
  }

  // Create only the folder that is actually being written to, and never edit
  // the user's .gitignore (commands print a one-line tip instead).
  getPath(type, filename = '') {
    const dir = this.directories[type] || this.directories.root;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return filename ? path.join(dir, filename) : dir;
  }

  getCachePath(filename = '') { return this.getPath('cache', filename); }
  getBackupPath(filename = '') { return this.getPath('backups', filename); }
  getGraphPath(filename = '') { return this.getPath('graphs', filename); }
  getReportPath(filename = '') { return this.getPath('reports', filename); }
  getExportPath(filename = '') { return this.getPath('exports', filename); }
  getTempPath(filename = '') { return this.getPath('temp', filename); }

  getRelativePath(absolutePath) { return path.relative(this.projectPath, absolutePath); }

  // Checks only — getPath() creates the directory it returns, so using it
  // here would make every existence check create the very directory it's
  // supposed to be testing for.
  exists(type, filename = '') {
    const dir = this.directories[type] || this.directories.root;
    return fs.existsSync(filename ? path.join(dir, filename) : dir);
  }

  list(type) {
    const dir = this.directories[type];
    if (!fs.existsSync(dir)) return [];
    try {
      return fs.readdirSync(dir).map(file => {
        const filePath = path.join(dir, file);
        return { name: file, path: filePath, relativePath: path.relative(this.projectPath, filePath), stats: fs.statSync(filePath) };
      });
    } catch (error) { return []; }
  }

  getSize(type) { return this.list(type).reduce((total, file) => file.stats.isDirectory() ? total : total + file.stats.size, 0); }

  getSummary() {
    return {
      baseDir: this.baseDir,
      relativePath: path.relative(this.projectPath, this.baseDir),
      directories: Object.keys(this.directories).map(type => ({
        type,
        path: this.directories[type],
        exists: fs.existsSync(this.directories[type]),
        files: this.list(type).length,
        size: this.getSize(type)
      }))
    };
  }
}

let tipShown = false;

// Commands that write into <project>/.devcompass/ or <project>/.devcompass-backups/
// (graph, backup, reports) call this after writing, instead of editing the
// user's .gitignore themselves (C-11). Prints at most once per process run.
function printGitignoreTipIfNeeded(projectPath) {
  if (tipShown) return;
  try {
    const gitignorePath = path.join(projectPath, '.gitignore');
    const content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (content.includes('.devcompass')) return;
    tipShown = true;
    // eslint-disable-next-line no-console
    console.error('\n💡 Tip: add .devcompass/ and .devcompass-backups/ to your .gitignore\n');
  } catch (error) { /* silent */ }
}

module.exports = OutputManager;
module.exports.printGitignoreTipIfNeeded = printGitignoreTipIfNeeded;