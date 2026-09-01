// src/features/cve/index.js

const chalk = require('chalk');
const apiKeyManager = require('./api-key.manager');
const cacheManager = require('./cache.manager');
const encryption = require('../../shared/utils/encryption');

async function cveCommand(subcommand, options = {}) {
  if (!subcommand) { showHelp(); return; }
  switch (subcommand) {
    case 'key': await handleKeyCommand(options); break;
    case 'test': await testKey(options); break;
    case 'cache': handleCacheCommand(options); break;
    default:
      console.log(chalk.red(`\n❌ Unknown subcommand: ${subcommand}\n`));
      showHelp();
  }
}

async function handleKeyCommand(options) {
  const { set, remove, list } = options;

  if (set) {
    const apiKey = options.apiKey || options.key;
    if (!apiKey) {
      console.log(chalk.red('\n❌ API key is required\n'));
      console.log(chalk.gray('  depvora cve key --set --api-key <your-key>\n'));
      return;
    }
    const success = apiKeyManager.setAPIKey('nvd', apiKey);
    if (success) {
      console.log(chalk.green('\n✓ NVD API key saved successfully!\n'));
      console.log(chalk.gray('  Test key: ') + chalk.cyan('depvora cve test'));
      console.log(chalk.gray('  Run analysis: ') + chalk.cyan('depvora analyze\n'));
    } else {
      console.log(chalk.red('\n❌ Failed to save API key\n'));
    }
    return;
  }

  if (remove) {
    const success = apiKeyManager.removeAPIKey('nvd');
    console.log(success ? chalk.green('\n✓ NVD API key removed\n') : chalk.yellow('\n⚠️  No API key found to remove\n'));
    return;
  }

  if (list) {
    const keys = apiKeyManager.listAPIKeys();
    console.log(chalk.bold.cyan('\n🔑 API Keys\n'));
    if (keys.length === 0) {
      console.log(chalk.yellow('No API keys configured.\n'));
      return;
    }
    keys.forEach(key => {
      const status = key.is_active ? chalk.green('Active') : chalk.gray('Inactive');
      console.log(`${key.service.padEnd(15)}${status.padEnd(20)}${chalk.gray(new Date(key.updated_at).toLocaleDateString())}`);
    });
    console.log('');
    return;
  }

  const hasKey = apiKeyManager.hasAPIKey('nvd');
  console.log(chalk.bold.cyan('\n🔑 NVD API Key Status\n'));
  if (hasKey) {
    const nvdKey = apiKeyManager.getAPIKey('nvd');
    console.log(chalk.green('✓ Configured'));
    console.log(chalk.gray(`  Key: ${encryption.maskToken(nvdKey)}\n`));
    console.log(chalk.bold('💡 Commands:'));
    console.log(chalk.gray('  Test: ') + chalk.cyan('depvora cve test'));
    console.log(chalk.gray('  Remove: ') + chalk.cyan('depvora cve key --remove\n'));
  } else {
    console.log(chalk.yellow('⚠️  Not configured\n'));
    console.log(chalk.gray('  Visit: ') + chalk.cyan('https://nvd.nist.gov/developers/request-an-api-key'));
    console.log(chalk.gray('  Then: ') + chalk.cyan('depvora cve key --set --api-key <your-key>\n'));
  }
}

async function testKey() {
  console.log(chalk.bold.cyan('\n🧪 Testing NVD API Key...\n'));
  const result = await apiKeyManager.testAPIKey('nvd');
  if (result.success) {
    console.log(chalk.green('✓ ' + result.message + '\n'));
    console.log(chalk.gray('  Run: ') + chalk.cyan('depvora analyze') + chalk.gray(' to scan with CVE detection\n'));
  } else {
    console.log(chalk.red('✗ ' + result.message + '\n'));
    if (result.message.includes('not found')) {
      console.log(chalk.gray('   depvora cve key --set --api-key <your-key>\n'));
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
    const s = cacheManager.getStats();
    console.log(chalk.bold.cyan('\n📊 CVE Cache Statistics\n'));
    console.log(`  ${chalk.bold('Total entries:')} ${s.total}`);
    console.log(`  ${chalk.bold('Active:')} ${chalk.green(s.active)}`);
    console.log(`  ${chalk.bold('Expired:')} ${chalk.gray(s.expired)}`);
    console.log(`  ${chalk.bold('Outdated:')} ${chalk.yellow(s.outdated)}\n`);
    return;
  }
  const expired = cacheManager.clearExpired();
  console.log(chalk.green(`\n✓ Cleared ${expired} expired CVE cache entries\n`));
}

function showHelp() {
  console.log(chalk.bold.cyan('\n🛡️  Depvora CVE Management\n'));
  console.log(chalk.bold('USAGE:'));
  console.log('  depvora cve <command> [options]\n');
  console.log(chalk.bold('COMMANDS:'));
  console.log(`  ${chalk.cyan('key')}      Manage NVD API keys`);
  console.log(`  ${chalk.cyan('test')}     Test NVD API key connection`);
  console.log(`  ${chalk.cyan('cache')}    Manage vulnerability cache\n`);
}

module.exports = cveCommand;
module.exports.showHelp = showHelp;