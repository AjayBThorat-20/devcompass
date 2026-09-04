// src/features/fix/index.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const { createFixPlan } = require('./planners/fix.planner');
const { BackupExecutor } = require('./executors/backup.executor');
const { FixExecutor } = require('./executors/fix.executor');
const { renderFixPreview, renderConfirmation } = require('./renderers/preview.renderer');
const { ProgressRenderer } = require('./renderers/progress.renderer');
const { renderFixResult } = require('./renderers/result.renderer');
const { renderMigrationSummary } = require('./renderers/migration.renderer');
const { migrateSyntax } = require('./services/syntax-migrator.service');
const { FixSessionManager, restoreLatestSession } = require('./services/fix-session.service');
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
    skip = null,
    migrateSyntax: migrateSyntaxEnabled = false
  } = options;

  if (batch || batchMode || only || skip) {
    console.log('\n⚠️  Batch mode features are not yet available');
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
    renderFixPreview(plan, mode, projectPath);

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
      if (!skipConfirm) {
        const cont = await confirmFix();
        if (!cont) { console.log('\n❌ Fix cancelled\n'); return; }
      }
    }

    // Snapshotted *before* npm install/uninstall runs, so a --migrate-syntax
    // undo can restore package.json/package-lock.json to their true pre-fix
    // state, not the state after the version bump already landed.
    let fixSession = null;
    if (migrateSyntaxEnabled) {
      fixSession = new FixSessionManager(projectPath);
      fixSession.start({ mode, migrateSyntax: true });
      fixSession.snapshotFile(path.join(projectPath, 'package.json'));
      const lockPath = path.join(projectPath, 'package-lock.json');
      if (fs.existsSync(lockPath)) fixSession.snapshotFile(lockPath);
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

    if (migrateSyntaxEnabled) {
      const successfulUpdates = new Set(
        executor.getResults().successful.filter(r => r.action === 'update').map(r => r.package)
      );
      const updatedActions = actions.filter(a => a.action === 'update' && successfulUpdates.has(a.package));

      if (updatedActions.length > 0) {
        console.log('\n🧬 Checking for breaking syntax changes...');
        const tokenManager = require('../ai/token.manager');
        const migrationResult = await migrateSyntax(updatedActions, {
          projectPath,
          session: fixSession,
          getAIProvider: () => tokenManager.getProvider()
        });

        if (migrationResult.migrated.length > 0) {
          fixSession.finalize();
          renderMigrationSummary(migrationResult, projectPath, fixSession.sessionId);
        } else {
          renderMigrationSummary(migrationResult, projectPath, null);
          fs.rmSync(fixSession.sessionDir, { recursive: true, force: true });
        }
      }
    }

    const afterAnalysis = await runAnalyze({ projectPath, mode: 'silent', silent: true, json: false, saveHistory: false });
    renderFixResult(executor, beforeScore, afterAnalysis.healthScore);

  } catch (error) {
    console.error('Fix failed:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    await processManager.killAll();
    process.exit(1);
  }
}

async function runFixUndo(options = {}) {
  const { projectPath = process.cwd() } = options;

  const result = restoreLatestSession(projectPath);
  if (!result.success) {
    console.error(chalk.red(`\n❌ ${result.error}\n`));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.bold.green(`\n✔ Reverted fix session ${result.sessionId}\n`));
  (result.restored || []).forEach(file => console.log(chalk.gray(`  ${file}`)));
  if ((result.failed || []).length > 0) {
    console.log(chalk.yellow(`\n⚠️  Could not restore ${result.failed.length} file(s):`));
    result.failed.forEach(f => console.log(chalk.gray(`  ${f.file}: ${f.error}`)));
  }
  console.log(chalk.gray('\nRun `npm install` if package.json/package-lock.json were reverted.\n'));
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

module.exports = { runFix, runFixUndo };