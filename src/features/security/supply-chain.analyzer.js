// src/features/security/supply-chain.analyzer.js

const dynamicSecurity = require('../quality/dynamic-security.service');

const TRUSTED_PACKAGES = new Set([
  'react', 'react-dom', 'next', 'vue', 'nuxt', 'express', 'pg', 'mongoose',
  'axios', 'lodash', 'chalk', 'dotenv', 'typescript', 'webpack', 'vite',
  'jest', 'eslint', 'nodemon', 'rxjs', 'redux', 'socket.io'
]);

// npm audit's `via` mixes advisory objects (with a real `.title`) and plain
// package-name strings (the dependency chain that pulled it in).
function describeVulnerability(via) {
  if (!Array.isArray(via)) return 'Security vulnerability detected';
  const titles = via.filter(v => v && typeof v === 'object' && v.title).map(v => v.title);
  if (titles.length > 0) return titles.join('; ');
  const names = via.filter(v => typeof v === 'string');
  return names.length > 0 ? names.join(', ') : 'Security vulnerability detected';
}

// npm audit's fixAvailable is true, false, or { name, version, isSemVerMajor }.
// Only a fix that stays within the current major version is non-breaking.
function isNonBreakingFix(fixAvailable) {
  if (fixAvailable === true) return true;
  return typeof fixAvailable === 'object' && fixAvailable !== null && fixAvailable.isSemVerMajor === false;
}

async function analyzeSupplyChain(projectPath, dependencies = {}) {
  const packages = Object.keys(dependencies || {});
  const emptyResult = { warnings: [], total: 0, summary: { typosquatting: 0, vulnerabilities: 0 } };

  if (packages.length === 0) return emptyResult;

  try {
    const warnings = [];

    // A one-character name match is only reported when npm's download
    // counts back it up (see checkTyposquattingRisk). Install scripts are
    // listed separately, as information, from the dependency graph — having
    // one isn't a vulnerability (esbuild, sharp and many others do).
    const candidates = packages.filter(pkg => !TRUSTED_PACKAGES.has(pkg));
    const typosquatResults = (await Promise.all(candidates.map(pkg => dynamicSecurity.checkTyposquattingRisk(pkg)))).filter(Boolean);
    const unverified = typosquatResults.filter(t => t.unverified).map(t => t.package);
    typosquatResults.filter(t => !t.unverified).forEach(typosquat => {
      warnings.push({
        package: typosquat.package,
        type: 'typosquatting',
        severity: 'high',
        description: typosquat.warning,
        correctPackage: typosquat.similarTo,
        distance: typosquat.distance,
        reason: `Package name is ${typosquat.distance} character(s) different from "${typosquat.similarTo}", which has ${typosquat.popularDownloads.toLocaleString('en-US')} downloads a month vs ${typosquat.downloads.toLocaleString('en-US')} for this package`,
        risk: 'Possible typosquatting attack',
        action: 'review',
        autoFixable: false
      });
    });

    let auditResult = { vulnerabilities: [], summary: { total: 0 } };
    try {
      auditResult = await dynamicSecurity.runNpmAudit(projectPath);
    } catch (error) {
      if (process.env.DEBUG) console.error('[supply-chain] npm audit failed:', error.message);
    }

    const vulnArray = Array.isArray(auditResult.vulnerabilities) ? auditResult.vulnerabilities : [];
    for (const vuln of vulnArray) {
      const severity = (vuln.severity || 'moderate').toLowerCase();
      if (severity === 'critical' || severity === 'high') {
        warnings.push({
          package: vuln.package || 'unknown',
          type: 'vulnerability',
          severity,
          // Using only the strings in `via` produced descriptions like
          // "body-parser, qs" instead of the actual vulnerability title.
          description: describeVulnerability(vuln.via),
          reason: 'npm audit flagged this package',
          risk: `${severity.toUpperCase()} security vulnerability`,
          action: 'update',
          // fixAvailable can be an object for a fix that needs a major
          // upgrade — truthy, but not a safe fix.
          autoFixable: isNonBreakingFix(vuln.fixAvailable)
        });
      }
    }

    return {
      warnings,
      total: warnings.length,
      summary: {
        typosquatting: warnings.filter(w => w.type === 'typosquatting').length,
        vulnerabilities: auditResult.summary?.total || 0,
        critical: auditResult.summary?.critical || 0,
        high: auditResult.summary?.high || 0
      },
      audit: auditResult,
      incomplete: !!auditResult.incomplete || unverified.length > 0,
      incompleteReason: [
        auditResult.incomplete ? 'npm audit could not be run for this project' : null,
        unverified.length > 0 ? `could not fetch download counts to check ${unverified.join(', ')} for typosquatting` : null
      ].filter(Boolean).join('; ') || undefined
    };
  } catch (error) {
    if (process.env.DEBUG) console.error('[supply-chain] Analysis failed:', error.message);
    return { ...emptyResult, incomplete: true, incompleteReason: error.message };
  }
}

module.exports = { analyzeSupplyChain, isNonBreakingFix, describeVulnerability };