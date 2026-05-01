// src/cve/nvd-client.js
const axios = require('axios');
const chalk = require('chalk');
const { db } = require('./database');

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

class NVDClient {
  /**
   * Get NVD API key from database
   */
  getAPIKey() {
    try {
      const stmt = db.prepare(`
        SELECT api_key FROM api_keys 
        WHERE service = 'nvd' AND is_active = 1
      `);
      const result = stmt.get();
      
      if (result?.api_key) {
        // Decrypt API key
        const encryption = require('../utils/encryption');
        return encryption.decrypt(result.api_key);
      }
      
      return null;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Error getting NVD API key:', error.message);
      }
      return null;
    }
  }

  /**
   * Query CVE by ID with retry logic
   */
  async queryCVE(cveId, retries = 2) {
    const apiKey = this.getAPIKey();
    
    if (!apiKey) {
      return null; // Silently skip if no key configured
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(NVD_API, {
          params: { cveId },
          headers: {
            'apiKey': apiKey
          },
          timeout: 15000
        });

        if (response.data.vulnerabilities && response.data.vulnerabilities.length > 0) {
          return this.parseCVE(response.data.vulnerabilities[0]);
        }

        return null;
      } catch (error) {
        // Rate limit - retry with exponential backoff
        if (error.response?.status === 429 && attempt < retries) {
          const delay = 2000 * (attempt + 1);
          if (process.env.DEBUG) {
            console.log(chalk.yellow(`⏳ NVD rate limit, retrying in ${delay}ms...`));
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Invalid API key - don't retry
        if (error.response?.status === 403) {
          if (process.env.DEBUG) {
            console.error(chalk.red('❌ NVD API key invalid or expired'));
          }
          return null;
        }
        
        // Other errors - don't retry
        if (process.env.DEBUG) {
          console.error(chalk.gray(`NVD error for ${cveId}: ${error.message}`));
        }
        return null;
      }
    }
    
    return null;
  }

  /**
   * Parse NVD CVE data
   */
  parseCVE(vulnerability) {
    try {
      const cve = vulnerability.cve;
      
      // Extract CVSS v3.1 or v3.0 score
      const cvssMetrics = cve.metrics?.cvssMetricV31 || cve.metrics?.cvssMetricV30 || [];
      const primaryMetric = cvssMetrics[0];
      
      return {
        id: cve.id,
        description: cve.descriptions?.[0]?.value || 'No description',
        cvssScore: primaryMetric?.cvssData?.baseScore || null,
        cvssVector: primaryMetric?.cvssData?.vectorString || null,
        severity: primaryMetric?.cvssData?.baseSeverity || null,
        publishedDate: cve.published || null,
        lastModifiedDate: cve.lastModified || null,
        references: cve.references || [],
        weaknesses: cve.weaknesses || []
      };
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('NVD parse error:', error.message);
      }
      return null;
    }
  }

  /**
   * Enrich OSV data with NVD CVSS scores
   */
  async enrichWithNVD(osvVulnerabilities) {
    const enriched = [];

    for (const vuln of osvVulnerabilities) {
      let enrichedVuln = { ...vuln };

      // Check if it's a CVE ID
      if (vuln.id && vuln.id.startsWith('CVE-')) {
        const nvdData = await this.queryCVE(vuln.id);
        
        if (nvdData) {
          enrichedVuln = {
            ...vuln,
            // Only override if NVD has better data
            cvssScore: nvdData.cvssScore || vuln.cvssScore,
            cvssVector: nvdData.cvssVector || vuln.cvssVector,
            // Keep OSV severity if NVD doesn't have it
            severity: nvdData.severity || vuln.severity,
            nvdDescription: nvdData.description,
            enrichedBy: 'NVD'
          };
        }
      }

      enriched.push(enrichedVuln);
    }

    return enriched;
  }
}

module.exports = new NVDClient();