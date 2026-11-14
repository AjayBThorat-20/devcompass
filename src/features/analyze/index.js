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
const { loadDependencyGraph, listInstallScripts } = require('../../core/graph');
const { loadProjectConfig, applyIgnores, matchesIgnoreEntry, isIgnoreExpired } = require('../../core/config/project-config');
const { evaluatePolicy, validateFailOn, EXIT_CODES } = require('../../core/services/policy-gate');
const { loadBaseline, applyBaseline, BASELINE_FILENAME } = require('../../core/services/baseline');
const logger = require('../../shared/utils/logger').default;

const { renderDefaultOutput } = require('./renderers/default.renderer');
const { renderDeepOutput } = require('./renderers/deep.renderer');
const { renderJSONOutput } = require('./renderers/json.renderer');
const { renderSarifOutput } = require('./renderers/sarif.renderer');
const { renderMarkdownOutput } = require('./renderers/markdown.renderer');

async function runAnalyze(options = {}) {
  const {
    mode = 'default',
    projectPath = process.cwd(),
    json = false,
    format = null, // 'json' | 'sarif' | 'markdown' | null (console)
    saveHistory = true,
    ci = false,
    silent = false,
    ciThreshold = 7.0,
    // The ecosystem/predictive checks call GitHub's API (60 requests an hour
    // without a token) and are off unless asked for: --ecosystem, or
    // devcompass.config.json's checks.<id>.enabled.
    includeEcosystem = false,
    // Skip every check that needs the network.
    offline = false,
    // Policy gates. A flag wins over devcompass.config.json's failOn, which
    // wins over no gate at all.
    failOn = null,
    failOnLicenses = null,
    onlyDirect = false,
    failOnIncomplete = false,
    // Only findings missing from a previously-saved baseline can fail the
    // policy gate.
    baseline = false
  } = options;

  const outputFormat = format || (json ? 'json' : 'console');
  const collector = createIssueCollector();

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found in project directory');
    }

    const packageJson = fileCache.readJSON(packageJsonPath);
    const quiet = silent || mode === 'silent';

    // Validated before any network call, so a typo fails fast instead of
    // after a full scan (or, worse, matching every finding).
    const projectConfig = loadProjectConfig(projectPath);
    const effectiveFailOn = validateFailOn(failOn) || projectConfig.failOn.severity;
    const effectiveFailOnLicenses = failOnLicenses && failOnLicenses.length > 0 ? failOnLicenses : projectConfig.failOn.licenses;
    const policyConfigured = !!effectiveFailOn || effectiveFailOnLicenses.length > 0;

    // Still skipped in silent runs (`fix`, `graph`), which only need the score.
    const wantsEcosystem = includeEcosystem && !quiet;

    // Every enabled collector runs generically — a new check is one
    // collector file plus one entry in collectors/index.js.
    // One dependency graph, read once from the lockfile, shared by the
    // collectors. It reports `incomplete` for pnpm/yarn/bun (and a missing or
    // lockfileVersion 1 lockfile); collectors then fall back to their
    // direct-dependency behavior instead of reporting nothing.
    let graph = null;
    try {
      graph = await loadDependencyGraph(projectPath);
      if (graph.incomplete) logger.debug(`Dependency graph unavailable: ${graph.incompleteReason}`);
    } catch (error) {
      logger.debug('Dependency graph failed to build:', error.message);
    }

    const ctx = { projectPath, packageJson, graph };
    const wantedCollectors = resolveEnabledCollectors({ checksConfig: projectConfig.checks, includeEcosystem: wantsEcosystem });
    const activeCollectors = resolveEnabledCollectors({ checksConfig: projectConfig.checks, includeEcosystem: wantsEcosystem, offline });
    const skippedOffline = wantedCollectors.filter(c => !activeCollectors.includes(c)).map(c => c.id);
    if (skippedOffline.length > 0 && !quiet) {
      console.error(`\nℹ️  Offline: skipped the ${skippedOffline.join(', ')} check${skippedOffline.length > 1 ? 's' : ''}${skippedOffline.includes('cve') ? ' — vulnerabilities were not checked' : ''}.\n`);
    }
    const results = await Promise.allSettled(activeCollectors.map(c => c.run(ctx)));

    const dataById = {};
    results.forEach((result, i) => {
      const collectorDef = activeCollectors[i];
      const data = result.status === 'fulfilled' ? result.value : [];
      dataById[collectorDef.id] = data;
      if (result.status === 'rejected') logger.debug(`${collectorDef.label} collector failed:`, result.reason?.message);
      collectorDef.addTo(collector, data);
    });

    // Show the version that is actually installed, never an advisory's
    // vulnerable range, for findings whose collector didn't report one.
    // node_modules first, then the lockfile — CI often runs before `npm ci`.
    const installed = await resolveInstalledVersions(projectPath, Object.fromEntries(collector.getPendingNames().map(n => [n, ''])));
    collector.setInstalledVersions({
      ...topLevelVersions(graph),
      ...Object.fromEntries(Object.values(installed).filter(v => v.version).map(v => [v.name, v.version]))
    });

    // An ignore is an accepted risk, so it's removed before scoring, not just
    // hidden from the printed list. An expired one puts its finding back, so
    // accepted risks get reviewed again instead of staying hidden forever.
    const { kept: allIssues, ignored: ignoredIssues, expired: expiredIgnores } = applyIgnores(collector.getAll(), projectConfig);
    if (expiredIgnores.length > 0 && !quiet) {
      console.error(`\n⚠️  ${expiredIgnores.length} ignore(s) in devcompass.config.json have expired — their finding(s) are back in this report.\n`);
    }

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
      if (data?.incomplete && !quiet) {
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
      totalDependencies,
      // Informational only, never scored (see listInstallScripts).
      installScripts: listInstallScripts(graph),
      ignoredCount: ignoredIssues.length,
      skippedChecks: skippedOffline
    };

    // Baseline mode never hides findings — the report (JSON/SARIF included)
    // still shows all of them — it only changes which ones can fail the
    // policy gate.
    const baselineData = baseline ? loadBaseline(projectPath) : null;
    const { known: knownIssues, new: newIssues } = applyBaseline(allIssues, baselineData);
    if (baseline && !baselineData && !quiet) {
      console.error(`\n⚠️  --baseline is set but there's no ${BASELINE_FILENAME} yet (run \`devcompass baseline save\`), so every finding counts as new.\n`);
    }
    metadata.baseline = baseline
      ? { savedAt: baselineData?.savedAt || null, knownCount: knownIssues.length, newCount: newIssues.length, newIds: newIssues.map(issue => issue.id) }
      : null;

    // Evaluated before rendering so --json output carries the result.
    let policyResult = null;
    if (policyConfigured) {
      const activeIgnores = projectConfig.ignore.filter(entry => !isIgnoreExpired(entry));
      // The license gate checks every installed package's license from the
      // lockfile (so it works offline and covers the whole tree), minus
      // anything an ignore entry covers.
      const packages = graph && !graph.incomplete
        ? Array.from(graph.nodes.values())
          .filter(node => !activeIgnores.some(entry => matchesIgnoreEntry(entry, { id: `license:${node.name}@${node.version}`, name: node.name, type: 'license', ruleId: 'license' })))
          .map(node => ({ name: node.name, version: node.version, license: node.license, direct: node.direct }))
        : null;
      // With --baseline, only findings missing from the saved snapshot can
      // fail the gate — known ones are still shown, just not gating.
      policyResult = evaluatePolicy(baseline ? newIssues : allIssues, {
        failOn: effectiveFailOn,
        failOnLicenses: effectiveFailOnLicenses,
        onlyDirect,
        directDependencies: new Set(Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies, ...packageJson.optionalDependencies })),
        packages,
        // A check that didn't run (offline) is as unknown as one that failed.
        incomplete: Object.values(incompleteById).some(Boolean) || skippedOffline.length > 0,
        failOnIncomplete
      });
      metadata.policy = {
        failOn: effectiveFailOn,
        failOnLicenses: effectiveFailOnLicenses,
        onlyDirect,
        matched: policyResult.matched.map(describeMatch),
        exitCode: policyResult.exitCode
      };
    }

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
      if (outputFormat === 'json') {
        renderJSONOutput(allIssues, metadata);
      } else if (outputFormat === 'sarif') {
        renderSarifOutput(allIssues, metadata);
      } else if (outputFormat === 'markdown') {
        renderMarkdownOutput(allIssues, metadata);
      } else if (mode === 'deep') {
        renderDeepOutput(allIssues, metadata);
      } else {
        renderDefaultOutput(allIssues, metadata);
        if (baselineData) console.log(`📌 Baseline (${baselineData.savedAt.slice(0, 10)}): ${knownIssues.length} known, ${newIssues.length} new\n`);
      }
    }

    if (saveHistory && !silent && mode !== 'silent') {
      try {
        await saveSnapshot({ issues: allIssues, metadata });
      } catch (error) {
        logger.debug('Snapshot save failed:', error.message);
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

    if (policyResult) {
      if (policyResult.exitCode !== EXIT_CODES.PASS) exitCode = policyResult.exitCode;
      if (!silent) printPolicyResult(policyResult, metadata.policy, skippedOffline);
    }

    return { issues: allIssues, metadata, healthScore, exitCode };

  } catch (error) {
    logger.debug(error.stack);
    // The caller (the CLI's catch block, or `fix`) reports it and decides
    // how to react.
    throw error;
  }
}

