// src/features/cve/osv.client.js

const axios = require('axios');
const chalk = require('chalk');
const pLimit = require('p-limit');

const OSV_API = 'https://api.osv.dev/v1';
const hydrateLimit = pLimit(10);
const MAX_HYDRATE_IDS = 300;

class OSVClient {
  async queryPackage(packageName, version, ecosystem = 'npm') {
    try {
      const response = await axios.post(`${OSV_API}/query`, {
        package: { name: packageName, ecosystem },
        version
      }, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });

      const vulns = (response.data.vulns || []).map(v => this.parseVulnerability(v));
      return { package: packageName, version, vulnerabilities: vulns, source: 'OSV' };
    } catch (error) {
      if (process.env.DEBUG) console.error(chalk.red(`❌ OSV error for ${packageName}:`), error.message);
      return { package: packageName, version, vulnerabilities: [], error: error.message };
    }
  }

  // OSV's /querybatch intentionally returns only {id, modified} per finding —
  // no severity, CVSS, summary, or affected/fixed-version data — to keep
  // batch responses small. Every vulnerability found through the main
  // `analyze` scan (which exclusively uses this batch path) used to be parsed
  // straight from that minimal stub, so severity/CVSS/summary/fix-version
  // were never real: extractSeverity's default ('MEDIUM'), extractCVSSScore's
  // default (null -> 0), and "No summary available" for literally every
  // finding. Each unique id now gets hydrated via GET /v1/vulns/{id} (OSV's
  // documented pattern for batch responses) before parsing.
  async batchQuery(packages, ecosystem = 'npm') {
    try {
      const queries = packages.map(pkg => ({ package: { name: pkg.name, ecosystem }, version: pkg.version }));
      const response = await axios.post(`${OSV_API}/querybatch`, { queries }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      const allIds = new Set();
      (response.data.results || []).forEach(r => (r.vulns || []).forEach(v => v.id && allIds.add(v.id)));
      // Bounded so a project with an unusually large number of distinct
      // advisories (very stale lockfile, huge dependency tree) can't turn one
      // `analyze` run into hundreds of individual HTTP calls. This result is
      // cached for 24h per package either way, so the cap is paid at most
      // once a day — ids past the cap just keep the minimal (unenriched) stub
      // data rather than failing the scan.
      const detailsById = await this.hydrateVulnDetails(Array.from(allIds).slice(0, MAX_HYDRATE_IDS));

      return response.data.results.map((result, index) => ({
        package: packages[index].name,
        version: packages[index].version,
        vulnerabilities: (result.vulns || []).map(v => this.parseVulnerability(detailsById.get(v.id) || v)),
        source: 'OSV'
      }));
    } catch (error) {
      if (process.env.DEBUG) console.error(chalk.red('❌ OSV batch query failed:'), error.message);
      return packages.map(pkg => ({ package: pkg.name, version: pkg.version, vulnerabilities: [], error: error.message }));
    }
  }

  async hydrateVulnDetails(ids) {
    const details = new Map();
    await Promise.all(ids.map(id => hydrateLimit(async () => {
      try {
        const response = await axios.get(`${OSV_API}/vulns/${encodeURIComponent(id)}`, { timeout: 10000 });
        details.set(id, response.data);
      } catch (error) {
        if (process.env.DEBUG) console.error(chalk.red(`❌ OSV detail fetch failed for ${id}:`), error.message);
      }
    })));
    return details;
  }

  parseVulnerability(vuln) {
    let summary = 'No summary available';
    if (vuln.summary && vuln.summary.trim()) summary = vuln.summary.substring(0, 150);
    else if (vuln.details && vuln.details.trim()) summary = vuln.details.split('\n')[0].substring(0, 150);

    return {
      id: vuln.id || 'UNKNOWN',
      severity: this.extractSeverity(vuln),
      cvssScore: this.extractCVSSScore(vuln),
      summary,
      details: vuln.details || '',
      references: vuln.references || [],
      aliases: vuln.aliases || [],
      affected: vuln.affected || [],
      fixedVersions: this.extractFixedVersions(vuln)
    };
  }

  extractFixedVersions(vuln) {
    const fixed = new Set();
    for (const affected of vuln.affected || []) {
      for (const range of affected.ranges || []) {
        for (const event of range.events || []) {
          if (event.fixed) fixed.add(event.fixed);
        }
      }
    }
    return Array.from(fixed);
  }

  extractSeverity(vuln) {
    if (vuln.database_specific && vuln.database_specific.severity) {
      const s = vuln.database_specific.severity.toUpperCase();
      if (s === 'MODERATE') return 'MEDIUM';
      if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(s)) return s;
      return s;
    }

    const cvssScore = this.computeCVSSFromVuln(vuln);
    if (cvssScore !== null) return this.severityFromScore(cvssScore);

    if (vuln.affected && vuln.affected[0] && vuln.affected[0].database_specific && vuln.affected[0].database_specific.severity) {
      const s = vuln.affected[0].database_specific.severity.toUpperCase();
      return s === 'MODERATE' ? 'MEDIUM' : s;
    }
    return 'MEDIUM';
  }

  extractCVSSScore(vuln) {
    return this.computeCVSSFromVuln(vuln);
  }

  severityFromScore(score) {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  }

  // OSV reports CVSS_V3 severity as either a bare numeric base score, or a full
  // vector string (e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H") with no
  // score in it at all. Naively regex-matching a number out of the vector string
  // used to grab the CVSS *spec version* ("3.1") instead of the actual score, so
  // vector strings are now computed via the real CVSS v3.1 base-score formula.
  // CVSS_V4 vectors use a different (macro-vector table) formula we don't
  // implement, so those are left unscored rather than misreported.
  computeCVSSFromVuln(vuln) {
    if (!vuln.severity || !Array.isArray(vuln.severity)) return null;
    const cvss = vuln.severity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V4');
    if (!cvss || !cvss.score) return null;

    const scoreStr = String(cvss.score);
    if (scoreStr.startsWith('CVSS:3')) {
      const metrics = this.parseCVSSv3Vector(scoreStr);
      return metrics ? this.computeCVSSv3Score(metrics) : null;
    }
    if (scoreStr.startsWith('CVSS:')) return null; // CVSS v4+ vector, not scorable here

    const numericScore = parseFloat(scoreStr);
    return isNaN(numericScore) ? null : numericScore;
  }

  parseCVSSv3Vector(vectorString) {
    const parts = vectorString.split('/');
    const metrics = {};
    for (let i = 1; i < parts.length; i++) {
      const [key, value] = parts[i].split(':');
      if (key && value) metrics[key] = value;
    }
    const required = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
    if (required.some(k => !metrics[k])) return null;
    return metrics;
  }

  // Reference implementation: https://www.first.org/cvss/v3.1/specification-document#7-3-CVSS-v3-1-Equations
  computeCVSSv3Score(metrics) {
    const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }[metrics.AV];
    const AC = { L: 0.77, H: 0.44 }[metrics.AC];
    const UI = { N: 0.85, R: 0.62 }[metrics.UI];
    const scope = metrics.S;
    const PR = (scope === 'C'
      ? { N: 0.85, L: 0.68, H: 0.5 }
      : { N: 0.85, L: 0.62, H: 0.27 })[metrics.PR];
    const C = { H: 0.56, L: 0.22, N: 0 }[metrics.C];
    const I = { H: 0.56, L: 0.22, N: 0 }[metrics.I];
    const A = { H: 0.56, L: 0.22, N: 0 }[metrics.A];

    if ([AV, AC, UI, PR, C, I, A].some(v => v === undefined) || (scope !== 'U' && scope !== 'C')) return null;

    const iss = 1 - ((1 - C) * (1 - I) * (1 - A));
    const impact = scope === 'U'
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
    if (impact <= 0) return 0;

    const exploitability = 8.22 * AV * AC * PR * UI;
    const raw = scope === 'U' ? (impact + exploitability) : 1.08 * (impact + exploitability);
    return this.roundUp1(Math.min(raw, 10));
  }

  roundUp1(value) {
    const intVal = Math.round(value * 100000);
    return intVal % 10000 === 0 ? intVal / 100000 : (Math.floor(intVal / 10000) + 1) / 10;
  }
}

module.exports = new OSVClient();