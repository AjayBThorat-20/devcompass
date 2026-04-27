#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { analyze } = require('../src/commands/analyze');
const fix = require('../src/commands/fix');
const backup = require('../src/commands/backup');
const config = require('../src/commands/config');
const packageJson = require('../package.json');

// Check if running from local node_modules
const isLocalInstall = __dirname.includes('node_modules');
if (isLocalInstall && process.argv.includes('analyze')) {
  console.log(chalk.yellow('\n⚠️  DevCompass is installed locally as a dependency.'));
  console.log(chalk.yellow('   For best results, install globally:'));
  console.log(chalk.cyan('   npm install -g devcompass\n'));
}

const program = new Command();

program
  .name('devcompass')
  .description('Dependency health checker with AI-powered insights')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
${chalk.gray('New in v3.2.2:')} 🤖 AI-powered dependency analysis
  `);

// Analyze command (UPDATED with --ai flag)
program
  .command('analyze')
  .description('Analyze your project dependencies')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--json', 'Output results as JSON')
  .option('--ci', 'CI mode - exit with error code if score below threshold')
  .option('--silent', 'Silent mode - no output')
  .option('--no-history', 'Skip saving snapshot to history database')
  .option('--ai', '🤖 Get AI-powered insights and recommendations')
  .option('--ai-provider <provider>', 'AI provider to use (openai, anthropic, google, local)')
  .addHelpText('after', `

${chalk.bold('Analysis Examples:')}
  ${chalk.cyan('devcompass analyze')}                 Analyze current project & save snapshot
  ${chalk.cyan('devcompass analyze --ai')}            Analyze with AI insights 🤖
  ${chalk.cyan('devcompass analyze --no-history')}    Analyze without saving to history
  ${chalk.cyan('devcompass analyze --json')}          Output as JSON
  ${chalk.cyan('devcompass analyze --ci')}            CI mode with exit codes

${chalk.bold('🤖 AI-Powered Analysis:')}
  • Get intelligent recommendations
  • Understand why packages are outdated
  • Learn about breaking changes
  • See migration paths
  • Prioritized action plan

${chalk.bold('History Tracking:')}
  • Snapshots auto-saved to SQLite database
  • Compare changes over time
  • View dependency evolution
  • Use ${chalk.cyan('--no-history')} to disable
  `)
  .action(analyze);

// Fix command with batch mode support
program
  .command('fix')
  .description('Fix issues automatically (remove unused, update safe packages)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('--dry-run', 'Show what would be fixed without making changes')
  .option('--dry', 'Alias for --dry-run')
  .option('--batch', 'Interactive batch mode - select which categories to fix')
  .option('--batch-mode <mode>', 'Preset batch mode: critical, high, all')
  .option('--only <categories>', 'Fix only specific categories (comma-separated: supply-chain,license,quality,security,ecosystem,unused,updates)')
  .option('--skip <categories>', 'Skip specific categories (comma-separated)')
  .option('--verbose', 'Show detailed output')
  .addHelpText('after', `

${chalk.bold('Batch Mode Examples:')}
  ${chalk.cyan('devcompass fix --batch')}                    Interactive batch selection
  ${chalk.cyan('devcompass fix --batch-mode critical')}      Fix critical issues only
  ${chalk.cyan('devcompass fix --batch-mode high')}          Fix high-priority issues
  ${chalk.cyan('devcompass fix --batch-mode all')}           Fix all safe issues
  ${chalk.cyan('devcompass fix --only supply-chain,license')} Fix specific categories
  ${chalk.cyan('devcompass fix --skip updates')}             Skip updates category

${chalk.bold('Available Categories:')}
  ${chalk.red('supply-chain')} - Malicious packages, typosquatting
  ${chalk.yellow('license')}      - GPL/AGPL/LGPL conflicts
  ${chalk.blue('quality')}      - Abandoned/deprecated packages
  ${chalk.red('security')}     - npm audit vulnerabilities
  ${chalk.yellow('ecosystem')}    - Known package issues
  ${chalk.cyan('unused')}       - Unused dependencies
  ${chalk.green('updates')}      - Safe version updates
  `)
  .action(fix);

// Backup command
program
  .command('backup <action>')
  .description('Manage backups (list, restore, clean, info)')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-n, --name <name>', 'Backup name (for restore/info commands)')
  .option('-f, --force', 'Skip confirmation prompts', false)
  .option('--keep <number>', 'Number of backups to keep (for clean command)', parseInt, 5)
  .addHelpText('after', `

