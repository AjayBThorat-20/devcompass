
// src/shared/utils/batch-reporter.js

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class BatchReporter {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.reportPath = path.join(projectPath, 'depvora-batch-report.json');
  }

  generateReport(batchResults, summary) {
    const report = {
      timestamp: new Date().toISOString(),
      mode: 'batch',
      summary: { totalBatches: batchResults.length, ...summary },
      batches: batchResults.map(batch => ({ batch: batch.batch, batchName: batch.batchName, fixes: batch.fixes, successful: batch.successful, failed: batch.failed, errors: batch.errors }))
    };
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    return report;
  }

  renderPreview(previewData) {
    console.log('\n' + chalk.bold.cyan('🔍 DRY RUN PREVIEW'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log('');
    console.log(`Operations: ${chalk.cyan(previewData.operations.length)}\n`);
    previewData.operations.forEach((op, index) => {
      console.log(chalk.bold(`${index + 1}. ${op.package}`));
      if (op.from && op.to) console.log(chalk.gray(`   ${op.from} → ${op.to}`));
      console.log(chalk.gray(`   Type: ${op.type}`));
      console.log('');
    });
    console.log(chalk.yellow('⚠️  No changes were applied (dry run mode)\n'));
  }
}

module.exports = BatchReporter;