// src/utils/batch-reporter.js
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class BatchReporter {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.reportPath = path.join(projectPath, 'devcompass-batch-report.json');
  }

  /**
   * Generate batch report
   */
  generateReport(batchResults, summary) {
    const report = {
      timestamp: new Date().toISOString(),
      mode: 'batch',
      summary: {
        totalBatches: batchResults.length,
        totalFixes: summary.totalFixes,
        successful: summary.successful,
        failed: summary.failed,
        skipped: summary.skipped,
        duration: summary.duration
      },
      batches: batchResults.map(batch => ({
        batch: batch.batch,
        batchName: batch.batchName,
        fixes: batch.fixes,
        successful: batch.successful,
        failed: batch.failed,
        errors: batch.errors
      }))
    };

    // Save to file
    fs.writeFileSync(
      this.reportPath,
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  /**
   * Display batch summary
   */
  displaySummary(batchResults, summary) {
    console.log('\n' + chalk.bold.cyan('📊 BATCH FIX SUMMARY'));
    console.log(chalk.gray('═'.repeat(70)) + '\n');

    // Display each batch
    batchResults.forEach(batch => {
      if (batch.successful > 0 || batch.failed > 0) {
        console.log(chalk.bold(`${this.getBatchIcon(batch.batch)} ${batch.batchName}`));
        
        if (batch.successful > 0) {
          console.log(chalk.green(`  ✓ ${batch.successful} fix(es) applied`));
        }
        
        if (batch.failed > 0) {
          console.log(chalk.red(`  ✗ ${batch.failed} fix(es) failed`));
        }

        // Show details
        if (batch.fixes.length > 0) {
          batch.fixes.forEach(fix => {
            console.log(chalk.gray(`    • ${this.formatFix(fix)}`));
          });
        }

        console.log('');
      }
    });

    // Overall summary
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.bold('\n📈 OVERALL RESULTS:\n'));
    console.log(`  Total Batches: ${chalk.cyan(summary.totalBatches)}`);
    console.log(`  Total Fixes: ${chalk.cyan(summary.totalFixes)}`);
    console.log(`  Successful: ${chalk.green(summary.successful)}`);
    console.log(`  Failed: ${summary.failed > 0 ? chalk.red(summary.failed) : chalk.gray('0')}`);
    console.log(`  Duration: ${chalk.cyan(summary.duration)}`);

    console.log('\n' + chalk.gray('─'.repeat(70)));
    console.log(chalk.green(`\n✓ Batch report saved: ${this.reportPath}\n`));
  }

  /**
   * Get batch icon
   */
  getBatchIcon(batchId) {
    const icons = {
      'supply-chain': '🛡️',
      'license': '⚖️',
      'quality': '📦',
      'security': '🔐',
      'ecosystem': '🚨',
      'unused': '🧹',
      'updates': '⬆️'
    };
    return icons[batchId] || '📦';
  }

  /**
   * Format individual fix
   */
  formatFix(fix) {
    switch (fix.type) {
      case 'supply-chain':
        return `${fix.package} - ${fix.action}`;
      
      case 'license':
        return `${fix.package} → ${fix.alternative} (${fix.oldLicense} → ${fix.newLicense})`;
      
      case 'quality':
        return `${fix.package} → ${fix.alternative} (${fix.reason})`;
      
      case 'security':
        return fix.action;
      
      case 'ecosystem':
        return `${fix.package}@${fix.version}`;
      
      case 'unused':
        return `Removed: ${fix.packages.join(', ')}`;
      
      case 'update':
        return `${fix.package}: ${fix.from} → ${fix.to}`;
      
      default:
        return JSON.stringify(fix);
    }
  }
}

module.exports = BatchReporter;