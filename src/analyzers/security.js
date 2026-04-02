// src/analyzers/security.js
const { execSync } = require('child_process');

/**
 * Run npm audit and parse results
 */
async function checkSecurity(projectPath) {
  try {
    // Run npm audit in JSON mode
    const auditOutput = execSync('npm audit --json', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const auditData = JSON.parse(auditOutput);
    
    // Extract vulnerabilities
    const vulnerabilities = [];
    
    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
        vulnerabilities.push({
          package: packageName,
          severity: vuln.severity, // critical, high, moderate, low
          title: vuln.via[0]?.title || 'Security vulnerability',
          range: vuln.range,
          fixAvailable: vuln.fixAvailable,
          cve: vuln.via[0]?.cve || null,
          url: vuln.via[0]?.url || null
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
    
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    // Try to parse the error output
    try {
      const auditData = JSON.parse(error.stdout);
      
      const vulnerabilities = [];
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
          vulnerabilities.push({
            package: packageName,
            severity: vuln.severity,
            title: vuln.via[0]?.title || 'Security vulnerability',
            range: vuln.range,
            fixAvailable: vuln.fixAvailable,
            cve: vuln.via[0]?.cve || null,
            url: vuln.via[0]?.url || null
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
    } catch (parseError) {
      // If we can't parse, return empty
      return {
        vulnerabilities: [],
        metadata: {
          total: 0,
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0
        }
      };
    }
  }
}

/**
 * Calculate security penalty for health score
 */
function calculateSecurityPenalty(metadata) {
  let penalty = 0;
  
  penalty += metadata.critical * 2.5;  // Critical: -2.5 points each
  penalty += metadata.high * 1.5;      // High: -1.5 points each
  penalty += metadata.moderate * 0.5;   // Moderate: -0.5 points each
  penalty += metadata.low * 0.2;        // Low: -0.2 points each
  
  return Math.min(penalty, 5.0); // Cap at 5 points
}

module.exports = { 
  checkSecurity,
  calculateSecurityPenalty
};