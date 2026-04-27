// src/ai/context-builder.js
const fs = require('fs');
const path = require('path');

/**
 * Build comprehensive context from analysis results for AI
 */
class ContextBuilder {
  /**
   * Build context for analyze command
   */
  buildAnalysisContext(analysisResults) {
    const sections = [];

    // Project Overview
    sections.push(this._buildProjectOverview(analysisResults));

    // Health Score Breakdown
    sections.push(this._buildHealthScoreBreakdown(analysisResults));

    // Security Issues
    if (analysisResults.vulnerabilities && analysisResults.vulnerabilities.length > 0) {
      sections.push(this._buildSecuritySection(analysisResults.vulnerabilities));
    }

    // Outdated Packages
    if (analysisResults.outdated && analysisResults.outdated.length > 0) {
      sections.push(this._buildOutdatedSection(analysisResults.outdated));
    }

    // Deprecated Packages
    if (analysisResults.deprecated && analysisResults.deprecated.length > 0) {
      sections.push(this._buildDeprecatedSection(analysisResults.deprecated));
    }

    // Unused Dependencies
    if (analysisResults.unused && analysisResults.unused.length > 0) {
      sections.push(this._buildUnusedSection(analysisResults.unused));
    }

    // Supply Chain Risks
    if (analysisResults.supplyChain && analysisResults.supplyChain.length > 0) {
      sections.push(this._buildSupplyChainSection(analysisResults.supplyChain));
    }

    // License Issues
    if (analysisResults.licenseIssues && analysisResults.licenseIssues.length > 0) {
      sections.push(this._buildLicenseSection(analysisResults.licenseIssues));
    }

    // Bundle Size Analysis
    if (analysisResults.heavyPackages && analysisResults.heavyPackages.length > 0) {
      sections.push(this._buildBundleSizeSection(analysisResults.heavyPackages));
    }

    return sections.join('\n\n');
  }

  /**
   * Build project overview
   */
  _buildProjectOverview(results) {
    return `PROJECT OVERVIEW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${results.projectName || 'Unknown'}
Version: ${results.projectVersion || 'Unknown'}
Path: ${results.projectPath || process.cwd()}
Total Dependencies: ${results.totalDependencies || 0}
Health Score: ${results.healthScore || 0}/10
Analyzed: ${new Date().toISOString()}`;
  }

  /**
   * Build health score breakdown
   */
  _buildHealthScoreBreakdown(results) {
    const factors = [];

    if (results.vulnerabilities?.length > 0) {
      factors.push(`- Security Vulnerabilities: ${results.vulnerabilities.length} (impact: -${results.vulnerabilities.length * 0.5} points)`);
    }

    if (results.outdated?.length > 0) {
      factors.push(`- Outdated Packages: ${results.outdated.length} (impact: -${Math.min(results.outdated.length * 0.2, 2)} points)`);
    }

    if (results.deprecated?.length > 0) {
      factors.push(`- Deprecated Packages: ${results.deprecated.length} (impact: -${results.deprecated.length * 0.5} points)`);
    }

    if (results.unused?.length > 0) {
      factors.push(`- Unused Dependencies: ${results.unused.length} (impact: -${Math.min(results.unused.length * 0.1, 1)} points)`);
    }

    if (results.supplyChain?.length > 0) {
      factors.push(`- Supply Chain Risks: ${results.supplyChain.length} (impact: -${results.supplyChain.length * 0.3} points)`);
    }

    return `HEALTH SCORE BREAKDOWN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Score: ${results.healthScore || 0}/10

Factors affecting score:
${factors.length > 0 ? factors.join('\n') : '- No issues detected (excellent! ✅)'}`;
  }

  /**
   * Build security section
   */
  _buildSecuritySection(vulnerabilities) {
    const critical = vulnerabilities.filter(v => v.severity === 'critical');
    const high = vulnerabilities.filter(v => v.severity === 'high');
    const medium = vulnerabilities.filter(v => v.severity === 'medium');
    const low = vulnerabilities.filter(v => v.severity === 'low');

    const vulnList = vulnerabilities.slice(0, 10).map(v => 
      `  - ${v.package} (${v.severity.toUpperCase()}): ${v.via?.[0] || 'Unknown vulnerability'}`
    ).join('\n');

    return `SECURITY VULNERABILITIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${vulnerabilities.length}
  Critical: ${critical.length}
  High: ${high.length}
  Medium: ${medium.length}
  Low: ${low.length}

Top Vulnerabilities:
${vulnList}
${vulnerabilities.length > 10 ? `\n... and ${vulnerabilities.length - 10} more` : ''}`;
  }

