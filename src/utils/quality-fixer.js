// src/utils/quality-fixer.js
// v3.1.4 - Quality issue fixer with dynamic alternatives

const { execSync } = require('child_process');
const chalk = require('chalk');
const { analyzer } = require('../services');

class QualityFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }
  
  /**
   * Find alternative for a package (dynamic lookup)
   */
  async findAlternative(packageName) {
    try {
      const result = await analyzer.quality.analyzePackage(packageName);
      
      if (result.alternative) {
        return {
          recommended: result.alternative,
          reason: result.deprecationMessage || 'Package has quality issues',
          migration_guide: null // Could be enhanced with migration guides
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Fix a quality warning
   */
  async fixWarning(pkg, dryRun = false) {
    const packageName = pkg.name || pkg.package;
    
    try {
      // Get dynamic alternative
      const alternative = await this.findAlternative(packageName);
      
      if (alternative) {
        if (!dryRun) {
          // Uninstall old package
          try {
            execSync(`npm uninstall ${packageName}`, {
              stdio: 'pipe',
              cwd: process.cwd()
            });
          } catch (error) {
            // Ignore uninstall errors
          }
          
          // Install alternative
          execSync(`npm install ${alternative.recommended}`, {
            stdio: 'pipe',
            cwd: process.cwd()
          });
        }
        
        this.fixes.push({
          package: packageName,
          action: 'replaced',
          replacement: alternative.recommended,
          reason: alternative.reason,
          status: pkg.status
        });
        
        return {
          success: true,
          action: 'replaced',
          metadata: {
            from: packageName,
            to: alternative.recommended,
            reason: alternative.reason
          }
        };
      } else {
        // No alternative available - requires manual review
        this.skipped.push({
          package: packageName,
          reason: 'No alternative available - requires manual review',
          status: pkg.status
        });
        
        return {
          success: false,
          action: 'review',
          reason: 'No alternative available'
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
   * Display summary of quality fixes
   */
  displaySummary() {
    console.log(chalk.bold.cyan('\n📦 QUALITY FIXES SUMMARY\n'));
    
    if (this.fixes.length > 0) {
      console.log(chalk.green(`✓ ${this.fixes.length} package(s) replaced:\n`));
      
      this.fixes.forEach(fix => {
        console.log(`  ${chalk.cyan(fix.package)} → ${chalk.green(fix.replacement)}`);
        console.log(`    ${chalk.gray('Reason:')} ${fix.reason}`);
      });
      
      console.log('');
    }
    
    if (this.skipped.length > 0) {
      console.log(chalk.yellow(`⚠️  ${this.skipped.length} package(s) require manual review:\n`));
      
      this.skipped.forEach(skip => {
        console.log(`  ${chalk.yellow(skip.package)}`);
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

module.exports = QualityFixer;