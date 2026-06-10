const chalk = require('chalk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const tokenManager = require('../ai/token-manager');
const conversationManager = require('../ai/conversation');
const contextBuilder = require('../ai/context-builder');
const costTracker = require('../ai/cost-tracker');
const promptTemplates = require('../ai/prompt-templates');
const RateLimiter = require('../utils/rate-limiter');

let currentProvider = null;
const rateLimiter = new RateLimiter(10, 60000);
const costLimiter = { dailyLimit: 10.0, currentSpend: 0, lastReset: Date.now() };

function setupCancellation() {
  process.removeAllListeners('SIGINT');

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️ Cancelling AI request...'));

    if (currentProvider && typeof currentProvider.cancel === 'function') {
      currentProvider.cancel();
    }

    console.log(chalk.gray('Request cancelled.\n'));
    process.exit(0);
  });
}

function checkDailyCostLimit(estimatedCost) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (now - costLimiter.lastReset > dayMs) {
    costLimiter.currentSpend = 0;
    costLimiter.lastReset = now;
  }

  if (costLimiter.currentSpend + estimatedCost > costLimiter.dailyLimit) {
    throw new Error(`Daily cost limit reached ($${costLimiter.dailyLimit}). Resets in ${Math.ceil((dayMs - (now - costLimiter.lastReset)) / 3600000)} hours.`);
  }
}

async function getProvider() {
  try {
    const provider = tokenManager.getProvider();

    if (!provider) {
      console.log(chalk.red('\n❌ No AI provider configured'));
      console.log(chalk.cyan('\nTo set up an AI provider:'));
      console.log(chalk.white('  devcompass llm add --provider openai --token YOUR_API_KEY'));
      console.log(chalk.white('  devcompass llm add --provider anthropic --token YOUR_API_KEY'));
      console.log(chalk.white('  devcompass llm add --provider google --token YOUR_GOOGLE_KEY\n'));
      return null;
    }

    return provider;
  } catch (error) {
    if (error.message.includes('No default provider configured')) {
      console.log(chalk.red('\n❌ No AI provider configured'));
      console.log(chalk.cyan('\nTo set up an AI provider:'));
      console.log(chalk.white('  devcompass llm add --provider openai --token YOUR_API_KEY'));
      console.log(chalk.white('  devcompass llm add --provider anthropic --token YOUR_API_KEY'));
      console.log(chalk.white('  devcompass llm add --provider google --token YOUR_GOOGLE_KEY\n'));
    } else {
      console.log(chalk.red('\n❌ AI Provider Error:'));
      console.log(chalk.gray(error.message + '\n'));
    }
    return null;
  }
}

function getProviderId(provider) {
  return provider?.config?.id || provider?.id || null;
}

