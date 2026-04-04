// src/utils/progress-tracker.js
const ora = require('ora');
const chalk = require('chalk');

class ProgressTracker {
  constructor(totalSteps) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.spinner = null;
    this.startTime = Date.now();
  }

  start(message) {
    this.spinner = ora({
      text: this.formatMessage(message),
      spinner: 'dots'
    }).start();
  }

  update(message) {
    this.currentStep++;
    if (this.spinner) {
      this.spinner.text = this.formatMessage(message);
    }
  }

  succeed(message) {
    if (this.spinner) {
      this.spinner.succeed(this.formatMessage(message || 'Complete'));
    }
  }

  fail(message) {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
    }
  }

  warn(message) {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(message));
    }
  }

  info(message) {
    if (this.spinner) {
      this.spinner.info(chalk.cyan(message));
    }
  }

  formatMessage(message) {
    const percentage = Math.round((this.currentStep / this.totalSteps) * 100);
    const elapsed = this.getElapsedTime();
    const eta = this.getETA();
    
    return `${message} ${chalk.gray(`[${this.currentStep}/${this.totalSteps}]`)} ${chalk.cyan(`${percentage}%`)} ${chalk.gray(`• ${elapsed}s elapsed`)}${eta ? chalk.gray(` • ETA: ${eta}s`) : ''}`;
  }

  getElapsedTime() {
    return ((Date.now() - this.startTime) / 1000).toFixed(1);
  }

  getETA() {
    if (this.currentStep === 0) return null;
    const elapsed = Date.now() - this.startTime;
    const avgTimePerStep = elapsed / this.currentStep;
    const remainingSteps = this.totalSteps - this.currentStep;
    const eta = (avgTimePerStep * remainingSteps) / 1000;
    return eta > 0 ? eta.toFixed(1) : null;
  }

  stop() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }
}

module.exports = ProgressTracker;