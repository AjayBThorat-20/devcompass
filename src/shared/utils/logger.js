// src/shared/utils/logger.js

const chalk = require('chalk');

// CL-08: every diagnostic level goes to stderr — stdout is reserved for a
// command's actual output (with --json, stdout must carry only the JSON
// document, per C-05). DEBUG=1 (matching the 89 former `if
// (process.env.DEBUG)` call sites this logger replaces) or --verbose sets
// the level to debug.
function defaultLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  if (process.env.DEBUG) return 'debug';
  return 'info';
}

class Logger {
  constructor(options = {}) {
    this.level = options.level || defaultLevel();
    this.silent = options.silent || false;
    this.prefix = options.prefix || '';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  shouldLog(level) {
    if (this.silent) return false;
    return this.levels[level] >= this.levels[this.level];
  }

  debug(message, ...args) { if (this.shouldLog('debug')) console.error(chalk.gray(`[DEBUG]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args); }
  info(message, ...args) { if (this.shouldLog('info')) console.error(chalk.cyan(`[INFO]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args); }
  warn(message, ...args) { if (this.shouldLog('warn')) console.error(chalk.yellow(`[WARN]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args); }
  error(message, ...args) { if (this.shouldLog('error')) console.error(chalk.red(`[ERROR]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args); }
  success(message, ...args) { if (this.shouldLog('info')) console.error(chalk.green(`[SUCCESS]${this.prefix ? ` ${this.prefix}:` : ''} ${message}`), ...args); }
  // log() is the one exception: a command's actual output, not a diagnostic —
  // callers that want stdout (the default renderer, `--json`, etc.) already
  // use console.log directly, not the logger, so this stays available for the
  // rare case something does want an unprefixed stdout line via the logger.
  log(message, ...args) { if (!this.silent) console.log(message, ...args); }

  setLevel(level) { if (this.levels.hasOwnProperty(level)) this.level = level; }
  setSilent(silent) { this.silent = silent; }
  setPrefix(prefix) { this.prefix = prefix; }
}

module.exports = Logger;
module.exports.default = new Logger();