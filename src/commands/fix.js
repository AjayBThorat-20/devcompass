// src/commands/fix.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const ProgressTracker = require('../utils/progress-tracker');
const FixReport = require('../utils/fix-report');
const BackupManager = require('../utils/backup-manager');
const SupplyChainFixer = require('../utils/supply-chain-fixer');
const LicenseConflictFixer = require('../utils/license-conflict-fixer');
const { clearCache } = require('../cache/manager');

async function fix(options = {}) {
  const projectPath = options.path || process.cwd();
  const autoApply = options.yes || options.y || false;
  const dryRun = options.dryRun || options.dry || false;

  console.log(chalk.bold.cyan('\n🔧 DevCompass Fix\n'));

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN MODE - No changes will be made\n'));
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('❌ No package.json found in this directory'));
    process.exit(1);
  }

  // Initialize report, backup, supply chain fixer, and license conflict fixer
  const report = new FixReport();
  const backupManager = new BackupManager(projectPath);
  const supplyChainFixer = new SupplyChainFixer();
  const licenseConflictFixer = new LicenseConflictFixer();

  try {
    // Step 1: Analyze what needs fixing
    console.log(chalk.bold('Step 1: Analyzing issues...\n'));
    const spinner = ora('Scanning project...').start();

    const { alerts, unused, outdated, security, supplyChain, licenseRisks } = await analyzeProject(projectPath);

    spinner.succeed('Analysis complete');

    // Calculate total fixes needed
    const totalFixes = calculateTotalFixes(alerts, unused, outdated, security, supplyChain, licenseRisks);

    if (totalFixes === 0) {
      console.log(chalk.green('\n✨ No issues to fix! Your project is healthy.\n'));
      return;
    }

    // Step 2: Show what will be fixed
    console.log(chalk.bold('\nStep 2: Planned fixes\n'));
    displayPlannedFixes(alerts, unused, outdated, security, supplyChain, licenseRisks, dryRun);

    // Step 3: Get confirmation (unless auto-apply or dry-run)
    if (!dryRun && !autoApply) {
      console.log(chalk.bold('\n' + '='.repeat(70)));
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question(chalk.yellow('⚠️  Apply these fixes? (y/N): '), resolve);
      });
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('\nFix cancelled by user.\n'));
        return;
      }
    }

    if (dryRun) {
      console.log(chalk.cyan('\n✓ Dry run complete. No changes were made.\n'));
      return;
    }

    // Step 4: Create backup
    console.log(chalk.bold('\nStep 4: Creating backup...\n'));
    const backupPath = await backupManager.createBackup();
    if (backupPath) {
      console.log(chalk.green(`✓ Backup created: ${path.basename(backupPath)}\n`));
    }

    // Step 5: Apply fixes with progress tracking
    console.log(chalk.bold('Step 5: Applying fixes...\n'));
    
    const progress = new ProgressTracker(totalFixes);
    progress.start('Starting fixes...');

    // Fix supply chain issues FIRST (critical security)
    if (supplyChain.warnings && supplyChain.warnings.length > 0) {
      const autoFixableSupplyChain = supplyChain.warnings.filter(w => w.autoFixable);
      
      for (const warning of autoFixableSupplyChain) {
        progress.update(`Fixing supply chain issue: ${warning.package}...`);
        await supplyChainFixer.fixWarning(warning, projectPath, report, progress, autoApply);
      }
    }

    // Fix license conflicts SECOND (after supply chain, before security)
    if (licenseRisks.warnings && licenseRisks.warnings.length > 0) {
      const autoFixableLicense = licenseRisks.warnings.filter(w => w.autoFixable);
      
      for (const warning of autoFixableLicense) {
        progress.update(`Fixing license conflict: ${warning.package}...`);
        await licenseConflictFixer.fixWarning(warning, projectPath, report, progress, autoApply);
      }
    }

    // Fix critical security issues
    if (security.metadata.critical > 0 || security.metadata.high > 0) {
      progress.update('Fixing security vulnerabilities...');
      await fixSecurityIssues(projectPath, report, progress);
    }

    // Fix ecosystem alerts
    if (alerts.length > 0) {
      for (const alert of alerts) {
        if (alert.severity === 'critical' || alert.severity === 'high') {
          progress.update(`Fixing ${alert.package}...`);
          await fixAlert(alert, projectPath, report, progress);
        }
      }
    }

    // Remove unused dependencies
    if (unused.length > 0) {
      for (const dep of unused) {
        progress.update(`Removing ${dep}...`);
        await removeUnusedDependency(dep, projectPath, report, progress);
      }
    }

    // Update outdated packages (only patch/minor) - FIXED!
    if (outdated.length > 0) {
      for (const pkg of outdated) {
        // Check if it's a major update - FIXED VERSION
        const isMajorUpdate = isMajorVersionUpdate(pkg.versionsBehind);
        
        if (!isMajorUpdate) {
          progress.update(`Updating ${pkg.name}...`);
          await updatePackage(pkg, projectPath, report, progress);
        }
      }
    }

    progress.succeed('All fixes applied!');

    // Display supply chain fix summary
    if (supplyChain.warnings && supplyChain.warnings.length > 0) {
      supplyChainFixer.displaySummary();
    }

    // Display license conflict fix summary
    if (licenseRisks.warnings && licenseRisks.warnings.length > 0) {
      licenseConflictFixer.displaySummary();
    }

    // Step 6: Clear cache
    console.log(chalk.bold('\nStep 6: Clearing cache...\n'));
    clearCache(projectPath);
    console.log(chalk.green('✓ Cache cleared\n'));

    // Step 7: Generate and display report
    report.finalize();
    report.display();

    // Save report to file
    const reportPath = await report.save(projectPath);
    if (reportPath) {
      console.log(chalk.cyan(`📄 Full report saved to: ${path.basename(reportPath)}\n`));
    }

    // Final summary
    const summary = report.getSummary();
    if (summary.totalFixes > 0) {
      console.log(chalk.green.bold(`✓ Successfully applied ${summary.totalFixes} fix(es)!\n`));
      console.log(chalk.gray('💡 TIP: Run'), chalk.cyan('devcompass analyze'), chalk.gray('to verify improvements\n'));
    }

    if (summary.totalErrors > 0) {
      console.log(chalk.yellow(`⚠️  ${summary.totalErrors} error(s) occurred during fix\n`));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Fix failed:'), error.message);
    console.log(chalk.yellow('\n💡 TIP: Your backup is available in .devcompass-backups/\n'));
    process.exit(1);
  }
}

