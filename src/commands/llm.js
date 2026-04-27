// src/commands/llm.js
const chalk = require('chalk');
const tokenManager = require('../ai/token-manager');
const aiDatabase = require('../ai/database');
const costTracker = require('../ai/cost-tracker');

/**
 * Add a new LLM provider
 */
async function addProvider(options) {
  const { provider, token, model, baseUrl } = options;

  // Validate required fields
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    console.log('\nUsage: devcompass llm add --provider <name> --token <token> --model <model>');
    console.log('\nSupported providers: openai, anthropic, google, local');
    return;
  }

  if (!token && provider !== 'local') {
    console.error(chalk.red('❌ Error: API token is required'));
    return;
  }

  if (!model) {
    console.error(chalk.red('❌ Error: Model name is required'));
    console.log('\nExamples:');
    console.log('  OpenAI: gpt-4, gpt-4-turbo, gpt-3.5-turbo');
    console.log('  Anthropic: claude-3-5-sonnet-20241022, claude-3-opus-20240229');
    console.log('  Google: gemini-pro, gemini-1.5-pro');
    console.log('  Local: llama3, mistral, codellama');
    return;
  }

  // Validate provider type
  const validProviders = ['openai', 'anthropic', 'google', 'local'];
  if (!validProviders.includes(provider)) {
    console.error(chalk.red(`❌ Error: Invalid provider "${provider}"`));
    console.log(`\nSupported providers: ${validProviders.join(', ')}`);
    return;
  }

  try {
    const result = tokenManager.addProvider(provider, token, model, baseUrl);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
      console.log(chalk.gray(`   Model: ${model}`));
      if (baseUrl) {
        console.log(chalk.gray(`   Base URL: ${baseUrl}`));
      }
      console.log('\n💡 Test connection with: devcompass llm test ' + provider);
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error adding provider: ' + error.message));
  }
}

/**
 * List all LLM providers
 */
function listProviders() {
  try {
    const providers = tokenManager.listProviders();

    if (providers.length === 0) {
      console.log(chalk.yellow('⚠️  No LLM providers configured'));
      console.log('\n💡 Add one with: devcompass llm add --provider openai --token sk-xxx --model gpt-4');
      return;
    }

    console.log(chalk.bold('\n📋 Configured LLM Providers\n'));

    providers.forEach(p => {
      const status = p.isActive ? chalk.green('●') : chalk.gray('○');
      const defaultBadge = p.isDefault ? chalk.cyan(' (default)') : '';
      
      console.log(`${status} ${chalk.bold(p.provider)}${defaultBadge}`);
      console.log(`   Model: ${p.model}`);
      console.log(`   API Key: ${p.apiKey}`);
      if (p.baseUrl) {
        console.log(`   Base URL: ${p.baseUrl}`);
      }
      console.log(`   Added: ${new Date(p.createdAt).toLocaleDateString()}`);
      console.log();
    });

    console.log(chalk.gray('💡 Tips:'));
    console.log(chalk.gray('   • Set default: devcompass llm default <provider>'));
    console.log(chalk.gray('   • Test connection: devcompass llm test <provider>'));
    console.log(chalk.gray('   • Remove: devcompass llm remove <provider>'));
  } catch (error) {
    console.error(chalk.red('❌ Error listing providers: ' + error.message));
  }
}

/**
 * Set default provider
 */
