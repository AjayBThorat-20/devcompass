// src/utils/batch-selector.js
const readline = require('readline');
const chalk = require('chalk');

class BatchSelector {
  constructor() {
    this.batches = [
      {
        id: 'supply-chain',
        name: 'Supply Chain Security',
        icon: '🛡️',
        priority: 1,
        description: 'Malicious packages, typosquatting, suspicious scripts'
      },
      {
        id: 'license',
        name: 'License Conflicts',
        icon: '⚖️',
        priority: 2,
        description: 'GPL/AGPL/LGPL package replacements'
      },
      {
        id: 'quality',
        name: 'Package Quality',
        icon: '📦',
        priority: 3,
        description: 'Abandoned, deprecated, stale packages'
      },
      {
        id: 'security',
        name: 'Critical Security',
        icon: '🔐',
        priority: 4,
        description: 'npm audit vulnerabilities'
      },
      {
        id: 'ecosystem',
        name: 'Ecosystem Alerts',
        icon: '🚨',
        priority: 5,
        description: 'Known package issues'
      },
      {
        id: 'unused',
        name: 'Unused Dependencies',
        icon: '🧹',
        priority: 6,
        description: 'Remove unused packages'
      },
      {
        id: 'updates',
        name: 'Safe Updates',
        icon: '⬆️',
        priority: 7,
        description: 'Patch and minor version updates'
      }
    ];
  }

  /**
   * Get batch statistics from planned fixes
   */
  getBatchStats(plannedFixes) {
    const stats = {};
    
    this.batches.forEach(batch => {
      stats[batch.id] = {
        count: 0,
        fixes: []
      };
    });

    // Count supply chain fixes
    if (plannedFixes.supplyChain?.length > 0) {
      stats['supply-chain'].count = plannedFixes.supplyChain.length;
      stats['supply-chain'].fixes = plannedFixes.supplyChain;
    }

    // Count license fixes
    if (plannedFixes.licenseConflicts?.length > 0) {
      stats['license'].count = plannedFixes.licenseConflicts.length;
      stats['license'].fixes = plannedFixes.licenseConflicts;
    }

    // Count quality fixes
    if (plannedFixes.quality?.length > 0) {
      stats['quality'].count = plannedFixes.quality.length;
      stats['quality'].fixes = plannedFixes.quality;
    }

    // Count security fixes
    if (plannedFixes.security?.criticalCount > 0) {
      stats['security'].count = plannedFixes.security.criticalCount;
      stats['security'].fixes = ['npm audit fix'];
    }

    // Count ecosystem fixes
    if (plannedFixes.ecosystem?.length > 0) {
      stats['ecosystem'].count = plannedFixes.ecosystem.length;
      stats['ecosystem'].fixes = plannedFixes.ecosystem;
    }

    // Count unused dependencies
    if (plannedFixes.unused?.length > 0) {
      stats['unused'].count = plannedFixes.unused.length;
      stats['unused'].fixes = plannedFixes.unused;
    }

    // Count safe updates
    if (plannedFixes.updates?.safe?.length > 0) {
      stats['updates'].count = plannedFixes.updates.safe.length;
      stats['updates'].fixes = plannedFixes.updates.safe;
    }

    return stats;
  }

  /**
   * Display batch selection menu
   */
  displayBatchMenu(stats) {
    console.log('\n' + chalk.bold.cyan('📦 BATCH FIX MODE'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log('\nSelect which categories to fix:\n');

    this.batches.forEach((batch, index) => {
      const count = stats[batch.id]?.count || 0;
      const status = count > 0 ? chalk.yellow(`${count} fix(es)`) : chalk.gray('none');
      
      console.log(`${chalk.bold(index + 1)}. ${batch.icon} ${chalk.bold(batch.name)}`);
      console.log(`   ${chalk.gray(batch.description)}`);
      console.log(`   Fixes available: ${status}\n`);
    });

    console.log(chalk.gray('─'.repeat(70)));
    console.log('\n' + chalk.bold('Preset Modes:'));
    console.log(`${chalk.bold('c')} - ${chalk.red('Critical only')} (supply-chain + license + security)`);
    console.log(`${chalk.bold('h')} - ${chalk.yellow('High priority')} (critical + quality + ecosystem)`);
    console.log(`${chalk.bold('a')} - ${chalk.green('All safe fixes')} (everything except major updates)`);
    console.log(`${chalk.bold('n')} - ${chalk.gray('None')} (cancel)\n`);
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
      rl.question(chalk.cyan('Enter your choice (1-7, c/h/a/n, or comma-separated): '), (answer) => {
        rl.close();

        const selection = this.parseBatchSelection(answer.trim().toLowerCase(), stats);
        resolve(selection);
      });
    });
  }

  /**
   * Parse user's batch selection
   */
  parseBatchSelection(input, stats) {
    // Handle preset modes
    if (input === 'c') {
      // Critical only: supply-chain, license, security
      return this.batches.filter(b => 
        ['supply-chain', 'license', 'security'].includes(b.id) && 
        stats[b.id]?.count > 0
      );
    }

    if (input === 'h') {
      // High priority: critical + quality + ecosystem
      return this.batches.filter(b => 
        ['supply-chain', 'license', 'security', 'quality', 'ecosystem'].includes(b.id) && 
        stats[b.id]?.count > 0
      );
    }

    if (input === 'a') {
      // All safe fixes
      return this.batches.filter(b => stats[b.id]?.count > 0);
    }

    if (input === 'n' || input === '') {
      // None - cancel
      return [];
    }

    // Handle comma-separated numbers (e.g., "1,2,5")
    const numbers = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    if (numbers.length > 0) {
      return this.batches.filter((b, idx) => 
        numbers.includes(idx + 1) && stats[b.id]?.count > 0
      );
    }

    // Invalid input
    return null;
  }

  /**
   * Get batch by ID
   */
  getBatchById(id) {
    return this.batches.find(b => b.id === id);
  }

  /**
   * Get all batches with fixes
   */
  getBatchesWithFixes(stats) {
    return this.batches.filter(b => stats[b.id]?.count > 0);
  }
}

module.exports = BatchSelector;