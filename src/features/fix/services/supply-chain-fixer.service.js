// src/features/fix/services/supply-chain-fixer.service.js

const { execSync } = require('child_process');
const dynamicSecurity = require('../../quality/dynamic-security.service');

class SupplyChainFixer {
  constructor() {
    this.fixes = [];
    this.skipped = [];
    this.errors = [];
  }

  async fixWarning(warning, dryRun = false) {
    const packageName = warning.package;

    try {
      if (warning.type === 'typosquatting') {
        const check = dynamicSecurity.checkTyposquatting(packageName);

        if (check) {
          if (!dryRun) {
            execSync(`npm uninstall ${packageName}`, { stdio: 'pipe', cwd: process.cwd() });
            if (warning.correctPackage) {
              try {
                execSync(`npm install ${warning.correctPackage}`, { stdio: 'pipe', cwd: process.cwd() });
              } catch (error) { /* ignore — removal already succeeded */ }
            }
          }

          this.fixes.push({ package: packageName, action: 'removed', correctPackage: warning.correctPackage || null, reason: 'Typosquatting detected', distance: warning.distance });
          return { success: true, action: 'removed', metadata: { package: packageName, correctPackage: warning.correctPackage, reason: 'Typosquatting' } };
        }

        this.skipped.push({ package: packageName, reason: 'No longer flagged as suspicious' });
        return { success: false, action: 'skip', reason: 'Not suspicious' };
      }

      if (warning.type === 'vulnerability') {
        if (!dryRun) execSync('npm audit fix', { stdio: 'pipe', cwd: process.cwd() });

        this.fixes.push({ package: packageName, action: 'updated', reason: 'Security vulnerability fixed', severity: warning.severity });
        return { success: true, action: 'updated', metadata: { package: packageName, severity: warning.severity } };
      }

      this.skipped.push({ package: packageName, reason: `Unknown warning type: ${warning.type}` });
      return { success: false, action: 'skip', reason: 'Unknown type' };
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

module.exports = SupplyChainFixer;