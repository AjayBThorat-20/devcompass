// src/features/fix/renderers/preview.renderer.js

const chalk = require('chalk');
const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');
const { detectPackageManager } = require('../../../core/graph');
const { buildDiffEntries } = require('../utils/package-diff');
const { selectActions } = require('../planners/fix.planner');
const { version } = require('../../../../package.json');

function renderFixPreview(plan, mode = 'safe', projectPath = process.cwd(), { removeUnused = false } = {}) {
  ConsoleFormatter.header(`DevCompass Fix v${version}`);

  // Same selector the executor uses, so the preview can't promise something
  // different from what runs.
  const actions = selectActions(plan, mode, { removeUnused }).filter(action => action.action !== 'review');
  // 'review' items (a vulnerable transitive package, a vulnerability with no
  // fixed version to pin to, a typosquat match...) are never executed in any
  // mode, so they're listed on their own rather than as "skipped".
  const needsReview = [...plan.safe, ...plan.moderate, ...plan.risky].filter(action => action.action === 'review');
  const skipped = getSkippedActions(plan, mode, { removeUnused }).filter(action => action.action !== 'review');
  const heldBackRemovals = removeUnused ? 0 : skipped.filter(a => a.action === 'remove').length;
  const line = '━'.repeat(60);

  if (actions.length === 0 && needsReview.length === 0) {
    console.log(chalk.yellow(`\n✅ No ${getModeLabel(mode).toLowerCase()} fixes available\n`));
    if (skipped.length > heldBackRemovals) {
      console.log(chalk.gray(`There are ${skipped.length - heldBackRemovals} riskier fix(es). Use ${chalk.cyan('devcompass fix --all')} to include them.\n`));
    }
    if (heldBackRemovals > 0) {
      console.log(chalk.gray(`${heldBackRemovals} unused package(s) could be removed. Unused detection is a heuristic, so removal needs ${chalk.cyan('devcompass fix --remove-unused')} explicitly.\n`));
    }
    return;
  }

  console.log(chalk.dim(line));
  console.log(chalk.bold(`🛠️  Fix Plan (${getModeLabel(mode)})`));
  console.log(chalk.dim(line));
  console.log('');

  if (actions.length > 0) {
    console.log(chalk.bold.green(`✔ Actions (${actions.length})\n`));

    actions.forEach((action, index) => {
      console.log(chalk.cyan(`${index + 1}. ${action.package}`));
      if (action.action === 'update') console.log(chalk.gray(`   ${action.currentVersion} → ${action.targetVersion}`));
      else if (action.action === 'remove') console.log(chalk.gray('   Remove unused dependency'));
      else if (action.action === 'replace') console.log(chalk.gray(`   Replace with ${action.metadata?.alternative?.replacement || action.metadata?.alternative}`));
      console.log(chalk.gray(`   Reason: ${action.message}`));
      console.log(chalk.gray(`   Risk: ${getRiskLabel(action.riskLevel)}`));
      console.log('');
    });
  }

  if (needsReview.length > 0) {
    console.log(chalk.bold.magenta(`\n🔍 Needs manual action (${needsReview.length})\n`));
    needsReview.slice(0, 10).forEach((action, index) => {
      console.log(chalk.cyan(`${index + 1}. ${action.package}${action.currentVersion ? `@${action.currentVersion}` : ''}`));
      console.log(chalk.gray(`   ${describeReview(action)}`));
    });
    if (needsReview.length > 10) console.log(chalk.gray(`   ... and ${needsReview.length - 10} more`));
    console.log('');
    const transitive = needsReview.filter(action => action.metadata?.transitive);
    if (transitive.length > 0) printTransitiveAdvice(transitive, detectPackageManager(projectPath));
  }

  if (skipped.length > 0) {
    console.log(chalk.bold.yellow(`\n⚠️  Skipped (${skipped.length} risky fix${skipped.length > 1 ? 'es' : ''})\n`));
    skipped.slice(0, 5).forEach((action, index) => {
      console.log(chalk.yellow(`${index + 1}. ${action.package}`));
      console.log(chalk.gray(`   Reason: ${action.riskInfo?.reason || 'Risky change'}`));
      console.log(chalk.gray(`   Risk: ${getRiskLabel(action.riskLevel)}`));
      console.log('');
    });
    if (skipped.length > 5) console.log(chalk.gray(`   ... and ${skipped.length - 5} more\n`));
    console.log(chalk.gray(`To include risky fixes: ${chalk.cyan('devcompass fix --all')}`));
    if (heldBackRemovals > 0) {
      console.log(chalk.gray(`To remove the ${heldBackRemovals} package(s) flagged unused: ${chalk.cyan('devcompass fix --remove-unused')} (heuristic — confirm nothing imports them first)`));
    }
    console.log('');
  }

  console.log(chalk.dim(line));
  console.log(chalk.bold('📊 Summary'));
  console.log(chalk.dim(line));
  console.log('');
  console.log(chalk.green(`✔ Will apply:    ${actions.length} fix${actions.length > 1 ? 'es' : ''}`));
  console.log(chalk.yellow(`⚠️  Will skip:     ${skipped.length} fix${skipped.length > 1 ? 'es' : ''}`));
  if (needsReview.length > 0) {
    console.log(chalk.magenta(`🔍 Needs review:  ${needsReview.length} item${needsReview.length > 1 ? 's' : ''} (not applied automatically)`));
  }
  console.log(chalk.cyan(`📦 Total issues:  ${plan.summary.totalIssues}`));
  console.log('');

  renderPackageJsonDiff(actions, projectPath);
}