async function askQuestion(question, projectPath = process.cwd(), options = {}) {
  setupCancellation();

  try {
    if (!rateLimiter.tryAcquire()) {
      const timeUntilReset = Math.ceil(rateLimiter.getTimeUntilReset() / 1000);
      throw new Error(`Rate limit exceeded (10 requests per minute). Please wait ${timeUntilReset} seconds.`);
    }

    const provider = await getProvider();
    if (!provider) return;

    currentProvider = provider;

    const resolvedProjectPath = path.resolve(options.projectPath || projectPath || process.cwd());

    const context = options.context || await contextBuilder.buildContext(resolvedProjectPath);

    // Only show "excellent health" for simple health checks with no issues
    const isSimpleHealthCheck = question.toLowerCase().includes('health') && 
                                question.split(' ').length < 10;
    
    if (context && context.analysis && 
        context.analysis.totalIssues === 0 && 
        isSimpleHealthCheck) {
      console.log(chalk.green('\n✅ Your project is in excellent health!'));
      console.log(chalk.gray('Health Score: ' + (context.analysis.healthScore || 10.0) + '/10'));
      console.log(chalk.gray('No issues detected.\n'));
      currentProvider = null;
      return;
    }

    const conversationId = options.conversationId || uuidv4();
    
    if (typeof conversationManager.addMessage === 'function') {
      conversationManager.addMessage(conversationId, 'user', question);
    }

    const messages = [
      {
        role: 'system',
        content: promptTemplates.getSystemPrompt('qa')
      },
      {
        role: 'user',
        content: promptTemplates.buildAnalysisContext(context, question)
      }
    ];

    const estimatedInputTokens = Math.ceil(JSON.stringify(messages).length / 4);
    const estimatedCost = provider.estimateCost ? provider.estimateCost(estimatedInputTokens, 500) : 0;

    checkDailyCostLimit(estimatedCost);

    let fullResponse = '';
    let hasOutput = false;

    process.stdout.write(chalk.cyan('\n🤖 '));

    // ADD ERROR HANDLING FOR STREAM
    try {
      await provider.streamPrompt(messages, (chunk) => {
        if (chunk && chunk.trim()) {
          process.stdout.write(chunk);
          fullResponse += chunk;
          hasOutput = true;
        }
      }, options);
    } catch (streamError) {
      console.error(chalk.red('\n\n❌ Streaming Error:'), streamError.message);
      
      // Check if it's an Ollama connection error
      if (streamError.message.includes('ECONNREFUSED') || 
          streamError.message.includes('connect')) {
        console.log(chalk.yellow('\n💡 Is Ollama running?'));
        console.log(chalk.gray('   Start it with: ollama serve'));
        console.log(chalk.gray('   Or check: curl http://localhost:11434/api/tags\n'));
      }
      
      currentProvider = null;
      return;
    }

    process.stdout.write('\n\n');

    // CHECK IF RESPONSE IS EMPTY
    if (!hasOutput || !fullResponse.trim()) {
      console.log(chalk.yellow('⚠️  Received empty response from AI provider'));
      console.log(chalk.gray('This might indicate:'));
      console.log(chalk.gray('  • Model not loaded'));
      console.log(chalk.gray('  • Provider connection issue'));
      console.log(chalk.gray('  • Model context too small\n'));
      console.log(chalk.cyan('Try:'));
      console.log(chalk.white('  devcompass llm test local'));
      console.log(chalk.white('  ollama list\n'));
      currentProvider = null;
      return;
    }

    if (typeof conversationManager.addMessage === 'function') {
      conversationManager.addMessage(conversationId, 'assistant', fullResponse);
    }

    const estimatedOutput = Math.ceil(fullResponse.length / 4);
    const finalCost = provider.estimateCost ? provider.estimateCost(estimatedInputTokens, estimatedOutput) : 0;

    costLimiter.currentSpend += finalCost;

    const providerId = getProviderId(provider);

    if (providerId) {
      costTracker.trackUsage(providerId, estimatedInputTokens + estimatedOutput, finalCost);
    }

    console.log(chalk.gray(`💰 Cost: $${finalCost.toFixed(4)} | Daily: $${costLimiter.currentSpend.toFixed(2)}/$${costLimiter.dailyLimit}`));

    currentProvider = null;
  } catch (error) {
    currentProvider = null;

    if (error.message === 'Request cancelled by user') {
      console.log(chalk.yellow('\nOperation cancelled by user'));
      return;
    }

    console.error(chalk.red('\n❌ Error:'), error.message);
    
    // ADD DEBUGGING HELP
    if (process.env.DEBUG) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
  }
}

async function getRecommendations(projectPath = process.cwd(), options = {}) {
  return askQuestion('Analyze this project and provide recommendations.', projectPath, options);
}

async function getAlternatives(packageName, projectPath = process.cwd(), options = {}) {
  return askQuestion(`Suggest alternatives for package: ${packageName}`, projectPath, options);
}

async function startChat(projectPath = process.cwd(), options = {}) {
  setupCancellation();

  try {
    const provider = await getProvider();
    if (!provider) return;

    currentProvider = provider;

    const readline = require('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan('\n💬 DevCompass AI Chat\n'));
    console.log(chalk.gray('Type your questions. Ctrl+C to exit.\n'));

    const askLoop = () => {
      rl.question(chalk.green('You: '), async (input) => {
        if (!input.trim()) {
          return askLoop();
        }

        await askQuestion(input, projectPath, options);

        askLoop();
      });
    };

    askLoop();
  } catch (error) {
    currentProvider = null;
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

module.exports = {
  askQuestion,
  getRecommendations,
  getAlternatives,
  startChat
};