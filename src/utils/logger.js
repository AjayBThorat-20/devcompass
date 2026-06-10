const chalk = require('chalk');

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.silent = options.silent || false;
    this.prefix = options.prefix || '';

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  shouldLog(level) {
    if (this.silent) return false;
    return this.levels[level] >= this.levels[this.level];
  }

  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`[DEBUG]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.log(chalk.cyan(`[INFO]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(chalk.yellow(`[WARN]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args);
    }
  }

  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(chalk.red(`[ERROR]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args);
    }
  }

  success(message, ...args) {
    if (this.shouldLog('info')) {
      console.log(chalk.green(`[SUCCESS]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args);
    }
  }

  log(message, ...args) {
    if (!this.silent) {
      console.log(message, ...args);
    }
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    }
  }

  setSilent(silent) {
    this.silent = silent;
  }

  setPrefix(prefix) {
    this.prefix = prefix;
  }
}

const defaultLogger = new Logger();

module.exports = Logger;
module.exports.default = defaultLogger;