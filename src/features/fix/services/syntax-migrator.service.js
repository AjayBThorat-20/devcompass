// src/features/fix/services/syntax-migrator.service.js

const fs = require('fs');
const semver = require('semver');
const { findBuiltInTransform } = require('../migrations/registry');
const { findPackageUsages } = require('../migrations/usage-scanner');
const { migrateWithAI } = require('../migrations/ai-migrator');

function isMajorBump(currentVersion, targetVersion) {
  const current = semver.coerce(currentVersion);
  const target = semver.coerce(targetVersion);
  if (!current || !target) return false;
  return semver.major(target) > semver.major(current);
}

// For every 'update' action that crosses a major version boundary, finds
// where the package is used in source and rewrites the call-sites: a
// built-in codemod when one is registered, otherwise the configured AI
// provider. Every file rewritten is snapshotted into `session` first so
// `devcompass fix undo` can revert it. Returns a summary for the CLI to
// print — this never throws; per-file failures are collected, not fatal.
async function migrateSyntax(actions, { projectPath, session, getAIProvider }) {
  const result = { migrated: [], skipped: [], errors: [] };

  const majorBumps = (actions || []).filter(a => a.action === 'update' && isMajorBump(a.currentVersion, a.targetVersion));
  if (majorBumps.length === 0) return result;

  let aiProvider;
  let aiUnavailableReason = null;
  const resolveAIProvider = () => {
    if (aiProvider !== undefined) return aiProvider;
    try {
      aiProvider = getAIProvider();
    } catch (error) {
      aiProvider = null;
      aiUnavailableReason = error.message;
    }
    return aiProvider;
  };

  for (const action of majorBumps) {
    const usageFiles = findPackageUsages(projectPath, action.package);
    if (usageFiles.length === 0) continue;

    const builtIn = findBuiltInTransform(action.package, action.currentVersion, action.targetVersion);

    for (const file of usageFiles) {
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch (error) {
        result.errors.push({ file, package: action.package, error: `Could not read file: ${error.message}` });
        continue;
      }

      let newContent = null;
      let via = null;

      if (builtIn) {
        try {
          newContent = builtIn.transform(content);
          if (newContent) via = 'built-in';
        } catch (error) {
          result.errors.push({ file, package: action.package, error: `Built-in codemod failed: ${error.message}` });
        }
      }

      if (!newContent) {
        const provider = resolveAIProvider();
        if (!provider) {
          result.skipped.push({ file, package: action.package, reason: aiUnavailableReason || 'No AI provider configured (devcompass llm add) — manual review needed' });
          continue;
        }

        const aiResult = await migrateWithAI({
          provider,
          packageName: action.package,
          fromVersion: action.currentVersion,
          toVersion: action.targetVersion,
          filePath: file,
          content
        });

        if (!aiResult.success) {
          result.skipped.push({ file, package: action.package, reason: aiResult.reason });
          continue;
        }
        newContent = aiResult.content;
        via = 'ai';
      }

      if (!newContent || newContent === content) {
        result.skipped.push({ file, package: action.package, reason: 'No syntax change needed' });
        continue;
      }

      session.snapshotFile(file);
      try {
        fs.writeFileSync(file, newContent, 'utf8');
        result.migrated.push({ file, package: action.package, via });
      } catch (error) {
        result.errors.push({ file, package: action.package, error: `Could not write file: ${error.message}` });
      }
    }
  }

  return result;
}

module.exports = { migrateSyntax, isMajorBump };
