const readline = require('readline');
const { createFixPlan } = require('./planners/fix-planner');
const { BackupExecutor } = require('./executors/backup-executor');
const { FixExecutor } = require('./executors/fix-executor');
const { renderFixPreview, renderConfirmation } = require('./renderers/preview-renderer');
const { ProgressRenderer } = require('./renderers/progress-renderer');
const { renderFixResult } = require('./renderers/result-renderer');
const { runAnalyze } = require('../analyze');

async function runFix(options = {}) {
  const {
    mode = 'safe',
    projectPath = process.cwd(),
    skipConfirm = false,
    dryRun = false,
    batch = false,
    batchMode = null,
    only = null,
    skip = null,
    verbose = false
  } = options;

  try {
    if (batch || batchMode || only || skip) {
      console.log('\n⚠️  Batch mode features are not yet available in v3.2.5');
      console.log('Use standard fix mode or run v3.2.4 for batch features\n');
      console.log('Standard fix usage:');
      console.log('  devcompass fix          # Safe fixes with preview');
      console.log('  devcompass fix --all    # Include risky fixes');
      console.log('  devcompass fix --yes    # Skip confirmation\n');
      return;
    }

    const analysisResult = await runAnalyze({ 
      projectPath, 
      mode: 'silent',
      silent: true,
      json: false,
      saveHistory: false
    });

    const beforeScore = analysisResult.healthScore;
    const issues = analysisResult.issues;

    if (issues.length === 0) {
      console.log('\n✅ No issues to fix!\n');
      return;
    }

    const plan = createFixPlan(issues);

    renderFixPreview(plan, mode);

    if (dryRun) {
      console.log('\n🔍 Dry run mode - no changes made\n');
      return;
    }

    const actions = mode === 'all' 
      ? [...plan.safe, ...plan.moderate, ...plan.risky]
      : plan.safe;
    
    if (actions.length === 0) {
      return;
    }

    if (!skipConfirm) {
      renderConfirmation();
      const confirmed = await confirmFix();
      
      if (!confirmed) {
        console.log('\n❌ Fix cancelled\n');
        return;
      }
    }

    const backupExecutor = new BackupExecutor(projectPath);
    console.log('\n💾 Creating backup...');
    
    const backupResult = await backupExecutor.createBackup({
      mode,
      issueCount: issues.length
    });

    if (backupResult.success) {
      console.log(`✔ Backup saved: ${backupResult.path}\n`);
    } else {
      console.error('⚠️  Backup failed:', backupResult.error);
      console.log('Continue anyway? (y/N)');
      const continueAnyway = await confirmFix();
      if (!continueAnyway) {
        console.log('\n❌ Fix cancelled\n');
        return;
      }
    }

    const executor = new FixExecutor(projectPath);
    const progress = new ProgressRenderer();

    progress.start(actions.length);

    for (const action of actions) {
      const result = await executor.executeAction(action);
      progress.updateAction(action, result.success);
    }

    progress.finish();
    progress.complete();

    const afterAnalysis = await runAnalyze({ 
      projectPath, 
      mode: 'silent',
      silent: true,
      json: false,
      saveHistory: false
    });
    const afterScore = afterAnalysis.healthScore;

    renderFixResult(executor, beforeScore, afterScore);

  } catch (error) {
    console.error('Fix failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function confirmFix() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('> ', (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '');
    });
  });
}

module.exports = { runFix };
