// src/features/fix/services/license-conflict-fixer.service.js

const { execSync } = require('child_process');
const chalk = require('chalk');
const dynamicLicense = require('../../quality/dynamic-license.service');
const { sanitizePackageName } = require('../../../shared/utils/package-sanitizer');

class LicenseConflictFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }

  async fixWarning(warning, dryRun = false) {
    const packageName = warning.package;

    try {
      const result = await dynamicLicense.analyzePackage(packageName);
      const alternative = result?.alternative?.replacement || result?.alternative;

      if (alternative) {
        if (!dryRun) {
          const safePackageName = sanitizePackageName(packageName);
          const safeAlternative = sanitizePackageName(alternative);

          try {
            execSync(`npm uninstall ${safePackageName}`, { stdio: 'pipe', cwd: process.cwd() });
          } catch (error) { /* ignore uninstall errors */ }

          execSync(`npm install ${safeAlternative}`, { stdio: 'pipe', cwd: process.cwd() });
        }

        this.fixes.push({
          package: packageName,
          action: 'replaced',
          replacement: alternative,
          oldLicense: warning.license,
          newLicense: 'MIT',
          severity: warning.severity
        });

        return { success: true, action: 'replaced', metadata: { from: packageName, to: alternative, oldLicense: warning.license, newLicense: 'MIT' } };
      }

      this.skipped.push({ package: packageName, license: warning.license, severity: warning.severity, reason: 'No permissive alternative available - manual review required' });
      return { success: false, action: 'review', reason: 'No alternative found' };
    } catch (error) {
      this.errors.push({ package: packageName, error: error.message });
      return { success: false, action: 'error', reason: error.message };
    }
  }

  getSummary() {
    return { totalFixes: this.fixes.length, totalSkipped: this.skipped.length, totalErrors: this.errors.length, fixes: this.fixes, skipped: this.skipped, errors: this.errors };
  }

  reset() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }
}

module.exports = LicenseConflictFixer;