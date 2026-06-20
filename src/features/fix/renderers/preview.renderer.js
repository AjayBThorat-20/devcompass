// src/features/fix/renderers/preview.renderer.js

const chalk = require('chalk');
const { ConsoleFormatter } = require('../../../core/formatters/console-formatter');

function renderFixPreview(plan, mode = 'safe') {
  ConsoleFormatter.header('DevCompass Fix v3.2.6');

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
    else if (action.action === 'replace') console.log(chalk.gray(`   Replace with ${action.metadata?.alternative?.replacement}`));
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

module.exports = { renderFixPreview, renderConfirmation };