${chalk.bold('Backup Examples:')}
  ${chalk.cyan('devcompass backup list')}                          List all backups
  ${chalk.cyan('devcompass backup restore --name <backup-name>')}  Restore from backup
  ${chalk.cyan('devcompass backup info --name <backup-name>')}     Show backup details
  ${chalk.cyan('devcompass backup clean')}                         Remove old backups (keeps 5)
  ${chalk.cyan('devcompass backup clean --keep 3')}                Keep only 3 backups
  `)
  .action((action, options) => {
    backup(action, options);
  });

// Graph command
program
  .command('graph')
  .description('Generate dependency graph visualization')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-o, --output <file>', 'Output file', 'dependency-graph.html')
  .option('-f, --format <format>', 'Output format: html, svg, json, png')
  .option('-l, --layout <type>', 'Layout: tree, force, radial, conflict', 'tree')
  .option('-d, --depth <number>', 'Maximum depth to traverse', parseInt, Infinity)
  .option('--filter <filter>', 'Filter: all, vulnerable, outdated, unused', 'all')
  .option('-w, --width <number>', 'Graph width in pixels', parseInt, 1200)
  .option('-h, --height <number>', 'Graph height in pixels', parseInt, 800)
  .option('--open', 'Open in browser (HTML only)', false)
  .action(async (options) => {
    const graphCommand = require('../src/commands/graph');
    await graphCommand(options);
  });

// History command with FLEXIBLE DATE FORMATS
program
  .command('history <subcommand>')
  .description('Manage analysis history and snapshots')
  .option('--limit <number>', 'Limit number of results', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('--keep <number>', 'Number of snapshots to keep (cleanup only)', parseInt, 30)
  .option('--date <date>', 'Specific date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--from <date>', 'Start date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--to <date>', 'End date (DD-MM-YYYY or YYYY-MM-DD)')
  .option('--after <date>', 'After date (alias for --from)')
  .option('--before <date>', 'Before date (alias for --to)')
  .option('--month <month>', 'Specific month (MM-YYYY or YYYY-MM)')
  .option('--year <year>', 'Specific year (YYYY)')
  .addHelpText('after', `

${chalk.bold('History Subcommands:')}
  ${chalk.cyan('list')}      List all saved snapshots
  ${chalk.cyan('show')}      Show snapshot details
  ${chalk.cyan('summary')}   Show monthly summary
  ${chalk.cyan('cleanup')}   Delete old snapshots
  ${chalk.cyan('stats')}     Show history statistics

${chalk.bold('📅 Supported Date Formats:')}
  ${chalk.cyan('DD-MM-YYYY')}    Day: ${chalk.white('25-04-2026')} ${chalk.dim('(April 25, 2026)')}
  ${chalk.cyan('MM-YYYY')}       Month: ${chalk.white('04-2026')} ${chalk.dim('(April 2026)')}
  ${chalk.cyan('YYYY')}          Year: ${chalk.white('2026')} ${chalk.dim('(Full year 2026)')}
  ${chalk.cyan('YYYY-MM-DD')}    ISO date: ${chalk.white('2026-04-25')} ${chalk.dim('(April 25, 2026)')}
  ${chalk.cyan('YYYY-MM')}       ISO month: ${chalk.white('2026-04')} ${chalk.dim('(April 2026)')}

${chalk.bold('Basic Examples:')}
  ${chalk.gray('devcompass history list')}                     List all snapshots
  ${chalk.gray('devcompass history list --limit 50')}          List last 50 snapshots
  ${chalk.gray('devcompass history show 5')}                   Show snapshot #5 details
  ${chalk.gray('devcompass history summary')}                  Monthly breakdown
  ${chalk.gray('devcompass history cleanup --keep 20')}        Keep only last 20 snapshots
  ${chalk.gray('devcompass history stats')}                    Show overall statistics
  `)
  .action(async (subcommand, options) => {
    const historyCommand = require('../src/commands/history');
    await historyCommand({ ...options, _: ['history', subcommand] });
  });

// Compare command
program
  .command('compare <id1> <id2>')
  .description('Compare two analysis snapshots')
  .option('-o, --output <file>', 'Save comparison report to file')
  .option('--verbose', 'Show detailed comparison', false)
  .addHelpText('after', `

${chalk.bold('Compare Examples:')}
  ${chalk.cyan('devcompass compare 5 8')}                    Compare snapshots #5 and #8
  ${chalk.cyan('devcompass compare 5 8 --verbose')}          Detailed comparison
  ${chalk.cyan('devcompass compare 5 8 -o report.md')}       Save to markdown file

