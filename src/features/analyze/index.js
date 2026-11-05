// src/features/analyze/index.js

const fs = require('fs');
const path = require('path');
const { createIssueCollector } = require('../../core/services/issue-collector');
const { HealthCalculator } = require('../../core/services/health-calculator');
const { saveSnapshot } = require('../../core/services/snapshot-manager');
const { saveAnalysisCache } = require('../../shared/utils/analysis-cache');
const fileCache = require('../../shared/utils/file-cache');

const { resolveEnabledCollectors } = require('./collectors');
const { resolveInstalledVersions } = require('../alerts/version-resolver.service');
const { loadDependencyGraph } = require('../../core/graph');

const { renderDefaultOutput } = require('./renderers/default.renderer');
const { renderDeepOutput } = require('./renderers/deep.renderer');
const { renderJSONOutput } = require('./renderers/json.renderer');

async function runAnalyze(options = {}) {
  const {
    mode = 'default',
    projectPath = process.cwd(),
    json = false,
    saveHistory = true,
    ci = false,
    silent = false,
    ciThreshold = 7.0,
    includeEcosystem = true
  } = options;

  const collector = createIssueCollector();

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found in project directory');
    }

    const packageJson = fileCache.readJSON(packageJsonPath);

    // Ecosystem/predictive checks call GitHub's API; skip in silent/CI runs to keep
    // those paths fast, and let callers opt back in via includeEcosystem.
    const shouldRunEcosystem = includeEcosystem && mode !== 'silent' && !silent;

    // Every enabled collector runs generically — a new check is one
    // collector file plus one entry in collectors/index.js.
    // One dependency graph, read once from the lockfile, shared by the
    // collectors. It reports `incomplete` for pnpm/yarn/bun (and a missing or
    // lockfileVersion 1 lockfile); collectors then fall back to their
    // direct-dependency behavior instead of reporting nothing.
    let graph = null;
    try {
      graph = await loadDependencyGraph(projectPath);
      if (graph.incomplete && process.env.DEBUG) console.error(`Dependency graph unavailable: ${graph.incompleteReason}`);
    } catch (error) {
      if (process.env.DEBUG) console.error('Dependency graph failed to build:', error.message);
    }

    const ctx = { projectPath, packageJson, graph };
    const activeCollectors = resolveEnabledCollectors({ includeEcosystem: shouldRunEcosystem });
    const results = await Promise.allSettled(activeCollectors.map(c => c.run(ctx)));

    const dataById = {};
    results.forEach((result, i) => {
      const collectorDef = activeCollectors[i];
      const data = result.status === 'fulfilled' ? result.value : [];
      dataById[collectorDef.id] = data;
      if (result.status === 'rejected' && process.env.DEBUG) {
        console.error(`${collectorDef.label} collector failed:`, result.reason?.message);
      }
      collectorDef.addTo(collector, data);
    });

    // Show the version that is actually installed, never an advisory's
    // vulnerable range, for findings whose collector didn't report one.
    const installed = await resolveInstalledVersions(projectPath, Object.fromEntries(collector.getPendingNames().map(n => [n, ''])));
    collector.setInstalledVersions(Object.fromEntries(Object.values(installed).filter(v => v.version).map(v => [v.name, v.version])));

    const allIssues = collector.getAll();
    const healthScore = HealthCalculator.calculate(allIssues);
    const totalDependencies = Object.keys({
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    }).length;

    // One generic "scan incomplete" announcement per collector, driven by
    // its own incompleteMessage.
    const incompleteById = {};
    activeCollectors.forEach(collectorDef => {
      const data = dataById[collectorDef.id];
      incompleteById[collectorDef.id] = !!data?.incomplete;
      if (data?.incomplete && !silent && mode !== 'silent') {
        console.error(`\n⚠️  ${collectorDef.label} scan incomplete: ${data.incompleteReason}. ${collectorDef.incompleteMessage}\n`);
      }
    });

    const metadata = {
      projectName: packageJson.name || 'unknown',
      projectVersion: packageJson.version || '1.0.0',
      projectPath,
      projectInfo: `${packageJson.name || 'unknown'}@${packageJson.version || '1.0.0'}`,
      // Kept under their original names for existing --json consumers;
      // scanIncomplete has every collector.
      cveScanIncomplete: !!incompleteById.cve,
      predictiveScanIncomplete: !!incompleteById.predictive,
      securityScanIncomplete: !!incompleteById.security,
      ecosystemScanIncomplete: !!incompleteById.ecosystem,
      outdatedScanIncomplete: !!incompleteById.outdated,
      scanIncomplete: incompleteById,
      healthScore,
      totalDependencies
    };

    saveAnalysisCache({
      issues: allIssues,
      metadata,
      healthScore,
      dependencies: Object.keys({
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      }).map(name => ({ name })),
      projectName: metadata.projectName,
      version: metadata.projectVersion
    }, projectPath);

    if (!silent && mode !== 'silent') {
      if (json) {
        renderJSONOutput(allIssues, metadata);
      } else if (mode === 'deep') {
        renderDeepOutput(allIssues, metadata);
      } else {
        renderDefaultOutput(allIssues, metadata);
      }
    }

    if (saveHistory && !silent && mode !== 'silent') {
      try {
        await saveSnapshot({ issues: allIssues, metadata });
      } catch (error) {
        if (process.env.DEBUG) console.error('Snapshot save failed:', error.message);
      }
    }

    // The caller sets the exit code: calling process.exit() here could cut
    // off piped output, and the status line goes to stderr so that
    // `analyze --ci --json > out.json` stays valid JSON.
    let exitCode = 0;
    if (ci) {
      const passed = healthScore >= ciThreshold;
      exitCode = passed ? 0 : 1;
      if (!silent) {
        console.error(passed
          ? `\n✅ CI Check Passed: Health score ${healthScore.toFixed(1)} meets threshold ${ciThreshold}\n`
          : `\n❌ CI Check Failed: Health score ${healthScore.toFixed(1)} is below threshold ${ciThreshold}\n`);
      }
    }

    return { issues: allIssues, metadata, healthScore, exitCode };

  } catch (error) {
    if (!silent && mode !== 'silent') console.error('Analysis failed:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    // The caller (the CLI's catch block, or `fix`) decides how to react.
    throw error;
  }
}

module.exports = { runAnalyze };