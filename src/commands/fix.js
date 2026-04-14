// src/commands/fix.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const readline = require('readline');
const ProgressTracker = require('../utils/progress-tracker');
const FixReport = require('../utils/fix-report');
const BackupManager = require('../utils/backup-manager');
const SupplyChainFixer = require('../utils/supply-chain-fixer');
const LicenseConflictFixer = require('../utils/license-conflict-fixer');
const QualityFixer = require('../utils/quality-fixer');
const BatchSelector = require('../utils/batch-selector');
const BatchExecutor = require('../utils/batch-executor');
const BatchReporter = require('../utils/batch-reporter');
const { clearCache } = require('../cache/manager');
const { calculateAlertPenalty } = require('../alerts/formatter');
const { calculateScore } = require('../analyzers/scoring');
const { calculateSecurityPenalty } = require('../analyzers/security');

async function fix(options = {}) {
  const projectPath = options.path || process.cwd();
  const autoApply = options.yes || options.y || false;
  const dryRun = options.dryRun || options.dry || false;
  const batchMode = options.batch || options.batchMode || options.only || options.skip;

  console.log(chalk.bold.cyan('\n🔧 DevCompass Fix\n'));

  if (dryRun) {
    console.log(chalk.yellow('📋 DRY RUN MODE - No changes will be made\n'));
  }

  if (batchMode) {
    console.log(chalk.cyan('📦 BATCH MODE ENABLED\n'));
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red('❌ No package.json found in this directory'));
    process.exit(1);
  }

  // Initialize report, backup, and fixers
  const report = new FixReport();
  const backupManager = new BackupManager(projectPath);
  const supplyChainFixer = new SupplyChainFixer();
  const licenseConflictFixer = new LicenseConflictFixer();
  const qualityFixer = new QualityFixer();

  try {
    // Step 1: Analyze what needs fixing
    console.log(chalk.bold('Step 1: Analyzing issues...\n'));
    const spinner = ora('Scanning project...').start();

    const analysisData = await analyzeProject(projectPath);

    spinner.succeed('Analysis complete');

    // Build planned fixes structure
    const plannedFixes = buildPlannedFixes(analysisData);

    // Calculate total fixes needed
    const totalFixes = calculateTotalFixes(
      analysisData.security,
      analysisData.supplyChain,
      analysisData.licenseData,
      analysisData.qualityData,
      analysisData.ecosystem,
      analysisData.unused,
      analysisData.outdated
    );

    if (totalFixes === 0) {
      console.log(chalk.green('\n✨ No issues to fix! Your project is healthy.\n'));
      return;
    }

    // Check if batch mode is enabled
    if (batchMode) {
      return await executeBatchMode(options, plannedFixes, analysisData, projectPath, backupManager, dryRun, autoApply);
    }

    // Continue with normal fix mode...
    // Step 2: Show what will be fixed
    console.log(chalk.bold('\nStep 2: Planned fixes\n'));
    displayPlannedFixes(analysisData, dryRun);

    console.log(chalk.bold('\n' + '='.repeat(70)));
    console.log(chalk.bold(`Total fixes to apply: ${chalk.cyan(totalFixes)}`));
    
    if (dryRun) {
      console.log(chalk.yellow('(Dry run - no changes will be made)'));
    }

    // Step 3: Get confirmation (unless auto-apply or dry-run)
    if (!dryRun && !autoApply) {
      console.log(chalk.bold('\n' + '='.repeat(70)));
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question(chalk.yellow('⚠️  Apply these fixes? (y/N): '), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('\nFix cancelled by user.\n'));
        return;
      }
    }

    // Step 4: Create backup
    console.log(chalk.bold('\nStep 4: Creating backup...\n'));

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
    );
    const totalDeps = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }).length;

    let currentScore;
    try {
      currentScore = calculateScore(
        totalDeps,
        analysisData.unused.length,
        analysisData.outdated.length,
        analysisData.ecosystem.length,
        calculateAlertPenalty(analysisData.ecosystem),
        calculateSecurityPenalty(analysisData.security.metadata)
      );
    } catch (error) {
      console.log(chalk.gray('  (Score calculation skipped)'));
      currentScore = { total: 0 };
    }

    const backupPath = await backupManager.createBackup(
      dryRun ? 'Before dry-run analysis' : 'Before automated fixes',
      {
        fixesPending: totalFixes,
        healthScore: currentScore.total || 0,
        supplyChainWarnings: analysisData.supplyChain?.total || 0,
        licenseWarnings: analysisData.licenseData?.warnings?.length || 0,
        qualityWarnings: analysisData.qualityData?.packages?.filter(p => p.autoFixable).length || 0,
        securityVulnerabilities: analysisData.security?.metadata?.total || 0,
        ecosystemAlerts: analysisData.ecosystem?.length || 0,
        unusedDependencies: analysisData.unused?.length || 0
      }
    );

    if (backupPath) {
      console.log(chalk.green(`✓ Backup created: ${path.basename(backupPath)}\n`));
    } else {
      console.log(chalk.yellow('⚠️  Warning: Backup creation failed (continuing anyway)\n'));
    }

    if (dryRun) {
      console.log(chalk.cyan('✓ Dry run complete. No changes were made.\n'));
      return;
    }

    // Step 5: Apply fixes with progress tracking
    console.log(chalk.bold('Step 5: Applying fixes...\n'));
    
    const appliedFixes = [];
    const skippedFixes = [];
    const errors = [];
    
    let currentFix = 0;
    const startTime = Date.now();
    const fixSpinner = ora('Starting fixes...').start();

    // ✅ FIXED: Safe array extraction for supply chain warnings
    const safeSupplyChainWarnings = Array.isArray(analysisData.supplyChain?.warnings) 
      ? analysisData.supplyChain.warnings 
      : [];

    // Priority 1: Fix supply chain issues FIRST
    if (safeSupplyChainWarnings.length > 0) {
      const autoFixableSupplyChain = safeSupplyChainWarnings.filter(w => w.autoFixable);
      
      for (const warning of autoFixableSupplyChain) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
        
        fixSpinner.text = `Fixing supply chain: ${warning.package}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
        
        try {
          const result = await supplyChainFixer.fixWarning(warning, dryRun);
          
          if (result.success) {
            appliedFixes.push({
              type: 'supply-chain',
              package: warning.package,
              action: result.action,
              metadata: result.metadata
            });
          } else {
            skippedFixes.push({
              type: 'supply-chain',
              package: warning.package,
              reason: result.reason
            });
          }
        } catch (error) {
          errors.push({
            type: 'supply-chain',
            package: warning.package,
            error: error.message
          });
        }
      }
    }

    // ✅ FIXED: Safe array extraction for license warnings
    const safeLicenseWarnings = Array.isArray(analysisData.licenseData?.warnings)
      ? analysisData.licenseData.warnings
      : [];

    // Priority 2: Fix license conflicts
    if (safeLicenseWarnings.length > 0) {
      const autoFixableLicense = safeLicenseWarnings.filter(w => w.autoFixable);
      
      for (const warning of autoFixableLicense) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
        
        fixSpinner.text = `Fixing license conflict: ${warning.package}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
        
        try {
          const result = await licenseConflictFixer.fixWarning(warning, dryRun);
          
          if (result.success) {
            appliedFixes.push({
              type: 'license-conflict',
              package: warning.package,
              action: result.action,
              metadata: result.metadata
            });
          } else {
            skippedFixes.push({
              type: 'license-conflict',
              package: warning.package,
              reason: result.reason
            });
          }
        } catch (error) {
          errors.push({
            type: 'license-conflict',
            package: warning.package,
            error: error.message
          });
        }
      }
    }

    // ✅ FIXED: Safe array extraction for quality packages
    const safeQualityPackages = Array.isArray(analysisData.qualityData?.packages)
      ? analysisData.qualityData.packages
      : [];

    // Priority 3: Fix package quality issues
    if (safeQualityPackages.length > 0) {
      const qualityIssues = safeQualityPackages.filter(p => p.autoFixable);
      
      for (const pkg of qualityIssues) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';

        const alternative = qualityFixer.findAlternative(pkg.name);
        const message = alternative ? `Replacing ${pkg.name} with ${alternative.recommended}` : `Reviewing ${pkg.name}`;

        fixSpinner.text = `${message}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;

        try {
          const result = await qualityFixer.fixWarning(pkg, dryRun);
          
          if (result.success && result.action === 'replaced') {
            appliedFixes.push({
              type: 'quality',
              package: pkg.name,
              action: `Replaced with ${alternative.recommended}`,
              metadata: {
                from: pkg.name,
                to: alternative.recommended,
                reason: alternative.reason,
                status: pkg.status
              }
            });
          } else if (result.action === 'review') {
            skippedFixes.push({
              type: 'quality',
              package: pkg.name,
              reason: 'Requires manual review'
            });
          } else {
            skippedFixes.push({
              type: 'quality',
              package: pkg.name,
              reason: result.reason || 'No alternative available'
            });
          }
        } catch (error) {
          errors.push({
            type: 'quality',
            package: pkg.name,
            error: error.message
          });
        }
      }
    }

    // Priority 4: Fix critical security vulnerabilities
    if (analysisData.security?.metadata?.critical > 0 || analysisData.security?.metadata?.high > 0) {
      currentFix++;
      const progress = Math.round((currentFix / totalFixes) * 100);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
      
      fixSpinner.text = `Fixing security vulnerabilities... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
      
      try {
        execSync('npm audit fix', {
          cwd: projectPath,
          stdio: 'pipe'
        });
        
        appliedFixes.push({
          type: 'security',
          package: 'npm audit',
          action: 'Fixed security vulnerabilities'
        });
      } catch (error) {
        errors.push({
          type: 'security',
          package: 'npm audit',
          error: error.message
        });
      }
    }

    // ✅ FIXED: Safe array extraction for ecosystem alerts
    const safeEcosystemAlerts = Array.isArray(analysisData.ecosystem)
      ? analysisData.ecosystem
      : [];

    // Priority 5: Fix ecosystem alerts
    if (safeEcosystemAlerts.length > 0) {
      const criticalAlerts = safeEcosystemAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
      
      for (const alert of criticalAlerts) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
        
        fixSpinner.text = `Fixing ${alert.package}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
        
        try {
          const pkg = alert.package.split('@')[0];
          const version = alert.fix;

          execSync(`npm install ${pkg}@${version}`, {
            cwd: projectPath,
            stdio: 'pipe'
          });

          appliedFixes.push({
            type: 'ecosystem',
            package: pkg,
            action: `Updated to ${version}`,
            metadata: {
              from: alert.package.split('@')[1],
              to: version
            }
          });
        } catch (error) {
          errors.push({
            type: 'ecosystem',
            package: alert.package,
            error: error.message
          });
        }
      }
    }

    // ✅ FIXED: Safe array extraction for unused dependencies
    const safeUnusedDeps = Array.isArray(analysisData.unused)
      ? analysisData.unused
      : [];

    // Priority 6: Remove unused dependencies
    if (safeUnusedDeps.length > 0) {
      for (const dep of safeUnusedDeps) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
        
        fixSpinner.text = `Removing ${dep.name}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
        
        try {
          execSync(`npm uninstall ${dep.name}`, {
            cwd: projectPath,
            stdio: 'pipe'
          });

          appliedFixes.push({
            type: 'unused',
            package: dep.name,
            action: 'Removed unused dependency'
          });
        } catch (error) {
          errors.push({
            type: 'unused',
            package: dep.name,
            error: error.message
          });
        }
      }
    }

    // ✅ FIXED: Safe array extraction for outdated packages
    const safeOutdatedDeps = Array.isArray(analysisData.outdated)
      ? analysisData.outdated
      : [];

    // Priority 7: Update outdated packages
    if (safeOutdatedDeps.length > 0) {
      const safeUpdates = safeOutdatedDeps.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
      
      for (const pkg of safeUpdates) {
        currentFix++;
        const progress = Math.round((currentFix / totalFixes) * 100);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const eta = totalFixes > 0 ? (((Date.now() - startTime) / currentFix) * (totalFixes - currentFix) / 1000).toFixed(1) : '0.0';
        
        fixSpinner.text = `Updating ${pkg.name}... [${currentFix}/${totalFixes}] ${progress}% • ${elapsed}s elapsed • ETA: ${eta}s`;
        
        try {
          execSync(`npm install ${pkg.name}@${pkg.latest}`, {
            cwd: projectPath,
            stdio: 'pipe'
          });

          appliedFixes.push({
            type: 'update',
            package: pkg.name,
            action: `Updated to ${pkg.latest}`,
            metadata: {
              from: pkg.current,
              to: pkg.latest
            }
          });
        } catch (error) {
          errors.push({
            type: 'update',
            package: pkg.name,
            error: error.message
          });
        }
      }
    }

    fixSpinner.succeed('All fixes applied!');

    // Display fix summaries
    if (safeSupplyChainWarnings.length > 0) {
      supplyChainFixer.displaySummary();
    }

    if (safeLicenseWarnings.length > 0) {
      licenseConflictFixer.displaySummary();
    }

    if (safeQualityPackages.filter(p => p.autoFixable).length > 0) {
      qualityFixer.displaySummary();
    }

    // Add fixes to report
    appliedFixes.forEach(fix => {
      report.addFix(fix.type, fix.package, fix.action, fix.metadata);
    });

    skippedFixes.forEach(skip => {
      report.addSkipped(skip.package, skip.reason);
    });

    errors.forEach(err => {
      report.addError(err.package, err);
    });

    // Step 6: Clear cache
    console.log(chalk.bold('\nStep 6: Clearing cache...\n'));
    clearCache(projectPath);
    console.log(chalk.green('✓ Cache cleared\n'));

    // Step 7: Generate and display report
    report.finalize();
    report.display();

    const reportPath = await report.save(projectPath);
    if (reportPath) {
      console.log(chalk.cyan(`📄 Full report saved to: ${path.basename(reportPath)}\n`));
    }

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

