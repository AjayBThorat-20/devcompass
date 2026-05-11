const SEVERITY_WEIGHTS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

const SEVERITY_COLORS = {
  CRITICAL: 'red',
  HIGH: 'yellow',
  MEDIUM: 'blue',
  LOW: 'gray'
};

const TYPE_ICONS = {
  security: '🔴',
  license: '⚖️',
  quality: '📦',
  outdated: '⬆️',
  unused: '🧹'
};

class Issue {
  constructor({
    id,
    name,
    version,
    type,
    severity,
    score,
    message,
    risk,
    fix,
    safeFix,
    source,
    metadata
  }) {
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

  get severityWeight() {
    return SEVERITY_WEIGHTS[this.severity] || 0;
  }

  get color() {
    return SEVERITY_COLORS[this.severity] || 'white';
  }

  get icon() {
    return TYPE_ICONS[this.type] || '⚠️';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      severity: this.severity,
      score: this.score,
      message: this.message,
      risk: this.risk,
      fix: this.fix,
      safeFix: this.safeFix,
      source: this.source,
      metadata: this.metadata
    };
  }
}

function createIssue(data) {
  return new Issue(data);
}

function validateIssue(issue) {
  const required = ['name', 'version', 'type', 'severity'];
  return required.every(field => issue[field]);
}

module.exports = {
  Issue,
  createIssue,
  validateIssue,
  SEVERITY_WEIGHTS,
  SEVERITY_COLORS,
  TYPE_ICONS
};