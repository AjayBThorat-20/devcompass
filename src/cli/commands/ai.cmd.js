// src/cli/commands/ai.cmd.js

const chalk = require('chalk');

module.exports = function registerAiCommand(program) {
  program
    .command('ai')
    .description('AI-powered dependency analysis')
    .argument('[subcommand]', 'AI subcommand (ask, recommend, alternatives, chat)')
    .argument('[args...]', 'Additional arguments')
    .option('--provider <name>', 'AI provider to use')
    .option('--stream', 'Stream responses in real-time', true)
    .option('--no-stream', 'Wait for complete response')
    .option('--verbose', 'Show detailed information')
    .action(async (subcommand, args, options) => {
      const aiCommand = require('../../features/ai/ai.command');
      const projectPath = process.cwd();
      switch (subcommand) {
        case 'ask': {
          const question = args.join(' ');
          if (!question) { console.log(chalk.red('❌ Question required')); return; }
          await aiCommand.askQuestion(question, projectPath, options);
          break;
        }
        case 'recommend': await aiCommand.getRecommendations(projectPath, options); break;
        case 'alternatives': {
          const packageName = args[0];
          if (!packageName) { console.log(chalk.red('❌ Package name required')); return; }
          await aiCommand.getAlternatives(packageName, projectPath, options);
          break;
        }
        case 'chat': await aiCommand.startChat(projectPath, options); break;
        default:
          console.log(chalk.yellow('\n⚠️ Invalid AI command\n'));
          console.log('  depvora ai ask "question"');
          console.log('  depvora ai recommend');
          console.log('  depvora ai alternatives <package>');
          console.log('  depvora ai chat\n');
      }
    });
};