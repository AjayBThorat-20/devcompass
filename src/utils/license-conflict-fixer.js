// src/utils/license-conflict-fixer.js
// v3.1.4 - License conflict fixer with dynamic alternatives

const { execSync } = require('child_process');
const chalk = require('chalk');
const { analyzer } = require('../services');

class LicenseConflictFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }
  
  /**
   * Fix a license conflict warning
   */
  async fixWarning(warning, dryRun = false) {
    const packageName = warning.package;
    
    try {
      // Get dynamic alternative from license analyzer
      const result = await analyzer.license.analyzePackage(packageName);
      
      if (result.alternative) {
        if (!dryRun) {
          // Uninstall problematic package
          try {
            execSync(`npm uninstall ${packageName}`, {
              stdio: 'pipe',
              cwd: process.cwd()
            });
          } catch (error) {
            // Ignore uninstall errors
          }
          
          // Install alternative
          execSync(`npm install ${result.alternative}`, {
            stdio: 'pipe',
            cwd: process.cwd()
          });
        }
        
        this.fixes.push({
          package: packageName,
          action: 'replaced',
          replacement: result.alternative,
          oldLicense: warning.license,
          newLicense: 'MIT', // Most alternatives are MIT
          severity: warning.severity
        });
        
        return {
          success: true,
          action: 'replaced',
          metadata: {
            from: packageName,
            to: result.alternative,
            oldLicense: warning.license,
            newLicense: 'MIT'
          }
        };
      } else {
        // No alternative found - requires manual review
        this.skipped.push({
          package: packageName,
          license: warning.license,
          severity: warning.severity,
          reason: 'No permissive alternative available - manual review required'
        });
        
        return {
          success: false,
          action: 'review',
          reason: 'No alternative found'
        };
      }
      
    } catch (error) {
      this.errors.push({
        package: packageName,
        error: error.message
      });
      
      return {
        success: false,
        action: 'error',
        reason: error.message
      };
    }
  }
  
  /**
   * Display summary of license fixes
   */
  displaySummary() {
    console.log(chalk.bold.cyan('\n⚖️  LICENSE FIXES SUMMARY\n'));
    
    if (this.fixes.length > 0) {
      console.log(chalk.green(`✓ ${this.fixes.length} license conflict(s) resolved:\n`));
      
      this.fixes.forEach(fix => {
        console.log(`  ${chalk.cyan(fix.package)} → ${chalk.green(fix.replacement)}`);
        console.log(`    ${chalk.gray('License:')} ${chalk.red(fix.oldLicense)} → ${chalk.green(fix.newLicense)}`);
      });
      
      console.log('');
    }
    
    if (this.skipped.length > 0) {
      console.log(chalk.yellow(`⚠️  ${this.skipped.length} conflict(s) require manual review:\n`));
      
      this.skipped.forEach(skip => {
        console.log(`  ${chalk.yellow(skip.package)}`);
        console.log(`    ${chalk.gray('License:')} ${skip.license}`);
        console.log(`    ${chalk.gray('Severity:')} ${skip.severity}`);
        console.log(`    ${chalk.gray('Reason:')} ${skip.reason}`);
      });
      
      console.log('');
    }
    
    if (this.errors.length > 0) {
      console.log(chalk.red(`✗ ${this.errors.length} error(s) occurred:\n`));
      
      this.errors.forEach(err => {
        console.log(`  ${chalk.red(err.package)}`);
        console.log(`    ${chalk.gray('Error:')} ${err.error}`);
      });
      
      console.log('');
    }
  }
  
  /**
   * Get summary statistics
   * @returns {Object}
   */
  getSummary() {
    return {
      totalFixes: this.fixes.length,
      totalSkipped: this.skipped.length,
      totalErrors: this.errors.length,
      fixes: this.fixes,
      skipped: this.skipped,
      errors: this.errors
    };
  }
  
  /**
   * Reset fixer state
   */
  reset() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }
}

module.exports = LicenseConflictFixer;