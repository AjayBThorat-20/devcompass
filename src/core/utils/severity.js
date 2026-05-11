const SEVERITY_LEVELS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#6b7280'
};

const SEVERITY_LABELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

function normalizeSeverity(severity) {
  if (!severity) return 'MEDIUM';
  const s = severity.toUpperCase();
  if (s === 'MODERATE') return 'MEDIUM';
  if (SEVERITY_LEVELS[s]) return s;
  return 'MEDIUM';
}

function getSeverityWeight(severity) {
  return SEVERITY_LEVELS[severity] || 0;
}

function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] || '#6b7280';
}

function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity] || 'Unknown';
}

function compareSeverity(a, b) {
  return getSeverityWeight(b) - getSeverityWeight(a);
}

module.exports = {
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  normalizeSeverity,
  getSeverityWeight,
  getSeverityColor,
  getSeverityLabel,
  compareSeverity
};