// Helper functions

// NEW: Helper function to detect major updates
function isMajorVersionUpdate(versionsBehind) {
  if (!versionsBehind) return false;
  
  const str = versionsBehind.toString().toLowerCase();
  return str === 'major' || 
         str.includes('major') || 
         str === 'major update';
}

async function analyzeProject(projectPath) {
  // Load existing analyzers
  const alerts = require('../alerts');
  const unusedDeps = require('../analyzers/unused-deps');
  const outdated = require('../analyzers/outdated');
  const security = require('../analyzers/security');
  const supplyChainAnalyzer = require('../analyzers/supply-chain');
  const licenses = require('../analyzers/licenses');
  const licenseRiskAnalyzer = require('../analyzers/license-risk');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
  );

  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  // Run analyses
  const alertsList = await alerts.checkEcosystemAlerts(projectPath, dependencies);
  const unusedList = await unusedDeps.findUnusedDeps(projectPath, dependencies);
  const outdatedList = await outdated.findOutdatedDeps(projectPath, dependencies);
  const securityData = await security.checkSecurity(projectPath);
  const supplyChainData = await supplyChainAnalyzer.analyzeSupplyChain(projectPath, dependencies);
  const licenseData = await licenses.checkLicenses(projectPath, dependencies);
  const licenseRisksData = await licenseRiskAnalyzer.analyzeLicenseRisks(projectPath, licenseData);

  return { 
    alerts: alertsList, 
    unused: unusedList, 
    outdated: outdatedList, 
    security: securityData,
    supplyChain: supplyChainData,
    licenseRisks: licenseRisksData
  };
}

function calculateTotalFixes(alerts, unused, outdated, security, supplyChain, licenseRisks) {
  let total = 0;

  // Count supply chain auto-fixable issues
  if (supplyChain && supplyChain.warnings) {
    total += supplyChain.warnings.filter(w => w.autoFixable).length;
  }

  // Count license conflict auto-fixable issues
  if (licenseRisks && licenseRisks.warnings) {
    total += licenseRisks.warnings.filter(w => w.autoFixable).length;
  }

  // Count security fixes
  if (security.metadata.critical > 0 || security.metadata.high > 0) {
    total += 1; // npm audit fix counts as one operation
  }

  // Count critical/high alerts
  total += alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  // Count unused deps
  total += unused.length;

  // Count safe updates (patch/minor only) - FIXED!
  const safeUpdates = outdated.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
  total += safeUpdates.length;

  return total;
}

