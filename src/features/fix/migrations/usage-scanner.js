// src/features/fix/migrations/usage-scanner.js

const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set(['node_modules', '.git', '.devcompass-backups', 'dist', 'build', 'coverage', '.next', 'out', '.cache']);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const MAX_FILES_SCANNED = 5000;
const MAX_FILE_SIZE_BYTES = 512 * 1024; // skip bundled/minified files

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildUsageRegex(packageName) {
  const escaped = escapeRegExp(packageName);
  // Matches require('pkg'), require('pkg/sub/path'), and static/dynamic
  // import ... from 'pkg' — bounded so "pkg-extra" doesn't match "pkg".
  return new RegExp(`(require\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\)|from\\s+['"]${escaped}(?:/[^'"]*)?['"])`);
}

// Walks the project (skipping node_modules/build output/backups) and returns
// absolute paths of source files that reference `packageName` via require()
// or an import statement. Best-effort text scan, not a real module resolver —
// good enough to find migration candidates, not a substitute for a bundler.
function findPackageUsages(projectPath, packageName) {
  const regex = buildUsageRegex(packageName);
  const matches = [];
  let scanned = 0;

  function walk(dir) {
    if (scanned >= MAX_FILES_SCANNED) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const entry of entries) {
      if (scanned >= MAX_FILES_SCANNED) return;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;

      scanned++;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE_BYTES) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        if (regex.test(content)) matches.push(fullPath);
      } catch (error) {
        // unreadable file — skip
      }
    }
  }

  walk(projectPath);
  return matches;
}

module.exports = { findPackageUsages, buildUsageRegex };
