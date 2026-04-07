const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');

class BatchExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  /**
   * Execute a single batch of fixes
   */
  async executeBatch(batch, fixes, options = {}) {
    const results = {
      batch: batch.id,
      batchName: batch.name,
      totalFixes: Array.isArray(fixes) ? fixes.length : 1,
      successful: 0,
      failed: 0,
      skipped: 0,
      fixes: [],
      errors: []
    };

    console.log('\n' + chalk.bold(`${batch.icon} ${batch.name.toUpperCase()}`));
    console.log(chalk.gray('─'.repeat(70)));

    try {
      switch (batch.id) {
        case 'supply-chain':
          await this.executeSupplyChainBatch(fixes, results, options);
          break;
        
        case 'license':
          await this.executeLicenseBatch(fixes, results, options);
          break;
        
        case 'quality':
          await this.executeQualityBatch(fixes, results, options);
          break;
        
        case 'security':
          await this.executeSecurityBatch(fixes, results, options);
          break;
        
        case 'ecosystem':
          await this.executeEcosystemBatch(fixes, results, options);
          break;
        
        case 'unused':
          await this.executeUnusedBatch(fixes, results, options);
          break;
        
        case 'updates':
          await this.executeUpdatesBatch(fixes, results, options);
          break;
      }
    } catch (error) {
      results.errors.push({
        batch: batch.id,
        error: error.message
      });
    }

    return results;
  }

  /**
   * Execute supply chain fixes
   */
  async executeSupplyChainBatch(fixes, results, options) {
    const SupplyChainFixer = require('./supply-chain-fixer');
    const fixer = new SupplyChainFixer();

    for (const fix of fixes) {
      try {
        const spinner = ora(`Fixing ${fix.type}: ${fix.package}`).start();
        
        const result = await fixer.fixWarning(fix, false);
        
        if (result.success) {
          spinner.succeed(`Fixed ${fix.type}: ${fix.package}`);
          results.successful++;
          results.fixes.push({
            type: 'supply-chain',
            package: fix.package,
            action: result.action
          });
        } else {
          spinner.fail(`Failed to fix ${fix.package}: ${result.reason}`);
          results.failed++;
          results.errors.push({
            package: fix.package,
            error: result.reason
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          package: fix.package,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute license conflict fixes
   */
  async executeLicenseBatch(fixes, results, options) {
    const LicenseConflictFixer = require('./license-conflict-fixer');
    const fixer = new LicenseConflictFixer();

    for (const fix of fixes) {
      try {
        const spinner = ora(`Replacing ${fix.package} (${fix.license})`).start();
        
        const result = await fixer.fixWarning(fix, false);
        
        if (result.success) {
          spinner.succeed(`Replaced ${fix.package} with ${fix.suggestedAlternative?.name || 'alternative'}`);
          results.successful++;
          results.fixes.push({
            type: 'license',
            package: fix.package,
            action: result.action
          });
        } else {
          spinner.fail(`Failed to replace ${fix.package}: ${result.reason}`);
          results.failed++;
          results.errors.push({
            package: fix.package,
            error: result.reason
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          package: fix.package,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute quality fixes
   */
  async executeQualityBatch(fixes, results, options) {
    const QualityFixer = require('./quality-fixer');
    const fixer = new QualityFixer();

    for (const fix of fixes) {
      try {
        const alternative = fixer.findAlternative(fix.name);
        const spinner = ora(`Replacing ${fix.name} (${fix.status})`).start();
        
        const result = await fixer.fixWarning(fix, false);
        
        if (result.success && result.action === 'replaced') {
          spinner.succeed(`Replaced ${fix.name} with ${alternative?.recommended || 'alternative'}`);
          results.successful++;
          results.fixes.push({
            type: 'quality',
            package: fix.name,
            action: `Replaced with ${alternative?.recommended}`,
            metadata: {
              from: fix.name,
              to: alternative?.recommended,
              reason: fix.status
            }
          });
        } else {
          spinner.fail(`Failed to replace ${fix.name}: ${result.reason || 'No alternative'}`);
          results.failed++;
          results.errors.push({
            package: fix.name,
            error: result.reason || 'No alternative available'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          package: fix.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute security fixes (npm audit)
   */
  async executeSecurityBatch(fixes, results, options) {
    const spinner = ora('Running npm audit fix...').start();
    
    try {
      execSync('npm audit fix', {
        cwd: this.projectPath,
        stdio: options.verbose ? 'inherit' : 'pipe',
        timeout: 60000 // 60 second timeout
      });
      
      spinner.succeed('Security vulnerabilities fixed');
      results.successful++;
      results.fixes.push({
        type: 'security',
        action: 'npm audit fix'
      });
    } catch (error) {
      spinner.fail('Failed to run npm audit fix');
      results.failed++;
      results.errors.push({
        action: 'npm audit fix',
        error: error.message
      });
    }
  }

  /**
   * Execute ecosystem alert fixes
   */
  async executeEcosystemBatch(fixes, results, options) {
    for (const fix of fixes) {
      try {
        const pkg = fix.package.split('@')[0];
        const version = fix.fix;

        // Skip if version is invalid
        if (!version || version.includes('Migrate') || version.includes('Use')) {
          results.skipped++;
          results.errors.push({
            package: pkg,
            error: 'Migration required - manual intervention needed'
          });
          continue;
        }

        const spinner = ora(`Updating ${pkg} to ${version}`).start();
        
        execSync(`npm install ${pkg}@${version}`, {
          cwd: this.projectPath,
          stdio: options.verbose ? 'inherit' : 'pipe',
          timeout: 60000
        });
        
        spinner.succeed(`Updated ${pkg} to ${version}`);
        results.successful++;
        results.fixes.push({
          type: 'ecosystem',
          package: pkg,
          version: version
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          package: fix.package,
          error: error.message
        });
      }
    }
  }

  /**
   * Execute unused dependency removal
   */
  async executeUnusedBatch(fixes, results, options) {
    if (!Array.isArray(fixes) || fixes.length === 0) return;

    const packageNames = fixes.join(' ');
    const spinner = ora(`Removing ${fixes.length} unused package(s)...`).start();
    
    try {
      execSync(`npm uninstall ${packageNames}`, {
        cwd: this.projectPath,
        stdio: options.verbose ? 'inherit' : 'pipe',
        timeout: 60000
      });
      
      spinner.succeed(`Removed ${fixes.length} unused package(s)`);
      results.successful += fixes.length;
      results.fixes.push({
        type: 'unused',
        packages: fixes
      });
    } catch (error) {
      spinner.fail('Failed to remove unused packages');
      results.failed++;
      results.errors.push({
        packages: fixes,
        error: error.message
      });
    }
  }

  /**
   * Execute safe updates
   */
  async executeUpdatesBatch(fixes, results, options) {
    for (const fix of fixes) {
      try {
        const spinner = ora(`Updating ${fix.name} to ${fix.latest}`).start();
        
        execSync(`npm install ${fix.name}@${fix.latest}`, {
          cwd: this.projectPath,
          stdio: options.verbose ? 'inherit' : 'pipe',
          timeout: 60000
        });
        
        spinner.succeed(`Updated ${fix.name} to ${fix.latest}`);
        results.successful++;
        results.fixes.push({
          type: 'update',
          package: fix.name,
          from: fix.current,
          to: fix.latest
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          package: fix.name,
          error: error.message
        });
      }
    }
  }
}

module.exports = BatchExecutor;