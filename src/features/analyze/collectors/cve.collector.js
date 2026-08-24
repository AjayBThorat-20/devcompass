// src/features/analyze/collectors/cve.collector.js

const vulnerabilityChecker = require('../../cve/vulnerability-checker');
const semver = require('semver');
const { normalizeSeverity, getSeverityWeight } = require('../../../core/utils/severity');

// Picks the version a package needs to move to in order to resolve a
// vulnerability: the nearest "fixed" version above what's installed, or (if
// every known fix is already below the installed version, which shouldn't
// normally happen but guards against bad data) the lowest known fix.
function resolveNearestFix(fixedVersions, installedVersion) {
  if (!Array.isArray(fixedVersions) || fixedVersions.length === 0) return null;
  const candidates = fixedVersions.map(v => semver.coerce(v)).filter(Boolean);
  if (candidates.length === 0) return null;
  const installed = semver.coerce(installedVersion);
  const above = installed ? candidates.filter(c => semver.gt(c, installed)) : candidates;
  const pool = above.length > 0 ? above : candidates;
  pool.sort(semver.compare);
  return pool[0].version;
}

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
    const rank = getSeverityWeight(severity);
    const installedVersion = vuln.packageVersion || vuln.version;
    const cvss = vuln.cvssScore || vuln.cvss || 0;
    const vulnFixVersion = resolveNearestFix(vuln.fixedVersions, installedVersion);

    if (!byPackage.has(pkgName)) {
      byPackage.set(pkgName, {
        package: pkgName,
        version: installedVersion,
        severity,
        rank,
        cvss,
        summary: vuln.summary || vuln.title || 'Security vulnerability',
        ids: [vuln.id].filter(Boolean),
        source: vuln.source || 'OSV',
        fixVersion: vulnFixVersion
      });
      continue;
    }

    const existing = byPackage.get(pkgName);
    if (vuln.id) existing.ids.push(vuln.id);

    // A package needs to move to the highest fix version across all of its
    // vulnerabilities to actually resolve every one of them.
    if (vulnFixVersion && (!existing.fixVersion || semver.gt(semver.coerce(vulnFixVersion), semver.coerce(existing.fixVersion)))) {
      existing.fixVersion = vulnFixVersion;
    }

    if (rank > existing.rank) {
      existing.severity = severity;
      existing.rank = rank;
      existing.cvss = cvss || existing.cvss;
      existing.summary = vuln.summary || vuln.title || existing.summary;
    } else if (rank === existing.rank && cvss > existing.cvss) {
      // Among equal-severity vulnerabilities for the same package, surface the
      // worst (highest-CVSS) one rather than whichever was encountered first.
      existing.cvss = cvss;
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
    advisoryCount: entry.ids.length,
    fixVersion: entry.fixVersion
  }));
}

module.exports = { collectCVEData };