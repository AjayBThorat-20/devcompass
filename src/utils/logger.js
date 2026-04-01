// src/utils/logger.js
const chalk = require('chalk');

function log(message) {
  console.log(message);
}

function logSection(title, count) {
  const countStr = count !== undefined 
    ? chalk.gray(` (${count})`) 
    : '';
  log(chalk.bold(`\n${title}${countStr}\n`));
}

function logDivider() {
  const line = '━'.repeat(70);
  log(chalk.gray(line) + '\n');
}

function getScoreColor(score) {
  if (score >= 8) {
    return chalk.green.bold;
  } else if (score >= 6) {
    return chalk.yellow.bold;
  } else {
    return chalk.red.bold;
  }
}

module.exports = { 
  log, 
  logSection, 
  logDivider,
  getScoreColor
};


