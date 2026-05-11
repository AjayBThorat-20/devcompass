const readline = require('readline');

class ConfirmPrompt {
  static async ask(question, defaultYes = true) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const suffix = defaultYes ? ' (Y/n)' : ' (y/N)';
    
    return new Promise((resolve) => {
      rl.question(`${question}${suffix}: `, (answer) => {
        rl.close();
        
        const normalized = answer.toLowerCase().trim();
        
        if (normalized === '') {
          resolve(defaultYes);
        } else {
          resolve(normalized === 'y' || normalized === 'yes');
        }
      });
    });
  }

  static async askWithOptions(question, options = ['Y', 'n', 'd']) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const optionsText = options.map(opt => 
      opt === opt.toUpperCase() ? `(${opt})` : `(${opt})`
    ).join('  ');

    return new Promise((resolve) => {
      rl.question(`${question}\n${optionsText}: `, (answer) => {
        rl.close();
        
        const normalized = answer.toLowerCase().trim();
        
        if (normalized === '') {
          const defaultOption = options.find(opt => opt === opt.toUpperCase());
          resolve(defaultOption ? defaultOption.toLowerCase() : 'y');
        } else {
          resolve(normalized);
        }
      });
    });
  }
}

module.exports = { ConfirmPrompt };