// name -> version for each top-level (node_modules/<name>) lockfile entry.
function topLevelVersions(graph) {
  if (!graph || graph.incomplete) return {};
  const versions = {};
  for (const node of graph.nodes.values()) {
    if (node.paths.includes(`node_modules/${node.name}`)) versions[node.name] = node.version;
  }
  return versions;
}

function describeMatch(match) {
  const reason = match.matchedBy === 'license'
    ? `${match.metadata?.license || 'unknown'} license`
    : `${match.severity} ${match.type}${match.metadata?.knownExploited ? ' (known exploited)' : ''}`;
  return { id: match.id || null, package: match.name, version: match.version, reason };
}

function printPolicyResult(result, policy, skippedChecks) {
  const rules = [
    policy.failOn ? `--fail-on ${policy.failOn}` : null,
    policy.failOnLicenses.length > 0 ? `--fail-on-license ${policy.failOnLicenses.join(',')}` : null
  ].filter(Boolean).join(', ');

  if (result.exitCode === EXIT_CODES.INCOMPLETE) {
    console.error(`\n❌ Policy check incomplete (${rules}): the scan didn't finish${skippedChecks.length > 0 ? ` (offline: ${skippedChecks.join(', ')} skipped)` : ''}, and --fail-on-incomplete is set\n`);
    return;
  }
  if (result.exitCode === EXIT_CODES.PASS) {
    const caveat = skippedChecks.length > 0 ? ` — but ${skippedChecks.join(', ')} didn't run (offline)` : '';
    console.error(`\n✅ Policy check passed (${rules})${caveat}\n`);
    return;
  }
  console.error(`\n❌ Policy check failed (${rules}): ${policy.matched.length} finding(s)`);
  policy.matched.slice(0, 20).forEach(m => console.error(`   - ${m.package}@${m.version}: ${m.reason}`));
  if (policy.matched.length > 20) console.error(`   ... and ${policy.matched.length - 20} more (see --json)`);
  console.error('');
}

module.exports = { runAnalyze };