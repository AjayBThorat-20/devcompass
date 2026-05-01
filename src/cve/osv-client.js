// src/cve/osv-client.js
const axios = require('axios');
const chalk = require('chalk');

const OSV_API = 'https://api.osv.dev/v1';

class OSVClient {
  async queryPackage(packageName, version, ecosystem = 'npm') {
    try {
      const response = await axios.post(
        `${OSV_API}/query`,
        {
          package: {
            name: packageName,
            ecosystem: ecosystem
          },
          version: version
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        package: packageName,
        version: version,
        vulnerabilities: response.data.vulns || [],
        source: 'OSV'
      };
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        if (process.env.DEBUG) {
          console.error(chalk.yellow(`⚠️  OSV timeout for ${packageName}`));
        }
      } else if (process.env.DEBUG) {
        console.error(chalk.red(`❌ OSV error for ${packageName}:`), error.message);
      }
      return {
        package: packageName,
        version: version,
        vulnerabilities: [],
        error: error.message
      };
    }
  }

  async batchQuery(packages, ecosystem = 'npm') {
    try {
      const queries = packages.map(pkg => ({
        package: {
          name: pkg.name,
          ecosystem: ecosystem
        },
        version: pkg.version
      }));

      const response = await axios.post(
        `${OSV_API}/querybatch`,
        { queries },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.results.map((result, index) => ({
        package: packages[index].name,
        version: packages[index].version,
        vulnerabilities: result.vulns || [],
        source: 'OSV'
      }));
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(chalk.red('❌ OSV batch query failed:'), error.message);
      }
      return packages.map(pkg => ({
        package: pkg.name,
        version: pkg.version,
        vulnerabilities: [],
        error: error.message
      }));
    }
  }

 parseVulnerability(vuln) {
  // ✅ Extract summary - use actual field from OSV
  let summary = 'No summary available';
  if (vuln.summary && vuln.summary.trim()) {
    summary = vuln.summary.substring(0, 150);
  } else if (vuln.details && vuln.details.trim()) {
    // Fallback to first line of details
    summary = vuln.details.split('\n')[0].substring(0, 150);
  }

  return {
    id: vuln.id || 'UNKNOWN',
    severity: this.extractSeverity(vuln),
    cvssScore: this.extractCVSSScore(vuln),
    summary: summary, // ✅ Use extracted summary
    details: vuln.details || '',
    references: vuln.references || [],
    aliases: vuln.aliases || [],
    affected: vuln.affected || []
  };
}

/**
 * ✅ FIXED: Extract severity from OSV data
 */
extractSeverity(vuln) {
  // 1. HIGHEST PRIORITY: database_specific.severity (GitHub Reviewed)
  if (vuln.database_specific?.severity) {
    const severity = vuln.database_specific.severity.toUpperCase();
    // Map GitHub severity to standard levels
    if (severity === 'MODERATE') return 'MEDIUM';
    if (severity === 'CRITICAL') return 'CRITICAL';
    if (severity === 'HIGH') return 'HIGH';
    if (severity === 'LOW') return 'LOW';
    return severity;
  }

  // 2. Try severity array with CVSS score
  if (vuln.severity && Array.isArray(vuln.severity)) {
    const cvss = vuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V4');
    if (cvss?.score) {
      // Extract numeric score from CVSS vector
      // Format: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N"
      const vectorMatch = cvss.score.match(/CVSS:[^\/]+\/(.+)/);
      if (vectorMatch) {
        // Calculate from vector components (simplified)
        const vector = vectorMatch[1];
        if (vector.includes('C:H') || vector.includes('I:H') || vector.includes('A:H')) {
          return 'HIGH';
        }
        if (vector.includes('C:L') || vector.includes('I:L') || vector.includes('A:L')) {
          return 'MEDIUM';
        }
        return 'LOW';
      }
      
      // Try numeric score directly
      const numericScore = parseFloat(cvss.score);
      if (!isNaN(numericScore)) {
        if (numericScore >= 9.0) return 'CRITICAL';
        if (numericScore >= 7.0) return 'HIGH';
        if (numericScore >= 4.0) return 'MEDIUM';
        return 'LOW';
      }
    }
  }

  // 3. Try affected packages database_specific
  if (vuln.affected?.[0]?.database_specific?.severity) {
    const severity = vuln.affected[0].database_specific.severity.toUpperCase();
    if (severity === 'MODERATE') return 'MEDIUM';
    return severity;
  }

  // 4. Default - don't show UNKNOWN in output
  return 'MEDIUM'; // Default to MEDIUM instead of UNKNOWN for better UX
}

  /**
   * Extract CVSS score from OSV data
   */
  extractCVSSScore(vuln) {
    if (vuln.severity && Array.isArray(vuln.severity)) {
      const cvss = vuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V4');
      if (cvss?.score) {
        // Try direct numeric
        const numericScore = parseFloat(cvss.score);
        if (!isNaN(numericScore)) {
          return numericScore;
        }
        
        // Try extracting from vector
        const scoreMatch = cvss.score.match(/(\d+\.\d+)(?:\/|$)/);
        if (scoreMatch) {
          return parseFloat(scoreMatch[1]);
        }
      }
    }
    return null;
  }
}

module.exports = new OSVClient();