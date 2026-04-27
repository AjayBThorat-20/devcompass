// src/utils/stream-formatter.js
const chalk = require('chalk');

class StreamFormatter {
  constructor() {
    this.buffer = '';
    this.isFirstChunk = true;
  }

  /**
   * Format streaming chunk for terminal output
   */
  formatChunk(chunk) {
    if (this.isFirstChunk) {
      this.isFirstChunk = false;
      process.stdout.write('\n🤖 ');
    }
    
    process.stdout.write(chunk);
    this.buffer += chunk;
  }

  /**
   * Finish streaming
   */
  finish() {
    process.stdout.write('\n\n');
    const content = this.buffer;
    this.buffer = '';
    this.isFirstChunk = true;
    return content;
  }

  /**
   * Show typing indicator
   */
  showTyping(message = 'AI is thinking') {
    process.stdout.write(chalk.gray(`${message}...`));
  }

  /**
   * Clear typing indicator
   */
  clearTyping() {
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
  }
}

module.exports = new StreamFormatter();