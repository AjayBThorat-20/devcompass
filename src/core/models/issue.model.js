// src/core/models/issue.model.js
//
// AR-03: one finding model. `ruleId` classifies *what kind* of finding this
// is (independent of the human-readable `message`), `confidence` says how
// much a heuristic (unused/typosquat) should be trusted, and `advisoryIds`
// keeps every GHSA/CVE id a merged finding carries — not just the first one,
// which `mergeSecurityEntries()` used to compute (`advisoryCount`) and then
// never use anywhere.

// CL-07: severity weights/colors come from the one shared table (severity.js)
// instead of a separate local copy — SEVERITY_WEIGHTS/SEVERITY_COLORS are
// re-exported under their old names here so existing importers keep working.
const { SEVERITY_LEVELS: SEVERITY_WEIGHTS, SEVERITY_TERMINAL_COLORS: SEVERITY_COLORS } = require('../utils/severity');
const TYPE_ICONS = { security: '🔴', license: '⚖️', quality: '📦', outdated: '⬆️', unused: '🧹' };

// A stable-ish rule id per kind of finding, independent of which collector
// produced it or how its message is worded — e.g. "vuln", "typosquat",
// "license", "outdated/major", "unused".
function buildRuleId({ type, source, metadata }) {
  if (type === 'security') {
    if (source === 'Typosquat') return 'typosquat';
    return 'vuln';
  }
  if (type === 'outdated') return metadata?.updateType ? `outdated/${metadata.updateType}` : 'outdated';
  if (type === 'license') return 'license';
  if (type === 'unused') return 'unused';
  if (type === 'quality') return source === 'Predictive' ? 'quality/predictive' : 'quality';
  return type || 'other';
}

// "<ruleId>:<package>@<version>[:<advisoryId>]" — stable within a scan, and
// precise enough for devcompass.config.json's `ignore[].id` and a baseline
// to target one specific finding rather than everything for a package.
function buildId({ ruleId, name, version, advisoryIds }) {
  const base = `${ruleId}:${name}@${version || 'unknown'}`;
  return advisoryIds && advisoryIds.length > 0 ? `${base}:${advisoryIds[0]}` : base;
}

class Issue {
  constructor({
    id, name, version, type, severity, score, message, risk, fix, safeFix, source, metadata,
    ruleId, confidence, advisoryIds
  }) {
    this.ruleId = ruleId || buildRuleId({ type, source, metadata });
    this.name = name;
    this.version = version;
    this.type = type;
    this.severity = severity;
    // Heuristics (unused, typosquat) are never "high" — see risk-classifier.js,
    // which requires confidence 'high' before a security finding can be
    // auto-fixed without --all.
    this.confidence = confidence || 'medium';
    this.advisoryIds = Array.isArray(advisoryIds) ? advisoryIds : [];
    this.score = score || 0;
    this.message = message;
    this.risk = risk;
    this.fix = fix;
    this.safeFix = safeFix !== false;
    this.source = source;
    this.metadata = metadata || {};
    this.id = id || buildId({ ruleId: this.ruleId, name, version, advisoryIds: this.advisoryIds });
  }

  get severityWeight() { return SEVERITY_WEIGHTS[this.severity] || 0; }
  get color() { return SEVERITY_COLORS[this.severity] || 'white'; }
  get icon() { return TYPE_ICONS[this.type] || '⚠️'; }

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      name: this.name,
      version: this.version,
      type: this.type,
      severity: this.severity,
      confidence: this.confidence,
      advisoryIds: this.advisoryIds,
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
  return ['name', 'version', 'type', 'severity'].every(field => issue[field]);
}

module.exports = {
  Issue,
  createIssue,
  validateIssue,
  buildRuleId,
  buildId,
  SEVERITY_WEIGHTS,
  SEVERITY_COLORS,
  TYPE_ICONS
};
