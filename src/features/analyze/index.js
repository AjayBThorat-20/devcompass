// src/features/analyze/index.js

const fs = require('fs');
const path = require('path');
const { createIssueCollector } = require('../../core/services/issue-collector');
const { HealthCalculator } = require('../../core/services/health-calculator');
const { saveSnapshot } = require('../../core/services/snapshot-manager');
const { saveAnalysisCache } = require('../../shared/utils/analysis-cache');
const fileCache = require('../../shared/utils/file-cache');
const OutputManager = require('../../shared/utils/output-manager');

const { resolveEnabledCollectors } = require('./collectors');
const { resolveInstalledVersions } = require('../alerts/version-resolver.service');

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

  const outputManager = new OutputManager(projectPath);
  outputManager.ensureDirectories();

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
    const ctx = { projectPath, packageJson };
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

    if (ci) {
      if (healthScore < ciThreshold) {
        if (!silent) console.error(`\n❌ CI Check Failed: Health score ${healthScore.toFixed(1)} is below threshold ${ciThreshold}\n`);
        process.exit(1);
      } else {
        if (!silent) console.log(`\n✅ CI Check Passed: Health score ${healthScore.toFixed(1)} meets threshold ${ciThreshold}\n`);
        process.exit(0);
      }
    }

    return { issues: allIssues, metadata, healthScore };

  } catch (error) {
    if (!silent && mode !== 'silent') console.error('Analysis failed:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    if (ci) process.exit(1);
    throw error;
  }
}

module.exports = { runAnalyze };