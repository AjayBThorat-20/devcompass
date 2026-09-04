// src/features/fix/migrations/registry.js
//
// Deterministic, hand-verified codemods for known breaking API changes.
// Kept intentionally small — every entry here is a real, well-documented
// breaking change with a transform that's been checked against sample code.
// Anything not listed here falls back to the configured AI provider
// (see ai-migrator.js), which is why this list doesn't need to be exhaustive.

const REGISTRY = {
  uuid: [
    {
      // uuid v3.x deep-imported each generator from its own subpath; v7.x
      // (and everything since v8) exports them as named exports of the
      // package root instead. https://github.com/uuidjs/uuid/blob/main/CHANGELOG.md
      minFromMajor: 1,
      maxFromMajor: 3,
      minToMajor: 8,
      description: "uuid v8+ dropped the 'uuid/v4'-style deep imports in favor of named exports",
      transform(content) {
        let changed = false;
        let next = content;

        // require('uuid/v4') / require("uuid/v1") assigned to a variable
        next = next.replace(
          /(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]uuid\/(v[1345])['"]\s*\)\s*;?/g,
          (match, decl, varName, fn) => { changed = true; return `${decl} { ${fn}: ${varName} } = require('uuid');`; }
        );

        // import uuidv4 from 'uuid/v4'
        next = next.replace(
          /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]uuid\/(v[1345])['"]\s*;?/g,
          (match, varName, fn) => { changed = true; return `import { ${fn} as ${varName} } from 'uuid';`; }
        );

        return changed ? next : null;
      }
    }
  ]
};

function findBuiltInTransform(packageName, fromVersion, toVersion) {
  const entries = REGISTRY[packageName];
  if (!entries) return null;

  const semver = require('semver');
  const from = semver.coerce(fromVersion);
  const to = semver.coerce(toVersion);
  if (!from || !to) return null;

  const fromMajor = semver.major(from);
  const toMajor = semver.major(to);

  return entries.find(entry =>
    fromMajor >= entry.minFromMajor &&
    fromMajor <= entry.maxFromMajor &&
    toMajor >= entry.minToMajor
  ) || null;
}

module.exports = { REGISTRY, findBuiltInTransform };
