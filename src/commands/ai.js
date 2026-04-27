// src/commands/ai.js
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const tokenManager = require('../ai/token-manager');
const conversationManager = require('../ai/conversation');
const costTracker = require('../ai/cost-tracker');
const streamFormatter = require('../utils/stream-formatter');
const { SYSTEM_PROMPTS, buildAnalysisContext } = require('../ai/prompt-templates');
const aiDatabase = require('../ai/database');
const readline = require('readline');

/**
 * Get analysis data from cache
 */
function getAnalysisData() {
  try {
    const cacheFile = path.join(process.cwd(), '.devcompass-cache.json');
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

/**
 * Ask AI a question about the analysis
 */
async function askQuestion(question, context = null, options = {}) {
  if (!question) {
    console.error(chalk.red('❌ Error: Question is required'));
    console.log('\nUsage: devcompass ai ask "your question here"');
    return;
  }

  try {
    const provider = tokenManager.getProvider(options.provider);
    const providerConfig = aiDatabase.getProvider(options.provider || provider.name);

    const analysisData = getAnalysisData();
    let contextText = '';
    if (analysisData) {
      contextText = buildAnalysisContext(analysisData);
    } else if (context) {
      contextText = context;
    }

    const systemPrompt = SYSTEM_PROMPTS.qa;
    let userPrompt = `${contextText}\n\nQuestion: ${question}\n\nAnswer in 2-4 sentences max.`;

    streamFormatter.showTyping('AI is thinking');

    let response;
    if (options.stream !== false) {
      streamFormatter.clearTyping();
      response = await provider.streamPrompt(
        userPrompt,
        systemPrompt,
        (chunk) => streamFormatter.formatChunk(chunk),
        { maxTokens: options.maxTokens || 500 }  // REDUCED
      );
      streamFormatter.finish();
    } else {
      response = await provider.sendPrompt(userPrompt, systemPrompt, {
        maxTokens: options.maxTokens || 500  // REDUCED
      });
      streamFormatter.clearTyping();
      console.log('\n🤖 ' + response.content + '\n');
    }

    const inputCost = provider.estimateCost(response.promptTokens, true);
    const outputCost = provider.estimateCost(response.completionTokens, false);
    const totalCost = inputCost + outputCost;

    costTracker.trackUsage(providerConfig.id, response.tokensUsed, totalCost);
    conversationManager.saveConversation(
      providerConfig.id,
      'ai ask',
      contextText,
      question,
      response.content,
      response.tokensUsed,
      totalCost
    );

    if (options.verbose) {
      console.log(chalk.gray(`\n💡 Tokens used: ${response.tokensUsed.toLocaleString()} (~$${totalCost.toFixed(4)})`));
    }

    return response.content;
  } catch (error) {
    streamFormatter.clearTyping();
    console.error(chalk.red('\n❌ AI Error: ' + error.message));
    
    if (error.message.includes('not found') || error.message.includes('No default provider')) {
      console.log(chalk.yellow('\n💡 Add an LLM provider first:'));
      console.log('   devcompass llm add --provider openai --token sk-xxx --model gpt-4');
    }
  }
}

/**
 * Get AI recommendations
 */
async function getRecommendations(analysisResults, options = {}) {
  try {
    // Get provider
    const provider = tokenManager.getProvider(options.provider);
    const providerConfig = aiDatabase.getProvider(options.provider || provider.name);

    // Build context - use analysisResults directly
    const context = buildAnalysisContext(analysisResults);
    const systemPrompt = SYSTEM_PROMPTS.recommend;
    const userPrompt = `Based on the project analysis above, provide a prioritized action plan with:

🔴 CRITICAL (Do Now):
🟡 HIGH PRIORITY (This Week):
🟢 MEDIUM PRIORITY (This Month):

For each issue, include:
- What it is
- Why it matters
- How to fix it (specific commands)

Be specific and actionable based on the analysis data provided.`;

    console.log(chalk.bold('\n🤖 AI Recommendations\n'));
    streamFormatter.showTyping('Analyzing your project');

    // Get response
    let response;
    if (options.stream !== false) {
      streamFormatter.clearTyping();
      response = await provider.streamPrompt(
        `${context}\n\n${userPrompt}`,
        systemPrompt,
        (chunk) => streamFormatter.formatChunk(chunk),
        { maxTokens: options.maxTokens || 3000 }
      );
      streamFormatter.finish();
    } else {
      response = await provider.sendPrompt(
        `${context}\n\n${userPrompt}`,
        systemPrompt,
        { maxTokens: options.maxTokens || 3000 }
      );
      streamFormatter.clearTyping();
      console.log(response.content + '\n');
    }

    // Calculate cost
    const inputCost = provider.estimateCost(response.promptTokens, true);
    const outputCost = provider.estimateCost(response.completionTokens, false);
    const totalCost = inputCost + outputCost;

    // Track usage
    costTracker.trackUsage(providerConfig.id, response.tokensUsed, totalCost);

    // Save conversation
    conversationManager.saveConversation(
      providerConfig.id,
      'ai recommend',
      context,
      userPrompt,
      response.content,
      response.tokensUsed,
      totalCost
    );

    // Show stats
    if (options.verbose) {
      console.log(chalk.gray(`💡 Tokens used: ${response.tokensUsed.toLocaleString()} (~$${totalCost.toFixed(4)})`));
    }

    return response.content;
  } catch (error) {
    streamFormatter.clearTyping();
    console.error(chalk.red('\n❌ AI Error: ' + error.message));
  }
}

/**
 * Get alternative package suggestions
 */
async function getAlternatives(packageName, options = {}) {
  if (!packageName) {
    console.error(chalk.red('❌ Error: Package name is required'));
    console.log('\nUsage: devcompass ai alternatives <package-name>');
    return;
  }

  try {
    // Get provider
    const provider = tokenManager.getProvider(options.provider);
    const providerConfig = aiDatabase.getProvider(options.provider || provider.name);

    const systemPrompt = SYSTEM_PROMPTS.alternatives;
    const userPrompt = `Suggest the top 3-5 modern alternatives to the npm package "${packageName}".

For each alternative, provide:
1. Package name
2. Bundle size (compared to ${packageName})
3. Key differences
4. Migration difficulty (easy/medium/hard)
5. Current popularity and maintenance status

Also include a brief code example showing how to migrate from ${packageName}.

Be specific, accurate, and practical.`;

    console.log(chalk.bold(`\n🔍 Finding alternatives for "${packageName}"\n`));
    streamFormatter.showTyping('Searching npm ecosystem');

    // Get response
    let response;
    if (options.stream !== false) {
      streamFormatter.clearTyping();
      response = await provider.streamPrompt(
        userPrompt,
        systemPrompt,
        (chunk) => streamFormatter.formatChunk(chunk),
        { maxTokens: options.maxTokens || 2500 }
      );
      streamFormatter.finish();
    } else {
      response = await provider.sendPrompt(userPrompt, systemPrompt, {
        maxTokens: options.maxTokens || 2500
      });
      streamFormatter.clearTyping();
      console.log(response.content + '\n');
    }

    // Calculate cost
    const inputCost = provider.estimateCost(response.promptTokens, true);
    const outputCost = provider.estimateCost(response.completionTokens, false);
    const totalCost = inputCost + outputCost;

    // Track usage
    costTracker.trackUsage(providerConfig.id, response.tokensUsed, totalCost);

    // Save conversation
    conversationManager.saveConversation(
      providerConfig.id,
      'ai alternatives',
      null,
      `alternatives for ${packageName}`,
      response.content,
      response.tokensUsed,
      totalCost
    );

    return response.content;
  } catch (error) {
    streamFormatter.clearTyping();
    console.error(chalk.red('\n❌ AI Error: ' + error.message));
  }
}

/**
 * Interactive AI chat
 */
async function startChat(context = null, options = {}) {
  try {
    // Get provider
    const provider = tokenManager.getProvider(options.provider);
    const providerConfig = aiDatabase.getProvider(options.provider || provider.name);

    // Get analysis data for context
    const analysisData = getAnalysisData();
    let contextText = '';
    
    if (analysisData) {
      contextText = buildAnalysisContext(analysisData);
    } else if (context) {
      contextText = context;
    }

    // Start new session
    conversationManager.startSession();

    console.log(chalk.bold(`\n🤖 DevCompass AI Assistant (powered by ${providerConfig.model})`));
    if (contextText) {
      console.log(chalk.gray('I have access to your project analysis. Ask me anything!'));
    } else {
      console.log(chalk.yellow('⚠️  No analysis data found. Run "devcompass analyze" first for better insights.'));
    }
    console.log(chalk.gray('Type "exit" or "quit" to end the conversation.\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('You: ')
    });

    let totalTokens = 0;
    let totalCost = 0;

    rl.prompt();

    rl.on('line', async (input) => {
      const question = input.trim();

      if (!question) {
        rl.prompt();
        return;
      }

      if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
        console.log(chalk.gray(`\n👋 Chat ended. Used ${totalTokens.toLocaleString()} tokens (~$${totalCost.toFixed(4)})\n`));
        rl.close();
        conversationManager.clearSession();
        return;
      }

      try {
        // Build conversation history
        const history = conversationManager.buildContext(5);
        let userPrompt = question;
        
        if (contextText) {
          userPrompt = `${contextText}\n\nUser: ${question}\n\nProvide a specific answer based on the project analysis above.`;
        }

        // Get response
        const response = await provider.streamPrompt(
          userPrompt,
          SYSTEM_PROMPTS.chat,
          (chunk) => streamFormatter.formatChunk(chunk),
          { maxTokens: 2000 }
        );
        
        streamFormatter.finish();

        // Calculate cost
        const inputCost = provider.estimateCost(response.promptTokens, true);
        const outputCost = provider.estimateCost(response.completionTokens, false);
        const messageCost = inputCost + outputCost;

        totalTokens += response.tokensUsed;
        totalCost += messageCost;

        // Track usage
        costTracker.trackUsage(providerConfig.id, response.tokensUsed, messageCost);

        // Save conversation
        conversationManager.saveConversation(
          providerConfig.id,
          'ai chat',
          contextText,
          question,
          response.content,
          response.tokensUsed,
          messageCost
        );

        rl.prompt();
      } catch (error) {
        console.error(chalk.red('\n❌ Error: ' + error.message + '\n'));
        rl.prompt();
      }
    });

    rl.on('close', () => {
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red('❌ Chat Error: ' + error.message));
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(chalk.bold('\n🤖 DevCompass AI Commands\n'));
  
  console.log(chalk.bold('Commands:'));
  console.log('  devcompass ai ask           Ask AI about your dependencies');
  console.log('  devcompass ai recommend     Get AI recommendations');
  console.log('  devcompass ai alternatives  Find package alternatives');
  console.log('  devcompass ai chat          Start interactive chat');
  
  console.log(chalk.bold('\nExamples:'));
  console.log('  # Ask a question');
  console.log('  devcompass ai ask "Why is my health score low?"');
  console.log();
  console.log('  # Get recommendations after analysis');
  console.log('  devcompass analyze --ai');
  console.log();
  console.log('  # Find alternatives');
  console.log('  devcompass ai alternatives moment');
  console.log();
  console.log('  # Interactive chat');
  console.log('  devcompass ai chat');
  console.log();
}

module.exports = {
  askQuestion,
  getRecommendations,
  getAlternatives,
  startChat,
  showHelp
};