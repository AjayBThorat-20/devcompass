// src/features/fix/renderers/migration.renderer.js

const chalk = require('chalk');
const path = require('path');

function renderMigrationSummary(result, projectPath, sessionId) {
  const total = result.migrated.length + result.skipped.length + result.errors.length;
  if (total === 0) return;

  const line = '━'.repeat(60);
  console.log(chalk.dim(line));
  console.log(chalk.bold('🧬 Syntax migration (--migrate-syntax)'));
  console.log(chalk.dim(line));
  console.log('');

  if (result.migrated.length > 0) {
    console.log(chalk.bold.green(`✔ Rewritten (${result.migrated.length})\n`));
    result.migrated.forEach(m => {
      console.log(chalk.cyan(`  ${path.relative(projectPath, m.file)}`));
      console.log(chalk.gray(`    ${m.package} — via ${m.via === 'ai' ? 'AI provider' : 'built-in codemod'}`));
    });
    console.log('');
  }

  if (result.skipped.length > 0) {
    console.log(chalk.bold.yellow(`⚠️  Needs manual review (${result.skipped.length})\n`));
    result.skipped.forEach(s => {
      console.log(chalk.yellow(`  ${path.relative(projectPath, s.file)}`));
      console.log(chalk.gray(`    ${s.package} — ${s.reason}`));
    });
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log(chalk.bold.red(`❌ Errors (${result.errors.length})\n`));
    result.errors.forEach(e => {
      console.log(chalk.red(`  ${path.relative(projectPath, e.file)}`));
      console.log(chalk.gray(`    ${e.package} — ${e.error}`));
    });
    console.log('');
  }

  console.log(chalk.dim(line));
  if (result.migrated.length > 0) {
    console.log(chalk.bold('Nothing was committed.'));
    console.log(`Run your tests to verify, then commit — or revert everything from this fix run:`);
    console.log(chalk.cyan(`  devcompass fix undo`) + chalk.gray(`  (session: ${sessionId})`));
  }
  console.log('');
}

module.exports = { renderMigrationSummary };
