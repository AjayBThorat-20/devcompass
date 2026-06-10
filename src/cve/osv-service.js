// src/cve/osv-service.js
const https = require('https');

const OSV_API_URL = 'https://api.osv.dev/v1';
const REQUEST_TIMEOUT = 10000;

class OSVService {
  async checkPackage(packageName, version) {
    try {
      const query = {
        package: {
          name: packageName,
          ecosystem: 'npm'
        },
        version: version
      };

      const result = await this.queryOSV('/query', query);

      if (!result || !result.vulns || result.vulns.length === 0) {
        return [];
      }

      return result.vulns.map(vuln => ({
        id: vuln.id,
        summary: vuln.summary || 'No summary available',
        severity: this.extractSeverity(vuln),
        affected: vuln.affected,
        references: vuln.references || [],
        published: vuln.published,
        modified: vuln.modified
      }));
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(`OSV check failed for ${packageName}:`, error.message);
      }
      return [];
    }
  }
  async checkBatch(packages) {
    try {
      const queries = packages.map(pkg => ({
        package: {
          name: pkg.name,
          ecosystem: 'npm'
        },
        version: pkg.version
      }));

      const result = await this.queryOSV('/querybatch', { queries });

      if (!result || !result.results) {
        return [];
      }

      return result.results.map((queryResult, index) => ({
        package: packages[index].name,
        version: packages[index].version,
        vulnerabilities: (queryResult.vulns || []).map(vuln => ({
          id: vuln.id,
          summary: vuln.summary || 'No summary available',
          severity: this.extractSeverity(vuln),
          affected: vuln.affected,
          references: vuln.references || [],
          published: vuln.published,
          modified: vuln.modified
        }))
      }));
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('OSV batch check failed:', error.message);
      }
      return [];
    }
  }

  queryOSV(endpoint, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'api.osv.dev',
        port: 443,
        path: `/v1${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: REQUEST_TIMEOUT
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse OSV response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`OSV request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OSV request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  extractSeverity(vuln) {
    // Check for CVSS severity
    if (vuln.severity) {
      if (Array.isArray(vuln.severity)) {
        const cvssEntry = vuln.severity.find(s => s.type === 'CVSS_V3');
        if (cvssEntry && cvssEntry.score) {
          return this.cvssToSeverity(cvssEntry.score);
        }
      } else if (typeof vuln.severity === 'object' && vuln.severity.score) {
        return this.cvssToSeverity(vuln.severity.score);
      }
    }

    // Check database_specific for severity
    if (vuln.database_specific && vuln.database_specific.severity) {
      const sev = vuln.database_specific.severity.toUpperCase();
      if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev)) {
        return sev;
      }
    }

    // Default to MEDIUM if no severity found
    return 'MEDIUM';
  }

  cvssToSeverity(score) {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  }


  async testConnection() {
    try {
      // Test with a known package
      const result = await this.checkPackage('express', '4.0.0');
      return { success: true, message: 'OSV API connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new OSVService();
