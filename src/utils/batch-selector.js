// src/utils/batch-selector.js
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

// Load batch categories from JSON
const batchCategories = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/batch-categories.json'), 'utf8')
);

class BatchSelector {
  constructor() {
    this.batches = batchCategories;
  }

  /**
   * Get fix statistics for each batch
   */
  getBatchStats(analysisResults) {
    const stats = {};

    this.batches.forEach(batch => {
      stats[batch.id] = 0;
    });

    // Count fixes per category
    const {
      supplyChain,
      licenseRisk,
      quality,
      security,
      ecosystem,
      unused,
      outdated
    } = analysisResults;

    // Supply chain
    if (supplyChain && supplyChain.warnings) {
      stats['supply-chain'] = supplyChain.warnings.length;
    }

    // License
    if (licenseRisk && licenseRisk.warnings) {
      stats['license'] = licenseRisk.warnings.filter(w => w.autoFixable).length;
    }

    // Quality
    if (quality && quality.packages) {
      stats['quality'] = quality.packages.filter(p => 
        p.status === 'deprecated' || p.status === 'abandoned'
      ).length;
    }

    // Security
    if (security && security.vulnerabilities) {
      stats['security'] = security.vulnerabilities.length > 0 ? 1 : 0;
    }

    // Ecosystem
    if (ecosystem && ecosystem.alerts) {
      stats['ecosystem'] = ecosystem.alerts.length;
    }

    // Unused
    if (unused && Array.isArray(unused)) {
      stats['unused'] = unused.length > 0 ? 1 : 0;
    }

    // Updates
    if (outdated && Array.isArray(outdated)) {
      const safeUpdates = outdated.filter(p => 
        p.updateType === 'patch' || p.updateType === 'minor'
      );
      stats['updates'] = safeUpdates.length > 0 ? 1 : 0;
    }

    return stats;
  }

  /**
   * Display batch menu
   */
  displayBatchMenu(stats) {
    console.log('\n' + chalk.cyan.bold('📦 BATCH FIX MODE'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.white('Select which categories to fix:\n'));

    this.batches.forEach((batch, index) => {
      const count = stats[batch.id] || 0;
      const hasFixed = count > 0;
      
      console.log(chalk.white(`${batch.icon} ${batch.name}`));
      console.log(chalk.gray(batch.description));
      console.log(
        hasFixed 
          ? chalk.green(`Fixes available: ${count} fix(es)`)
          : chalk.gray('Fixes available: none')
      );
      
      if (index < this.batches.length - 1) {
        console.log('');
      }
    });

    console.log('\n' + chalk.gray('─'.repeat(70)));
    console.log(chalk.white('Preset Modes:'));
    console.log(chalk.cyan('c') + ' - Critical only (supply-chain + license + security)');
    console.log(chalk.cyan('h') + ' - High priority (critical + quality + ecosystem)');
    console.log(chalk.cyan('a') + ' - All safe fixes (everything except major updates)');
    console.log(chalk.cyan('n') + ' - None (cancel)');
    console.log(chalk.gray('Enter your choice (1-7, c/h/a/n, or comma-separated):'));
  }

  /**
   * Prompt user for batch selection
   */
  async promptBatchSelection(stats) {
    this.displayBatchMenu(stats);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('> ', (answer) => {
        rl.close();
        const selected = this.parseBatchSelection(answer.trim().toLowerCase(), stats);
        resolve(selected);
      });
    });
  }

  /**
   * Parse batch selection
   */
  parseBatchSelection(input, stats) {
    // Handle preset modes
    if (input === 'c') {
      return this.batches
        .filter(b => ['supply-chain', 'license', 'security'].includes(b.id))
        .filter(b => stats[b.id] > 0);
    }

    if (input === 'h') {
      return this.batches
        .filter(b => ['supply-chain', 'license', 'security', 'quality', 'ecosystem'].includes(b.id))
        .filter(b => stats[b.id] > 0);
    }

    if (input === 'a') {
      return this.batches.filter(b => stats[b.id] > 0);
    }

    if (input === 'n') {
      return [];
    }

    // Handle number selections (1-7 or comma-separated)
    const numbers = input.split(',').map(n => parseInt(n.trim()));
    const selectedBatches = [];

    numbers.forEach(num => {
      if (num >= 1 && num <= this.batches.length) {
        const batch = this.batches[num - 1];
        if (stats[batch.id] > 0) {
          selectedBatches.push(batch);
        }
      }
    });

    return selectedBatches;
  }
}

module.exports = BatchSelector;