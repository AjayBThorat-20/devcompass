// src/core/utils/severity.js

const SEVERITY_LEVELS = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' };
const SEVERITY_LABELS = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function normalizeSeverity(severity) {
  if (!severity) return 'MEDIUM';
  const s = severity.toUpperCase();
  if (s === 'MODERATE') return 'MEDIUM';
  if (SEVERITY_LEVELS[s]) return s;
  return 'MEDIUM';
}

function getSeverityWeight(severity) { return SEVERITY_LEVELS[severity] || 0; }
function getSeverityColor(severity) { return SEVERITY_COLORS[severity] || '#6b7280'; }
function getSeverityLabel(severity) { return SEVERITY_LABELS[severity] || 'Unknown'; }
function compareSeverity(a, b) { return getSeverityWeight(b) - getSeverityWeight(a); }

module.exports = { SEVERITY_LEVELS, SEVERITY_COLORS, SEVERITY_LABELS, normalizeSeverity, getSeverityWeight, getSeverityColor, getSeverityLabel, compareSeverity };

// src/core/utils/validators.js

const fs = require('fs');
const path = require('path');

class Validators {
  static isValidProjectPath(projectPath) {
    try { return fs.existsSync(path.join(projectPath, 'package.json')); }
    catch (error) { return false; }
  }

  static hasPackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) throw new Error('No package.json found in project directory');
    try { require(packageJsonPath); return true; }
    catch (error) { throw new Error('Invalid package.json format'); }
  }

  static hasPackageLock(projectPath) { return fs.existsSync(path.join(projectPath, 'package-lock.json')); }
  static isValidPackageName(name) { return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name); }
  static isValidVersion(version) { if (version === 'latest') return true; return /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(version); }
  static validateIssue(issue) { return ['name', 'version', 'type', 'severity'].every(field => issue[field] !== undefined); }
  static validateFixAction(action) { return ['package', 'action'].every(field => action[field] !== undefined); }
}

module.exports = { Validators };