#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const { analyze } = require('../src/commands/analyze');
const packageJson = require('../package.json');

const program = new Command();

program
  .name('devcompass')
  .description('Health check for your JavaScript project')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .addHelpText('after', `
${chalk.gray('Author:')} Ajay Thorat
${chalk.gray('GitHub:')} ${chalk.cyan('https://github.com/AjayBThorat-20/devcompass')}
  `);

program
  .command('analyze')
  .description('Analyze your project dependencies')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(analyze);

program.parse();