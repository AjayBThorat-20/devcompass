const { categorizeFixes } = require('../../../core/services/risk-classifier');

class FixPlanner {
  constructor(issues) {
    this.issues = issues;
  }

  generatePlan() {
    const { safe, moderate, risky } = categorizeFixes(this.issues);

    const plan = {
      safe: this.createFixActions(safe, 'safe'),
      moderate: this.createFixActions(moderate, 'moderate'),
      risky: this.createFixActions(risky, 'risky'),
      summary: {
        totalIssues: this.issues.length,
        safeCount: safe.length,
        moderateCount: moderate.length,
        riskyCount: risky.length
      }
    };

    return plan;
  }

  createFixActions(issues, riskLevel) {
    return issues.map(issue => ({
      id: issue.id,
      package: issue.name,
      currentVersion: issue.version,
      targetVersion: this.extractTargetVersion(issue.fix),
      action: this.determineAction(issue),
      type: issue.type,
      severity: issue.severity,
      message: issue.message,
      fix: issue.fix,
      riskLevel,
      riskInfo: issue.riskInfo,
      metadata: issue.metadata
    }));
  }

  determineAction(issue) {
    if (issue.type === 'unused') return 'remove';
    if (issue.type === 'security' || issue.type === 'outdated') return 'update';
    if (issue.type === 'quality' || issue.type === 'license') {
      return issue.metadata?.alternative ? 'replace' : 'review';
    }
    return 'review';
  }

  extractTargetVersion(fixText) {
    const match = fixText.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'latest';
  }

  getExecutableActions(plan, mode = 'safe') {
    if (mode === 'safe') {
      return plan.safe;
    } else if (mode === 'moderate') {
      return [...plan.safe, ...plan.moderate];
    } else if (mode === 'all') {
      return [...plan.safe, ...plan.moderate, ...plan.risky];
    }
    return [];
  }
}

function createFixPlan(issues) {
  const planner = new FixPlanner(issues);
  return planner.generatePlan();
}

module.exports = {
  FixPlanner,
  createFixPlan
};