${chalk.bold('What Gets Compared:')}
  • Added/removed packages
  • Version changes
  • Health score changes
  • Vulnerability status changes
  `)
  .action(async (id1, id2, options) => {
    const compareCommand = require('../src/commands/compare');
    await compareCommand({ ...options, _: ['compare', id1, id2] });
  });

// Timeline command
program
  .command('timeline')
  .description('View dependency evolution timeline')
  .option('--days <number>', 'Number of days to include', parseInt, 30)
  .option('--project <name>', 'Filter by project name')
  .option('-o, --open', 'Open interactive timeline in browser', false)
  .option('--output <file>', 'Output file path', 'devcompass-timeline.html')
  .addHelpText('after', `

${chalk.bold('Timeline Examples:')}
  ${chalk.cyan('devcompass timeline')}                Show last 30 days
  ${chalk.cyan('devcompass timeline --days 60')}      Show last 60 days
  ${chalk.cyan('devcompass timeline --open')}         Open interactive chart
  `)
  .action(async (options) => {
    const timelineCommand = require('../src/commands/timeline');
    await timelineCommand(options);
  });

// ===========================
// NEW v3.2.2 - LLM Management Command - FIXED
// ===========================
program
  .command('llm')
  .description('🤖 Manage AI/LLM providers and settings')
  .argument('[subcommand]', 'LLM subcommand (add, list, default, update, remove, enable, disable, test, stats)')
  .argument('[provider]', 'Provider name for specific operations')
  .option('--provider <name>', 'Provider name (openai, anthropic, google, local)')
  .option('--token <token>', 'API token/key')
  .option('--model <model>', 'Model name')
  .option('--base-url <url>', 'Base URL (for local models)')
  .option('--year <year>', 'Year for stats (default: current)')
  .option('--month <month>', 'Month for stats (1-12)')
  .addHelpText('after', `

${chalk.bold('🤖 LLM Subcommands:')}
  ${chalk.cyan('add')}        Add a new AI provider
  ${chalk.cyan('list')}       List all configured providers
  ${chalk.cyan('default')}    Set default provider
  ${chalk.cyan('update')}     Update provider settings
  ${chalk.cyan('remove')}     Remove a provider
  ${chalk.cyan('enable')}     Enable a provider
  ${chalk.cyan('disable')}    Disable a provider
  ${chalk.cyan('test')}       Test provider connection
  ${chalk.cyan('stats')}      Show AI usage statistics

${chalk.bold('Provider Setup Examples:')}

  ${chalk.bold('OpenAI (GPT-4):')}
  ${chalk.gray('devcompass llm add --provider openai --token sk-xxx --model gpt-4')}
  ${chalk.gray('devcompass llm add --provider openai --token sk-xxx --model gpt-4-turbo')}
  ${chalk.gray('devcompass llm add --provider openai --token sk-xxx --model gpt-3.5-turbo')}

  ${chalk.bold('Anthropic (Claude):')}
  ${chalk.gray('devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet-20241022')}
  ${chalk.gray('devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-opus-20240229')}
  ${chalk.gray('devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-haiku-20240307')}

  ${chalk.bold('Google (Gemini):')}
  ${chalk.gray('devcompass llm add --provider google --token xxx --model gemini-pro')}
  ${chalk.gray('devcompass llm add --provider google --token xxx --model gemini-1.5-pro')}

  ${chalk.bold('Local Models (Ollama):')}
  ${chalk.gray('devcompass llm add --provider local --model llama3 --base-url http://localhost:11434')}
  ${chalk.gray('devcompass llm add --provider local --model mistral --base-url http://localhost:11434')}
  ${chalk.gray('devcompass llm add --provider local --model codellama --base-url http://localhost:11434')}

${chalk.bold('Management Examples:')}
  ${chalk.gray('devcompass llm list')}                          List all providers
  ${chalk.gray('devcompass llm default openai')}                Set OpenAI as default
  ${chalk.gray('devcompass llm test openai')}                   Test OpenAI connection
  ${chalk.gray('devcompass llm update openai --token sk-new')}  Update token
  ${chalk.gray('devcompass llm remove openai')}                 Remove OpenAI
  ${chalk.gray('devcompass llm stats')}                         Show usage stats

