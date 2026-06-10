// src/cve/nvd-client.js
const axios = require('axios');
const chalk = require('chalk');
const { db } = require('./database');
const { decrypt } = require('../utils/encryption');

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

class NVDClient {
  constructor() {
    this._cachedKey = null;
    this._keyFetchTime = 0;
    this._keyTTL = 60000;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 5;
    this.circuitOpen = false;
    this.lastFailureTime = 0;
    this.circuitResetTime = 300000;
  }

  getAPIKey() {
    try {
      const now = Date.now();
      if (this._cachedKey && (now - this._keyFetchTime) < this._keyTTL) {
        return this._cachedKey;
      }

      const stmt = db.prepare(`
        SELECT api_key FROM api_keys 
        WHERE service = 'nvd' AND is_active = 1
      `);
      const result = stmt.get();
      
      if (result?.api_key) {
        this._cachedKey = decrypt(result.api_key);
        this._keyFetchTime = now;
        return this._cachedKey;
      }
      
      return null;
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Error getting NVD API key:', error.message);
      }
      return null;
    }
  }

  clearKeyCache() {
    this._cachedKey = null;
    this._keyFetchTime = 0;
  }

  isCircuitOpen() {
    if (!this.circuitOpen) return false;
    
    if (Date.now() - this.lastFailureTime > this.circuitResetTime) {
      this.circuitOpen = false;
      this.consecutiveFailures = 0;
      if (process.env.DEBUG) {
        console.log(chalk.green('NVD Circuit breaker CLOSED: Resuming enrichment'));
      }
      return false;
    }
    
    return true;
  }

  recordFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.circuitOpen = true;
      if (process.env.DEBUG) {
        console.error(chalk.red(`NVD Circuit breaker OPEN: ${this.consecutiveFailures} consecutive failures`));
      }
    }
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
  }

  async queryCVE(cveId, retries = 2) {
    if (this.isCircuitOpen()) {
      return null;
    }

    const apiKey = this.getAPIKey();
    
    if (!apiKey) {
      return null;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(NVD_API, {
          params: { cveId },
          headers: { 'apiKey': apiKey },
          timeout: 15000
        });

        if (response.data.vulnerabilities && response.data.vulnerabilities.length > 0) {
          this.recordSuccess();
          return this.parseCVE(response.data.vulnerabilities[0]);
        }

        return null;
      } catch (error) {
        if (error.response?.status === 429 && attempt < retries) {
          const delay = 2000 * (attempt + 1);
          if (process.env.DEBUG) {
            console.log(chalk.yellow(`⏳ NVD rate limit, retrying in ${delay}ms...`));
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (error.response?.status === 403) {
          if (process.env.DEBUG) {
            console.error(chalk.red('❌ NVD API key invalid or expired'));
          }
          this.clearKeyCache();
          this.recordFailure();
          return null;
        }
        
        if (attempt === retries) {
          this.recordFailure();
        }
        
        if (process.env.DEBUG) {
          console.error(chalk.gray(`NVD error for ${cveId}: ${error.message}`));
        }
        
        if (attempt === retries) {
          return null;
        }
      }
    }
    
    return null;
  }

  parseCVE(vulnerability) {
    try {
      const cve = vulnerability.cve;
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

  async enrichWithNVD(osvVulnerabilities) {
    if (!Array.isArray(osvVulnerabilities) || osvVulnerabilities.length === 0) {
      return [];
    }

    if (this.isCircuitOpen()) {
      if (process.env.DEBUG) {
        console.log(chalk.yellow('NVD circuit open, returning OSV data only'));
      }
      return osvVulnerabilities;
    }

    const enriched = await Promise.all(
      osvVulnerabilities.map(async (vuln) => {
        try {
          let enrichedVuln = { ...vuln };

          if (vuln.id && vuln.id.startsWith('CVE-')) {
            const nvdData = await this.queryCVE(vuln.id);

            if (nvdData) {
              enrichedVuln = {
                ...vuln,
                cvssScore: nvdData.cvssScore || vuln.cvssScore,
                cvssVector: nvdData.cvssVector || vuln.cvssVector,
                severity: nvdData.severity || vuln.severity,
                nvdDescription: nvdData.description,
                enrichedBy: 'NVD'
              };
            }
          }

          return enrichedVuln;
        } catch (error) {
          if (process.env.DEBUG) {
            console.error(`NVD enrich failed for ${vuln.id}:`, error.message);
          }
          return vuln;
        }
      })
    );

    return enriched;
  }
}

module.exports = new NVDClient();