/**
 * Execute batch fix mode
 */
async function executeBatchMode(options, plannedFixes, analysisData, projectPath, backupManager, dryRun, autoApply) {
  const selector = new BatchSelector();
  const executor = new BatchExecutor(projectPath);
  const reporter = new BatchReporter(projectPath);

  // Get batch statistics
  const stats = selector.getBatchStats(plannedFixes);

  let selectedBatches;

  // Handle preset batch modes
  if (options.batchMode) {
    const presetMap = {
      'critical': 'c',
      'high': 'h',
      'all': 'a'
    };
    const preset = presetMap[options.batchMode.toLowerCase()];
    selectedBatches = selector.parseBatchSelection(preset, stats);
    
    if (!selectedBatches || selectedBatches.length === 0) {
      console.log(chalk.yellow('\n⚠️  No fixes available for selected batch mode.\n'));
      return;
    }

    console.log(chalk.cyan(`Batch mode: ${options.batchMode}`));
    console.log(chalk.gray(`Selected ${selectedBatches.length} batch(es)\n`));
  }
  // Handle --only option
  else if (options.only) {
    const categories = options.only.split(',').map(c => c.trim());
    selectedBatches = selector.batches.filter(b => 
      categories.includes(b.id) && stats[b.id]?.count > 0
    );

    if (selectedBatches.length === 0) {
      console.log(chalk.yellow('\n⚠️  No fixes available for selected categories.\n'));
      return;
    }
  }
  // Interactive selection
  else {
    selectedBatches = await selector.promptBatchSelection(stats);
    
    if (!selectedBatches) {
      console.log(chalk.red('\n✗ Invalid selection. Please try again.\n'));
      return;
    }

    if (selectedBatches.length === 0) {
      console.log(chalk.yellow('\n⚠️  No batches selected. Exiting.\n'));
      return;
    }
  }

  // Show selected batches
  console.log(chalk.bold.cyan('\n📦 SELECTED BATCHES:\n'));
  selectedBatches.forEach(batch => {
    const count = stats[batch.id]?.count || 0;
    console.log(`  ${batch.icon} ${chalk.bold(batch.name)}: ${chalk.yellow(count + ' fix(es)')}`);
  });

  // Apply --skip option
  if (options.skip) {
    const skipCategories = options.skip.split(',').map(c => c.trim());
    selectedBatches = selectedBatches.filter(b => !skipCategories.includes(b.id));
    
    if (selectedBatches.length === 0) {
      console.log(chalk.yellow('\n⚠️  All batches skipped. Exiting.\n'));
      return;
    }

    console.log(chalk.gray(`\nSkipped categories: ${skipCategories.join(', ')}`));
  }

  // Confirm execution
  if (!autoApply && !dryRun) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(chalk.yellow('\n⚠️  Apply selected batch fixes? (y/N): '), resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log(chalk.gray('\nBatch fix cancelled by user.\n'));
      return;
    }
  }

  // Create backup
  if (!dryRun) {
    console.log(chalk.cyan('\nStep 1: Creating backup...\n'));
    
    const totalBatchFixes = selectedBatches.reduce((sum, b) => sum + (stats[b.id]?.count || 0), 0);
    
    const backupName = await backupManager.createBackup('Before batch fixes', {
      fixesPending: totalBatchFixes,
      healthScore: 0,
      batchMode: true,
      selectedBatches: selectedBatches.map(b => b.id)
    });

    console.log(chalk.green(`✓ Backup created: ${backupName}\n`));
  }

  // Execute batches
  const startTime = Date.now();
  const batchResults = [];
  let totalSuccessful = 0;
  let totalFailed = 0;

  console.log(chalk.cyan('\nStep 2: Executing batches...\n'));

  for (const batch of selectedBatches) {
    const fixes = stats[batch.id]?.fixes || [];
    
    if (dryRun) {
      console.log(chalk.gray(`\n[DRY RUN] Would execute ${batch.name}: ${fixes.length} fix(es)`));
      continue;
    }

    const result = await executor.executeBatch(batch, fixes, {
      verbose: options.verbose,
      yes: autoApply
    });

    batchResults.push(result);
    totalSuccessful += result.successful;
    totalFailed += result.failed;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  if (dryRun) {
    console.log(chalk.green('\n✓ Dry run complete. No changes were made.\n'));
    return;
  }

  // Generate and display report
  const summary = {
    totalBatches: selectedBatches.length,
    totalFixes: totalSuccessful + totalFailed,
    successful: totalSuccessful,
    failed: totalFailed,
    skipped: 0,
    duration
  };

  const batchReport = reporter.generateReport(batchResults, summary);
  reporter.displaySummary(batchResults, summary);

  return {
    success: totalFailed === 0,
    report: batchReport,
    summary
  };
}

