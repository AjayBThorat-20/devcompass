const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class QualityFixer {
  constructor() {
    this.fixesApplied = [];
    this.fixesSkipped = [];
    this.alternatives = null;
  }

  /**
   * Load quality alternatives database
   */
  loadAlternatives() {
    if (this.alternatives) {
      return this.alternatives;
    }

    try {
      const alternativesPath = path.join(__dirname, '../../data/quality-alternatives.json');
      this.alternatives = JSON.parse(fs.readFileSync(alternativesPath, 'utf8'));
      return this.alternatives;
    } catch (error) {
      console.error(chalk.yellow('⚠️  Could not load quality alternatives database'));
      this.alternatives = {
        abandoned_alternatives: {},
        stale_alternatives: {},
        migration_guides: {}
      };
      return this.alternatives;
    }
  }

  async fixWarning(warning, dryRun = false) {
    this.loadAlternatives();

    const { package: pkgName, status, healthScore } = warning;

    // Determine fix action based on status
    if (status === 'ABANDONED' || status === 'DEPRECATED') {
      return this.replacePackage(pkgName, warning, dryRun);
    } else if (status === 'STALE') {
      return this.replacePackage(pkgName, warning, dryRun);
    } else if (status === 'NEEDS_ATTENTION') {
      // For packages that need attention but aren't abandoned, just review
      return this.reviewPackage(pkgName, warning, dryRun);
    }

    return {
      success: false,
      action: 'skipped',
      reason: 'No fix available for this status'
    };
  }

  /**
   * Replace package with modern alternative
   */
  async replacePackage(pkgName, warning, dryRun = false) {
    const alternative = this.findAlternative(pkgName);

    if (!alternative) {
      this.fixesSkipped.push({
        package: pkgName,
        reason: 'No alternative found in database',
        status: warning.status
      });

      return {
        success: false,
        action: 'skipped',
        reason: 'No alternative available'
      };
    }

    const fix = {
      package: pkgName,
      action: 'Replace with modern alternative',
      alternative: alternative.recommended,
      allAlternatives: alternative.alternatives,
      reason: alternative.reason,
      migrationGuide: alternative.migration_guide,
      status: warning.status
    };

    if (dryRun) {
      return {
        success: true,
        action: 'planned',
        fix
      };
    }

    // Record the fix
    this.fixesApplied.push(fix);

    return {
      success: true,
      action: 'replaced',
      fix,
      command: `npm uninstall ${pkgName} && npm install ${alternative.recommended}`
    };
  }

  /**
   * Review package (no automatic fix)
   */
  async reviewPackage(pkgName, warning, dryRun = false) {
    const fix = {
      package: pkgName,
      action: 'Review and monitor',
      healthScore: warning.healthScore,
      lastUpdate: warning.lastUpdate,
      reason: 'Package needs attention but is not abandoned',
      status: warning.status
    };

    if (dryRun) {
      return {
        success: true,
        action: 'review',
        fix
      };
    }

    this.fixesSkipped.push(fix);

    return {
      success: false,
      action: 'review',
      reason: 'Manual review required',
      fix
    };
  }

  /**
   * Remove package without replacement
   */
  async removePackage(pkgName, warning, dryRun = false) {
    const fix = {
      package: pkgName,
      action: 'Remove package',
      reason: warning.reason || 'Package is obsolete',
      status: warning.status
    };

    if (dryRun) {
      return {
        success: true,
        action: 'planned',
        fix
      };
    }

    this.fixesApplied.push(fix);

    return {
      success: true,
      action: 'removed',
      fix,
      command: `npm uninstall ${pkgName}`
    };
  }

  /**
   * Find alternative for a package
   */
  findAlternative(pkgName) {
    this.loadAlternatives();

    // Check abandoned packages first
    if (this.alternatives.abandoned_alternatives[pkgName]) {
      return this.alternatives.abandoned_alternatives[pkgName];
    }

    // Check stale packages
    if (this.alternatives.stale_alternatives[pkgName]) {
      return this.alternatives.stale_alternatives[pkgName];
    }

    return null;
  }

  /**
   * Get migration guide URL
   */
  getMigrationGuide(from, to) {
    this.loadAlternatives();
    const key = `${from}_to_${to}`;
    return this.alternatives.migration_guides[key] || null;
  }

  /**
   * Get summary of fixes
   */
  getSummary() {
    const abandonedFixed = this.fixesApplied.filter(f => 
      f.status === 'ABANDONED' || f.status === 'DEPRECATED'
    ).length;

    const staleFixed = this.fixesApplied.filter(f => 
      f.status === 'STALE'
    ).length;

    return {
      total: this.fixesApplied.length,
      abandoned: abandonedFixed,
      stale: staleFixed,
      skipped: this.fixesSkipped.length,
      fixes: this.fixesApplied,
      skippedItems: this.fixesSkipped
    };
  }

  /**
   * Display summary in terminal
   */
  displaySummary() {
    const summary = this.getSummary();

    if (summary.total === 0) {
      return;
    }

    console.log('\n' + chalk.green('✓ Package Quality Fixes Applied: ') + chalk.bold(summary.total));
    
    if (summary.abandoned > 0) {
      console.log(chalk.gray('  • Abandoned/deprecated packages replaced: ') + chalk.bold(summary.abandoned));
    }
    
    if (summary.stale > 0) {
      console.log(chalk.gray('  • Stale packages replaced: ') + chalk.bold(summary.stale));
    }
    
    if (summary.skipped > 0) {
      console.log(chalk.gray('  • Packages skipped (no alternative): ') + chalk.bold(summary.skipped));
    }
  }

  /**
   * Reset fixes tracking
   */
  reset() {
    this.fixesApplied = [];
    this.fixesSkipped = [];
  }
}

module.exports = QualityFixer;