function renderPackageJsonDiff(actions, projectPath) {
  const { entries, indirect } = buildDiffEntries(actions, projectPath);
  if (entries.length === 0 && indirect.length === 0) return;

  const line = '━'.repeat(60);
  console.log(chalk.dim(line));
  console.log(chalk.bold('📄 package.json diff (applied in place)'));
  console.log(chalk.dim(line));
  console.log('');

  if (entries.length > 0) {
    const byField = entries.reduce((acc, entry) => {
      (acc[entry.field] = acc[entry.field] || []).push(entry);
      return acc;
    }, {});

    Object.entries(byField).forEach(([field, fieldEntries]) => {
      console.log(chalk.gray(`  "${field}": {`));
      fieldEntries.forEach(entry => {
        if (entry.removed) console.log(chalk.red(`-   ${entry.removed},`));
        if (entry.added) console.log(chalk.green(`+   ${entry.added},`));
      });
      console.log(chalk.gray('  }'));
      console.log('');
    });
  }

  if (indirect.length > 0) {
    console.log(chalk.gray(`  ℹ️  ${indirect.length} more resolved via npm install/uninstall (transitive, not listed directly in package.json):`));
    console.log(chalk.gray(`     ${indirect.join(', ')}`));
    console.log('');
  }
}

function renderConfirmation() {
  const line = '━'.repeat(60);
  console.log(chalk.dim(line));
  console.log(chalk.bold('❓ Confirm Fix'));
  console.log(chalk.dim(line));
  console.log('');
  console.log('Apply fixes?');
  console.log('');
  console.log(chalk.cyan('(Y)') + ' Yes    ' + chalk.gray('(n)') + ' No');
  console.log('');
}

// What this mode won't touch: the buckets it doesn't cover, plus any
// removals being held back for lack of --remove-unused (including in
// --all mode, which otherwise covers every bucket).
function getSkippedActions(plan, mode, { removeUnused = false } = {}) {
  let skipped;
  if (mode === 'safe') skipped = [...plan.moderate, ...plan.risky];
  else if (mode === 'moderate') skipped = [...plan.risky];
  else skipped = [];

  if (!removeUnused) {
    const alreadySkipped = new Set(skipped.map(a => a.id));
    const heldBackRemovals = [...plan.safe, ...plan.moderate, ...plan.risky]
      .filter(a => a.action === 'remove' && !alreadySkipped.has(a.id));
    skipped = [...skipped, ...heldBackRemovals];
  }

  return skipped;
}

function getModeLabel(mode) {
  return { safe: 'Safe Mode', moderate: 'Moderate Mode', all: 'All Fixes' }[mode] || 'Safe Mode';
}

function getRiskLabel(riskLevel) {
  return { safe: chalk.green('Safe'), moderate: chalk.yellow('Moderate'), risky: chalk.red('Risky') }[riskLevel] || chalk.gray('Unknown');
}

function describeReview(action) {
  if (action.metadata?.transitive) {
    return `Transitive dependency${action.targetVersion ? `, fixed in ${action.targetVersion}` : ''} — see below`;
  }
  if (action.type === 'security' && !action.targetVersion && /^(Update to latest|Run npm audit fix)$/i.test(action.fix || '')) {
    return `No version to pin to — ${chalk.cyan('npm audit fix')} applies a compatible fix if one exists; otherwise check the advisory`;
  }
  return action.fix ? `${action.message} — ${action.fix}` : action.message;
}

// One combined override snippet. Versions are the fix versions from the
// findings themselves, never 'latest'.
function printTransitiveAdvice(transitive, manager) {
  const pinned = transitive.filter(action => action.targetVersion);
  const auditFix = manager === 'pnpm' ? 'pnpm audit --fix' : manager === 'yarn' ? null : 'npm audit fix';

  console.log(chalk.gray('   Transitive dependencies can\'t be fixed by installing them directly: that adds a new'));
  console.log(chalk.gray('   top-level dependency and leaves the vulnerable nested copy in place.'));
  if (auditFix) console.log(chalk.gray(`   First try ${chalk.cyan(auditFix)}, which updates them within what their parents allow.`));
  if (pinned.length > 0) {
    console.log(chalk.gray(`   ${auditFix ? 'For any still vulnerable after that, pin' : 'Pin'} the patched version, then run your tests`));
    console.log(chalk.gray('   (the parent package was never tested with it):'));
    console.log('');
    const entries = pinned.map(action => `"${action.package}": "${action.targetVersion}"`).join(', ');
    console.log(chalk.gray('   // package.json'));
    if (manager === 'pnpm') console.log(chalk.gray(`   "pnpm": { "overrides": { ${entries} } }`));
    else if (manager === 'yarn') console.log(chalk.gray(`   "resolutions": { ${entries} }`));
    else console.log(chalk.gray(`   "overrides": { ${entries} }`));
  }
  console.log('');
}

module.exports = { renderFixPreview, renderConfirmation, renderPackageJsonDiff };