/**
 * Build planned fixes structure for batch mode
 */
function buildPlannedFixes(analysisData) {
  const planned = {};

  // ✅ FIXED: Safe array extraction
  // Supply chain fixes
  if (Array.isArray(analysisData.supplyChain?.warnings)) {
    planned.supplyChain = analysisData.supplyChain.warnings.filter(w => w.autoFixable);
  }

  // License conflict fixes
  if (Array.isArray(analysisData.licenseData?.warnings)) {
    planned.licenseConflicts = analysisData.licenseData.warnings.filter(w => w.autoFixable);
  }

  // Quality fixes
  if (Array.isArray(analysisData.qualityData?.packages)) {
    planned.quality = analysisData.qualityData.packages.filter(p => p.autoFixable);
  }

  // Security fixes
  if (analysisData.security?.metadata) {
    const criticalCount = (analysisData.security.metadata.critical || 0) + 
                         (analysisData.security.metadata.high || 0);
    if (criticalCount > 0) {
      planned.security = { criticalCount };
    }
  }

  // Ecosystem fixes
  if (Array.isArray(analysisData.ecosystem)) {
    planned.ecosystem = analysisData.ecosystem.filter(a => 
      a.severity === 'critical' || a.severity === 'high'
    );
  }

  // Unused dependencies
  if (Array.isArray(analysisData.unused)) {
    planned.unused = analysisData.unused.map(dep => dep.name);
  }

  // Safe updates
  if (Array.isArray(analysisData.outdated)) {
    const safeUpdates = analysisData.outdated.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
    if (safeUpdates.length > 0) {
      planned.updates = { safe: safeUpdates };
    }
  }

  return planned;
}

