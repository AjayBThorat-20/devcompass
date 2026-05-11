const chalk = require('chalk');

class HeaderDisplay {
  static render(title, subtitle = '', version = '3.2.5') {
    console.log('');
    console.log(chalk.bold.cyan(`📊 ${title}`));
    
    if (version) {
      console.log(chalk.gray(`v${version}`));
    }
    
    if (subtitle) {
      console.log(chalk.gray(subtitle));
    }
    
    console.log('');
  }

  static renderWithMetadata(title, metadata = {}) {
    console.log('');
    console.log(chalk.bold.cyan(`📊 ${title}`));
    console.log('');
    
    if (metadata.projectName) {
      console.log(chalk.white(`Project: ${metadata.projectName}`));
    }
    
    if (metadata.version) {
      console.log(chalk.white(`Version: ${metadata.version}`));
    }
    
    if (metadata.dependencies !== undefined) {
      console.log(chalk.white(`Dependencies: ${metadata.dependencies}`));
    }
    
    console.log('');
  }
}

module.exports = { HeaderDisplay };