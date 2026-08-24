// src/features/config/index.js

const chalk = require('chalk');
const GitHubTokenManager = require('./github-token.manager');
const { maskToken } = require('../../shared/utils/encryption');

async function config(options) {
  const tokenManager = new GitHubTokenManager();

  if (options.show) {
    const token = tokenManager.getToken();
    if (token) {
      const masked = maskToken(token);
      console.log(chalk.green('✓'), 'GitHub token configured:', chalk.dim(masked));
      console.log(chalk.dim('  Stored encrypted in: ~/.devcompass/config.db'));
    } else {
      console.log(chalk.yellow('⚠'), 'No GitHub token configured');
      GitHubTokenManager.showTokenInstructions();
    }
    return;
  }

  if (options.removeGithubToken) {
    if (tokenManager.removeToken()) console.log(chalk.green('✓'), 'GitHub token removed successfully');
    else console.log(chalk.red('✗'), 'Failed to remove GitHub token');
    return;
  }

  if (options.githubToken) {
    const token = options.githubToken;
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      console.log(chalk.red('✗'), 'Invalid GitHub token format. Must start with "ghp_" or "github_pat_"');
      GitHubTokenManager.showTokenInstructions();
      return;
    }
    if (tokenManager.saveToken(token)) {
      console.log(chalk.green('✓'), 'GitHub token saved successfully!');
      console.log('🔒 Token encrypted with AES-256-GCM');
      console.log('📁 Stored in:', chalk.dim('~/.devcompass/config.db'));
      console.log('🎉 You can now use DevCompass without rate limits!');
    } else {
      console.log(chalk.red('✗'), 'Failed to save GitHub token');
    }
    return;
  }

  console.log('');
  console.log(chalk.bold('DevCompass Configuration'));
  console.log('');
  console.log('Usage:');
  console.log('  devcompass config --github-token <token>  Set GitHub token');
  console.log('  devcompass config --show                  Show current token');
  console.log('  devcompass config --remove-github-token   Remove GitHub token');
  console.log('');
  GitHubTokenManager.showTokenInstructions();
}

module.exports = config;