// Helper functions

function isMajorVersionUpdate(versionsBehind) {
  if (!versionsBehind) return false;
  
  const str = versionsBehind.toString().toLowerCase();
  return str === 'major' || 
         str.includes('major') || 
         str === 'major update';
}

async function analyzeProject(projectPath) {
  const alerts = require('../alerts');
  const unusedDeps = require('../analyzers/unused-deps');
  const outdated = require('../analyzers/outdated');
  const securityAnalyzer = require('../analyzers/security');
  const supplyChainAnalyzer = require('../analyzers/supply-chain');
  const licenses = require('../analyzers/licenses');
  const licenseRiskAnalyzer = require('../analyzers/license-risk');
  const packageQuality = require('../analyzers/package-quality');

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
  );

  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  const ecosystem = await alerts.checkEcosystemAlerts(projectPath, dependencies);
  const unused = await unusedDeps.findUnusedDeps(projectPath, dependencies);
  const outdatedList = await outdated.findOutdatedDeps(projectPath, dependencies);
  const securityData = await securityAnalyzer.checkSecurity(projectPath);
  const supplyChain = await supplyChainAnalyzer.analyzeSupplyChain(projectPath, dependencies);
  const licenseData = await licenses.checkLicenses(projectPath, dependencies);
  const licenseRisks = await licenseRiskAnalyzer.analyzeLicenseRisks(projectPath, licenseData);
  const qualityData = await packageQuality.analyzePackageQuality(dependencies);

  return { 
    ecosystem,
    unused,
    outdated: outdatedList,
    security: securityData,
    supplyChain,
    licenseData: licenseRisks,
    qualityData
  };
}

