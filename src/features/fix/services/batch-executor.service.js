// src/features/fix/services/batch-executor.service.js

const chalk = require('chalk');
const ora = require('ora');
const { exec } = require('child_process');
const { promisify } = require('util');
const { sanitizePackageName, sanitizeVersion } = require('../../../shared/utils/package-sanitizer');
const { BackupExecutor } = require('../executors/backup.executor');

const execAsync = promisify(exec);

class BatchExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.activeProcesses = new Set();
  }

  async executeBatch(batch, fixes, options = {}) {
    const results = { batch: batch.id, batchName: batch.name, totalFixes: Array.isArray(fixes) ? fixes.length : 1, successful: 0, failed: 0, skipped: 0, fixes: [], errors: [] };
    const { preview = false } = options;

    if (preview) {
      results.preview = true;
      results.operations = Array.isArray(fixes)
        ? fixes.map(fix => ({ package: fix.package || fix.name || 'unknown', type: fix.type || batch.id, from: fix.current || fix.from || null, to: fix.latest || fix.to || null }))
        : [];
      return results;
    }

    console.log('\n' + chalk.bold(`${batch.icon} ${batch.name.toUpperCase()}`));
    console.log(chalk.gray('─'.repeat(70)));

    // The standard (non-batch) fix path always backs up package.json/lock
    // before mutating anything; this batch path ran npm install/uninstall
    // directly with no backup at all, so a bad batch (major version bump,
    // lockfile corruption) had no recovery path.
    const backupExecutor = new BackupExecutor(this.projectPath);
    const backupResult = await backupExecutor.createBackup({ mode: 'batch', batch: batch.id, issueCount: results.totalFixes });
    if (!backupResult.success) {
      console.error(chalk.yellow(`⚠️  Backup failed: ${backupResult.error} — proceeding without a backup`));
    } else {
      console.log(chalk.gray(`💾 Backup saved: ${backupResult.path}`));
    }

    try {
      switch (batch.id) {
        case 'supply-chain': await this.executeSupplyChainBatch(fixes, results); break;
        case 'license': await this.executeLicenseBatch(fixes, results); break;
        case 'quality': await this.executeQualityBatch(fixes, results); break;
        case 'security': await this.executeSecurityBatch(fixes, results); break;
        case 'ecosystem': await this.executeEcosystemBatch(fixes, results); break;
        case 'unused': await this.executeUnusedBatch(fixes, results); break;
        case 'updates': await this.executeUpdatesBatch(fixes, results); break;
        default: results.skipped += Array.isArray(fixes) ? fixes.length : 0;
      }
    } catch (error) {
      results.errors.push({ batch: batch.id, error: error.message, severity: 'critical' });
      if (error.message?.includes('ENOSPC') || error.message?.includes('ENOMEM')) {
        console.error(chalk.red('\n❌ Critical error: System resources exhausted'));
        throw error;
      }
    } finally {
      await this.cleanup();
    }

    return results;
  }

  async executeSupplyChainBatch(fixes, results) {
    const SupplyChainFixer = require('./supply-chain-fixer.service');
    const fixer = new SupplyChainFixer(this.projectPath);

    for (const fix of fixes) {
      try {
        const spinner = ora(`Fixing ${fix.type}: ${fix.package}`).start();
        const result = await fixer.fixWarning(fix, false);

        if (result.success) {
          spinner.succeed(`Fixed ${fix.type}: ${fix.package}`);
          results.successful++;
          results.fixes.push({ type: 'supply-chain', package: fix.package, action: result.action });
        } else {
          spinner.fail(`Failed to fix ${fix.package}: ${result.reason}`);
          results.failed++;
          results.errors.push({ package: fix.package, error: result.reason, severity: 'high' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ package: fix.package, error: error.message, severity: 'high' });
      }
    }
  }

  async executeLicenseBatch(fixes, results) {
    const LicenseConflictFixer = require('./license-conflict-fixer.service');
    const fixer = new LicenseConflictFixer(this.projectPath);

    for (const fix of fixes) {
      try {
        const spinner = ora(`Replacing ${fix.package} (${fix.license})`).start();
        const result = await fixer.fixWarning(fix, false);

        if (result.success) {
          spinner.succeed(`Replaced ${fix.package} with ${result.metadata?.to || 'alternative'}`);
          results.successful++;
          results.fixes.push({ type: 'license', package: fix.package, action: result.action });
        } else {
          spinner.fail(`Failed to replace ${fix.package}: ${result.reason}`);
          results.failed++;
          results.errors.push({ package: fix.package, error: result.reason, severity: 'medium' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ package: fix.package, error: error.message, severity: 'medium' });
      }
    }
  }

  async executeQualityBatch(fixes, results) {
    const QualityFixer = require('./quality-fixer.service');
    const fixer = new QualityFixer(this.projectPath);

    for (const fix of fixes) {
      try {
        const alternative = await fixer.findAlternative(fix.name);
        const spinner = ora(`Replacing ${fix.name} (${fix.status})`).start();
        const result = await fixer.fixWarning(fix, false);

        if (result.success && result.action === 'replaced') {
          spinner.succeed(`Replaced ${fix.name} with ${alternative?.recommended || 'alternative'}`);
          results.successful++;
          results.fixes.push({ type: 'quality', package: fix.name, action: `Replaced with ${alternative?.recommended}`, metadata: { from: fix.name, to: alternative?.recommended, reason: fix.status } });
        } else {
          spinner.fail(`Failed to replace ${fix.name}: ${result.reason || 'No alternative'}`);
          results.failed++;
          results.errors.push({ package: fix.name, error: result.reason || 'No alternative available', severity: 'low' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ package: fix.name, error: error.message, severity: 'low' });
      }
    }
  }

  async executeSecurityBatch(fixes, results) {
    const spinner = ora('Running npm audit fix...').start();
    try {
      await execAsync('npm audit fix', { cwd: this.projectPath, timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
      spinner.succeed('Security vulnerabilities fixed');
      results.successful++;
      results.fixes.push({ type: 'security', action: 'npm audit fix' });
    } catch (error) {
      spinner.fail('Failed to run npm audit fix');
      results.failed++;
      results.errors.push({ action: 'npm audit fix', error: error.message, severity: 'critical' });
    }
  }

  // executeEcosystemBatch and executeUpdatesBatch both boil down to "sanitize
  // + spinner + npm install <name>@<version> + record success/failure" for one
  // package, differing only in where the name/version/result-shape come from.
  // Pulled out the shared install step; the differing bits (skip logic, error
  // severity, result shape) stay in each caller.
  async _installPackageUpdate({ name, version, results, errorSeverity, errorPackage, buildFixEntry }) {
    try {
      const safeName = sanitizePackageName(name);
      const safeVersion = sanitizeVersion(version);
      const spinner = ora(`Updating ${name} to ${version}`).start();
      await execAsync(`npm install ${safeName}@${safeVersion}`, { cwd: this.projectPath, timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
      spinner.succeed(`Updated ${name} to ${version}`);
      results.successful++;
      results.fixes.push(buildFixEntry());
    } catch (error) {
      results.failed++;
      results.errors.push({ package: errorPackage, error: error.message, severity: errorSeverity });
    }
  }

  async executeEcosystemBatch(fixes, results) {
    for (const fix of fixes) {
      const pkg = (fix.package || '').split('@')[0];
      const version = fix.fix;

      if (!pkg || !version || version.includes('Migrate') || version.includes('Use')) {
        results.skipped++;
        results.errors.push({ package: pkg || fix.package, error: 'Migration required - manual intervention needed', severity: 'low' });
        continue;
      }

      await this._installPackageUpdate({
        name: pkg,
        version,
        results,
        errorSeverity: 'medium',
        errorPackage: fix.package,
        buildFixEntry: () => ({ type: 'ecosystem', package: pkg, version })
      });
    }
  }

  async executeUnusedBatch(fixes, results) {
    if (!Array.isArray(fixes) || fixes.length === 0) return;
    const packageNames = fixes.map(sanitizePackageName).join(' ');
    const spinner = ora(`Removing ${fixes.length} unused package(s)...`).start();

    try {
      await execAsync(`npm uninstall ${packageNames}`, { cwd: this.projectPath, timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
      spinner.succeed(`Removed ${fixes.length} unused package(s)`);
      results.successful += fixes.length;
      results.fixes.push({ type: 'unused', packages: fixes });
    } catch (error) {
      spinner.fail('Failed to remove unused packages');
      results.failed++;
      results.errors.push({ packages: fixes, error: error.message, severity: 'low' });
    }
  }

  async executeUpdatesBatch(fixes, results) {
    for (const fix of fixes) {
      await this._installPackageUpdate({
        name: fix.name,
        version: fix.latest,
        results,
        errorSeverity: 'low',
        errorPackage: fix.name,
        buildFixEntry: () => ({ type: 'update', package: fix.name, from: fix.current, to: fix.latest })
      });
    }
  }

  async cleanup() {
    for (const proc of this.activeProcesses) {
      try {
        if (proc && !proc.killed) proc.kill('SIGTERM');
      } catch (error) {
        if (process.env.DEBUG) console.error('Process cleanup error:', error.message);
      }
    }
    this.activeProcesses.clear();
  }
}

module.exports = BatchExecutor;