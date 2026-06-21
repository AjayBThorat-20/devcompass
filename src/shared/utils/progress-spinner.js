// src/shared/utils/progress-spinner.js

const ora = require('ora');
const chalk = require('chalk');

class ProgressSpinner {
  constructor(options = {}) {
    this.spinner = null;
    this.silent = options.silent || false;
  }

  start(text) {
    if (this.silent) return this;
    this.spinner = ora({ text, spinner: 'dots', color: 'cyan' }).start();
    return this;
  }

  update(text) {
    if (this.silent || !this.spinner) return this;
    this.spinner.text = text;
    return this;
  }

  succeed(text) {
    if (this.silent || !this.spinner) return this;
    this.spinner.succeed(chalk.green(text));
    this.spinner = null;
    return this;
  }

  fail(text) {
    if (this.silent || !this.spinner) return this;
    this.spinner.fail(chalk.red(text));
    this.spinner = null;
    return this;
  }

  warn(text) {
    if (this.silent || !this.spinner) return this;
    this.spinner.warn(chalk.yellow(text));
    this.spinner = null;
    return this;
  }

  stop() {
    if (this.silent || !this.spinner) return this;
    this.spinner.stop();
    this.spinner = null;
    return this;
  }

  isSpinning() {
    return Boolean(this.spinner && this.spinner.isSpinning);
  }
}

module.exports = ProgressSpinner;