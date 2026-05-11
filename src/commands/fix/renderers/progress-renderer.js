const ora = require('ora');
const chalk = require('chalk');

class ProgressRenderer {
  constructor() {
    this.spinner = null;
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
    const message = this.formatActionMessage(action, success);
    
    console.log(`${icon} ${message}`);
  }

  formatActionMessage(action, success) {
    if (action.action === 'update') {
      return `${action.package} updated → ${action.targetVersion}`;
    } else if (action.action === 'remove') {
      return `${action.package} removed`;
    } else if (action.action === 'replace') {
      const replacement = action.metadata?.alternative?.replacement;
      return `${action.package} replaced with ${replacement}`;
    }
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