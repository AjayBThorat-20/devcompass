// src/features/analyze/index.js

const fs = require('fs');
const path = require('path');
const { createIssueCollector } = require('../../core/services/issue-collector');
const { HealthCalculator } = require('../../core/services/health-calculator');
const { saveSnapshot } = require('../../core/services/snapshot-manager');
const { saveAnalysisCache } = require('../../shared/utils/analysis-cache');
const fileCache = require('../../shared/utils/file-cache');
const OutputManager = require('../../shared/utils/output-manager');

const { collectCVEData } = require('./collectors/cve.collector');
const { collectLicenseData } = require('./collectors/license.collector');
const { collectQualityData } = require('./collectors/quality.collector');
const { collectSecurityData } = require('./collectors/security.collector');
const { collectOutdatedData, collectUnusedData } = require('./collectors/dependency.collector');
const { collectEcosystemData } = require('./collectors/ecosystem.collector');
const { collectPredictiveData } = require('./collectors/predictive.collector');

const { renderDefaultOutput } = require('./renderers/default.renderer');
const { renderDeepOutput } = require('./renderers/deep.renderer');
const { renderJSONOutput } = require('./renderers/json.renderer');

async function runAnalyze(options = {}) {
  const {
    mode = 'default',
    projectPath = process.cwd(),
    json = false,
    aiEnabled = false,
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

    const collectorTasks = [
      collectCVEData(projectPath, packageJson),
      collectLicenseData(projectPath, packageJson),
      collectQualityData(projectPath, packageJson),
      collectSecurityData(projectPath, packageJson),
      collectOutdatedData(projectPath, packageJson),
      collectUnusedData(projectPath, packageJson)
    ];

    // Ecosystem/predictive checks call GitHub's API; skip in silent/CI runs to keep
    // those paths fast, and let callers opt back in via includeEcosystem.
    const shouldRunEcosystem = includeEcosystem && mode !== 'silent' && !silent;

    if (shouldRunEcosystem) {
      collectorTasks.push(collectEcosystemData(projectPath, packageJson));
      collectorTasks.push(collectPredictiveData(projectPath, packageJson));
    }

    const results = await Promise.allSettled(collectorTasks);

    const [cveData, licenseData, qualityData, securityData, outdatedData, unusedData, ecosystemData, predictiveData] =
      results.map(result => (result.status === 'fulfilled' ? result.value : []));

    if (process.env.DEBUG) {
      const names = ['CVE', 'License', 'Quality', 'Security', 'Outdated', 'Unused', 'Ecosystem', 'Predictive'];
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`${names[i]} collector failed:`, r.reason?.message);
      });
    }

    collector.addCVEIssues(cveData);
    collector.addLicenseIssues(licenseData);
    collector.addQualityIssues(qualityData);
    collector.addSecurityIssues(securityData);
    collector.addOutdatedIssues(outdatedData);
    collector.addUnusedIssues(unusedData);
    if (shouldRunEcosystem) {
      collector.addEcosystemIssues(ecosystemData);
      collector.addPredictiveIssues(predictiveData);
    }

    const allIssues = collector.getAll();
    const healthScore = HealthCalculator.calculate(allIssues);
    const totalDependencies = Object.keys({
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    }).length;

    if (cveData?.incomplete && !silent && mode !== 'silent') {
      console.error(`\n⚠️  CVE scan incomplete: ${cveData.incompleteReason}. Vulnerability results below may be missing entries — this is not a confirmed clean scan.\n`);
    }

    if (predictiveData?.incomplete && !silent && mode !== 'silent') {
      console.error(`\n⚠️  Predictive scan incomplete: ${predictiveData.incompleteReason}. Bug-activity warnings below may be missing entries for those packages.\n`);
    }

    if (securityData?.incomplete && !silent && mode !== 'silent') {
      console.error(`\n⚠️  Security scan incomplete: ${securityData.incompleteReason}. Vulnerability/supply-chain warnings below may be missing entries — this is not a confirmed clean scan.\n`);
    }

    if (shouldRunEcosystem && ecosystemData?.incomplete && !silent && mode !== 'silent') {
      console.error(`\n⚠️  Ecosystem scan incomplete: ${ecosystemData.incompleteReason}. Ecosystem alerts below may be missing entries.\n`);
    }

    const metadata = {
      projectName: packageJson.name || 'unknown',
      projectVersion: packageJson.version || '1.0.0',
      projectPath,
      projectInfo: `${packageJson.name || 'unknown'}@${packageJson.version || '1.0.0'}`,
      cveScanIncomplete: !!cveData?.incomplete,
      predictiveScanIncomplete: !!predictiveData?.incomplete,
      securityScanIncomplete: !!securityData?.incomplete,
      ecosystemScanIncomplete: !!(shouldRunEcosystem && ecosystemData?.incomplete),
      healthScore,
      totalDependencies,
      aiInsight: aiEnabled ? await generateAIInsight(allIssues) : null
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

async function generateAIInsight(issues) {
  if (!issues || issues.length === 0) return 'Your project has no detected issues.';
  const critical = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
  if (critical.length === 0) return 'Your project has minor issues that can be addressed over time.';
  return `Your main risk comes from ${critical.length} high-severity issue(s). Fixing ${critical[0].name} will significantly improve security.`;
}

module.exports = { runAnalyze };