function displayPlannedFixes(alerts, unused, outdated, security, supplyChain, licenseRisks, dryRun) {
  let fixCount = 0;

  // Supply chain fixes
  if (supplyChain && supplyChain.warnings && supplyChain.warnings.length > 0) {
    const autoFixable = supplyChain.warnings.filter(w => w.autoFixable);
    
    if (autoFixable.length > 0) {
      console.log(chalk.red.bold('🔴 SUPPLY CHAIN SECURITY FIXES'));
      
      autoFixable.forEach(warning => {
        console.log(`  ${chalk.cyan(warning.package)}`);
        console.log(`    ${chalk.gray('→')} ${warning.description}`);
        console.log(`    ${chalk.gray('Action:')} ${warning.action.replace(/_/g, ' ')}`);
        if (warning.replacement) {
          console.log(`    ${chalk.gray('Replace with:')} ${warning.replacement}`);
        }
        fixCount++;
      });
      
      const requiresReview = supplyChain.warnings.filter(w => w.requiresConfirmation);
      if (requiresReview.length > 0) {
        console.log(chalk.yellow('\n  ⚠️  Some supply chain issues require manual review'));
      }
    }
  }

  // License conflict fixes
  if (licenseRisks && licenseRisks.warnings && licenseRisks.warnings.length > 0) {
    const autoFixable = licenseRisks.warnings.filter(w => w.autoFixable);
    
    if (autoFixable.length > 0) {
      console.log(chalk.yellow.bold('\n🟠 LICENSE CONFLICT FIXES'));
      
      autoFixable.forEach(warning => {
        console.log(`  ${chalk.cyan(warning.package)}`);
        console.log(`    ${chalk.gray('→')} License conflict: ${warning.license}`);
        if (warning.suggestedAlternative) {
          console.log(`    ${chalk.gray('Replace with:')} ${warning.suggestedAlternative.name} (${warning.suggestedAlternative.license})`);
        }
        console.log(`    ${chalk.gray('Action:')} ${warning.recommendation}`);
        fixCount++;
      });
      
      const requiresReview = licenseRisks.warnings.filter(w => !w.autoFixable);
      if (requiresReview.length > 0) {
        console.log(chalk.yellow('\n  ⚠️  Some license conflicts require manual review'));
      }
    }
  }

  // Security fixes
  if (security.metadata.critical > 0 || security.metadata.high > 0) {
    console.log(chalk.red.bold('\n🔴 CRITICAL SECURITY FIXES'));
    console.log(`  ${chalk.cyan('→')} Run npm audit fix to resolve ${security.metadata.critical + security.metadata.high} vulnerabilities`);
    fixCount++;
  }

  // Ecosystem alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
  if (criticalAlerts.length > 0) {
    console.log(chalk.red.bold('\n🔴 CRITICAL PACKAGE ISSUES'));
    criticalAlerts.forEach(alert => {
      console.log(`  ${chalk.cyan(alert.package)}`);
      console.log(`    ${chalk.gray('→')} ${alert.title}`);
      console.log(`    ${chalk.gray('Fix:')} ${alert.fix}`);
      fixCount++;
    });
  }

  // Unused dependencies
  if (unused.length > 0) {
    console.log(chalk.yellow.bold('\n🟡 UNUSED DEPENDENCIES'));
    unused.forEach(dep => {
      console.log(`  ${chalk.cyan(dep.name)}`);
      console.log(`    ${chalk.gray('→')} Will be removed`);
      fixCount++;
    });
  }

  // Safe updates - FIXED!
  const safeUpdates = outdated.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
  if (safeUpdates.length > 0) {
    console.log(chalk.cyan.bold('\n🔵 SAFE UPDATES (patch/minor)'));
    safeUpdates.forEach(pkg => {
      console.log(`  ${chalk.cyan(pkg.name)}`);
      console.log(`    ${chalk.gray('→')} ${pkg.current} → ${pkg.latest}`);
      fixCount++;
    });
  }

  // Major updates (will be skipped) - FIXED!
  const majorUpdates = outdated.filter(pkg => isMajorVersionUpdate(pkg.versionsBehind));
  if (majorUpdates.length > 0) {
    console.log(chalk.gray.bold('\n⚪ SKIPPED (major updates - manual review required)'));
    majorUpdates.forEach(pkg => {
      console.log(`  ${chalk.gray(pkg.name)}`);
      console.log(`    ${chalk.gray('→')} ${pkg.current} → ${pkg.latest} (breaking changes possible)`);
    });
  }

  console.log(chalk.bold('\n' + '='.repeat(70)));
  console.log(chalk.bold(`Total fixes to apply: ${chalk.cyan(fixCount)}`));
  
  if (dryRun) {
    console.log(chalk.yellow('(Dry run - no changes will be made)'));
  }
}

async function fixSecurityIssues(projectPath, report, progress) {
  try {
    execSync('npm audit fix', {
      cwd: projectPath,
      stdio: 'pipe'
    });
    report.addFix('security', 'npm audit', 'Fixed security vulnerabilities');
  } catch (error) {
    report.addError('npm audit', error);
    progress.warn('Some security issues could not be auto-fixed');
  }
}

async function fixAlert(alert, projectPath, report, progress) {
  try {
    const pkg = alert.package.split('@')[0];
    const version = alert.fix;

    execSync(`npm install ${pkg}@${version}`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    report.addFix('alert', pkg, `Updated to ${version}`, {
      from: alert.package.split('@')[1],
      to: version
    });
  } catch (error) {
    report.addError(alert.package, error);
  }
}

async function removeUnusedDependency(dep, projectPath, report, progress) {
  try {
    execSync(`npm uninstall ${dep.name}`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    report.addFix('unused', dep.name, 'Removed unused dependency');
  } catch (error) {
    report.addError(dep.name, error);
  }
}

async function updatePackage(pkg, projectPath, report, progress) {
  try {
    execSync(`npm install ${pkg.name}@${pkg.latest}`, {
      cwd: projectPath,
      stdio: 'pipe'
    });

    report.addFix('update', pkg.name, `Updated to ${pkg.latest}`, {
      from: pkg.current,
      to: pkg.latest
    });
  } catch (error) {
    report.addError(pkg.name, error);
  }
}

module.exports = fix;