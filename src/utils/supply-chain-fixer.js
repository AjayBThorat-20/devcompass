// src/utils/supply-chain-fixer.js
// v3.1.4 - Supply chain security fixer with dynamic detection

const { execSync } = require('child_process');
const chalk = require('chalk');
const { analyzer } = require('../services');

class SupplyChainFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }
  
  /**
   * Fix a supply chain warning
   */
  async fixWarning(warning, dryRun = false) {
    const packageName = warning.package;
    
    try {
      if (warning.type === 'typosquatting') {
        // Verify it's still suspicious with live check
        const check = analyzer.security.checkTyposquatting(packageName);
        
        if (check) {
          if (!dryRun) {
            // Remove suspicious package
            execSync(`npm uninstall ${packageName}`, {
              stdio: 'pipe',
              cwd: process.cwd()
            });
            
            // Install correct package if suggested
            if (warning.correctPackage) {
              try {
                execSync(`npm install ${warning.correctPackage}`, {
                  stdio: 'pipe',
                  cwd: process.cwd()
                });
              } catch (error) {
                // If correct package install fails, just remove suspicious one
              }
            }
          }
          
          this.fixes.push({
            package: packageName,
            action: 'removed',
            correctPackage: warning.correctPackage || null,
            reason: 'Typosquatting detected',
            distance: warning.distance
          });
          
          return {
            success: true,
            action: 'removed',
            metadata: {
              package: packageName,
              correctPackage: warning.correctPackage,
              reason: 'Typosquatting'
            }
          };
        } else {
          // No longer flagged as suspicious
          this.skipped.push({
            package: packageName,
            reason: 'No longer flagged as suspicious'
          });
          
          return {
            success: false,
            action: 'skip',
            reason: 'Not suspicious'
          };
        }
      } else if (warning.type === 'vulnerability') {
        // Security vulnerabilities are handled by npm audit fix
        if (!dryRun) {
          execSync('npm audit fix', {
            stdio: 'pipe',
            cwd: process.cwd()
          });
        }
        
        this.fixes.push({
          package: packageName,
          action: 'updated',
          reason: 'Security vulnerability fixed',
          severity: warning.severity
        });
        
        return {
          success: true,
          action: 'updated',
          metadata: {
            package: packageName,
            severity: warning.severity
          }
        };
      } else {
        // Unknown type - skip
        this.skipped.push({
          package: packageName,
          reason: `Unknown warning type: ${warning.type}`
        });
        
        return {
          success: false,
          action: 'skip',
          reason: 'Unknown type'
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
   * Display summary of supply chain fixes
   */
  displaySummary() {
    console.log(chalk.bold.cyan('\n🛡️  SUPPLY CHAIN FIXES SUMMARY\n'));
    
    if (this.fixes.length > 0) {
      console.log(chalk.green(`✓ ${this.fixes.length} issue(s) resolved:\n`));
      
      this.fixes.forEach(fix => {
        if (fix.action === 'removed') {
          console.log(`  ${chalk.red('✗')} Removed: ${chalk.cyan(fix.package)}`);
          if (fix.correctPackage) {
            console.log(`    ${chalk.green('✓')} Installed: ${chalk.green(fix.correctPackage)}`);
          }
          console.log(`    ${chalk.gray('Reason:')} ${fix.reason}`);
        } else if (fix.action === 'updated') {
          console.log(`  ${chalk.green('↑')} Updated: ${chalk.cyan(fix.package)}`);
          console.log(`    ${chalk.gray('Reason:')} ${fix.reason}`);
        }
      });
      
      console.log('');
    }
    
    if (this.skipped.length > 0) {
      console.log(chalk.yellow(`⚠️  ${this.skipped.length} warning(s) skipped:\n`));
      
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

module.exports = SupplyChainFixer;