// src/features/security/supply-chain.analyzer.js

const path = require('path');
const fs = require('fs');
const dynamicSecurity = require('../quality/dynamic-security.service');

const TRUSTED_PACKAGES = new Set([
  'react', 'react-dom', 'next', 'vue', 'nuxt', 'express', 'pg', 'mongoose',
  'axios', 'lodash', 'chalk', 'dotenv', 'typescript', 'webpack', 'vite',
  'jest', 'eslint', 'nodemon', 'rxjs', 'redux', 'socket.io'
]);

async function analyzeSupplyChain(projectPath, dependencies = {}) {
  const packages = Object.keys(dependencies || {});
  const emptyResult = { warnings: [], total: 0, summary: { typosquatting: 0, suspiciousScripts: 0, vulnerabilities: 0 } };

  if (packages.length === 0) return emptyResult;

  try {
    const warnings = [];

    for (const pkg of packages) {
      if (TRUSTED_PACKAGES.has(pkg)) continue;
      const typosquat = dynamicSecurity.checkTyposquatting(pkg);
      if (typosquat && typosquat.similarTo && typosquat.distance <= 1) {
        warnings.push({
          package: pkg,
          type: 'typosquatting',
          severity: 'high',
          description: typosquat.warning,
          correctPackage: typosquat.similarTo,
          distance: typosquat.distance,
          reason: `Package name is ${typosquat.distance} character(s) different from "${typosquat.similarTo}"`,
          risk: 'Possible typosquatting attack',
          action: 'review',
          autoFixable: false
        });
      }
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const suspiciousScripts = dynamicSecurity.checkInstallScripts(packageJsonPath);
      suspiciousScripts.forEach(script => {
        warnings.push({
          package: script.script,
          type: 'install_script',
          severity: script.severity || 'medium',
          description: `Suspicious pattern detected in "${script.script}" script`,
          reason: `Script content matched pattern: ${script.pattern}`,
          risk: 'Potentially malicious install script',
          action: 'review',
          autoFixable: false
        });
      });
    }

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
          description: Array.isArray(vuln.via) ? vuln.via.filter(v => typeof v === 'string').join(', ') || 'Security vulnerability detected' : 'Security vulnerability detected',
          reason: 'npm audit flagged this package',
          risk: `${severity.toUpperCase()} security vulnerability`,
          action: 'update',
          autoFixable: !!vuln.fixAvailable
        });
      }
    }

    return {
      warnings,
      total: warnings.length,
      summary: {
        typosquatting: warnings.filter(w => w.type === 'typosquatting').length,
        suspiciousScripts: warnings.filter(w => w.type === 'install_script').length,
        vulnerabilities: auditResult.summary?.total || 0,
        critical: auditResult.summary?.critical || 0,
        high: auditResult.summary?.high || 0
      },
      audit: auditResult
    };
  } catch (error) {
    if (process.env.DEBUG) console.error('[supply-chain] Analysis failed:', error.message);
    return emptyResult;
  }
}

module.exports = { analyzeSupplyChain };