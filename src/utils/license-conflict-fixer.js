// src/utils/license-conflict-fixer.js
const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class LicenseConflictFixer {
  constructor() {
    this.fixesApplied = [];
    this.fixesSkipped = [];
    this.errors = [];
    this.alternatives = this.loadAlternatives();
  }

  /**
   * Load package alternatives database
   */
  loadAlternatives() {
    try {
      const alternativesPath = path.join(__dirname, '../../data/package-alternatives.json');
      if (fs.existsSync(alternativesPath)) {
        return JSON.parse(fs.readFileSync(alternativesPath, 'utf8'));
      }
      return null;
    } catch (error) {
      console.error('Warning: Could not load package alternatives database');
      return null;
    }
  }

  async fixWarning(warning, projectPath, report, progress, skipConfirmation = false) {
    try {
      switch (warning.autoFixAction) {
        case 'replace':
          return await this.replacePackage(warning, projectPath, report, progress, skipConfirmation);
        
        case 'review':
          // Requires manual review
          this.fixesSkipped.push({
            package: warning.package,
            reason: 'Requires manual legal review',
            warning: warning
          });
          report.addSkipped(
            warning.package,
            'License conflict - requires manual legal review'
          );
          return false;
        
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
   * Replace package with license-compatible alternative
   */
  async replacePackage(warning, projectPath, report, progress, skipConfirmation) {
    const pkgName = warning.package.split('@')[0];
    const alternative = warning.suggestedAlternative;

    if (!alternative) {
      this.fixesSkipped.push({
        package: warning.package,
        reason: 'No alternative available',
        warning: warning
      });
      return false;
    }

    // Requires confirmation unless skipConfirmation is true
    if (!skipConfirmation && warning.requiresConfirmation) {
      this.fixesSkipped.push({
        package: warning.package,
        reason: 'Requires confirmation (use --yes to auto-apply)',
        warning: warning
      });
      report.addSkipped(
        warning.package,
        'License conflict - requires confirmation'
      );
      return false;
    }

    progress.update(`Replacing ${pkgName} with ${alternative.name}...`);

    try {
      // Remove conflicting package
      execSync(`npm uninstall ${pkgName}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      // Install alternative
      execSync(`npm install ${alternative.name}`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      this.fixesApplied.push({
        type: 'license_replaced',
        package: warning.package,
        alternative: alternative.name,
        action: `Replaced with license-compatible alternative: ${alternative.name}`,
        oldLicense: warning.license,
        newLicense: alternative.license
      });

      report.addFix(
        'license-conflict',
        warning.package,
        `Replaced with ${alternative.name}`,
        {
          from: warning.package,
          to: alternative.name,
          oldLicense: warning.license,
          newLicense: alternative.license,
          reason: warning.reason
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to replace ${pkgName}: ${error.message}`);
    }
  }

  /**
   * Find alternative for a package
   */
  findAlternative(packageName, license) {
    if (!this.alternatives) return null;

    // Check GPL alternatives
    if (license.includes('GPL') && !license.includes('LGPL')) {
      const gplAlts = this.alternatives.gpl_alternatives[packageName];
      if (gplAlts && gplAlts.alternatives.length > 0) {
        return gplAlts.alternatives[0];
      }
    }

    // Check AGPL alternatives
    if (license.includes('AGPL')) {
      const agplAlts = this.alternatives.agpl_alternatives[packageName];
      if (agplAlts && agplAlts.alternatives.length > 0) {
        return agplAlts.alternatives[0];
      }
    }

    // Check LGPL alternatives
    if (license.includes('LGPL')) {
      const lgplAlts = this.alternatives.lgpl_alternatives[packageName];
      if (lgplAlts && lgplAlts.alternatives.length > 0) {
        return lgplAlts.alternatives[0];
      }
    }

    return null;
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
        gplReplaced: this.fixesApplied.filter(f => f.oldLicense && f.oldLicense.includes('GPL') && !f.oldLicense.includes('LGPL')).length,
        agplReplaced: this.fixesApplied.filter(f => f.oldLicense && f.oldLicense.includes('AGPL')).length,
        lgplReplaced: this.fixesApplied.filter(f => f.oldLicense && f.oldLicense.includes('LGPL')).length
      }
    };
  }

  /**
   * Display summary
   */
  displaySummary() {
    const summary = this.getSummary();

    if (summary.applied > 0) {
      console.log(chalk.green.bold(`\n✓ License Conflict Fixes Applied: ${summary.applied}`));
      
      if (summary.details.gplReplaced > 0) {
        console.log(chalk.yellow(`  • GPL packages replaced: ${summary.details.gplReplaced}`));
      }
      if (summary.details.agplReplaced > 0) {
        console.log(chalk.red(`  • AGPL packages replaced: ${summary.details.agplReplaced}`));
      }
      if (summary.details.lgplReplaced > 0) {
        console.log(chalk.yellow(`  • LGPL packages replaced: ${summary.details.lgplReplaced}`));
      }
    }

    if (summary.skipped > 0) {
      console.log(chalk.yellow(`\n⊘ License Conflict Fixes Skipped: ${summary.skipped}`));
      this.fixesSkipped.forEach(skip => {
        console.log(chalk.gray(`  • ${skip.package}: ${skip.reason}`));
      });
    }

    if (summary.errors > 0) {
      console.log(chalk.red(`\n✗ License Conflict Fix Errors: ${summary.errors}`));
      this.errors.forEach(err => {
        console.log(chalk.red(`  • ${err.package}: ${err.error}`));
      });
    }
  }
}

module.exports = LicenseConflictFixer;