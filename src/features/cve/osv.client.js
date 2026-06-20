// src/features/cve/osv.client.js

const axios = require('axios');
const chalk = require('chalk');

const OSV_API = 'https://api.osv.dev/v1';

class OSVClient {
  async queryPackage(packageName, version, ecosystem = 'npm') {
    try {
      const response = await axios.post(`${OSV_API}/query`, {
        package: { name: packageName, ecosystem },
        version
      }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });
      return { package: packageName, version, vulnerabilities: response.data.vulns || [], source: 'OSV' };
    } catch (error) {
      if (process.env.DEBUG) console.error(chalk.red(`❌ OSV error for ${packageName}:`), error.message);
      return { package: packageName, version, vulnerabilities: [], error: error.message };
    }
  }

  async batchQuery(packages, ecosystem = 'npm') {
    try {
      const queries = packages.map(pkg => ({ package: { name: pkg.name, ecosystem }, version: pkg.version }));
      const response = await axios.post(`${OSV_API}/querybatch`, { queries }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data.results.map((result, index) => ({
        package: packages[index].name,
        version: packages[index].version,
        vulnerabilities: result.vulns || [],
        source: 'OSV'
      }));
    } catch (error) {
      if (process.env.DEBUG) console.error(chalk.red('❌ OSV batch query failed:'), error.message);
      return packages.map(pkg => ({ package: pkg.name, version: pkg.version, vulnerabilities: [], error: error.message }));
    }
  }

  parseVulnerability(vuln) {
    let summary = 'No summary available';
    if (vuln.summary?.trim()) summary = vuln.summary.substring(0, 150);
    else if (vuln.details?.trim()) summary = vuln.details.split('\n')[0].substring(0, 150);

    return {
      id: vuln.id || 'UNKNOWN',
      severity: this.extractSeverity(vuln),
      cvssScore: this.extractCVSSScore(vuln),
      summary,
      details: vuln.details || '',
      references: vuln.references || [],
      aliases: vuln.aliases || [],
      affected: vuln.affected || []
    };
  }

  extractSeverity(vuln) {
    if (vuln.database_specific?.severity) {
      const s = vuln.database_specific.severity.toUpperCase();
      if (s === 'MODERATE') return 'MEDIUM';
      if (['CRITICAL', 'HIGH', 'LOW'].includes(s)) return s;
      return s;
    }
    if (vuln.severity && Array.isArray(vuln.severity)) {
      const cvss = vuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V4');
      if (cvss?.score) {
        const vectorMatch = cvss.score.match(/CVSS:[^/]+\/(.+)/);
        if (vectorMatch) {
          const vector = vectorMatch[1];
          if (vector.includes('C:H') || vector.includes('I:H') || vector.includes('A:H')) return 'HIGH';
          if (vector.includes('C:L') || vector.includes('I:L') || vector.includes('A:L')) return 'MEDIUM';
          return 'LOW';
        }
        const numericScore = parseFloat(cvss.score);
        if (!isNaN(numericScore)) {
          if (numericScore >= 9.0) return 'CRITICAL';
          if (numericScore >= 7.0) return 'HIGH';
          if (numericScore >= 4.0) return 'MEDIUM';
          return 'LOW';
        }
      }
    }
    if (vuln.affected?.[0]?.database_specific?.severity) {
      const s = vuln.affected[0].database_specific.severity.toUpperCase();
      return s === 'MODERATE' ? 'MEDIUM' : s;
    }
    return 'MEDIUM';
  }

  extractCVSSScore(vuln) {
    if (vuln.severity && Array.isArray(vuln.severity)) {
      const cvss = vuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V4');
      if (cvss?.score) {
        const numericScore = parseFloat(cvss.score);
        if (!isNaN(numericScore)) return numericScore;
        const scoreMatch = cvss.score.match(/(\d+\.\d+)(?:\/|$)/);
        if (scoreMatch) return parseFloat(scoreMatch[1]);
      }
    }
    return null;
  }
}

module.exports = new OSVClient();