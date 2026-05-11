const { SEVERITY_WEIGHTS } = require('../models/issue.model');

class HealthCalculator {
  static calculate(issues) {
    if (!Array.isArray(issues) || issues.length === 0) {
      return 10.0;
    }

    let score = 10.0;

    issues.forEach(issue => {
      const penalty = this.getPenalty(issue);
      score -= penalty;
    });

    return Math.max(0, Math.min(10, score));
  }

  static getPenalty(issue) {
    const severityPenalties = {
      CRITICAL: 2.0,
      HIGH: 1.5,
      MEDIUM: 1.0,
      LOW: 0.5
    };

    const typePenalties = {
      security: 1.2,
      license: 1.0,
      quality: 0.8,
      outdated: 0.5,
      unused: 0.3
    };

    const severityPenalty = severityPenalties[issue.severity] || 1.0;
    const typePenalty = typePenalties[issue.type] || 1.0;

    return severityPenalty * typePenalty;
  }

  static getHealthLabel(score) {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    if (score >= 3) return 'Poor';
    return 'Critical';
  }

  static getHealthColor(score) {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    return 'red';
  }
}

module.exports = { HealthCalculator };