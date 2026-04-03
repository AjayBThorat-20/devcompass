// src/commands/analyze.js
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');

const { findUnusedDeps } = require('../analyzers/unused-deps');
const { findOutdatedDeps } = require('../analyzers/outdated');
const { calculateScore } = require('../analyzers/scoring');
const { checkEcosystemAlerts } = require('../alerts');
const { checkSecurity, calculateSecurityPenalty } = require('../analyzers/security');
const { analyzeBundleSizes, findHeavyPackages } = require('../analyzers/bundle-size');
const { checkLicenses, findProblematicLicenses } = require('../analyzers/licenses');
const { 
  formatAlerts, 
  getSeverityDisplay, 
  calculateAlertPenalty 
} = require('../alerts/formatter');
const { 
  log, 
  logSection, 
  logDivider,
  getScoreColor 
} = require('../utils/logger');
const { loadConfig, filterAlerts } = require('../config/loader');
const { getCached, setCache } = require('../cache/manager');
const { formatAsJson } = require('../utils/json-formatter');
const { handleCiMode } = require('../utils/ci-handler');
const packageJson = require('../../package.json');

async function analyze(options) {
  const projectPath = options.path || process.cwd();
  
  // Load config
  const config = loadConfig(projectPath);
  
  // Handle output modes
  const outputMode = options.json ? 'json' : (options.ci ? 'ci' : (options.silent ? 'silent' : 'normal'));
  
  // Only show header for normal and CI modes
  if (outputMode !== 'silent' && outputMode !== 'json') {
    console.log('\n');
    log(chalk.cyan.bold(`🔍 DevCompass v${packageJson.version}`) + ' - Analyzing your project...\n');
  }
  
  // Create spinner (disabled for json/silent modes to prevent EPIPE errors)
  const spinner = (outputMode === 'json' || outputMode === 'silent')
    ? { 
        start: function() { return this; },
        succeed: function() {},
        fail: function(msg) { if (msg) console.error(msg); },
        text: '',
        set text(val) {}
      }
    : ora({
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
    
    // Check for ecosystem alerts (with cache)
    spinner.text = 'Checking ecosystem alerts...';
    let alerts = [];
    
    if (config.cache) {
      alerts = getCached(projectPath, 'alerts');
    }
    
    if (!alerts) {
      try {
        alerts = await checkEcosystemAlerts(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'alerts', alerts);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check ecosystem alerts'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        alerts = [];
      }
    }
    
    // Filter alerts based on config
    alerts = filterAlerts(alerts, config);
    
    // Unused dependencies
    spinner.text = 'Detecting unused dependencies...';
    let unusedDeps = [];
    
    if (config.cache) {
      unusedDeps = getCached(projectPath, 'unused');
    }
    
    if (!unusedDeps) {
      try {
        unusedDeps = await findUnusedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'unused', unusedDeps);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not detect unused dependencies'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        unusedDeps = [];
      }
    }
    
    // Outdated packages
    spinner.text = 'Checking for outdated packages...';
    let outdatedDeps = [];
    
    if (config.cache) {
      outdatedDeps = getCached(projectPath, 'outdated');
    }
    
    if (!outdatedDeps) {
      try {
        outdatedDeps = await findOutdatedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'outdated', outdatedDeps);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check for outdated packages'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        outdatedDeps = [];
      }
    }
    
    // Check security vulnerabilities
    spinner.text = 'Checking security vulnerabilities...';
    let securityData = { vulnerabilities: [], metadata: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    
    if (config.cache) {
      const cached = getCached(projectPath, 'security');
      if (cached) securityData = cached;
    }
    
    if (securityData.metadata.total === 0) {
      try {
        securityData = await checkSecurity(projectPath);
        if (config.cache) {
          setCache(projectPath, 'security', securityData);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check security vulnerabilities'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
      }
    }
    
    // Check for predictive warnings (GitHub Issues) - UPDATED for v2.5.0
    const { getTrackedPackageCount, TRACKED_REPOS } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    // Count how many installed packages are tracked
    const installedTrackedCount = Object.keys(dependencies).filter(pkg => TRACKED_REPOS[pkg]).length;
    
    if (installedTrackedCount > 0) {
      spinner.text = `Checking GitHub activity (${installedTrackedCount}/${totalTracked} tracked packages)...`;
    } else {
      spinner.text = 'Checking GitHub activity...';
    }
    
    let predictiveWarnings = [];
    
    if (config.cache) {
      predictiveWarnings = getCached(projectPath, 'predictive');
    }
    
    if (!predictiveWarnings) {
      try {
        const { generatePredictiveWarnings } = require('../alerts/predictive');
        predictiveWarnings = await generatePredictiveWarnings(dependencies);
        
        if (config.cache && predictiveWarnings.length > 0) {
          setCache(projectPath, 'predictive', predictiveWarnings);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check GitHub activity'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        predictiveWarnings = [];
      }
    }
    
    // Analyze bundle sizes
    spinner.text = 'Analyzing bundle sizes...';
    let bundleSizes = [];
    
    if (config.cache) {
      const cached = getCached(projectPath, 'bundleSizes');
      if (cached) bundleSizes = cached;
    }
    
    if (bundleSizes.length === 0) {
      try {
        bundleSizes = await analyzeBundleSizes(projectPath, dependencies);
        if (config.cache && bundleSizes.length > 0) {
          setCache(projectPath, 'bundleSizes', bundleSizes);
        }
      } catch (error) {
        // Bundle size analysis is optional
      }
    }
    
    // Check licenses
    spinner.text = 'Checking licenses...';
    let licenses = [];
    
    if (config.cache) {
      const cached = getCached(projectPath, 'licenses');
      if (cached) licenses = cached;
    }
    
    if (licenses.length === 0) {
      try {
        licenses = await checkLicenses(projectPath, dependencies);
        if (config.cache && licenses.length > 0) {
          setCache(projectPath, 'licenses', licenses);
        }
      } catch (error) {
        // License checking is optional
      }
    }
    
    // Calculate score
    const alertPenalty = calculateAlertPenalty(alerts);
    const securityPenalty = calculateSecurityPenalty(securityData.metadata);
    
    const score = calculateScore(
      totalDeps,
      unusedDeps.length,
      outdatedDeps.length,
      alerts.length,
      alertPenalty,
      securityPenalty
    );
    
    spinner.succeed(chalk.green(`Scanned ${totalDeps} dependencies in project`));
    
    // Handle different output modes
    if (outputMode === 'json') {
      const jsonOutput = formatAsJson(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses, predictiveWarnings);
      console.log(jsonOutput);
    } else if (outputMode === 'ci') {
      displayResults(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses, predictiveWarnings);
      handleCiMode(score, config, alerts, unusedDeps);
    } else if (outputMode === 'silent') {
      // Silent mode - no output
    } else {
      displayResults(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses, predictiveWarnings);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (process.env.DEBUG) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

function displayResults(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData, bundleSizes, licenses, predictiveWarnings) {
  logDivider();
  
  // SECURITY VULNERABILITIES
  if (securityData.metadata.total > 0) {
    const criticalCount = securityData.metadata.critical;
    const highCount = securityData.metadata.high;
    const moderateCount = securityData.metadata.moderate;
    const lowCount = securityData.metadata.low;
    
    logSection('🔐 SECURITY VULNERABILITIES', securityData.metadata.total);
    
    if (criticalCount > 0) {
      log(chalk.red.bold(`\n  🔴 CRITICAL: ${criticalCount}`));
    }
    if (highCount > 0) {
      log(chalk.red(`  🟠 HIGH: ${highCount}`));
    }
    if (moderateCount > 0) {
      log(chalk.yellow(`  🟡 MODERATE: ${moderateCount}`));
    }
    if (lowCount > 0) {
      log(chalk.gray(`  ⚪ LOW: ${lowCount}`));
    }
    
    log(chalk.cyan('\n  Run') + chalk.bold(' npm audit fix ') + chalk.cyan('to fix vulnerabilities\n'));
  } else {
    logSection('✅ SECURITY VULNERABILITIES');
    log(chalk.green('  No vulnerabilities detected!\n'));
  }
  
  logDivider();
  
  // ECOSYSTEM ALERTS
  if (alerts.length > 0) {
    logSection('🚨 ECOSYSTEM ALERTS', alerts.length);
    
    const grouped = formatAlerts(alerts);
    
    Object.entries(grouped).forEach(([packageName, packageAlerts]) => {
      const firstAlert = packageAlerts[0];
      const display = getSeverityDisplay(firstAlert.severity);
      
      log(`\n${display.emoji} ${display.color(display.label)}`);
      log(`  ${chalk.bold(packageName)}${chalk.gray('@' + firstAlert.version)}`);
      
      packageAlerts.forEach((alert, index) => {
        if (index > 0) {
          const alertDisplay = getSeverityDisplay(alert.severity);
          log(`\n  ${alertDisplay.emoji} ${alertDisplay.color(alertDisplay.label)}`);
        }
        
        log(`    ${chalk.yellow('Issue:')} ${alert.title}`);
        log(`    ${chalk.gray('Affected:')} ${alert.affected}`);
        
        if (alert.fix) {
          log(`    ${chalk.green('Fix:')} ${alert.fix}`);
        }
        
        if (alert.source) {
          log(`    ${chalk.gray('Source:')} ${alert.source}`);
        }
      });
    });
    
    log('');
  } else {
    logSection('✅ ECOSYSTEM ALERTS');
    log(chalk.green('  No known issues detected!\n'));
  }
  
  logDivider();
  
  // PREDICTIVE WARNINGS (UPDATED for v2.5.0)
  if (predictiveWarnings.length > 0) {
    const { getTrackedPackageCount } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    logSection('🔮 PREDICTIVE WARNINGS', predictiveWarnings.length);
    
    log(chalk.gray(`  Based on recent GitHub activity (${totalTracked}+ packages monitored):\n`));
    
    predictiveWarnings.forEach(warning => {
      const display = getSeverityDisplay(warning.severity);
      
      log(`${display.emoji} ${display.color(warning.package)}`);
      log(`   ${chalk.yellow(warning.title)}`);
      log(`   ${warning.description}`);
      log(`   ${chalk.cyan('→')} ${warning.recommendation}`);
      
      if (warning.data && warning.data.repoUrl) {
        log(chalk.gray(`   GitHub: ${warning.data.repoUrl}`));
      }
      
      log('');
    });
  } else {
    const { getTrackedPackageCount } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    logSection('✅ PREDICTIVE ANALYSIS');
    log(chalk.green(`  No unusual activity detected (${totalTracked}+ packages monitored)!\n`));
  }
  
  logDivider();
  
  // UNUSED DEPENDENCIES
  if (unusedDeps.length > 0) {
    logSection('🔴 UNUSED DEPENDENCIES', unusedDeps.length);
    
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
  
  // OUTDATED PACKAGES
  if (outdatedDeps.length > 0) {
    logSection('🟡 OUTDATED PACKAGES', outdatedDeps.length);
    
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
  
  // BUNDLE SIZE
  const heavyPackages = findHeavyPackages(bundleSizes);
  if (heavyPackages.length > 0) {
    logSection('📦 HEAVY PACKAGES', heavyPackages.length);
    
    log(chalk.gray('  Packages larger than 1MB:\n'));
    
    heavyPackages.slice(0, 10).forEach(pkg => {
      const nameCol = pkg.name.padEnd(25);
      const size = pkg.size > 5120 
        ? chalk.red(pkg.sizeFormatted)
        : chalk.yellow(pkg.sizeFormatted);
      
      log(`  ${nameCol} ${size}`);
    });
    
    log('');
    logDivider();
  }
  
  // LICENSE WARNINGS
  const problematicLicenses = findProblematicLicenses(licenses);
  if (problematicLicenses.length > 0) {
    logSection('⚖️  LICENSE WARNINGS', problematicLicenses.length);
    
    problematicLicenses.forEach(pkg => {
      const type = pkg.type === 'restrictive' 
        ? chalk.red('Restrictive') 
        : chalk.yellow('Unknown');
      log(`  ${chalk.bold(pkg.package)} - ${type} (${pkg.license})`);
    });
    
    log(chalk.gray('\n  Note: Restrictive licenses may require legal review\n'));
  } else {
    logSection('✅ LICENSE COMPLIANCE');
    log(chalk.green('  All licenses are permissive!\n'));
  }
  
  logDivider();
  
  // PROJECT HEALTH
  logSection('📊 PROJECT HEALTH');
  
  const scoreColor = getScoreColor(score.total);
  log(`  Overall Score:              ${scoreColor(score.total + '/10')}`);
  log(`  Total Dependencies:         ${chalk.cyan(totalDeps)}`);
  
  if (securityData.metadata.total > 0) {
    log(`  Security Vulnerabilities:   ${chalk.red(securityData.metadata.total)}`);
  }
  
  if (alerts.length > 0) {
    log(`  Ecosystem Alerts:           ${chalk.red(alerts.length)}`);
  }
  
  if (predictiveWarnings.length > 0) {
    log(`  Predictive Warnings:        ${chalk.yellow(predictiveWarnings.length)}`);
  }
  
  log(`  Unused:                     ${chalk.red(unusedDeps.length)}`);
  log(`  Outdated:                   ${chalk.yellow(outdatedDeps.length)}\n`);
  
  logDivider();
  
  // QUICK WINS
  displayQuickWins(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData);
}

function displayQuickWins(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData) {
  const hasCriticalAlerts = alerts.some(a => a.severity === 'critical' || a.severity === 'high');
  const hasCriticalSecurity = securityData.metadata.critical > 0 || securityData.metadata.high > 0;
  
  if (hasCriticalSecurity || hasCriticalAlerts || unusedDeps.length > 0) {
    logSection('💡 QUICK WINS');
    
    // Fix security vulnerabilities first
    if (hasCriticalSecurity) {
      log('  🔐 Fix security vulnerabilities:\n');
      log(chalk.cyan(`  npm audit fix\n`));
    }
    
    // Fix critical alerts
    if (hasCriticalAlerts) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
      
      log('  🔴 Fix critical issues:\n');
      
      criticalAlerts.forEach(alert => {
        if (alert.fix && alert.fix.includes('.')) {
          // It's a version number
          log(chalk.cyan(`  npm install ${alert.package}@${alert.fix}`));
        } else {
          log(chalk.gray(`  ${alert.package}: ${alert.fix}`));
        }
      });
      
      log('');
    }
    
    // Remove unused deps
    if (unusedDeps.length > 0) {
      log('  🧹 Clean up unused dependencies:\n');
      
      const packagesToRemove = unusedDeps.map(d => d.name).join(' ');
      log(chalk.cyan(`  npm uninstall ${packagesToRemove}\n`));
    }
    
    // Show expected impact
    const alertPenalty = calculateAlertPenalty(alerts.filter(a => a.severity !== 'critical' && a.severity !== 'high'));
    const improvedScore = calculateScore(
      totalDeps - unusedDeps.length,
      0,
      outdatedDeps.length,
      alerts.length - alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
      alertPenalty,
      0 // Assume security issues fixed
    );
    
    log('  Expected impact:');
    
    if (hasCriticalSecurity) {
      log(`  ${chalk.green('✓')} Resolve security vulnerabilities`);
    }
    
    if (hasCriticalAlerts) {
      log(`  ${chalk.green('✓')} Resolve critical stability issues`);
    }
    
    if (unusedDeps.length > 0) {
      log(`  ${chalk.green('✓')} Remove ${unusedDeps.length} unused package${unusedDeps.length > 1 ? 's' : ''}`);
      log(`  ${chalk.green('✓')} Reduce node_modules size`);
    }
    
    const improvedScoreColor = getScoreColor(improvedScore.total);
    log(`  ${chalk.green('✓')} Improve health score → ${improvedScoreColor(improvedScore.total + '/10')}\n`);
    
    log(chalk.cyan('💡 TIP: Run') + chalk.bold(' devcompass fix ') + chalk.cyan('to apply these fixes automatically!\n'));
    
    logDivider();
  }
}

module.exports = { analyze };