const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class BatchReporter {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.reportPath = path.join(projectPath, 'devcompass-batch-report.json');
  }

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
        errors: batch.errors.map(err => ({
          ...err,
          severity: err.severity || 'medium'
        }))
      }))
    };

    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  displaySummary(batchResults, summary) {
    console.log('\n' + chalk.bold.cyan('📊 BATCH FIX SUMMARY'));
    console.log(chalk.gray('═'.repeat(70)) + '\n');

    batchResults.forEach(batch => {
      if (batch.successful > 0 || batch.failed > 0) {
        console.log(chalk.bold(`${this.getBatchIcon(batch.batch)} ${batch.batchName}`));

        if (batch.successful > 0) {
          console.log(chalk.green(`  ✓ ${batch.successful} fix(es) applied`));
        }

        if (batch.failed > 0) {
          const criticalErrors = batch.errors.filter(e => e.severity === 'critical').length;
          if (criticalErrors > 0) {
            console.log(chalk.red(`  ✗ ${criticalErrors} critical failure(s)`));
          }
          console.log(chalk.red(`  ✗ ${batch.failed} fix(es) failed`));
        }

        if (batch.fixes.length > 0) {
          batch.fixes.forEach(fix => {
            console.log(chalk.gray(`    • ${this.formatFix(fix)}`));
          });
        }

        console.log('');
      }
    });

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

  renderPreview(previewData) {
    console.log('\n' + chalk.bold.cyan('🔍 DRY RUN PREVIEW'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log('');

    console.log(`Operations: ${chalk.cyan(previewData.operations.length)}\n`);

    previewData.operations.forEach((op, index) => {
      console.log(chalk.bold(`${index + 1}. ${op.package}`));

      if (op.from && op.to) {
        console.log(chalk.gray(`   ${op.from} → ${op.to}`));
      }

      console.log(chalk.gray(`   Type: ${op.type}`));
      console.log('');
    });

    console.log(chalk.yellow('⚠️  No changes were applied (dry run mode)\n'));
  }
}

module.exports = BatchReporter;