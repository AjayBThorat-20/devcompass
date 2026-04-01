const semver = require('semver');

/**
 * Match installed packages against known issues database
 */
function matchIssues(installedVersions, issuesDb) {
  const alerts = [];
  
  for (const [packageName, versionInfo] of Object.entries(installedVersions)) {
    // Check if this package has known issues
    if (!issuesDb[packageName]) {
      continue;
    }
    
    const packageIssues = issuesDb[packageName];
    const installedVersion = versionInfo.version;
    
    // Check each issue for this package
    for (const issue of packageIssues) {
      try {
        // Use semver to check if installed version is affected
        if (semver.satisfies(installedVersion, issue.affected)) {
          alerts.push({
            package: packageName,
            version: installedVersion,
            severity: issue.severity,
            title: issue.title,
            affected: issue.affected,
            fix: issue.fix || null,
            source: issue.source || null,
            reported: issue.reported || null
          });
        }
      } catch (error) {
        // Skip if semver parsing fails
        continue;
      }
    }
  }
  
  // Sort by severity: critical > high > medium > low
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return alerts;
}

module.exports = { matchIssues };