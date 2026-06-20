// src/core/models/issue.model.js

const SEVERITY_WEIGHTS = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const SEVERITY_COLORS = { CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'blue', LOW: 'gray' };
const TYPE_ICONS = { security: '🔴', license: '⚖️', quality: '📦', outdated: '⬆️', unused: '🧹' };

class Issue {
  constructor({ id, name, version, type, severity, score, message, risk, fix, safeFix, source, metadata }) {
    this.id = id || `${name}@${version}`;
    this.name = name;
    this.version = version;
    this.type = type;
    this.severity = severity;
    this.score = score || 0;
    this.message = message;
    this.risk = risk;
    this.fix = fix;
    this.safeFix = safeFix !== false;
    this.source = source;
    this.metadata = metadata || {};
  }

  get severityWeight() { return SEVERITY_WEIGHTS[this.severity] || 0; }
  get color() { return SEVERITY_COLORS[this.severity] || 'white'; }
  get icon() { return TYPE_ICONS[this.type] || '⚠️'; }

  toJSON() {
    return { id: this.id, name: this.name, version: this.version, type: this.type, severity: this.severity, score: this.score, message: this.message, risk: this.risk, fix: this.fix, safeFix: this.safeFix, source: this.source, metadata: this.metadata };
  }
}

function createIssue(data) { return new Issue(data); }
function validateIssue(issue) { return ['name', 'version', 'type', 'severity'].every(field => issue[field]); }

module.exports = { Issue, createIssue, validateIssue, SEVERITY_WEIGHTS, SEVERITY_COLORS, TYPE_ICONS };

// src/core/services/health-calculator.js

class HealthCalculator {
  static calculate(issues) {
    if (!Array.isArray(issues) || issues.length === 0) return 10.0;
    let score = 10.0;
    issues.forEach(issue => { score -= this.getPenalty(issue); });
    return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
  }

  static getPenalty(issue) {
    const severityPenalties = { CRITICAL: 2.0, HIGH: 1.5, MEDIUM: 1.0, LOW: 0.5 };
    const typePenalties = { security: 1.2, license: 1.0, quality: 0.8, outdated: 0.5, unused: 0.3 };
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
}

module.exports = { HealthCalculator };