  /**
   * Build outdated packages section
   */
  _buildOutdatedSection(outdated) {
    const major = outdated.filter(p => p.updateType === 'major');
    const minor = outdated.filter(p => p.updateType === 'minor');
    const patch = outdated.filter(p => p.updateType === 'patch');

    const packageList = outdated.slice(0, 10).map(p => 
      `  - ${p.name}: ${p.current} → ${p.latest} (${p.updateType} update)`
    ).join('\n');

    return `OUTDATED PACKAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${outdated.length}
  Major updates: ${major.length}
  Minor updates: ${minor.length}
  Patch updates: ${patch.length}

Top Outdated Packages:
${packageList}
${outdated.length > 10 ? `\n... and ${outdated.length - 10} more` : ''}`;
  }

  /**
   * Build deprecated packages section
   */
  _buildDeprecatedSection(deprecated) {
    const packageList = deprecated.map(p => 
      `  - ${p.name}@${p.version}${p.alternative ? ` → Recommended: ${p.alternative}` : ''}`
    ).join('\n');

    return `DEPRECATED PACKAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${deprecated.length}

Packages:
${packageList}`;
  }

  /**
   * Build unused dependencies section
   */
  _buildUnusedSection(unused) {
    const packageList = unused.slice(0, 15).map(p => `  - ${p}`).join('\n');

    return `UNUSED DEPENDENCIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${unused.length}

Packages:
${packageList}
${unused.length > 15 ? `\n... and ${unused.length - 15} more` : ''}

These packages are installed but never imported/required in your code.`;
  }

  /**
   * Build supply chain section
   */
  _buildSupplyChainSection(supplyChain) {
    const typosquatting = supplyChain.filter(r => r.type === 'typosquat');
    const suspicious = supplyChain.filter(r => r.type === 'suspicious');

    const riskList = supplyChain.slice(0, 10).map(r => 
      `  - ${r.package}${r.similarTo ? ` (similar to: ${r.similarTo})` : ''}: ${r.warning}`
    ).join('\n');

    return `SUPPLY CHAIN RISKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${supplyChain.length}
  Typosquatting risks: ${typosquatting.length}
  Suspicious packages: ${suspicious.length}

Detected Risks:
${riskList}
${supplyChain.length > 10 ? `\n... and ${supplyChain.length - 10} more` : ''}`;
  }

  /**
   * Build license section
   */
  _buildLicenseSection(licenseIssues) {
    const issueList = licenseIssues.map(l => 
      `  - ${l.package}: ${l.license} (${l.risk || 'Unknown risk'})`
    ).join('\n');

    return `LICENSE ISSUES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${licenseIssues.length}

Issues:
${issueList}`;
  }

  /**
   * Build bundle size section
   */
  _buildBundleSizeSection(heavyPackages) {
    const packageList = heavyPackages.map(p => 
      `  - ${p.name}: ${this._formatBytes(p.size)}`
    ).join('\n');

    const totalSize = heavyPackages.reduce((sum, p) => sum + p.size, 0);

    return `HEAVY PACKAGES (>1MB):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${heavyPackages.length}
Combined size: ${this._formatBytes(totalSize)}

Packages:
${packageList}`;
  }

