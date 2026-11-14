// src/core/utils/severity.js
//
// CL-07: this used to be one of four separate severity/priority tables
// (this file, SEVERITY_WEIGHTS/SEVERITY_COLORS in issue.model.js,
// data/priorities.json, and inline tables in health-calculator.js and
// issue-ranker.js) that had already drifted out of sync with each other
// (e.g. MEDIUM was 'blue' in one table and 'yellow' in another). This file
// is now the only source; everywhere else imports from here.

const SEVERITY_LEVELS = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' };
const SEVERITY_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
// Chalk color names (for the CLI) — a different palette from SEVERITY_COLORS
// (hex, for the web dashboard), not a duplicate of it.
const SEVERITY_TERMINAL_COLORS = { CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'blue', LOW: 'gray' };
const SEVERITY_ICONS = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '⚪' };

function normalizeSeverity(severity) {
  if (!severity) return 'MEDIUM';
  const s = severity.toUpperCase();
  if (s === 'MODERATE') return 'MEDIUM';
  if (SEVERITY_LEVELS[s]) return s;
  return 'MEDIUM';
}

function getSeverityWeight(severity) { return SEVERITY_LEVELS[severity] || 0; }
function getSeverityColor(severity) { return SEVERITY_COLORS[severity] || '#6b7280'; }
function getSeverityTerminalColor(severity) { return SEVERITY_TERMINAL_COLORS[severity] || 'white'; }
function getSeverityIcon(severity) { return SEVERITY_ICONS[severity] || '⚠️'; }
function getSeverityLabel(severity) { return SEVERITY_LABELS[severity] || 'Unknown'; }
function compareSeverity(a, b) { return getSeverityWeight(b) - getSeverityWeight(a); }

module.exports = {
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_TERMINAL_COLORS,
  SEVERITY_ICONS,
  normalizeSeverity,
  getSeverityWeight,
  getSeverityColor,
  getSeverityTerminalColor,
  getSeverityIcon,
  getSeverityLabel,
  compareSeverity
};
