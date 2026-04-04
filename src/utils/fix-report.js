// src/utils/fix-report.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class FixReport {
  constructor() {
    this.fixes = [];
    this.errors = [];
    this.skipped = [];
    this.startTime = Date.now();
    this.endTime = null;
  }

  addFix(type, packageName, action, details = {}) {
    this.fixes.push({
      type,
      package: packageName,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  addError(packageName, error, details = {}) {
    this.errors.push({
      package: packageName,
      error: error.message || error,
      details,
      timestamp: new Date().toISOString()
    });
  }

  addSkipped(packageName, reason, details = {}) {
    this.skipped.push({
      package: packageName,
      reason,
      details,
      timestamp: new Date().toISOString()
    });
  }

  finalize() {
    this.endTime = Date.now();
  }

  getSummary() {
    const duration = ((this.endTime || Date.now()) - this.startTime) / 1000;
    
    return {
      totalFixes: this.fixes.length,
      totalErrors: this.errors.length,
      totalSkipped: this.skipped.length,
      duration: `${duration.toFixed(2)}s`,
      timestamp: new Date().toISOString()
    };
  }

  async save(projectPath) {
    try {
      const reportPath = path.join(projectPath, 'devcompass-fix-report.json');
      const report = {
        summary: this.getSummary(),
        fixes: this.fixes,
        errors: this.errors,
        skipped: this.skipped
      };

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      return reportPath;
    } catch (error) {
      console.error(chalk.red('Failed to save fix report:'), error.message);
      return null;
    }
  }

  display() {
    console.log('\n' + chalk.bold('━'.repeat(70)));
    console.log(chalk.bold.cyan('📊 FIX REPORT'));
    console.log(chalk.bold('━'.repeat(70)) + '\n');

    const summary = this.getSummary();

    // Summary
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} Fixes Applied: ${chalk.cyan(summary.totalFixes)}`);
    if (summary.totalErrors > 0) {
      console.log(`  ${chalk.red('✗')} Errors: ${chalk.red(summary.totalErrors)}`);
    }
    if (summary.totalSkipped > 0) {
      console.log(`  ${chalk.yellow('⊘')} Skipped: ${chalk.yellow(summary.totalSkipped)}`);
    }
    console.log(`  ${chalk.gray('⏱')}  Duration: ${chalk.cyan(summary.duration)}`);

    // Fixes
    if (this.fixes.length > 0) {
      console.log('\n' + chalk.bold('Fixes Applied:'));
      this.fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${chalk.cyan(fix.package)}`);
        console.log(`     ${chalk.gray('→')} ${fix.action}`);
        if (fix.details.from && fix.details.to) {
          console.log(`     ${chalk.gray('Version:')} ${fix.details.from} → ${chalk.green(fix.details.to)}`);
        }
      });
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n' + chalk.bold.red('Errors:'));
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${chalk.red(error.package)}`);
        console.log(`     ${chalk.gray('→')} ${error.error}`);
      });
    }

    // Skipped
    if (this.skipped.length > 0) {
      console.log('\n' + chalk.bold.yellow('Skipped:'));
      this.skipped.forEach((skip, index) => {
        console.log(`  ${index + 1}. ${chalk.yellow(skip.package)}`);
        console.log(`     ${chalk.gray('→')} ${skip.reason}`);
      });
    }

    console.log('\n' + chalk.bold('━'.repeat(70)) + '\n');
  }
}

module.exports = FixReport;