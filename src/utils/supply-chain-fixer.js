// src/utils/supply-chain-fixer.js
const { execSync } = require('child_process');
const chalk = require('chalk');

class SupplyChainFixer {
  constructor() {
    this.fixesApplied = [];
    this.fixesSkipped = [];
    this.errors = [];
  }

  async fixWarning(warning, projectPath, report, progress, skipConfirmation = false) {
    try {
      switch (warning.autoFixAction) {
        case 'remove':
          return await this.removeMaliciousPackage(warning, projectPath, report, progress);
        
        case 'replace':
          return await this.replaceTyposquatPackage(warning, projectPath, report, progress);
        
        case 'review':
          // Requires manual confirmation due to suspicious scripts
          if (skipConfirmation || warning.requiresConfirmation === false) {
            return await this.removeSuspiciousPackage(warning, projectPath, report, progress);
          } else {
            this.fixesSkipped.push({
              package: warning.package,
              reason: 'Requires manual review (suspicious install script)',
              warning: warning
            });
            report.addSkipped(
              warning.package,
              'Suspicious install script - requires manual review'
            );
            return false;
          }
        
        default:
          this.fixesSkipped.push({
            package: warning.package,
            reason: 'No auto-fix available',
            warning: warning
          });
          return false;
      }
    } catch (error) {
      this.errors.push({
        package: warning.package,
        error: error.message
      });
      report.addError(warning.package, error);
      return false;
    }
  }

  /**
   * Remove malicious package
   */
  async removeMaliciousPackage(warning, projectPath, report, progress) {
    progress.update(`Removing malicious package: ${warning.package}...`);

    try {
      execSync(`npm uninstall ${warning.package}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      this.fixesApplied.push({
        type: 'malicious_removed',
        package: warning.package,
        action: 'Removed malicious package'
      });

      report.addFix(
        'supply-chain',
        warning.package,
        'Removed malicious package',
        { reason: warning.reason }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to remove ${warning.package}: ${error.message}`);
    }
  }

  /**
   * Replace typosquatting package with correct one
   */
  async replaceTyposquatPackage(warning, projectPath, report, progress) {
    progress.update(`Fixing typosquatting: ${warning.package} → ${warning.replacement}...`);

    try {
      // Remove typosquat
      execSync(`npm uninstall ${warning.package}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      // Install correct package
      execSync(`npm install ${warning.replacement}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      this.fixesApplied.push({
        type: 'typosquat_fixed',
        package: warning.package,
        replacement: warning.replacement,
        action: `Replaced with correct package: ${warning.replacement}`
      });

      report.addFix(
        'supply-chain',
        warning.package,
        `Replaced typosquat with ${warning.replacement}`,
        {
          from: warning.package,
          to: warning.replacement,
          reason: warning.reason
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to replace ${warning.package}: ${error.message}`);
    }
  }

  /**
   * Remove package with suspicious install scripts
   */
  async removeSuspiciousPackage(warning, projectPath, report, progress) {
    progress.update(`Removing suspicious package: ${warning.package}...`);

    try {
      execSync(`npm uninstall ${warning.package}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      this.fixesApplied.push({
        type: 'suspicious_removed',
        package: warning.package,
        action: 'Removed package with suspicious install script'
      });

      report.addFix(
        'supply-chain',
        warning.package,
        'Removed package with suspicious install script',
        {
          script: warning.script,
          patterns: warning.patterns,
          reason: warning.reason
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to remove ${warning.package}: ${error.message}`);
    }
  }

  /**
   * Get summary of fixes
   */
  getSummary() {
    return {
      applied: this.fixesApplied.length,
      skipped: this.fixesSkipped.length,
      errors: this.errors.length,
      details: {
        maliciousRemoved: this.fixesApplied.filter(f => f.type === 'malicious_removed').length,
        typosquatsFixed: this.fixesApplied.filter(f => f.type === 'typosquat_fixed').length,
        suspiciousRemoved: this.fixesApplied.filter(f => f.type === 'suspicious_removed').length
      }
    };
  }

  /**
   * Display summary
   */
  displaySummary() {
    const summary = this.getSummary();

    if (summary.applied > 0) {
      console.log(chalk.green.bold(`\n✓ Supply Chain Fixes Applied: ${summary.applied}`));
      
      if (summary.details.maliciousRemoved > 0) {
        console.log(chalk.red(`  • Malicious packages removed: ${summary.details.maliciousRemoved}`));
      }
      if (summary.details.typosquatsFixed > 0) {
        console.log(chalk.yellow(`  • Typosquats fixed: ${summary.details.typosquatsFixed}`));
      }
      if (summary.details.suspiciousRemoved > 0) {
        console.log(chalk.yellow(`  • Suspicious packages removed: ${summary.details.suspiciousRemoved}`));
      }
    }

    if (summary.skipped > 0) {
      console.log(chalk.yellow(`\n⊘ Supply Chain Fixes Skipped: ${summary.skipped}`));
      this.fixesSkipped.forEach(skip => {
        console.log(chalk.gray(`  • ${skip.package}: ${skip.reason}`));
      });
    }

    if (summary.errors > 0) {
      console.log(chalk.red(`\n✗ Supply Chain Fix Errors: ${summary.errors}`));
      this.errors.forEach(err => {
        console.log(chalk.red(`  • ${err.package}: ${err.error}`));
      });
    }
  }
}

module.exports = SupplyChainFixer;