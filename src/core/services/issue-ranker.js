// src/core/services/issue-ranker.js

const { SEVERITY_WEIGHTS } = require('../models/issue.model');

const TYPE_WEIGHTS = { security: 10, license: 8, quality: 6, outdated: 4, unused: 2 };

class IssueRanker {
  constructor(issues) { this.issues = issues; }

  calculatePriority(issue) {
    const severityScore = SEVERITY_WEIGHTS[issue.severity] || 0;
    const typeScore = TYPE_WEIGHTS[issue.type] || 0;
    const impactScore = issue.score || 0;
    // A vulnerability on CISA's known-exploited list is being used in real
    // attacks now, so it outranks anything that is only severe on paper.
    // EPSS (0-1) only breaks ties: at most 5 points, never enough to cross
    // a severity level (10 points apart).
    const exploitScore = (issue.metadata?.knownExploited ? 100 : 0) + ((issue.metadata?.epssScore || 0) * 5);
    return (severityScore * 10) + typeScore + (impactScore / 10) + exploitScore;
  }

  getTop(n = 3) {
    return this.issues
      .map(issue => ({ ...issue, priority: this.calculatePriority(issue) }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, n);
  }

  getCritical() { return this.issues.filter(issue => issue.severity === 'CRITICAL' || issue.severity === 'HIGH'); }
  getSafeFixes() { return this.issues.filter(issue => issue.safeFix); }
  getRiskyFixes() { return this.issues.filter(issue => !issue.safeFix); }

  // Each group is most-urgent first, same order as getTop().
  groupByType() {
    const byPriority = [...this.issues].sort((a, b) => this.calculatePriority(b) - this.calculatePriority(a));
    return byPriority.reduce((groups, issue) => {
      groups[issue.type] = groups[issue.type] || [];
      groups[issue.type].push(issue);
      return groups;
    }, {});
  }

  groupBySeverity() {
    return this.issues.reduce((groups, issue) => {
      groups[issue.severity] = groups[issue.severity] || [];
      groups[issue.severity].push(issue);
      return groups;
    }, {});
  }

  getStats() {
    return {
      total: this.issues.length,
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      high: this.issues.filter(i => i.severity === 'HIGH').length,
      medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
      low: this.issues.filter(i => i.severity === 'LOW').length,
      safeFixes: this.getSafeFixes().length,
      riskyFixes: this.getRiskyFixes().length
    };
  }
}

function createRanker(issues) { return new IssueRanker(issues); }
function getTopIssues(issues, n = 3) { return createRanker(issues).getTop(n); }

module.exports = { IssueRanker, createRanker, getTopIssues };