// src/shared/components/spinner.indicator.js

const ora = require('ora');

class Spinner {
  constructor(text = 'Loading...') {
    this.spinner = ora({ text, spinner: 'dots' });
  }

  start(text) {
    if (text) this.spinner.text = text;
    this.spinner.start();
    return this;
  }

  succeed(text) { this.spinner.succeed(text); return this; }
  fail(text) { this.spinner.fail(text); return this; }
  warn(text) { this.spinner.warn(text); return this; }
  info(text) { this.spinner.info(text); return this; }
  stop() { this.spinner.stop(); return this; }
  update(text) { this.spinner.text = text; return this; }
}

function createSpinner(text) {
  return new Spinner(text);
}

module.exports = { Spinner, createSpinner };