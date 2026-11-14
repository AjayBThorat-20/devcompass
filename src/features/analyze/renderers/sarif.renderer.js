// src/features/analyze/renderers/sarif.renderer.js
//
// FT-03: SARIF 2.1.0 output puts findings in GitHub's Security tab and on
// pull requests (`devcompass analyze --format sarif > devcompass.sarif`,
// then upload with github/codeql-action/upload-sarif).

const { version } = require('../../../../package.json');

// Keyed by the base rule id (before any "/subtype", e.g. "outdated/major" ->
// "outdated") — AR-03's Issue model computes issue.ruleId for every real
// finding; this is just the SARIF-facing display text for each one.
const RULE_DESCRIPTIONS = {
  vuln: { name: 'Vulnerable dependency', text: 'A dependency has a known vulnerability.' },
  typosquat: { name: 'Possible typosquat', text: 'A dependency name is suspiciously close to a popular package.' },
  license: { name: 'License risk', text: 'A dependency uses a license flagged as risky.' },
  quality: { name: 'Package quality', text: 'A dependency is deprecated, abandoned or stale.' },
  outdated: { name: 'Outdated dependency', text: 'A dependency has a newer version available.' },
  unused: { name: 'Unused dependency', text: 'A dependency looks unused (heuristic — verify before removing).' }
};

const SEVERITY_TO_LEVEL = { CRITICAL: 'error', HIGH: 'error', MEDIUM: 'warning', LOW: 'note' };

function ruleFor(issue) {
  // Prefer the finding model's own ruleId (AR-03); fall back to a
  // type-derived guess for callers that pass plain, older-shaped objects.
  let id = issue.ruleId;
  if (!id) {
    if (issue.type === 'security') id = issue.source === 'Typosquat' ? 'typosquat' : 'vuln';
    else id = issue.type || 'other';
  }
  const description = RULE_DESCRIPTIONS[id] || RULE_DESCRIPTIONS[id.split('/')[0]] || { name: id, text: 'DevCompass finding.' };
  return { id, name: description.name, text: description.text };
}

function buildRules(issues) {
  const byId = new Map();
  issues.forEach(issue => {
    const rule = ruleFor(issue);
    if (!byId.has(rule.id)) byId.set(rule.id, { id: rule.id, name: rule.name, shortDescription: { text: rule.text } });
  });
  return Array.from(byId.values());
}

function buildResult(issue) {
  const rule = ruleFor(issue);
  const level = SEVERITY_TO_LEVEL[issue.severity] || 'warning';
  const location = `${issue.name || 'unknown'}@${issue.version || 'unknown'}`;

  return {
    ruleId: rule.id,
    level,
    message: { text: `${location}: ${issue.message || rule.name}${issue.risk ? ` — ${issue.risk}` : ''}` },
    // DevCompass doesn't (yet) resolve a finding to a specific file/line —
    // package-lock.json is the closest real artifact every npm project has.
    locations: [{ physicalLocation: { artifactLocation: { uri: 'package-lock.json' } } }],
    properties: {
      severity: issue.severity,
      type: issue.type,
      confidence: issue.confidence,
      safeFix: !!issue.safeFix,
      advisoryIds: issue.advisoryIds || [],
      knownExploited: !!issue.metadata?.knownExploited,
      epssScore: issue.metadata?.epssScore ?? null
    }
  };
}

function renderSarifOutput(issues, metadata) {
  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [{
      tool: {
        driver: {
          name: 'DevCompass',
          version,
          informationUri: 'https://devcompass.ajaythorat.com',
          rules: buildRules(issues)
        }
      },
      results: issues.map(buildResult)
    }]
  };
  console.log(JSON.stringify(sarif, null, 2));
}

module.exports = { renderSarifOutput };
