const { SEVERITY_WEIGHTS } = require('../models/issue.model');

const TYPE_WEIGHTS = {
  security: 10,
  license: 8,
  quality: 6,
  outdated: 4,
  unused: 2
};

class IssueRanker {
  constructor(issues) {
    this.issues = issues;
  }

  calculatePriority(issue) {
    const severityScore = SEVERITY_WEIGHTS[issue.severity] || 0;
    const typeScore = TYPE_WEIGHTS[issue.type] || 0;
    const impactScore = issue.score || 0;
    
    return (severityScore * 10) + typeScore + (impactScore / 10);
  }

  getTop(n = 3) {
    return this.issues
      .map(issue => ({
        ...issue,
        priority: this.calculatePriority(issue)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, n);
  }

  getCritical() {
    return this.issues.filter(issue => 
      issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
    );
  }

  getSafeFixes() {
    return this.issues.filter(issue => issue.safeFix);
  }

  getRiskyFixes() {
    return this.issues.filter(issue => !issue.safeFix);
  }

  groupByType() {
    return this.issues.reduce((groups, issue) => {
      const type = issue.type;
      groups[type] = groups[type] || [];
      groups[type].push(issue);
      return groups;
    }, {});
  }

  groupBySeverity() {
    return this.issues.reduce((groups, issue) => {
      const severity = issue.severity;
      groups[severity] = groups[severity] || [];
      groups[severity].push(issue);
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

function createRanker(issues) {
  return new IssueRanker(issues);
}

function getTopIssues(issues, n = 3) {
  return createRanker(issues).getTop(n);
}

module.exports = {
  IssueRanker,
  createRanker,
  getTopIssues
};