// src/features/cve/nvd.client.js

const axios = require('axios');
const chalk = require('chalk');
const { db } = require('./database');
const { decrypt } = require('../../shared/utils/encryption');
const CircuitBreaker = require('../../shared/utils/circuit-breaker');
const { RETRY } = require('../../shared/utils/constants');

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CIRCUIT_MAX_FAILURES = 5;
// NVD's public rate limits are stricter than the npm registry's, so this
// stays a longer, NVD-specific cool-down rather than the shared class's
// 60s default — passed in explicitly rather than silently inherited.
const CIRCUIT_RESET_MS = 300000;

class NVDClient {
  constructor() {
    this._cachedKey = null;
    this._keyFetchTime = 0;
    this._keyTTL = 60000;
    // Was a hand-rolled { consecutiveFailures, circuitOpen, lastFailureTime }
    // state machine with no half-open recovery step — once tripped, it only
    // ever cleared on the *next* isCircuitOpen() call after the reset window,
    // and had no test coverage. The shared CircuitBreaker gets both a
    // documented HALF_OPEN transition and dedicated tests for free.
    this.circuitBreaker = new CircuitBreaker(CIRCUIT_MAX_FAILURES, CIRCUIT_RESET_MS);
  }

  getAPIKey() {
    try {
      const now = Date.now();
      if (this._cachedKey && (now - this._keyFetchTime) < this._keyTTL) return this._cachedKey;
      const result = db.prepare('SELECT api_key FROM api_keys WHERE service = \'nvd\' AND is_active = 1').get();
      if (result?.api_key) {
        this._cachedKey = decrypt(result.api_key);
        this._keyFetchTime = now;
        return this._cachedKey;
      }
      return null;
    } catch (error) {
      if (process.env.DEBUG) console.error('Error getting NVD API key:', error.message);
      return null;
    }
  }

  clearKeyCache() { this._cachedKey = null; this._keyFetchTime = 0; }

  // retries defaults to (shared MAX_ATTEMPTS - 1) since `retries` here means
  // "additional attempts after the first", not total attempts.
  async queryCVE(cveId, retries = RETRY.MAX_ATTEMPTS - 1) {
    if (this.circuitBreaker.isOpen()) return null;
    const apiKey = this.getAPIKey();
    if (!apiKey) return null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(NVD_API, { params: { cveId }, headers: { apiKey }, timeout: 15000 });
        this.circuitBreaker.recordSuccess();
        if (response.data.vulnerabilities?.length > 0) {
          return this.parseCVE(response.data.vulnerabilities[0]);
        }
        return null;
      } catch (error) {
        const status = error.response?.status;
        if (status === 403) { this.clearKeyCache(); this.circuitBreaker.recordFailure(); return null; }

        // Back off for rate limiting, server errors, and network failures (no response) —
        // not just 429 — otherwise transient 5xx/timeouts get hammered with no delay.
        // Same exponential-backoff policy (RETRY.INITIAL_DELAY_MS * BACKOFF_MULTIPLIER^attempt)
        // as registry-client.js, read from the one shared constant instead of a
        // locally hand-tuned formula, so a policy change only has to happen once.
        const isRetryable = status === 429 || !status || status >= 500;
        if (isRetryable && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RETRY.INITIAL_DELAY_MS * Math.pow(RETRY.BACKOFF_MULTIPLIER, attempt)));
          continue;
        }
        this.circuitBreaker.recordFailure();
        return null;
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
      if (process.env.DEBUG) console.error('NVD parse error:', error.message);
      return null;
    }
  }

  async enrichWithNVD(osvVulnerabilities) {
    if (!Array.isArray(osvVulnerabilities) || osvVulnerabilities.length === 0) return [];
    if (this.circuitBreaker.isOpen()) return osvVulnerabilities;

    return Promise.all(osvVulnerabilities.map(async (vuln) => {
      try {
        if (vuln.id?.startsWith('CVE-')) {
          const nvdData = await this.queryCVE(vuln.id);
          if (nvdData) {
            return {
              ...vuln,
              cvssScore: nvdData.cvssScore || vuln.cvssScore,
              severity: nvdData.severity || vuln.severity,
              nvdDescription: nvdData.description,
              enrichedBy: 'NVD'
            };
          }
        }
        return vuln;
      } catch (error) {
        return vuln;
      }
    }));
  }
}

module.exports = new NVDClient();