// src/commands/analyze.js
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');

const { findUnusedDeps } = require('../analyzers/unused-deps');
const { findOutdatedDeps } = require('../analyzers/outdated');
const { calculateScore } = require('../analyzers/scoring');
const { 
  log, 
  logSection, 
  logDivider,
  getScoreColor 
} = require('../utils/logger');
const packageJson = require('../../package.json');

async function analyze(options) {
  const projectPath = options.path || process.cwd();
  
  console.log('\n');
  log(chalk.cyan.bold(`🔍 DevCompass v${packageJson.version}`) + ' - Analyzing your project...\n');
  
  const spinner = ora({
    text: 'Loading project...',
    color: 'cyan'
  }).start();
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail(chalk.red('No package.json found in current directory'));
      console.log(chalk.yellow('\n💡 Make sure you run this command in a project directory.\n'));
      process.exit(1);
    }
    
    let projectPackageJson;
    try {
      const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
      projectPackageJson = JSON.parse(fileContent);
    } catch (error) {
      spinner.fail(chalk.red('Invalid package.json format'));
      console.log(chalk.yellow(`\n💡 Error: ${error.message}\n`));
      process.exit(1);
    }
    
    const dependencies = {
      ...(projectPackageJson.dependencies || {}),
      ...(projectPackageJson.devDependencies || {})
    };
    
    const totalDeps = Object.keys(dependencies).length;
    
    if (totalDeps === 0) {
      spinner.succeed(chalk.green('No dependencies found'));
      console.log(chalk.gray('\n✨ Nothing to analyze - your project has no dependencies.\n'));
      process.exit(0);
    }
    
    spinner.text = 'Detecting unused dependencies...';
    
    let unusedDeps = [];
    try {
      unusedDeps = await findUnusedDeps(projectPath, dependencies);
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Could not detect unused dependencies'));
      console.log(chalk.gray(`   Error: ${error.message}\n`));
    }
    
    spinner.text = 'Checking for outdated packages...';
    
    let outdatedDeps = [];
    try {
      outdatedDeps = await findOutdatedDeps(projectPath, dependencies);
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Could not check for outdated packages'));
      console.log(chalk.gray(`   Error: ${error.message}\n`));
    }
    
    const score = calculateScore(
      totalDeps,
      unusedDeps.length,
      outdatedDeps.length
    );
    
    spinner.succeed(chalk.green(`Scanned ${totalDeps} dependencies in project`));
    
    displayResults(unusedDeps, outdatedDeps, score, totalDeps);
    
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (process.env.DEBUG) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

function displayResults(unusedDeps, outdatedDeps, score, totalDeps) {
  logDivider();
  
  if (unusedDeps.length > 0) {
    logSection('🔴 UNUSED DEPENDENCIES', unusedDeps.length);
    
    // Show ALL unused deps
    unusedDeps.forEach(dep => {
      log(`  ${chalk.red('●')} ${dep.name}`);
    });
    
    log(chalk.gray('\n  Why marked unused:'));
    log(chalk.gray('  • No import/require found in source files'));
    log(chalk.gray('  • Excludes node_modules, build folders'));
    log(chalk.gray('  • May include false positives - verify before removing\n'));
  } else {
    logSection('✅ UNUSED DEPENDENCIES');
    log(chalk.green('  No unused dependencies detected!\n'));
  }
  
  logDivider();
  
  if (outdatedDeps.length > 0) {
    logSection('🟡 OUTDATED PACKAGES', outdatedDeps.length);
    
    // Show ALL outdated packages
    outdatedDeps.forEach(dep => {
      const nameCol = dep.name.padEnd(20);
      const currentVer = chalk.yellow(dep.current);
      const arrow = chalk.gray('→');
      const latestVer = chalk.green(dep.latest);
      const updateType = chalk.gray(`(${dep.versionsBehind})`);
      
      log(`  ${nameCol} ${currentVer} ${arrow} ${latestVer}  ${updateType}`);
    });
    
    log('');
  } else {
    logSection('✅ OUTDATED PACKAGES');
    log(chalk.green('  All packages are up to date!\n'));
  }
  
  logDivider();
  
  logSection('📊 PROJECT HEALTH');
  
  const scoreColor = getScoreColor(score.total);
  log(`  Overall Score:              ${scoreColor(score.total + '/10')}`);
  log(`  Total Dependencies:         ${chalk.cyan(totalDeps)}`);
  log(`  Unused:                     ${chalk.red(unusedDeps.length)}`);
  log(`  Outdated:                   ${chalk.yellow(outdatedDeps.length)}\n`);
  
  logDivider();
  
  if (unusedDeps.length > 0) {
    logSection('💡 QUICK WIN');
    log('  Clean up unused dependencies:\n');
    
    const packagesToRemove = unusedDeps
      .map(d => d.name)
      .join(' ');
    
    log(chalk.cyan(`  npm uninstall ${packagesToRemove}\n`));
    
    log('  Expected impact:');
    log(`  ${chalk.green('✓')} Remove ${unusedDeps.length} unused package${unusedDeps.length > 1 ? 's' : ''}`);
    log(`  ${chalk.green('✓')} Reduce node_modules size`);
    
    const improvedScore = calculateScore(
      totalDeps - unusedDeps.length,
      0,
      outdatedDeps.length
    );
    
    const improvedScoreColor = getScoreColor(improvedScore.total);
    log(`  ${chalk.green('✓')} Improve health score → ${improvedScoreColor(improvedScore.total + '/10')}\n`);
    
    logDivider();
  }
}

module.exports = { analyze };