// src/features/ai/llm.command.js

const chalk = require('chalk');
const tokenManager = require('./token.manager');
const aiDatabase = require('./ai.database');
const costTracker = require('./cost.tracker');

async function addProvider(options) {
  const { provider, token, model, baseUrl } = options;
  if (!provider) { console.error(chalk.red('❌ Error: Provider name is required')); return; }
  if (!token && provider !== 'local') { console.error(chalk.red('❌ Error: API token is required')); return; }
  if (!model) { console.error(chalk.red('❌ Error: Model name is required')); return; }
  const validProviders = ['openai', 'anthropic', 'google', 'local'];
  if (!validProviders.includes(provider)) { console.error(chalk.red(`❌ Invalid provider "${provider}". Supported: ${validProviders.join(', ')}`)); return; }

  try {
    const result = tokenManager.addProvider(provider, token, model, baseUrl);
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
      console.log(chalk.gray(`   Model: ${model}`));
      if (baseUrl) console.log(chalk.gray(`   Base URL: ${baseUrl}`));
      console.log('\n💡 Test: depvora llm test ' + provider);
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error adding provider: ' + error.message));
  }
}

function listProviders() {
  try {
    const providers = tokenManager.listProviders();
    if (providers.length === 0) {
      console.log(chalk.yellow('⚠️  No LLM providers configured'));
      console.log('\n💡 depvora llm add --provider openai --token sk-xxx --model gpt-4');
      return;
    }
    console.log(chalk.bold('\n📋 Configured LLM Providers\n'));
    providers.forEach(p => {
      const status = p.isActive ? chalk.green('●') : chalk.gray('○');
      const defaultBadge = p.isDefault ? chalk.cyan(' (default)') : '';
      console.log(`${status} ${chalk.bold(p.provider)}${defaultBadge}`);
      console.log(`   Model: ${p.model}`);
      console.log(`   API Key: ${p.apiKey}`);
      if (p.baseUrl) console.log(`   Base URL: ${p.baseUrl}`);
      console.log(`   Added: ${new Date(p.createdAt).toLocaleDateString()}`);
      console.log();
    });
  } catch (error) {
    console.error(chalk.red('❌ Error listing providers: ' + error.message));
  }
}

function setDefaultProvider(provider) {
  if (!provider) { console.error(chalk.red('❌ Provider name is required')); return; }
  try {
    const result = tokenManager.setDefault(provider);
    console.log(result.success ? chalk.green('✅ ' + result.message) : chalk.red('❌ Error: ' + result.message));
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

function updateProvider(provider, options) {
  if (!provider) { console.error(chalk.red('❌ Provider name is required')); return; }
  try {
    const updates = {};
    if (options.token) updates.api_key = options.token;
    if (options.model) updates.model = options.model;
    if (options.baseUrl) updates.base_url = options.baseUrl;
    if (Object.keys(updates).length === 0) { console.error(chalk.red('❌ No updates specified')); return; }
    const result = tokenManager.updateProvider(provider, updates);
    console.log(result.success ? chalk.green('✅ ' + result.message) : chalk.red('❌ Error: ' + result.message));
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

function removeProvider(provider) {
  if (!provider) { console.error(chalk.red('❌ Provider name is required')); return; }
  try {
    const result = tokenManager.removeProvider(provider);
    console.log(result.success ? chalk.green('✅ ' + result.message) : chalk.red('❌ Error: ' + result.message));
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

async function testProvider(provider) {
  if (!provider) { console.error(chalk.red('❌ Provider name is required')); return; }
  try {
    console.log(chalk.gray(`Testing connection to ${provider}...`));
    const result = await tokenManager.testProvider(provider);
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
      if (result.response) console.log(chalk.gray(`   Response: ${result.response}`));
    } else {
      console.log(chalk.red('❌ Connection failed\n   ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Test failed: ' + error.message));
  }
}

function showStats(options = {}) {
  try {
    const providers = aiDatabase.getAllProviders();
    const now = new Date();
    const year = options.year || now.getFullYear();
    const month = options.month || now.getMonth() + 1;
    const stats = aiDatabase.getUsageStats(year, month);
    const formattedStats = costTracker.formatStats(stats, providers);

    if (formattedStats.length === 0) {
      console.log(chalk.yellow(`⚠️  No usage data for ${year}-${month.toString().padStart(2, '0')}`));
      return;
    }

    console.log(chalk.bold(`\n📊 AI Usage Statistics - ${year}-${month.toString().padStart(2, '0')}\n`));
    let totalTokens = 0, totalCost = 0, totalRequests = 0;
    formattedStats.forEach(s => {
      console.log(chalk.bold(`${s.provider} (${s.model})`));
      console.log(`   Requests: ${s.requests}`);
      console.log(`   Tokens: ${s.tokens.toLocaleString()}`);
      console.log(`   Cost: $${s.cost}\n`);
      totalTokens += parseInt(s.tokens);
      totalCost += parseFloat(s.cost);
      totalRequests += parseInt(s.requests);
    });
    console.log(chalk.bold('─'.repeat(50)));
    console.log(chalk.bold(`Total Requests: ${totalRequests}`));
    console.log(chalk.bold(`Total Tokens: ${totalTokens.toLocaleString()}`));
    console.log(chalk.bold(`Total Cost: $${totalCost.toFixed(4)}\n`));
  } catch (error) {
    console.error(chalk.red('❌ Error showing stats: ' + error.message));
  }
}

function showHelp() {
  console.log(chalk.bold('\n🤖 Depvora LLM Management\n'));
  console.log('Commands:');
  console.log('  depvora llm add --provider <name> --token <token> --model <model>');
  console.log('  depvora llm list');
  console.log('  depvora llm default <provider>');
  console.log('  depvora llm test <provider>');
  console.log('  depvora llm remove <provider>');
  console.log('  depvora llm stats\n');
}

module.exports = { addProvider, listProviders, setDefaultProvider, updateProvider, removeProvider, testProvider, showStats, showHelp };