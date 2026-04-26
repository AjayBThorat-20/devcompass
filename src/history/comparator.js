// src/history/comparator.js
const loader = require('./snapshot-loader');

class SnapshotComparator {
  
  /**
   * Compare two snapshots
   */
  compare(snapshotId1, snapshotId2) {
    const startTime = Date.now();
    
    // Load both snapshots
    const snapshot1 = loader.getSnapshot(snapshotId1);
    const snapshot2 = loader.getSnapshot(snapshotId2);
    
    // Build package maps for fast lookup
    const packages1 = new Map(
      snapshot1.packages.map(p => [p.name, p])
    );
    const packages2 = new Map(
      snapshot2.packages.map(p => [p.name, p])
    );
    
    // Find changes
    const added = [];
    const removed = [];
    const updated = [];
    const unchanged = [];
    
    // Find added and updated packages
    packages2.forEach((pkg2, name) => {
      if (!packages1.has(name)) {
        added.push({
          name,
          version: pkg2.version,
          healthScore: pkg2.healthScore,
          status: 'added'
        });
      } else {
        const pkg1 = packages1.get(name);
        const changes = this.detectPackageChanges(pkg1, pkg2);
        
        if (changes.hasChanges) {
          updated.push({
            name,
            before: pkg1,
            after: pkg2,
            changes
          });
        } else {
          unchanged.push({ name, version: pkg2.version });
        }
      }
    });
    
    // Find removed packages
    packages1.forEach((pkg1, name) => {
      if (!packages2.has(name)) {
        removed.push({
          name,
          version: pkg1.version,
          healthScore: pkg1.healthScore,
          status: 'removed'
        });
      }
    });
    
    // Calculate summary statistics
    const summary = {
      snapshot1: {
        id: snapshotId1,
        timestamp: snapshot1.snapshot.timestamp,
        totalPackages: snapshot1.packages.length,
        healthScore: snapshot1.snapshot.health_score
      },
      snapshot2: {
        id: snapshotId2,
        timestamp: snapshot2.snapshot.timestamp,
        totalPackages: snapshot2.packages.length,
        healthScore: snapshot2.snapshot.health_score
      },
      changes: {
        added: added.length,
        removed: removed.length,
        updated: updated.length,
        unchanged: unchanged.length,
        healthScoreChange: (
          snapshot2.snapshot.health_score - snapshot1.snapshot.health_score
        ).toFixed(2)
      }
    };
    
    const duration = Date.now() - startTime;
    
    return {
      summary,
      added,
      removed,
      updated,
      unchanged,
      duration
    };
  }

  /**
   * Detect changes in a single package
   */
  detectPackageChanges(pkg1, pkg2) {
    const changes = {
      hasChanges: false,
      version: null,
      healthScore: null,
      vulnerabilities: null,
      deprecated: null,
      outdated: null
    };
    
    // Version change
    if (pkg1.version !== pkg2.version) {
      changes.hasChanges = true;
      changes.version = {
        from: pkg1.version,
        to: pkg2.version
      };
    }
    
    // Health score change
    const scoreDiff = pkg2.health_score - pkg1.health_score;
    if (Math.abs(scoreDiff) >= 0.1) {
      changes.hasChanges = true;
      changes.healthScore = {
        from: pkg1.health_score,
        to: pkg2.health_score,
        diff: scoreDiff
      };
    }
    
    // Vulnerability status change
    if (pkg1.isVulnerable !== pkg2.isVulnerable) {
      changes.hasChanges = true;
      changes.vulnerabilities = {
        from: pkg1.isVulnerable,
        to: pkg2.isVulnerable,
        status: pkg2.isVulnerable ? 'NEW VULNERABILITY' : 'FIXED'
      };
    }
    
    // Deprecated status change
    if (pkg1.isDeprecated !== pkg2.isDeprecated) {
      changes.hasChanges = true;
      changes.deprecated = {
        from: pkg1.isDeprecated,
        to: pkg2.isDeprecated
      };
    }
    
    // Outdated status change
    if (pkg1.isOutdated !== pkg2.isOutdated) {
      changes.hasChanges = true;
      changes.outdated = {
        from: pkg1.isOutdated,
        to: pkg2.isOutdated
      };
    }
    
    return changes;
  }

  /**
   * Generate comparison report
   */
  generateReport(comparisonResult) {
    const { summary, added, removed, updated } = comparisonResult;
    
    const lines = [];
    
    lines.push('# DevCompass Snapshot Comparison Report\n');
    lines.push(`**Snapshot 1:** ${summary.snapshot1.timestamp} (ID: ${summary.snapshot1.id})`);
    lines.push(`**Snapshot 2:** ${summary.snapshot2.timestamp} (ID: ${summary.snapshot2.id})\n`);
    
    lines.push('## Summary\n');
    lines.push(`- Total Packages: ${summary.snapshot1.totalPackages} → ${summary.snapshot2.totalPackages}`);
    lines.push(`- Health Score: ${summary.snapshot1.healthScore.toFixed(2)} → ${summary.snapshot2.healthScore.toFixed(2)} (${summary.changes.healthScoreChange > 0 ? '+' : ''}${summary.changes.healthScoreChange})`);
    lines.push(`- Added: ${summary.changes.added}`);
    lines.push(`- Removed: ${summary.changes.removed}`);
    lines.push(`- Updated: ${summary.changes.updated}`);
    lines.push(`- Unchanged: ${summary.changes.unchanged}\n`);
    
    if (added.length > 0) {
      lines.push('## Added Packages\n');
      added.forEach(pkg => {
        lines.push(`- **${pkg.name}** (${pkg.version}) - Health: ${pkg.healthScore.toFixed(1)}`);
      });
      lines.push('');
    }
    
    if (removed.length > 0) {
      lines.push('## Removed Packages\n');
      removed.forEach(pkg => {
        lines.push(`- **${pkg.name}** (${pkg.version}) - Health: ${pkg.healthScore.toFixed(1)}`);
      });
      lines.push('');
    }
    
    if (updated.length > 0) {
      lines.push('## Updated Packages\n');
      updated.forEach(pkg => {
        lines.push(`- **${pkg.name}**`);
        if (pkg.changes.version) {
          lines.push(`  - Version: ${pkg.changes.version.from} → ${pkg.changes.version.to}`);
        }
        if (pkg.changes.healthScore) {
          lines.push(`  - Health: ${pkg.changes.healthScore.from.toFixed(1)} → ${pkg.changes.healthScore.to.toFixed(1)} (${pkg.changes.healthScore.diff > 0 ? '+' : ''}${pkg.changes.healthScore.diff.toFixed(1)})`);
        }
        if (pkg.changes.vulnerabilities) {
          lines.push(`  - ⚠️ ${pkg.changes.vulnerabilities.status}`);
        }
      });
    }
    
    return lines.join('\n');
  }
}

module.exports = new SnapshotComparator();