${chalk.bold('How to Get API Tokens:')}

  ${chalk.bold('OpenAI:')}
  1. Visit: ${chalk.cyan('https://platform.openai.com/api-keys')}
  2. Create new API key
  3. Copy token (starts with sk-)

  ${chalk.bold('Anthropic:')}
  1. Visit: ${chalk.cyan('https://console.anthropic.com/settings/keys')}
  2. Create API key
  3. Copy token (starts with sk-ant-)

  ${chalk.bold('Google:')}
  1. Visit: ${chalk.cyan('https://makersuite.google.com/app/apikey')}
  2. Create API key
  3. Copy token

  ${chalk.bold('Local (Ollama):')}
  1. Install: ${chalk.gray('curl -fsSL https://ollama.com/install.sh | sh')}
  2. Start: ${chalk.gray('ollama serve')}
  3. Pull model: ${chalk.gray('ollama pull llama3')}
  4. No token needed!

${chalk.bold('Database Location:')}
  ${chalk.dim('~/.devcompass/ai.db')}

${chalk.bold('Security:')}
  • Tokens encrypted with AES-256-GCM
  • Stored locally (never sent to DevCompass)
  • Machine-specific encryption key
  `)
  .action(async (subcommand, provider, options) => {
    const llmCommand = require('../src/commands/llm');

    // Handle provider from either argument or option
    const providerName = provider || options.provider;

    switch (subcommand) {
      case 'add':
        await llmCommand.addProvider(options);
        break;
      case 'list':
        llmCommand.listProviders();
        break;
      case 'default':
        llmCommand.setDefaultProvider(providerName);
        break;
      case 'update':
        llmCommand.updateProvider(providerName, options);
        break;
      case 'remove':
        llmCommand.removeProvider(providerName);
        break;
      case 'enable':
        llmCommand.toggleProvider(providerName, true);
        break;
      case 'disable':
        llmCommand.toggleProvider(providerName, false);
        break;
      case 'test':
        await llmCommand.testProvider(providerName);
        break;
      case 'stats':
        llmCommand.showStats(options);
        break;
      default:
        llmCommand.showHelp();
    }
  });

// ===========================
// NEW v3.2.2 - AI Analysis Command - FIXED
// ===========================
program
  .command('ai')
  .description('🤖 AI-powered dependency analysis and recommendations')
  .argument('[subcommand]', 'AI subcommand (ask, recommend, alternatives, chat)')
  .argument('[args...]', 'Additional arguments')
  .option('--provider <name>', 'AI provider to use (openai, anthropic, google, local)')
  .option('--stream', 'Stream responses in real-time', true)
  .option('--no-stream', 'Wait for complete response')
  .option('--verbose', 'Show detailed information (token usage, cost)')
  .option('--max-tokens <number>', 'Maximum tokens per request', parseInt, 3000)
  .addHelpText('after', `

${chalk.bold('🤖 AI Subcommands:')}
  ${chalk.cyan('ask')}           Ask AI about your dependencies
  ${chalk.cyan('recommend')}     Get AI-powered recommendations
  ${chalk.cyan('alternatives')}  Find package alternatives with AI
  ${chalk.cyan('chat')}          Start interactive AI chat

${chalk.bold('AI Analysis Examples:')}

  ${chalk.bold('Ask Questions:')}
  ${chalk.gray('devcompass ai ask "Why is my health score low?"')}
  ${chalk.gray('devcompass ai ask "Should I update axios now?"')}
  ${chalk.gray('devcompass ai ask "What are the risks of updating to React 19?"')}
  ${chalk.gray('devcompass ai ask "How do I fix this security vulnerability?"')}

  ${chalk.bold('Get Recommendations:')}
  ${chalk.gray('devcompass analyze --ai')}                  ${chalk.dim('# Analyze with AI insights')}
  ${chalk.gray('devcompass ai recommend')}                  ${chalk.dim('# After analyze command')}

  ${chalk.bold('Find Alternatives:')}
  ${chalk.gray('devcompass ai alternatives moment')}        ${chalk.dim('# Better alternatives to moment.js')}
  ${chalk.gray('devcompass ai alternatives request')}       ${chalk.dim('# Alternatives to deprecated packages')}
  ${chalk.gray('devcompass ai alternatives lodash')}        ${chalk.dim('# Smaller alternatives')}

  ${chalk.bold('Interactive Chat:')}
  ${chalk.gray('devcompass ai chat')}                       ${chalk.dim('# Start conversation')}
  ${chalk.gray('devcompass ai chat --provider anthropic')}  ${chalk.dim('# Use specific provider')}

