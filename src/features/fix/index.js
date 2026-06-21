// src/features/fix/index.js

const readline = require('readline');
const { createFixPlan } = require('./planners/fix.planner');
const { BackupExecutor } = require('./executors/backup.executor');
const { FixExecutor } = require('./executors/fix.executor');
const { renderFixPreview, renderConfirmation } = require('./renderers/preview.renderer');
const { ProgressRenderer } = require('./renderers/progress.renderer');
const { renderFixResult } = require('./renderers/result.renderer');
const { runAnalyze } = require('../analyze');
const processManager = require('../../shared/utils/process-manager');

async function runFix(options = {}) {
  const {
    mode = 'safe',
    projectPath = process.cwd(),
    skipConfirm = false,
    dryRun = false,
    preview = false,
    batch = false,
    batchMode = null,
    only = null,
    skip = null
  } = options;

  if (preview && !dryRun) options.dryRun = true;

  if (batch || batchMode || only || skip) {
    console.log('\n⚠️  Batch mode features are not yet available in v3.2.6');
    console.log('Use standard fix mode:\n  devcompass fix\n  devcompass fix --all\n  devcompass fix --yes\n');
    return;
  }

  try {
const analysisResult = await runAnalyze({ projectPath, mode: 'silent', silent: true, json: false, saveHistory: false });
const beforeScore = analysisResult.healthScore;
    const issues = analysisResult.issues;

    if (!issues || issues.length === 0) {
      console.log('\n✅ No issues to fix!\n');
      return;
    }

    const plan = createFixPlan(issues);
    renderFixPreview(plan, mode);

    if (dryRun || preview) {
      console.log('\n🔍 Preview mode enabled\n');
      const actions = mode === 'all'
        ? [...plan.safe, ...plan.moderate, ...plan.risky]
        : plan.safe;

      const BatchReporter = require('../../shared/utils/batch-reporter');
      const reporter = new BatchReporter(projectPath);
      reporter.renderPreview({ operations: actions.map(a => ({ package: a.package || a.name || 'unknown', type: a.type || 'update', from: a.current || null, to: a.latest || null })) });
      return;
    }

    const actions = mode === 'all'
      ? [...plan.safe, ...plan.moderate, ...plan.risky]
      : plan.safe;

    if (actions.length === 0) return;

    if (!skipConfirm) {
      renderConfirmation();
      const confirmed = await confirmFix();
      if (!confirmed) { console.log('\n❌ Fix cancelled\n'); return; }
    }

    const backupExecutor = new BackupExecutor(projectPath);
    console.log('\n💾 Creating backup...');
    const backupResult = await backupExecutor.createBackup({ mode, issueCount: issues.length });

    if (backupResult.success) {
      console.log(`✔ Backup saved: ${backupResult.path}\n`);
    } else {
      console.error('⚠️  Backup failed:', backupResult.error);
      const cont = await confirmFix();
      if (!cont) { console.log('\n❌ Fix cancelled\n'); return; }
    }

    const executor = new FixExecutor(projectPath);
    const progress = new ProgressRenderer();
    progress.start(actions.length);

    await executor.executeActions(actions, (action, success) => {
      progress.updateAction(action, success);
    });

    progress.finish();
    progress.complete();
    await processManager.killAll();

    const afterAnalysis = await runAnalyze({ projectPath, mode: 'silent', silent: true, json: false, saveHistory: false });
    renderFixResult(executor, beforeScore, afterAnalysis.healthScore);

  } catch (error) {
    console.error('Fix failed:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    await processManager.killAll();
    process.exit(1);
  }
}

async function confirmFix() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      const n = answer.toLowerCase().trim();
      resolve(n === 'y' || n === 'yes' || n === '');
    });
  });
}

module.exports = { runFix };