function calculateTotalFixes(security, supplyChain, licenseData, qualityData, ecosystem, unused, outdated) {
  let total = 0;

  // ✅ FIXED: Safe array checks
  if (Array.isArray(supplyChain?.warnings)) {
    total += supplyChain.warnings.filter(w => w.autoFixable).length;
  }

  if (Array.isArray(licenseData?.warnings)) {
    total += licenseData.warnings.filter(w => w.autoFixable).length;
  }

  if (Array.isArray(qualityData?.packages)) {
    total += qualityData.packages.filter(p => p.autoFixable).length;
  }

  if (security?.metadata?.critical > 0 || security?.metadata?.high > 0) {
    total += 1;
  }

  if (Array.isArray(ecosystem)) {
    total += ecosystem.filter(a => a.severity === 'critical' || a.severity === 'high').length;
  }

  if (Array.isArray(unused)) {
    total += unused.length;
  }

  if (Array.isArray(outdated)) {
    const safeUpdates = outdated.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
    total += safeUpdates.length;
  }

  return total;
}

function displayPlannedFixes(data, dryRun) {
  const qualityFixer = new QualityFixer();

  // ✅ FIXED: Safe array extractions for all display sections
  const safeSupplyChainWarnings = Array.isArray(data.supplyChain?.warnings) 
    ? data.supplyChain.warnings 
    : [];
  const safeLicenseWarnings = Array.isArray(data.licenseData?.warnings)
    ? data.licenseData.warnings
    : [];
  const safeQualityPackages = Array.isArray(data.qualityData?.packages)
    ? data.qualityData.packages
    : [];
  const safeEcosystemAlerts = Array.isArray(data.ecosystem)
    ? data.ecosystem
    : [];
  const safeUnusedDeps = Array.isArray(data.unused)
    ? data.unused
    : [];
  const safeOutdatedDeps = Array.isArray(data.outdated)
    ? data.outdated
    : [];

  // Priority 1: Supply chain fixes
  if (safeSupplyChainWarnings.length > 0) {
    const autoFixable = safeSupplyChainWarnings.filter(w => w.autoFixable);
    
    if (autoFixable.length > 0) {
      console.log(chalk.red.bold('🔴 SUPPLY CHAIN SECURITY FIXES'));
      
      autoFixable.forEach(warning => {
        console.log(`  ${chalk.cyan(warning.package)}`);
        console.log(`    ${chalk.gray('→')} ${warning.description}`);
        console.log(`    ${chalk.gray('Action:')} ${warning.action.replace(/_/g, ' ')}`);
        if (warning.replacement) {
          console.log(`    ${chalk.gray('Replace with:')} ${warning.replacement}`);
        }
      });
    }
  }

  // Priority 2: License conflict fixes
  if (safeLicenseWarnings.length > 0) {
    const autoFixable = safeLicenseWarnings.filter(w => w.autoFixable);
    
    if (autoFixable.length > 0) {
      console.log(chalk.yellow.bold('\n🟠 LICENSE CONFLICT FIXES'));
      
      autoFixable.forEach(warning => {
        console.log(`  ${chalk.cyan(warning.package)}`);
        console.log(`    ${chalk.gray('→')} License conflict: ${warning.license}`);
        if (warning.suggestedAlternative) {
          console.log(`    ${chalk.gray('Replace with:')} ${warning.suggestedAlternative.name} (${warning.suggestedAlternative.license})`);
        }
        console.log(`    ${chalk.gray('Action:')} ${warning.recommendation}`);
      });
    }
  }

  // Priority 3: Package quality fixes
  if (safeQualityPackages.length > 0) {
    const qualityIssues = safeQualityPackages.filter(p => p.autoFixable);
    
    if (qualityIssues.length > 0) {
      console.log(chalk.blue.bold('\n🔵 PACKAGE QUALITY FIXES'));
      
      qualityIssues.forEach(pkg => {
        const alternative = qualityFixer.findAlternative(pkg.name);
        console.log(`  ${chalk.cyan(pkg.name)}`);
        
        if (pkg.status === 'ABANDONED' || pkg.status === 'DEPRECATED') {
          console.log(`    ${chalk.gray('→')} Package is ${pkg.status.toLowerCase()}`);
        } else if (pkg.status === 'STALE') {
          console.log(`    ${chalk.gray('→')} Package is stale (${pkg.lastUpdate})`);
        }
        
        if (alternative) {
          console.log(`    ${chalk.gray('Replace with:')} ${alternative.recommended}`);
          console.log(`    ${chalk.gray('Action:')} Replace with ${alternative.recommended}`);
          
          if (alternative.migration_guide) {
            console.log(`    ${chalk.gray('Migration guide:')} ${alternative.migration_guide}`);
          }
        } else {
          console.log(`    ${chalk.gray('Action:')} Review manually (no alternative available)`);
        }
      });
    }
  }

  // Priority 4: Security fixes
  if (data.security?.metadata?.critical > 0 || data.security?.metadata?.high > 0) {
    console.log(chalk.red.bold('\n🔴 CRITICAL SECURITY FIXES'));
    console.log(`  ${chalk.cyan('→')} Run npm audit fix to resolve ${data.security.metadata.critical + data.security.metadata.high} vulnerabilities`);
  }

  // Priority 5: Ecosystem alerts
  if (safeEcosystemAlerts.length > 0) {
    const criticalAlerts = safeEcosystemAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    
    if (criticalAlerts.length > 0) {
      console.log(chalk.yellow.bold('\n🟠 ECOSYSTEM ALERTS'));
      
      criticalAlerts.forEach(alert => {
        console.log(`  ${chalk.cyan(alert.package)}`);
        console.log(`    ${chalk.gray('→')} ${alert.title}`);
        console.log(`    ${chalk.gray('Fix:')} ${alert.fix}`);
      });
    }
  }

  // Priority 6: Unused dependencies
  if (safeUnusedDeps.length > 0) {
    console.log(chalk.yellow.bold('\n🟡 UNUSED DEPENDENCIES'));
    
    safeUnusedDeps.forEach(dep => {
      console.log(`  ${chalk.cyan(dep.name)}`);
      console.log(`    ${chalk.gray('→')} Will be removed`);
    });
  }

  // Priority 7: Safe updates
  if (safeOutdatedDeps.length > 0) {
    const safeUpdates = safeOutdatedDeps.filter(pkg => !isMajorVersionUpdate(pkg.versionsBehind));
    
    if (safeUpdates.length > 0) {
      console.log(chalk.cyan.bold('\n🔵 SAFE UPDATES (patch/minor)'));
      
      safeUpdates.forEach(pkg => {
        console.log(`  ${chalk.cyan(pkg.name)}`);
        console.log(`    ${chalk.gray('→')} ${pkg.current} → ${pkg.latest}`);
      });
    }

    const majorUpdates = safeOutdatedDeps.filter(pkg => isMajorVersionUpdate(pkg.versionsBehind));
    
    if (majorUpdates.length > 0) {
      console.log(chalk.gray.bold('\n⚪ SKIPPED (major updates - manual review required)'));
      
      majorUpdates.forEach(pkg => {
        console.log(`  ${chalk.gray(pkg.name)}`);
        console.log(`    ${chalk.gray('→')} ${pkg.current} → ${pkg.latest} (breaking changes possible)`);
      });
    }
  }
}

module.exports = fix;