${chalk.bold('What AI Can Help With:')}
  • Explain why packages are outdated
  • Identify breaking changes in updates
  • Suggest migration strategies
  • Find better alternatives
  • Prioritize updates by risk
  • Explain security vulnerabilities
  • Provide step-by-step fixes
  • Answer questions about dependencies

${chalk.bold('AI Capabilities:')}
  • Context-aware (knows your project details)
  • Real-time streaming responses
  • Natural language Q&A
  • Code examples and migration guides
  • Cost tracking (tokens + estimated $)
  • Conversation history

${chalk.bold('Provider Selection:')}
  Use ${chalk.cyan('--provider')} flag to choose:
  • ${chalk.cyan('openai')} - GPT-4, GPT-3.5-turbo (fast, accurate)
  • ${chalk.cyan('anthropic')} - Claude 3.5 Sonnet (smart, detailed)
  • ${chalk.cyan('google')} - Gemini Pro (good, free tier)
  • ${chalk.cyan('local')} - Llama3, Mistral (free, private)

  If not specified, uses default provider from ${chalk.cyan('devcompass llm default')}

${chalk.bold('Cost Information:')}
  • OpenAI GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output
  • Anthropic Claude: ~$0.003 per 1K input, ~$0.015 per 1K output
  • Google Gemini: ~$0.00025 per 1K input, ~$0.0005 per 1K output
  • Local models: FREE! (runs on your machine)

  View usage: ${chalk.cyan('devcompass llm stats')}

${chalk.bold('Privacy & Security:')}
  • Your code is never sent to AI (only analysis metadata)
  • Tokens stored encrypted locally
  • Conversations saved locally for context
  • You control which provider to use
  • Local models = complete privacy

${chalk.bold('First Time Setup:')}
  1. Add an AI provider:
     ${chalk.gray('devcompass llm add --provider openai --token sk-xxx --model gpt-4')}
  
  2. Test connection:
     ${chalk.gray('devcompass llm test openai')}
  
  3. Start using AI:
     ${chalk.gray('devcompass analyze --ai')}
     ${chalk.gray('devcompass ai ask "Help me understand my dependencies"')}
  `)
  .action(async (subcommand, args, options) => {
    const aiCommand = require('../src/commands/ai');
    const contextBuilder = require('../src/ai/context-builder');

    // Get current analysis context if available
    let context = null;
    try {
      const cacheFile = path.join(process.cwd(), '.devcompass-cache.json');
      if (fs.existsSync(cacheFile)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        context = contextBuilder.buildAnalysisContext(cacheData);
      }
    } catch (error) {
      // No context available, continue without it
    }

    switch (subcommand) {
      case 'ask':
        const question = args.join(' ');
        if (!question) {
          console.log(chalk.red('❌ Error: Question is required'));
          console.log('\nUsage: devcompass ai ask "your question here"');
          return;
        }
        await aiCommand.askQuestion(question, context, options);
        break;

      case 'recommend':
        if (!context) {
          console.log(chalk.yellow('⚠️  No recent analysis found. Run "devcompass analyze" first.'));
          return;
        }
        const analysisData = JSON.parse(fs.readFileSync(path.join(process.cwd(), '.devcompass-cache.json'), 'utf8'));
        await aiCommand.getRecommendations(analysisData, options);
        break;

      case 'alternatives':
        const packageName = args[0];
        if (!packageName) {
          console.log(chalk.red('❌ Error: Package name is required'));
          console.log('\nUsage: devcompass ai alternatives <package-name>');
          return;
        }
        await aiCommand.getAlternatives(packageName, options);
        break;

      case 'chat':
        await aiCommand.startChat(context, options);
        break;

      default:
        aiCommand.showHelp();
    }
  });

// Config command
program
  .command('config')
  .description('Configure DevCompass settings')
  .option('--github-token <token>', 'Set GitHub Personal Access Token')
  .option('--remove-github-token', 'Remove GitHub token')
  .option('--show', 'Show current configuration')
  .addHelpText('after', `

${chalk.bold('GitHub Token Configuration:')}
  ${chalk.cyan('devcompass config --github-token <token>')}  Set GitHub token
  ${chalk.cyan('devcompass config --show')}                  Show current token (masked)
  ${chalk.cyan('devcompass config --remove-github-token')}   Remove GitHub token

${chalk.bold('Why Configure a Token?')}
  • Avoid GitHub API rate limits (60 → 5,000 requests/hour)
  • Enable full package health monitoring
  • Track 500+ popular npm packages
  `)
  .action(config);

program.parse();