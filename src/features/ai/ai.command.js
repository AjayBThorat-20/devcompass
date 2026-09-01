// src/features/ai/ai.command.js

const chalk = require('chalk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const tokenManager = require('./token.manager');
const conversationManager = require('./conversation.manager');
const contextBuilder = require('./context.builder');
const costTracker = require('./cost.tracker');
const aiDatabase = require('./ai.database');
const promptTemplates = require('./prompt.templates');
const RateLimiter = require('../../shared/utils/rate-limiter');

let currentProvider = null;
const rateLimiter = new RateLimiter(10, 60000);
const DAILY_COST_LIMIT = 10.0;

function setupCancellation() {
  process.removeAllListeners('SIGINT');
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️ Cancelling AI request...'));
    if (currentProvider?.cancel) currentProvider.cancel();
    console.log(chalk.gray('Request cancelled.\n'));
    process.exit(0);
  });
}

// Backed by ai_conversations (persisted per-request, with a real timestamp) rather
// than an in-memory counter — each `devcompass ai ask` is a fresh CLI process, so an
// in-memory-only counter reset to 0 on every single invocation and never actually
// stopped anyone from blowing past the daily limit across separate commands.
function getTodaySpend() {
  try {
    return aiDatabase.getTodaySpend();
  } catch (error) {
    if (process.env.DEBUG) console.error('Could not read today\'s AI spend:', error.message);
    return 0;
  }
}

function checkDailyCostLimit(estimatedCost) {
  const todaySpend = getTodaySpend();
  if (todaySpend + estimatedCost > DAILY_COST_LIMIT) {
    throw new Error(`Daily cost limit reached ($${DAILY_COST_LIMIT}). Spent $${todaySpend.toFixed(2)} today.`);
  }
}

async function getProvider() {
  try {
    const provider = tokenManager.getProvider();
    if (!provider) {
      console.log(chalk.red('\n❌ No AI provider configured'));
      console.log(chalk.cyan('\nSetup:\n  devcompass llm add --provider openai --token YOUR_API_KEY\n'));
      return null;
    }
    return provider;
  } catch (error) {
    if (error.message.includes('No default provider')) {
      console.log(chalk.red('\n❌ No AI provider configured'));
      console.log(chalk.cyan('\n  devcompass llm add --provider openai --token YOUR_API_KEY\n'));
    } else {
      console.log(chalk.red('\n❌ AI Provider Error:'), chalk.gray(error.message + '\n'));
    }
    return null;
  }
}

