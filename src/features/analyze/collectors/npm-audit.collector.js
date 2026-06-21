// src/features/analyze/collectors/npm-audit.collector.js

const { execSync } = require('child_process');

async function checkSecurity(projectPath) {
  const empty = { vulnerabilities: [], metadata: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };

  try {
    const auditOutput = execSync('npm audit --json', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    });

    return parseAuditOutput(auditOutput);
  } catch (error) {
    if (error.stdout) {
      try {
        return parseAuditOutput(error.stdout);
      } catch (parseError) {
        if (process.env.DEBUG) console.error('checkSecurity parse failed:', parseError.message);
        return empty;
      }
    }
    if (process.env.DEBUG) console.error('checkSecurity failed:', error.message);
    return empty;
  }
}

function parseAuditOutput(rawOutput) {
  const auditData = JSON.parse(rawOutput);
  const vulnerabilities = [];

  if (auditData.vulnerabilities && typeof auditData.vulnerabilities === 'object') {
    Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
      const viaEntry = Array.isArray(vuln.via) ? vuln.via.find(v => typeof v === 'object') : null;
      vulnerabilities.push({
        package: packageName,
        severity: vuln.severity,
        title: viaEntry?.title || 'Security vulnerability',
        range: vuln.range,
        fixAvailable: vuln.fixAvailable,
        cve: viaEntry?.cve || null,
        url: viaEntry?.url || null
      });
    });
  }

  return {
    vulnerabilities,
    metadata: {
      total: auditData.metadata?.vulnerabilities?.total || 0,
      critical: auditData.metadata?.vulnerabilities?.critical || 0,
      high: auditData.metadata?.vulnerabilities?.high || 0,
      moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
      low: auditData.metadata?.vulnerabilities?.low || 0
    }
  };
}

function calculateSecurityPenalty(metadata) {
  if (!metadata) return 0;

  let penalty = 0;
  penalty += (metadata.critical || 0) * 2.5;
  penalty += (metadata.high || 0) * 1.5;
  penalty += (metadata.moderate || 0) * 0.5;
  penalty += (metadata.low || 0) * 0.2;

  return Math.min(penalty, 5.0);
}

module.exports = { checkSecurity, calculateSecurityPenalty };