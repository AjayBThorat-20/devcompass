const chalk = require('chalk');

class SectionDisplay {
  static render(title, count = null) {
    const line = '━'.repeat(60);
    const countStr = count !== null ? chalk.gray(` (${count})`) : '';
    
    console.log('');
    console.log(chalk.dim(line));
    console.log(chalk.bold(`${title}${countStr}`));
    console.log(chalk.dim(line));
    console.log('');
  }

  static renderSubSection(title) {
    console.log('');
    console.log(chalk.bold.cyan(title));
    console.log(chalk.dim('─'.repeat(60)));
    console.log('');
  }

  static renderDivider() {
    console.log(chalk.dim('─'.repeat(60)));
  }
}

module.exports = { SectionDisplay };