  /**
   * Build context from snapshot comparison
   */
  buildComparisonContext(comparison) {
    const sections = [];

    // Overview
    sections.push(`SNAPSHOT COMPARISON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: Snapshot #${comparison.snapshot1.id} (${new Date(comparison.snapshot1.timestamp).toLocaleString()})
To: Snapshot #${comparison.snapshot2.id} (${new Date(comparison.snapshot2.timestamp).toLocaleString()})

Time difference: ${this._calculateTimeDiff(comparison.snapshot1.timestamp, comparison.snapshot2.timestamp)}`);

    // Health Score Change
    const healthDelta = comparison.snapshot2.healthScore - comparison.snapshot1.healthScore;
    const healthEmoji = healthDelta > 0 ? '📈' : healthDelta < 0 ? '📉' : '➡️';
    
    sections.push(`HEALTH SCORE CHANGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${healthEmoji} ${comparison.snapshot1.healthScore}/10 → ${comparison.snapshot2.healthScore}/10 (${healthDelta > 0 ? '+' : ''}${healthDelta.toFixed(1)})`);

    // Changes Summary
    sections.push(`CHANGES SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Added Packages: ${comparison.added?.length || 0}
Removed Packages: ${comparison.removed?.length || 0}
Updated Packages: ${comparison.updated?.length || 0}
Unchanged Packages: ${comparison.unchanged?.length || 0}`);

    // Added Packages
    if (comparison.added?.length > 0) {
      const addedList = comparison.added.slice(0, 10).map(p => 
        `  + ${p.name}@${p.version}`
      ).join('\n');
      
      sections.push(`ADDED PACKAGES:
${addedList}
${comparison.added.length > 10 ? `... and ${comparison.added.length - 10} more` : ''}`);
    }

    // Removed Packages
    if (comparison.removed?.length > 0) {
      const removedList = comparison.removed.slice(0, 10).map(p => 
        `  - ${p.name}@${p.version}`
      ).join('\n');
      
      sections.push(`REMOVED PACKAGES:
${removedList}
${comparison.removed.length > 10 ? `... and ${comparison.removed.length - 10} more` : ''}`);
    }

    // Updated Packages
    if (comparison.updated?.length > 0) {
      const updatedList = comparison.updated.slice(0, 10).map(p => 
        `  ⟳ ${p.name}: ${p.oldVersion} → ${p.newVersion}${p.healthChange ? ` (health: ${p.healthChange > 0 ? '+' : ''}${p.healthChange})` : ''}`
      ).join('\n');
      
      sections.push(`UPDATED PACKAGES:
${updatedList}
${comparison.updated.length > 10 ? `... and ${comparison.updated.length - 10} more` : ''}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Build context from timeline data
   */
  buildTimelineContext(timeline) {
    const sections = [];

    // Overview
    sections.push(`TIMELINE ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period: ${timeline.period || 'All time'}
Total Snapshots: ${timeline.snapshots?.length || 0}
Date Range: ${timeline.startDate ? new Date(timeline.startDate).toLocaleDateString() : 'N/A'} to ${timeline.endDate ? new Date(timeline.endDate).toLocaleDateString() : 'N/A'}`);

    // Trend Analysis
    if (timeline.trend) {
      const trendEmoji = timeline.trend.direction === 'improving' ? '📈' : 
                        timeline.trend.direction === 'declining' ? '📉' : '➡️';
      
      sections.push(`TREND ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${trendEmoji} Overall Trend: ${timeline.trend.direction.toUpperCase()}
Change: ${timeline.trend.percentage > 0 ? '+' : ''}${timeline.trend.percentage.toFixed(1)}%
Average Health: ${timeline.averageHealth?.toFixed(1) || 'N/A'}/10`);
    }

    // Dependency Growth
    if (timeline.dependencyGrowth !== undefined) {
      sections.push(`DEPENDENCY CHANGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Growth: ${timeline.dependencyGrowth > 0 ? '+' : ''}${timeline.dependencyGrowth} packages
Starting Count: ${timeline.startingDependencies || 'N/A'}
Current Count: ${timeline.currentDependencies || 'N/A'}`);
    }

    // Snapshots Summary (first, middle, last)
    if (timeline.snapshots?.length >= 3) {
      const first = timeline.snapshots[0];
      const middle = timeline.snapshots[Math.floor(timeline.snapshots.length / 2)];
      const last = timeline.snapshots[timeline.snapshots.length - 1];

      sections.push(`KEY SNAPSHOTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
First (#${first.id}):  ${new Date(first.timestamp).toLocaleDateString()} - Health: ${first.health_score}/10, Deps: ${first.total_dependencies}
Middle (#${middle.id}): ${new Date(middle.timestamp).toLocaleDateString()} - Health: ${middle.health_score}/10, Deps: ${middle.total_dependencies}
Latest (#${last.id}): ${new Date(last.timestamp).toLocaleDateString()} - Health: ${last.health_score}/10, Deps: ${last.total_dependencies}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Build context from package.json
   */
  buildPackageJsonContext(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return 'No package.json found in project';
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const sections = [];

      sections.push(`PACKAGE.JSON INFO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${packageJson.name || 'Unknown'}
Version: ${packageJson.version || 'Unknown'}
Description: ${packageJson.description || 'No description'}
License: ${packageJson.license || 'Unknown'}`);

      // Scripts
      if (packageJson.scripts) {
        const scriptList = Object.keys(packageJson.scripts).slice(0, 5).join(', ');
        sections.push(`Available Scripts: ${scriptList}${Object.keys(packageJson.scripts).length > 5 ? '...' : ''}`);
      }

      // Dependencies count
      const depsCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepsCount = Object.keys(packageJson.devDependencies || {}).length;
      
      sections.push(`Dependencies: ${depsCount} production, ${devDepsCount} development`);

      return sections.join('\n');
    } catch (error) {
      return `Error reading package.json: ${error.message}`;
    }
  }

  /**
   * Build minimal context (for token efficiency)
   */
  buildMinimalContext(analysisResults) {
    return `Project: ${analysisResults.projectName || 'Unknown'}
Health: ${analysisResults.healthScore || 0}/10
Dependencies: ${analysisResults.totalDependencies || 0}
Issues: ${(analysisResults.vulnerabilities?.length || 0) + (analysisResults.outdated?.length || 0) + (analysisResults.deprecated?.length || 0)}`;
  }

  /**
   * Helper: Format bytes to human-readable
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Helper: Calculate time difference
   */
  _calculateTimeDiff(date1, date2) {
    const diff = new Date(date2) - new Date(date1);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
}

module.exports = new ContextBuilder();