// src/shared/utils/error-handler.js

const chalk = require('chalk');

class ErrorHandler {
  static handle(error, context = '') {
    const errorInfo = this.parseError(error);

    if (process.env.DEBUG) {
      console.error(chalk.red('\n❌ Error Details:'));
      console.error(chalk.gray(`Context: ${context || 'Unknown'}`));
      console.error(chalk.gray(`Type: ${errorInfo.type}`));
      console.error(chalk.gray(`Message: ${errorInfo.message}`));
      if (error.stack) console.error(chalk.gray(error.stack));
    } else {
      console.error(chalk.red(`\n❌ ${errorInfo.userMessage}`));
      if (errorInfo.suggestion) console.error(chalk.yellow(`💡 ${errorInfo.suggestion}`));
    }

    return errorInfo;
  }

  static parseError(error) {
    const errorInfo = {
      type: 'UnknownError',
      message: error.message || 'An unknown error occurred',
      userMessage: error.message || 'An unknown error occurred',
      suggestion: null,
      code: error.code,
      recoverable: true
    };

    if (error.code === 'ENOENT') {
      errorInfo.type = 'FileNotFound';
      errorInfo.userMessage = 'Required file not found';
      errorInfo.suggestion = 'Make sure you are in a valid Node.js project directory';
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorInfo.type = 'PermissionDenied';
      errorInfo.userMessage = 'Permission denied';
      errorInfo.suggestion = 'Check file permissions or run with appropriate privileges';
    } else if (error.code === 'ENOSPC') {
      errorInfo.type = 'DiskFull';
      errorInfo.userMessage = 'Disk space exhausted';
      errorInfo.suggestion = 'Free up disk space and try again';
      errorInfo.recoverable = false;
    } else if (error.code === 'ETIMEDOUT' || (error.message || '').includes('timeout')) {
      errorInfo.type = 'Timeout';
      errorInfo.userMessage = 'Operation timed out';
      errorInfo.suggestion = 'Check your network connection and try again';
    } else if ((error.message || '').includes('SQLITE') || (error.message || '').includes('database')) {
      errorInfo.type = 'DatabaseError';
      errorInfo.userMessage = 'Database error occurred';
    } else if ((error.message || '').includes('JSON')) {
      errorInfo.type = 'ParseError';
      errorInfo.userMessage = 'Failed to parse data';
      errorInfo.suggestion = 'Check if package.json or package-lock.json are valid';
    } else if ((error.message || '').includes('network') || (error.message || '').includes('fetch')) {
      errorInfo.type = 'NetworkError';
      errorInfo.userMessage = 'Network request failed';
      errorInfo.suggestion = 'Check your internet connection';
    } else if ((error.message || '').includes('Rate limit')) {
      errorInfo.type = 'RateLimitError';
      errorInfo.userMessage = 'Rate limit exceeded';
      errorInfo.suggestion = 'Wait a moment and try again';
    }

    return errorInfo;
  }

  static isRecoverable(error) {
    return this.parseError(error).recoverable;
  }

  static async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!this.isRecoverable(error)) throw error;
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }
}

module.exports = ErrorHandler;