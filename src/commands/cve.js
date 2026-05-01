// src/commands/cve.js
const chalk = require('chalk');
const apiKeyManager = require('../utils/api-key-manager');
const cacheManager = require('../cve/cache-manager');
const encryption = require('../utils/encryption');

async function cveCommand(subcommand, options = {}) {
  // Handle no subcommand - show help
  if (!subcommand) {
    showHelp();
    return;
  }

  switch (subcommand) {
    case 'key':
      await handleKeyCommand(options);
      break;
    case 'test':
      await testKey(options);
      break;
    case 'cache':
      handleCacheCommand(options);
      break;
    default:
      console.log(chalk.red(`\n❌ Unknown subcommand: ${subcommand}\n`));
      showHelp();
  }
}

async function handleKeyCommand(options) {
  const { set, remove, list } = options;

  if (set) {
    // Set NVD API key
    const apiKey = options.apiKey || options.key;
    
    if (!apiKey) {
      console.log(chalk.red('\n❌ API key is required\n'));
      console.log(chalk.bold('Usage:'));
      console.log(chalk.gray('  devcompass cve key --set --api-key <your-key>\n'));
      console.log(chalk.bold('Example:'));
      console.log(chalk.cyan('  devcompass cve key --set --api-key abc123xyz\n'));
      return;
    }

    const success = apiKeyManager.setAPIKey('nvd', apiKey);
    
    if (success) {
      console.log(chalk.green('\n✓ NVD API key saved successfully!\n'));
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray('  1. Test key: ') + chalk.cyan('devcompass cve test'));
      console.log(chalk.gray('  2. Run analysis: ') + chalk.cyan('devcompass analyze\n'));
    } else {
      console.log(chalk.red('\n❌ Failed to save API key\n'));
    }
    return;
  }

  if (remove) {
    const success = apiKeyManager.removeAPIKey('nvd');
    if (success) {
      console.log(chalk.green('\n✓ NVD API key removed\n'));
    } else {
      console.log(chalk.yellow('\n⚠️  No API key found to remove\n'));
    }
    return;
  }

  if (list) {
    const keys = apiKeyManager.listAPIKeys();
    
    console.log(chalk.bold.cyan('\n🔑 API Keys\n'));

    if (keys.length === 0) {
      console.log(chalk.yellow('No API keys configured.\n'));
      console.log(chalk.bold('💡 To add NVD API key:'));
      console.log(chalk.gray('   devcompass cve key --set --api-key <your-key>\n'));
      return;
    }

    console.log(chalk.bold('Service'.padEnd(15)) + chalk.bold('Status'.padEnd(12)) + chalk.bold('Updated'));
    console.log('─'.repeat(50));

    keys.forEach(key => {
      const status = key.is_active ? chalk.green('Active') : chalk.gray('Inactive');
      const updated = new Date(key.updated_at).toLocaleDateString();
      console.log(
        key.service.padEnd(15) +
        status.padEnd(20) +
        chalk.gray(updated)
      );
    });

    console.log('');
    return;
  }

  // Default: show current status
  const hasKey = apiKeyManager.hasAPIKey('nvd');
  
  console.log(chalk.bold.cyan('\n🔑 NVD API Key Status\n'));

  if (hasKey) {
    const nvdKey = apiKeyManager.getAPIKey('nvd');
    const masked = encryption.maskToken(nvdKey);
    
    console.log(chalk.green('✓ Configured'));
    console.log(chalk.gray(`  Key: ${masked}\n`));
    console.log(chalk.bold('💡 Commands:'));
    console.log(chalk.gray('  Test: ') + chalk.cyan('devcompass cve test'));
    console.log(chalk.gray('  Remove: ') + chalk.cyan('devcompass cve key --remove\n'));
  } else {
    console.log(chalk.yellow('⚠️  Not configured\n'));
    console.log(chalk.bold('📋 How to get NVD API Key:'));
    console.log(chalk.gray('  1. Visit: ') + chalk.cyan('https://nvd.nist.gov/developers/request-an-api-key'));
    console.log(chalk.gray('  2. Enter your organization name and email'));
    console.log(chalk.gray('  3. Agree to Terms of Use'));
    console.log(chalk.gray('  4. Check email for API key (single-use activation link)'));
    console.log(chalk.gray('  5. Activate within 7 days'));
    console.log(chalk.gray('  6. Run: ') + chalk.cyan('devcompass cve key --set --api-key <your-key>\n'));
  }
}

