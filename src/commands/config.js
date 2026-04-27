// src/commands/config.js
const chalk = require('chalk');
const GitHubTokenManager = require('../config/github-token');

async function config(options) {
  const tokenManager = new GitHubTokenManager();

  // Show token
  if (options.show) {
    const token = tokenManager.getToken();
    if (token) {
      // Mask token for security
      const masked = token.substring(0, 7) + '***' + token.substring(token.length - 4);
      console.log(chalk.green('✓'), 'GitHub token configured:', chalk.dim(masked));
      console.log(chalk.dim('  Stored encrypted in: ~/.devcompass/config.db'));
    } else {
      console.log(chalk.yellow('⚠'), 'No GitHub token configured');
      GitHubTokenManager.showTokenInstructions();
    }
    return;
  }

  // Remove token
  if (options.removeGithubToken) {
    if (tokenManager.removeToken()) {
      console.log(chalk.green('✓'), 'GitHub token removed successfully');
    } else {
      console.log(chalk.red('✗'), 'Failed to remove GitHub token');
    }
    return;
  }

  // Set token
  if (options.githubToken) {
    const token = options.githubToken;

    // Validate token format
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      console.log(chalk.red('✗'), 'Invalid GitHub token format');
      console.log('');
      console.log('Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)');
      console.log('');
      GitHubTokenManager.showTokenInstructions();
      return;
    }

    if (tokenManager.saveToken(token)) {
      console.log(chalk.green('✓'), 'GitHub token saved successfully!');
      console.log('');
      console.log('🔒 Token encrypted with AES-256-GCM');
      console.log('📁 Stored in:', chalk.dim('~/.devcompass/config.db'));
      console.log('');
      console.log('🎉 You can now use DevCompass without rate limits!');
    } else {
      console.log(chalk.red('✗'), 'Failed to save GitHub token');
    }
    return;
  }

  // Show help
  console.log('');
  console.log(chalk.bold('DevCompass Configuration'));
  console.log('');
  console.log('Usage:');
  console.log('  devcompass config --github-token <token>  Set GitHub token');
  console.log('  devcompass config --show                  Show current token (masked)');
  console.log('  devcompass config --remove-github-token   Remove GitHub token');
  console.log('');
  GitHubTokenManager.showTokenInstructions();
}

module.exports = config;