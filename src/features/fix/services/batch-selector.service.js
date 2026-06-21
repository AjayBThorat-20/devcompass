// src/features/fix/services/batch-selector.service.js

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

const batchCategories = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../../data/batch-categories.json'), 'utf8')
);

class BatchSelector {
  constructor() {
    this.batches = Array.isArray(batchCategories) ? batchCategories : [];
  }

  getBatchStats(analysisResults = {}) {
    const stats = {};
    this.batches.forEach(batch => { stats[batch.id] = 0; });

    const { supplyChain, licenseRisk, quality, security, ecosystem, unused, outdated } = analysisResults;

    if (supplyChain?.warnings) stats['supply-chain'] = supplyChain.warnings.length;
    if (licenseRisk?.warnings) stats['license'] = licenseRisk.warnings.filter(w => w.autoFixable).length;
    if (quality?.packages) stats['quality'] = quality.packages.filter(p => p.status === 'deprecated' || p.status === 'abandoned').length;
    if (security?.vulnerabilities) stats['security'] = security.vulnerabilities.length > 0 ? 1 : 0;
    if (ecosystem?.alerts) stats['ecosystem'] = ecosystem.alerts.length;
    if (Array.isArray(unused)) stats['unused'] = unused.length > 0 ? 1 : 0;
    if (Array.isArray(outdated)) {
      const safeUpdates = outdated.filter(p => p.updateType === 'patch' || p.updateType === 'minor');
      stats['updates'] = safeUpdates.length > 0 ? 1 : 0;
    }

    return stats;
  }

  displayBatchMenu(stats) {
    console.log('\n' + chalk.cyan.bold('📦 BATCH FIX MODE'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.white('Select which categories to fix:\n'));

    this.batches.forEach((batch, index) => {
      const count = stats[batch.id] || 0;
      console.log(chalk.white(`${batch.icon} ${batch.name}`));
      console.log(chalk.gray(batch.description));
      console.log(count > 0 ? chalk.green(`Fixes available: ${count} fix(es)`) : chalk.gray('Fixes available: none'));
      if (index < this.batches.length - 1) console.log('');
    });

    console.log('\n' + chalk.gray('─'.repeat(70)));
    console.log(chalk.white('Preset Modes:'));
    console.log(chalk.cyan('c') + ' - Critical only   ' + chalk.cyan('h') + ' - High priority   ' + chalk.cyan('a') + ' - All safe fixes   ' + chalk.cyan('n') + ' - None (cancel)');
  }

  async promptBatchSelection(stats) {
    this.displayBatchMenu(stats);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        resolve(this.parseBatchSelection((answer || '').trim().toLowerCase(), stats));
      });
    });
  }

  parseBatchSelection(input, stats) {
    if (input === 'c') return this.batches.filter(b => ['supply-chain', 'license', 'security'].includes(b.id)).filter(b => stats[b.id] > 0);
    if (input === 'h') return this.batches.filter(b => ['supply-chain', 'license', 'security', 'quality', 'ecosystem'].includes(b.id)).filter(b => stats[b.id] > 0);
    if (input === 'a') return this.batches.filter(b => stats[b.id] > 0);
    if (input === 'n' || input === '') return [];

    const numbers = input.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
    const selectedBatches = [];

    numbers.forEach(num => {
      if (num >= 1 && num <= this.batches.length) {
        const batch = this.batches[num - 1];
        if (stats[batch.id] > 0) selectedBatches.push(batch);
      }
    });

    return selectedBatches;
  }
}

module.exports = BatchSelector;