async function testKey(options) {
  console.log(chalk.bold.cyan('\n🧪 Testing NVD API Key...\n'));

  const result = await apiKeyManager.testAPIKey('nvd');

  if (result.success) {
    console.log(chalk.green('✓ ' + result.message + '\n'));
    console.log(chalk.bold('Ready to use:'));
    console.log(chalk.gray('  Run: ') + chalk.cyan('devcompass analyze') + chalk.gray(' to scan with CVE detection\n'));
  } else {
    console.log(chalk.red('✗ ' + result.message + '\n'));
    
    if (result.message.includes('not found')) {
      console.log(chalk.bold('💡 To add API key:'));
      console.log(chalk.gray('   devcompass cve key --set --api-key <your-key>\n'));
    } else if (result.message.includes('Invalid')) {
      console.log(chalk.bold('💡 Your API key may be:'));
      console.log(chalk.gray('   • Expired (keys need renewal)'));
      console.log(chalk.gray('   • Not activated (check activation email)'));
      console.log(chalk.gray('   • Incorrectly copied\n'));
      console.log(chalk.bold('To update:'));
      console.log(chalk.gray('   devcompass cve key --set --api-key <new-key>\n'));
    }
  }
}

function handleCacheCommand(options) {
  const { clear, stats } = options;

  if (clear) {
    const cleared = cacheManager.clearAll();
    console.log(chalk.green(`\n✓ Cleared ${cleared} cached CVE entries\n`));
    return;
  }

  if (stats) {
    const stats = cacheManager.getStats();
    
    console.log(chalk.bold.cyan('\n📊 CVE Cache Statistics\n'));
    console.log(`  ${chalk.bold('Total entries:')} ${stats.total}`);
    console.log(`  ${chalk.bold('Active:')} ${chalk.green(stats.active)}`);
    console.log(`  ${chalk.bold('Expired:')} ${chalk.gray(stats.expired)}`);
    console.log(`  ${chalk.bold('Outdated:')} ${chalk.yellow(stats.outdated)}\n`);
    
    if (stats.expired > 0 || stats.outdated > 0) {
      console.log(chalk.gray('💡 TIP: Run ') + chalk.cyan('devcompass cve cache --clear') + chalk.gray(' to remove old entries\n'));
    }
    return;
  }

  // Default: clear expired only
  const expired = cacheManager.clearExpired();
  console.log(chalk.green(`\n✓ Cleared ${expired} expired CVE cache entries\n`));
}

function showHelp() {
  console.log(chalk.bold.cyan('\n🛡️  DevCompass CVE Management\n'));
  
  console.log(chalk.bold('USAGE:'));
  console.log('  devcompass cve <command> [options]\n');
  
  console.log(chalk.bold('COMMANDS:'));
  console.log(`  ${chalk.cyan('key')}                    Manage NVD API keys`);
  console.log(`  ${chalk.cyan('test')}                   Test NVD API key connection`);
  console.log(`  ${chalk.cyan('cache')}                  Manage vulnerability cache\n`);
  
  console.log(chalk.bold('KEY OPTIONS:'));
  console.log(`  ${chalk.cyan('--set')}                  Set API key`);
  console.log(`  ${chalk.cyan('--api-key <key>')}        API key value`);
  console.log(`  ${chalk.cyan('--key <key>')}            API key value (alias)`);
  console.log(`  ${chalk.cyan('--remove')}               Remove API key`);
  console.log(`  ${chalk.cyan('--list')}                 List all API keys\n`);
  
  console.log(chalk.bold('CACHE OPTIONS:'));
  console.log(`  ${chalk.cyan('--clear')}                Clear all cache`);
  console.log(`  ${chalk.cyan('--stats')}                Show cache statistics\n`);
  
  console.log(chalk.bold('EXAMPLES:'));
  console.log(chalk.gray('  # Set NVD API key'));
  console.log(chalk.cyan('  devcompass cve key --set --api-key abc123xyz\n'));
  
  console.log(chalk.gray('  # Test API key'));
  console.log(chalk.cyan('  devcompass cve test\n'));
  
  console.log(chalk.gray('  # View cache stats'));
  console.log(chalk.cyan('  devcompass cve cache --stats\n'));
  
  console.log(chalk.gray('  # Clear cache'));
  console.log(chalk.cyan('  devcompass cve cache --clear\n'));
  
  console.log(chalk.bold('ABOUT CVE INTEGRATION:'));
  console.log(chalk.gray('  • OSV API: No key required (primary source)'));
  console.log(chalk.gray('  • NVD API: Key required (CVSS scores + enrichment)'));
  console.log(chalk.gray('  • Cache: 24-hour TTL for performance'));
  console.log(chalk.gray('  • Analysis: Runs automatically with "devcompass analyze"\n'));
}

module.exports = cveCommand;
module.exports.showHelp = showHelp;