function setDefaultProvider(provider) {
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    console.log('\nUsage: devcompass llm default <provider>');
    return;
  }

  try {
    const result = tokenManager.setDefault(provider);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

/**
 * Update provider
 */
function updateProvider(provider, options) {
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    console.log('\nUsage: devcompass llm update <provider> --token <new-token>');
    return;
  }

  try {
    const updates = {};
    if (options.token) updates.api_key = options.token;
    if (options.model) updates.model = options.model;
    if (options.baseUrl) updates.base_url = options.baseUrl;

    if (Object.keys(updates).length === 0) {
      console.error(chalk.red('❌ Error: No updates specified'));
      console.log('\nAvailable options: --token, --model, --base-url');
      return;
    }

    const result = tokenManager.updateProvider(provider, updates);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

/**
 * Remove provider
 */
function removeProvider(provider) {
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    console.log('\nUsage: devcompass llm remove <provider>');
    return;
  }

  try {
    const result = tokenManager.removeProvider(provider);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

/**
 * Enable/disable provider
 */
function toggleProvider(provider, enabled) {
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    return;
  }

  try {
    const result = tokenManager.toggleProvider(provider, enabled);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
    } else {
      console.error(chalk.red('❌ Error: ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error: ' + error.message));
  }
}

/**
 * Test provider connection
 */
async function testProvider(provider) {
  if (!provider) {
    console.error(chalk.red('❌ Error: Provider name is required'));
    console.log('\nUsage: devcompass llm test <provider>');
    return;
  }

  try {
    console.log(chalk.gray(`Testing connection to ${provider}...`));
    
    const result = await tokenManager.testProvider(provider);
    
    if (result.success) {
      console.log(chalk.green('✅ ' + result.message));
      if (result.response) {
        console.log(chalk.gray(`   Response: ${result.response}`));
      }
    } else {
      console.log(chalk.red('❌ Connection failed'));
      console.log(chalk.red('   ' + result.message));
    }
  } catch (error) {
    console.error(chalk.red('❌ Test failed: ' + error.message));
  }
}

/**
 * Show usage statistics
 */
function showStats(options) {
  try {
    const providers = aiDatabase.getAllProviders();
    
    // Get current month stats
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

    let totalTokens = 0;
    let totalCost = 0;
    let totalRequests = 0;

    formattedStats.forEach(s => {
      console.log(chalk.bold(`${s.provider} (${s.model})`));
      console.log(`   Requests: ${s.requests}`);
      console.log(`   Tokens: ${s.tokens.toLocaleString()}`);
      console.log(`   Cost: $${s.cost}`);
      console.log();

      totalTokens += parseInt(s.tokens);
      totalCost += parseFloat(s.cost);
      totalRequests += parseInt(s.requests);
    });

    console.log(chalk.bold('─'.repeat(50)));
    console.log(chalk.bold(`Total Requests: ${totalRequests}`));
    console.log(chalk.bold(`Total Tokens: ${totalTokens.toLocaleString()}`));
    console.log(chalk.bold(`Total Cost: $${totalCost.toFixed(4)}`));
    console.log();

    // Show cost projection
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = now.getDate();
    const projectedCost = (totalCost / currentDay) * daysInMonth;
    
    if (currentDay < daysInMonth) {
      console.log(chalk.gray(`📈 Projected monthly cost: $${projectedCost.toFixed(2)}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error showing stats: ' + error.message));
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.bold('\n🤖 DevCompass LLM Management\n'));
  
  console.log(chalk.bold('Commands:'));
  console.log('  devcompass llm add           Add a new LLM provider');
  console.log('  devcompass llm list          List all providers');
  console.log('  devcompass llm default       Set default provider');
  console.log('  devcompass llm update        Update provider settings');
  console.log('  devcompass llm remove        Remove a provider');
  console.log('  devcompass llm enable        Enable a provider');
  console.log('  devcompass llm disable       Disable a provider');
  console.log('  devcompass llm test          Test provider connection');
  console.log('  devcompass llm stats         Show usage statistics');
  
  console.log(chalk.bold('\nExamples:'));
  console.log('  # Add OpenAI provider');
  console.log('  devcompass llm add --provider openai --token sk-xxx --model gpt-4');
  console.log();
  console.log('  # Add Anthropic provider');
  console.log('  devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet-20241022');
  console.log();
  console.log('  # Add local Ollama');
  console.log('  devcompass llm add --provider local --model llama3 --base-url http://localhost:11434');
  console.log();
  console.log('  # Set default');
  console.log('  devcompass llm default openai');
  console.log();
  console.log('  # Test connection');
  console.log('  devcompass llm test openai');
  console.log();
  console.log('  # View usage');
  console.log('  devcompass llm stats');
  console.log();
}

module.exports = {
  addProvider,
  listProviders,
  setDefaultProvider,
  updateProvider,
  removeProvider,
  toggleProvider,
  testProvider,
  showStats,
  showHelp
};