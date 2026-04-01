const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');
const readline = require('readline');

const { findUnusedDeps } = require('../analyzers/unused-deps');
const { findOutdatedDeps } = require('../analyzers/outdated');
const { checkEcosystemAlerts } = require('../alerts');
const { getSeverityDisplay } = require('../alerts/formatter');

async function fix(options) {
  const projectPath = options.path || process.cwd();
  
  console.log('\n');
  console.log(chalk.cyan.bold('🔧 DevCompass Fix') + ' - Analyzing and fixing your project...\n');
  
  const spinner = ora({
    text: 'Analyzing project...',
    color: 'cyan'
  }).start();
  
  try {
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail(chalk.red('No package.json found'));
      process.exit(1);
    }
    
    const projectPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
      ...(projectPackageJson.dependencies || {}),
      ...(projectPackageJson.devDependencies || {})
    };
    
    // Check for critical alerts first
    spinner.text = 'Checking for critical issues...';
    const alerts = await checkEcosystemAlerts(projectPath, dependencies);
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    
    // Find unused dependencies
    spinner.text = 'Finding unused dependencies...';
    const unusedDeps = await findUnusedDeps(projectPath, dependencies);
    
    // Find outdated packages
    spinner.text = 'Checking for updates...';
    const outdatedDeps = await findOutdatedDeps(projectPath, dependencies);
    
    spinner.succeed(chalk.green('Analysis complete!\n'));
    
    // Show what will be fixed
    await showFixPlan(criticalAlerts, unusedDeps, outdatedDeps, options);
    
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

async function showFixPlan(criticalAlerts, unusedDeps, outdatedDeps, options) {
  const actions = [];
  
  // Critical alerts
  if (criticalAlerts.length > 0) {
    console.log(chalk.red.bold('🔴 CRITICAL ISSUES TO FIX:\n'));
    
    criticalAlerts.forEach(alert => {
      const display = getSeverityDisplay(alert.severity);
      console.log(`${display.emoji} ${chalk.bold(alert.package)}@${alert.version}`);
      console.log(`   ${chalk.gray('Issue:')} ${alert.title}`);
      
      if (alert.fix && /^\d+\.\d+/.test(alert.fix)) {
        console.log(`   ${chalk.green('Fix:')} Upgrade to ${alert.fix}\n`);
        actions.push({
          type: 'upgrade',
          package: alert.package,
          version: alert.fix,
          reason: 'Critical security/stability issue'
        });
      } else {
        console.log(`   ${chalk.yellow('Fix:')} ${alert.fix}\n`);
      }
    });
    
    console.log('━'.repeat(70) + '\n');
  }
  
  // Unused dependencies
  if (unusedDeps.length > 0) {
    console.log(chalk.yellow.bold('🧹 UNUSED DEPENDENCIES TO REMOVE:\n'));
    
    unusedDeps.forEach(dep => {
      console.log(`  ${chalk.red('●')} ${dep.name}`);
      actions.push({
        type: 'uninstall',
        package: dep.name,
        reason: 'Not used in project'
      });
    });
    
    console.log('\n' + '━'.repeat(70) + '\n');
  }
  
  // Safe updates (patch/minor only)
  const safeUpdates = outdatedDeps.filter(dep => 
    dep.versionsBehind === 'patch update' || dep.versionsBehind === 'minor update'
  );
  
  if (safeUpdates.length > 0) {
    console.log(chalk.cyan.bold('⬆️  SAFE UPDATES (patch/minor):\n'));
    
    safeUpdates.forEach(dep => {
      console.log(`  ${dep.name}: ${chalk.yellow(dep.current)} → ${chalk.green(dep.latest)} ${chalk.gray(`(${dep.versionsBehind})`)}`);
      actions.push({
        type: 'update',
        package: dep.name,
        version: dep.latest,
        reason: dep.versionsBehind
      });
    });
    
    console.log('\n' + '━'.repeat(70) + '\n');
  }
  
  // Major updates (show but don't auto-apply)
  const majorUpdates = outdatedDeps.filter(dep => dep.versionsBehind === 'major update');
  
  if (majorUpdates.length > 0) {
    console.log(chalk.gray.bold('⚠️  MAJOR UPDATES (skipped - may have breaking changes):\n'));
    
    majorUpdates.forEach(dep => {
      console.log(`  ${chalk.gray(dep.name)}: ${dep.current} → ${dep.latest}`);
    });
    
    console.log(chalk.gray('\n  Run these manually after reviewing changelog:\n'));
    majorUpdates.forEach(dep => {
      console.log(chalk.gray(`  npm install ${dep.name}@${dep.latest}`));
    });
    
    console.log('\n' + '━'.repeat(70) + '\n');
  }
  
  if (actions.length === 0) {
    console.log(chalk.green('✨ Everything looks good! No fixes needed.\n'));
    return;
  }
  
  // Summary
  console.log(chalk.bold('📊 FIX SUMMARY:\n'));
  console.log(`  Critical fixes:  ${criticalAlerts.length}`);
  console.log(`  Remove unused:   ${unusedDeps.length}`);
  console.log(`  Safe updates:    ${safeUpdates.length}`);
  console.log(`  Skipped major:   ${majorUpdates.length}\n`);
  
  console.log('━'.repeat(70) + '\n');
  
  // Confirm
  if (options.yes) {
    await applyFixes(actions);
  } else {
    const confirmed = await askConfirmation('\n❓ Apply these fixes?');
    
    if (confirmed) {
      await applyFixes(actions);
    } else {
      console.log(chalk.yellow('\n⚠️  Fix cancelled. No changes made.\n'));
    }
  }
}

