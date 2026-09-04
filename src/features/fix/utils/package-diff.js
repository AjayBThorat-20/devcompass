// src/features/fix/utils/package-diff.js

const fs = require('fs');
const path = require('path');

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function loadPackageJson(projectPath) {
  try {
    const raw = fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function findDependencyField(pkgJson, packageName) {
  if (!pkgJson) return null;
  for (const field of DEPENDENCY_FIELDS) {
    if (pkgJson[field] && Object.prototype.hasOwnProperty.call(pkgJson[field], packageName)) {
      return field;
    }
  }
  return null;
}

function rangePrefix(range) {
  const match = typeof range === 'string' && range.match(/^[\^~]/);
  return match ? match[0] : '^';
}

// Builds a git-style +/- diff of what package.json will look like after the
// planned actions are applied, so a dev can review the exact in-place change
// before it's written for real (npm install/uninstall run against the project).
function buildDiffEntries(actions, projectPath) {
  const pkgJson = loadPackageJson(projectPath);
  const entries = [];
  const indirect = [];

  for (const action of actions) {
    if (!['update', 'remove', 'replace'].includes(action.action)) continue;

    // Packages flagged as vulnerable/unused can be transitive (not listed
    // directly in package.json) — those get fixed via npm install/uninstall
    // resolving the tree, not by a package.json line edit, so they're
    // reported separately instead of faked into a "dependencies" entry.
    const field = findDependencyField(pkgJson, action.package);
    if (!field) {
      indirect.push(action.package);
      continue;
    }

    const currentRange = pkgJson[field][action.package];
    const removed = `"${action.package}": "${currentRange}"`;

    if (action.action === 'update') {
      const targetRange = action.targetVersion === 'latest'
        ? action.targetVersion
        : `${rangePrefix(currentRange)}${action.targetVersion}`;
      entries.push({ field, package: action.package, removed, added: `"${action.package}": "${targetRange}"` });
    } else if (action.action === 'remove') {
      entries.push({ field, package: action.package, removed, added: null });
    } else if (action.action === 'replace') {
      const replacement = action.metadata?.alternative?.replacement || action.metadata?.alternative || action.to;
      entries.push({
        field,
        package: action.package,
        removed,
        added: replacement ? `"${replacement}": "latest"` : null
      });
    }
  }

  return { entries, indirect };
}

module.exports = { buildDiffEntries, loadPackageJson, findDependencyField };
