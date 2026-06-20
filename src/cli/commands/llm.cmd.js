// src/cli/commands/llm.cmd.js

module.exports = function registerLlmCommand(program) {
  program
    .command('llm')
    .description('Manage AI/LLM providers and settings')
    .argument('[subcommand]', 'LLM subcommand')
    .argument('[provider]', 'Provider name')
    .option('--provider <name>', 'Provider name')
    .option('--token <token>', 'API token/key')
    .option('--model <model>', 'Model name')
    .option('--base-url <url>', 'Base URL (for local models)')
    .action(async (subcommand, provider, options) => {
      const llmCommand = require('../../features/ai/llm.command');
      const providerName = provider || options.provider;
      switch (subcommand) {
        case 'add': await llmCommand.addProvider(options); break;
        case 'list': llmCommand.listProviders(); break;
        case 'default': llmCommand.setDefaultProvider(providerName); break;
        case 'update': llmCommand.updateProvider(providerName, options); break;
        case 'remove': llmCommand.removeProvider(providerName); break;
        case 'test': await llmCommand.testProvider(providerName); break;
        case 'stats': llmCommand.showStats(options); break;
        default: llmCommand.showHelp();
      }
    });
};