async function askQuestion(question, projectPath = process.cwd(), options = {}) {
  setupCancellation();
  try {
    if (!rateLimiter.tryAcquire()) {
      const wait = Math.ceil(rateLimiter.getTimeUntilReset() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${wait} seconds.`);
    }

    const provider = await getProvider();
    if (!provider) return;
    currentProvider = provider;

    const resolvedPath = path.resolve(options.projectPath || projectPath || process.cwd());
    const context = options.context || await contextBuilder.buildContext(resolvedPath);

    const conversationId = options.conversationId || uuidv4();
    // Prior turns for this conversationId, read *before* the current question is
    // appended below — this is what actually gives multi-turn chat memory. It
    // only has anything in it when the caller (startChat) reuses the same
    // conversationId across turns instead of leaving it to default to a fresh
    // uuid every call.
    const priorMessages = typeof conversationManager.getMessages === 'function'
      ? conversationManager.getMessages(conversationId).slice(-10).map(m => ({ role: m.role, content: m.content }))
      : [];

    if (typeof conversationManager.addMessage === 'function') {
      await conversationManager.addMessage(conversationId, 'user', question);
    }

    const messages = [
      { role: 'system', content: promptTemplates.getSystemPrompt('qa') },
      ...priorMessages,
      { role: 'user', content: promptTemplates.buildAnalysisContext(context, question) }
    ];

    const estimatedInputTokens = Math.ceil(JSON.stringify(messages).length / 4);
    // Bounded by the actual max output the request can produce (rather than a
    // flat guess of 500) so the pre-flight daily-cost check is a real upper
    // bound instead of routinely underestimating long streamed responses.
    const assumedMaxOutputTokens = options.maxTokens || 2000;
    const estimatedCost = provider.estimateCost ? provider.estimateCost(estimatedInputTokens, assumedMaxOutputTokens) : 0;
    checkDailyCostLimit(estimatedCost);

    let fullResponse = '';
    let hasOutput = false;
    let actualUsage = null;
    process.stdout.write(chalk.cyan('\n🤖 '));

    try {
      actualUsage = await provider.streamPrompt(messages, (chunk) => {
        if (chunk?.trim()) { process.stdout.write(chunk); fullResponse += chunk; hasOutput = true; }
      }, options);
    } catch (streamError) {
      // Node's dual-stack connection errors (e.g. a refused localhost connection to
      // Ollama) surface as an AggregateError with an empty top-level `.message`.
      const errorMessage = streamError.message || streamError.code || streamError.errors?.[0]?.message || 'Unknown error';
      console.error(chalk.red('\n\n❌ Streaming Error:'), errorMessage);
      if (streamError.code === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
        console.log(chalk.yellow('\n💡 Is Ollama running? Start with: ollama serve\n'));
      }
      currentProvider = null;
      return;
    }

    process.stdout.write('\n\n');

    if (!hasOutput || !fullResponse.trim()) {
      console.log(chalk.yellow('⚠️  Received empty response from AI provider'));
      console.log(chalk.gray('  devcompass llm test local\n'));
      currentProvider = null;
      return;
    }

    if (typeof conversationManager.addMessage === 'function') {
      await conversationManager.addMessage(conversationId, 'assistant', fullResponse);
    }

    // A provider legitimately reporting 0 tokens (e.g. local/Ollama, which
    // doesn't return usage at all) is real data, not a missing value — `||`
    // would treat that 0 as falsy and silently substitute the rough estimate,
    // permanently skewing persisted token totals for that provider.
    const finalInputTokens = typeof actualUsage?.inputTokens === 'number' ? actualUsage.inputTokens : estimatedInputTokens;
    const finalOutputTokens = typeof actualUsage?.outputTokens === 'number' ? actualUsage.outputTokens : Math.ceil(fullResponse.length / 4);
    const finalCost = provider.estimateCost ? provider.estimateCost(finalInputTokens, finalOutputTokens) : 0;

    const providerId = provider?.config?.id || provider?.id;
    if (providerId) {
      costTracker.trackUsage(providerId, finalInputTokens + finalOutputTokens, finalCost);
      try {
        await conversationManager.saveConversation(providerId, 'ask', null, question, fullResponse, finalInputTokens + finalOutputTokens, finalCost);
      } catch (error) {
        if (process.env.DEBUG) console.error('Could not persist conversation:', error.message);
      }
    }

    const todaySpend = getTodaySpend();
    console.log(chalk.gray(`💰 Cost: $${finalCost.toFixed(4)} | Daily: $${todaySpend.toFixed(2)}/$${DAILY_COST_LIMIT}`));
    currentProvider = null;
  } catch (error) {
    currentProvider = null;
    if (error.message === 'Request cancelled by user') { console.log(chalk.yellow('\nOperation cancelled.')); return; }
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (process.env.DEBUG) console.error(chalk.gray(error.stack));
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
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log(chalk.cyan('\n💬 DevCompass AI Chat\n'));
    console.log(chalk.gray('Type your questions. Ctrl+C to exit.\n'));

    // A single stable conversationId for the whole chat session — askQuestion
    // defaults to a fresh uuid per call when none is given, which made every
    // "chat" turn a brand-new conversation with no memory of previous ones.
    const chatOptions = { ...options, conversationId: options.conversationId || uuidv4() };

    const askLoop = () => {
      rl.question(chalk.green('You: '), async (input) => {
        if (!input.trim()) return askLoop();
        await askQuestion(input, projectPath, chatOptions);
        askLoop();
      });
    };
    askLoop();
  } catch (error) {
    currentProvider = null;
    console.error(chalk.red('\n❌ Error:'), error.message);
  }
}

module.exports = { askQuestion, getRecommendations, getAlternatives, startChat };