async function applyFixes(actions) {
  console.log(chalk.cyan.bold('\n🔧 Applying fixes...\n'));
  
  const spinner = ora('Processing...').start();
  
  try {
    // Group by type
    const toUninstall = actions.filter(a => a.type === 'uninstall').map(a => a.package);
    const toUpgrade = actions.filter(a => a.type === 'upgrade');
    const toUpdate = actions.filter(a => a.type === 'update');
    
    // Uninstall unused
    if (toUninstall.length > 0) {
      spinner.text = `Removing ${toUninstall.length} unused packages...`;
      
      const cmd = `npm uninstall ${toUninstall.join(' ')}`;
      execSync(cmd, { stdio: 'pipe' });
      
      spinner.succeed(chalk.green(`✅ Removed ${toUninstall.length} unused packages`));
      spinner.start();
    }
    
    // Upgrade critical packages
    for (const action of toUpgrade) {
      spinner.text = `Fixing ${action.package}@${action.version}...`;
      
      const cmd = `npm install ${action.package}@${action.version}`;
      execSync(cmd, { stdio: 'pipe' });
      
      spinner.succeed(chalk.green(`✅ Fixed ${action.package}@${action.version}`));
      spinner.start();
    }
    
    // Update safe packages
    if (toUpdate.length > 0) {
      spinner.text = `Updating ${toUpdate.length} packages...`;
      
      for (const action of toUpdate) {
        const cmd = `npm install ${action.package}@${action.version}`;
        execSync(cmd, { stdio: 'pipe' });
      }
      
      spinner.succeed(chalk.green(`✅ Updated ${toUpdate.length} packages`));
    } else {
      spinner.stop();
    }
    
    console.log(chalk.green.bold('\n✨ All fixes applied successfully!\n'));
    console.log(chalk.cyan('💡 Run') + chalk.bold(' devcompass analyze ') + chalk.cyan('to see the new health score.\n'));
    
  } catch (error) {
    spinner.fail(chalk.red('Fix failed'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    console.log(chalk.yellow('💡 You may need to fix this manually.\n'));
    process.exit(1);
  }
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(chalk.cyan(question) + chalk.gray(' (y/N): '), answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

module.exports = { fix };
