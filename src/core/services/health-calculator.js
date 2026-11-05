// Each category's penalty approaches a fixed cap instead of growing without
// limit, so project size (issue count) stops mattering more than severity —
// a project with 30 outdated packages should never score worse than one
// with a single critical vulnerability. Caps sum to 10.
const CATEGORY_CAPS = { security: 5, license: 1.5, quality: 1.5, outdated: 1.5, unused: 0.5 };

// Severity-only: the category cap above already encodes how much a *type*
// of issue can matter, so weighting by severity here (not severity * type,
// as the old formula did) avoids double-counting severity twice.
const SEVERITY_PENALTIES = { CRITICAL: 3.0, HIGH: 2.0, MEDIUM: 1.2, LOW: 0.3 };

class HealthCalculator {
  static calculate(issues) {
    if (!Array.isArray(issues) || issues.length === 0) {
      return 10.0;
    }

    const rawByType = {};
    for (const issue of issues) {
      rawByType[issue.type] = (rawByType[issue.type] || 0) + this.getPenalty(issue);
    }

    let score = 10.0;
    for (const [type, sum] of Object.entries(rawByType)) {
      const cap = CATEGORY_CAPS[type] ?? 1;
      // Approaches `cap` as `sum` grows, but never exceeds it.
      score -= cap * (1 - Math.exp(-sum / cap));
    }

    // However small the rest of the project's issues are, a serious
    // vulnerability must never hide behind a "Good" score. One that's known
    // to be exploited in the wild (CISA KEV) counts as critical, whatever
    // its CVSS severity.
    const security = issues.filter(i => i.type === 'security');
    if (security.some(i => i.severity === 'CRITICAL' || i.metadata?.knownExploited)) score = Math.min(score, 3.9);
    else if (security.some(i => i.severity === 'HIGH')) score = Math.min(score, 5.9);

    return Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;
  }

  static getPenalty(issue) {
    return SEVERITY_PENALTIES[issue.severity] ?? 1.0;
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
