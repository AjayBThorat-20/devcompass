// src/features/fix/services/quality-fixer.service.js

const { execSync } = require('child_process');
const dynamicQuality = require('../../quality/dynamic-quality.service');
const { sanitizePackageName } = require('../../../shared/utils/package-sanitizer');

class QualityFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }

  async findAlternative(packageName) {
    try {
      const result = await dynamicQuality.analyzePackage(packageName);
      if (result?.alternative) {
        const replacement = result.alternative.replacement || result.alternative;
        return { recommended: replacement, reason: result.alternative.reason || 'Package has quality issues' };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async fixWarning(pkg, dryRun = false) {
    const packageName = pkg.name || pkg.package;

    try {
      const alternative = await this.findAlternative(packageName);

      if (alternative) {
        if (!dryRun) {
          const safePackageName = sanitizePackageName(packageName);
          const safeAlternative = sanitizePackageName(alternative.recommended);

          try {
            execSync(`npm uninstall ${safePackageName}`, { stdio: 'pipe', cwd: process.cwd() });
          } catch (error) { /* ignore uninstall errors */ }

          execSync(`npm install ${safeAlternative}`, { stdio: 'pipe', cwd: process.cwd() });
        }

        this.fixes.push({ package: packageName, action: 'replaced', replacement: alternative.recommended, reason: alternative.reason, status: pkg.status });
        return { success: true, action: 'replaced', metadata: { from: packageName, to: alternative.recommended, reason: alternative.reason } };
      }

      this.skipped.push({ package: packageName, reason: 'No alternative available - requires manual review', status: pkg.status });
      return { success: false, action: 'review', reason: 'No alternative available' };
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

module.exports = QualityFixer;