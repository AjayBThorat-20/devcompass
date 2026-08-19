// src/features/analyze/collectors/cve.collector.js

const vulnerabilityChecker = require('../../cve/vulnerability-checker');

const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

async function collectCVEData(projectPath, packageJson = null) {
  try {
    const result = await vulnerabilityChecker.checkProject(projectPath, packageJson);
    const rawVulns = result.vulnerabilities || [];

    const issues = rawVulns.length === 0 ? [] : collapsePerPackage(rawVulns);

    // Attached as extra properties on the array (not a shape change) so the
    // Promise.allSettled destructuring in analyze/index.js keeps treating this
    // as a plain issues array — index.js reads .incomplete to warn the user
    // and note it in the JSON metadata instead of reporting a false clean scan.
    if (result.incomplete) {
      issues.incomplete = true;
      issues.incompleteReason = result.error || 'CVE scan could not complete';
    }

    return issues;
  } catch (error) {
    if (process.env.DEBUG) console.error('CVE collection failed:', error.message);
    const issues = [];
    issues.incomplete = true;
    issues.incompleteReason = error.message;
    return issues;
  }
}

function collapsePerPackage(vulns) {
  const byPackage = new Map();

  for (const vuln of vulns) {
    const pkgName = vuln.package || vuln.name;
    if (!pkgName) continue;

    const severity = normalizeSeverity(vuln.severity);
    const rank = SEVERITY_RANK[severity] || 0;

    if (!byPackage.has(pkgName)) {
      byPackage.set(pkgName, {
        package: pkgName,
        version: vuln.packageVersion || vuln.version,
        severity,
        rank,
        cvss: vuln.cvssScore || vuln.cvss || 0,
        summary: vuln.summary || vuln.title || 'Security vulnerability',
        ids: [vuln.id].filter(Boolean),
        source: vuln.source || 'OSV'
      });
      continue;
    }

    const existing = byPackage.get(pkgName);
    if (vuln.id) existing.ids.push(vuln.id);

    if (rank > existing.rank) {
      existing.severity = severity;
      existing.rank = rank;
      existing.cvss = vuln.cvssScore || vuln.cvss || existing.cvss;
      existing.summary = vuln.summary || vuln.title || existing.summary;
    }
  }

  return Array.from(byPackage.values()).map(entry => ({
    package: entry.package,
    version: entry.version,
    severity: entry.severity,
    score: entry.cvss,
    summary: entry.ids.length > 1 ? `${entry.summary} (${entry.ids.length} advisories)` : entry.summary,
    risk: entry.ids.slice(0, 5).join(', ') + (entry.ids.length > 5 ? `, +${entry.ids.length - 5} more` : ''),
    source: entry.source,
    id: entry.ids[0],
    advisoryCount: entry.ids.length
  }));
}

function normalizeSeverity(severity) {
  if (!severity) return 'MEDIUM';
  const s = String(severity).toUpperCase();
  if (s === 'MODERATE') return 'MEDIUM';
  if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(s)) return s;
  return 'MEDIUM';
}

module.exports = { collectCVEData };