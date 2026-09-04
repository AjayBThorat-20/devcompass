// src/features/fix/renderers/preview.renderer.js

const chalk = require('chalk');
const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');
const { buildDiffEntries } = require('../utils/package-diff');
const { version } = require('../../../../package.json');

function renderFixPreview(plan, mode = 'safe', projectPath = process.cwd()) {
  ConsoleFormatter.header(`DevCompass Fix v${version}`);

  const actions = getActionsForMode(plan, mode);
  const skipped = getSkippedActions(plan, mode);
  const line = '━'.repeat(60);

  if (actions.length === 0) {
    console.log(chalk.yellow(`\n✅ No ${getModeLabel(mode).toLowerCase()} fixes available\n`));
    if (skipped.length > 0) {
      console.log(chalk.gray(`There are ${skipped.length} risky fix(es). Use ${chalk.cyan('devcompass fix --all')} to include them.\n`));
    }
    return;
  }

  console.log(chalk.dim(line));
  console.log(chalk.bold(`🛠️  Fix Plan (${getModeLabel(mode)})`));
  console.log(chalk.dim(line));
  console.log('');
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

  if (skipped.length > 0) {
    console.log(chalk.bold.yellow(`\n⚠️  Skipped (${skipped.length} risky fix${skipped.length > 1 ? 'es' : ''})\n`));
    skipped.slice(0, 5).forEach((action, index) => {
      console.log(chalk.yellow(`${index + 1}. ${action.package}`));
      console.log(chalk.gray(`   Reason: ${action.riskInfo?.reason || 'Risky change'}`));
      console.log(chalk.gray(`   Risk: ${getRiskLabel(action.riskLevel)}`));
      console.log('');
    });
    if (skipped.length > 5) console.log(chalk.gray(`   ... and ${skipped.length - 5} more\n`));
    console.log(chalk.gray(`To include risky fixes: ${chalk.cyan('devcompass fix --all')}\n`));
  }

  console.log(chalk.dim(line));
  console.log(chalk.bold('📊 Summary'));
  console.log(chalk.dim(line));
  console.log('');
  console.log(chalk.green(`✔ Will apply:    ${actions.length} fix${actions.length > 1 ? 'es' : ''}`));
  console.log(chalk.yellow(`⚠️  Will skip:     ${skipped.length} fix${skipped.length > 1 ? 'es' : ''}`));
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

function getActionsForMode(plan, mode) {
  if (mode === 'safe') return plan.safe;
  if (mode === 'moderate') return [...plan.safe, ...plan.moderate];
  if (mode === 'all') return [...plan.safe, ...plan.moderate, ...plan.risky];
  return [];
}

function getSkippedActions(plan, mode) {
  if (mode === 'safe') return [...plan.moderate, ...plan.risky];
  if (mode === 'moderate') return plan.risky;
  return [];
}

function getModeLabel(mode) {
  return { safe: 'Safe Mode', moderate: 'Moderate Mode', all: 'All Fixes' }[mode] || 'Safe Mode';
}

function getRiskLabel(riskLevel) {
  return { safe: chalk.green('Safe'), moderate: chalk.yellow('Moderate'), risky: chalk.red('Risky') }[riskLevel] || chalk.gray('Unknown');
}

module.exports = { renderFixPreview, renderConfirmation, renderPackageJsonDiff };