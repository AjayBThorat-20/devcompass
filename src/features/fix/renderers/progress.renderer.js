// src/features/fix/renderers/progress.renderer.js

const chalk = require('chalk');

class ProgressRenderer {
  constructor() {
    this.completed = 0;
    this.total = 0;
  }

  start(total) {
    this.total = total;
    this.completed = 0;
    const line = '━'.repeat(60);
    console.log('');
    console.log(chalk.dim(line));
    console.log(chalk.bold('⚙️ Applying Fixes...'));
    console.log(chalk.dim(line));
    console.log('');
  }

  updateAction(action, success) {
    this.completed++;
    const icon = success ? chalk.green('✔') : chalk.red('✗');
    const msg = this.formatActionMessage(action, success);
    console.log(`${icon} ${msg}`);
  }

  formatActionMessage(action) {
    if (action.action === 'update') return `${action.package} updated → ${action.targetVersion}`;
    if (action.action === 'remove') return `${action.package} removed`;
    if (action.action === 'replace') return `${action.package} replaced with ${action.metadata?.alternative?.replacement || action.metadata?.alternative}`;
    return action.package;
  }

  finish() {
    console.log('');
    console.log(chalk.cyan('📦 Installing dependencies...'));
  }

  complete() {
    console.log(chalk.green('✔ Done'));
    console.log('');
  }
}

module.exports = { ProgressRenderer };