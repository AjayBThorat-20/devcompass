// src/core/services/baseline.js
//
// Existing projects start with many findings, so a strict --fail-on gate
// tends to get switched off on day one. A baseline lets a team fail only on
// *new* problems: `devcompass baseline save` records today's findings, and
// `devcompass analyze --baseline --fail-on high` only lets findings that
// weren't there fail the run.
//
// Findings are matched by what they are, not by their full id: a
// vulnerability by package + advisory, anything else by package + rule.
// Versions are left out on purpose (upgrading lodash 4.17.15 -> 4.17.19
// while one accepted advisory remains isn't a new problem), and a finding
// is only "known" if every advisory it carries was in the baseline, so a
// newly published advisory against an old package still counts as new.

const fs = require('fs');
const path = require('path');

const BASELINE_FILENAME = '.devcompass-baseline.json';
const BASELINE_VERSION = 1;

function baselinePath(projectPath) {
  return path.join(projectPath, BASELINE_FILENAME);
}

function baselineKeys(issue) {
  if (!issue || !issue.name) return [];
  const rule = issue.ruleId || issue.type;
  if (rule === 'vuln' && Array.isArray(issue.advisoryIds) && issue.advisoryIds.length > 0) {
    return issue.advisoryIds.map(advisory => `vuln:${issue.name}:${advisory}`).sort();
  }
  return [`${rule}:${issue.name}`];
}

// Sorted, one finding per line when committed, so a re-saved baseline
// reviews as a readable diff.
function saveBaseline(issues, projectPath) {
  const findings = issues
    .map(issue => ({ id: issue.id, severity: issue.severity, keys: baselineKeys(issue) }))
    .filter(finding => finding.keys.length > 0)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const data = { version: BASELINE_VERSION, savedAt: new Date().toISOString(), findings };
  fs.writeFileSync(baselinePath(projectPath), JSON.stringify(data, null, 2) + '\n', 'utf8');
  return data;
}

// null when there's no baseline yet. A file that exists but can't be read
// is an error, not "no baseline" — that would quietly turn every known
// finding back into a new one.
function loadBaseline(projectPath) {
  const file = baselinePath(projectPath);
  if (!fs.existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${BASELINE_FILENAME} is not valid JSON (${error.message}). Re-create it with: devcompass baseline save`);
  }
  if (!data || data.version !== BASELINE_VERSION || !Array.isArray(data.findings)) {
    throw new Error(`${BASELINE_FILENAME} isn't a baseline this version of DevCompass can read. Re-create it with: devcompass baseline save`);
  }
  return data;
}

// Splits `issues` into what the baseline already knew about (keep showing
// these, just don't let them fail the gate) vs. what's new since it was saved.
function applyBaseline(issues, baseline) {
  if (!baseline) return { known: [], new: issues };
  const knownKeys = new Set(baseline.findings.flatMap(finding => finding.keys || []));
  const known = [];
  const fresh = [];
  for (const issue of issues) {
    const keys = baselineKeys(issue);
    if (keys.length > 0 && keys.every(key => knownKeys.has(key))) known.push(issue);
    else fresh.push(issue);
  }
  return { known, new: fresh };
}

module.exports = { saveBaseline, loadBaseline, applyBaseline, baselineKeys, baselinePath, BASELINE_FILENAME };
