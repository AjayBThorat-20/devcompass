// src/analyzers/supply-chain.js
const { analyzer } = require('../services');

const TRUSTED_PACKAGES = new Set([
  'react',
  'react-dom',
  'next',
  'vue',
  'nuxt',
  'express',
  'pg',
  'mongoose',
  'axios',
  'lodash',
  'chalk',
  'dotenv',
  'typescript',
  'webpack',
  'vite',
  'jest',
  'eslint',
  'nodemon',
  'rxjs',
  'redux',
  'socket.io'
]);

async function analyzeSupplyChain(
  projectPath,
  dependencies = {}
) {

  const packages =
    Object.keys(dependencies);

  if (packages.length === 0) {

    return {
      warnings: [],
      total: 0,
      summary: {
        typosquatting: 0,
        suspiciousScripts: 0,
        vulnerabilities: 0
      }
    };
  }

  try {

    const warnings = [];

    for (const pkg of packages) {

      if (
        TRUSTED_PACKAGES.has(pkg)
      ) {
        continue;
      }

      const typosquat =
        analyzer.security
          .checkTyposquatting(pkg);

      if (
        typosquat &&
        typosquat.similarTo &&
        typosquat.similarTo !== 'undefined' &&
        typosquat.distance <= 1
      ) {

        warnings.push({
          package: pkg,
          type: 'typosquatting',
          severity: 'high',
          description:
            typosquat.warning,
          correctPackage:
            typosquat.similarTo,
          distance:
            typosquat.distance,
          reason:
            `Package name is ${typosquat.distance} character(s) different from "${typosquat.similarTo}"`,
          risk:
            'Possible typosquatting attack',
          action: 'review',
          autoFixable: false
        });
      }
    }

    let auditResults = {
      vulnerabilities: [],
      summary: { total: 0 }
    };

    try {

      auditResults =
        await analyzer.security
          .runNpmAudit(projectPath);

    } catch (error) {

      if (process.env.DEBUG) {

        console.error(
          '[supply-chain] npm audit failed:',
          error.message
        );
      }
    }

    const vulnArray =
      Array.isArray(
        auditResults.vulnerabilities
      )
        ? auditResults.vulnerabilities
        : [];

    for (const vuln of vulnArray) {

      const severity =
        (vuln.severity || 'moderate')
          .toLowerCase();

      if (
        severity === 'critical' ||
        severity === 'high'
      ) {

        warnings.push({
          package:
            vuln.package || 'unknown',

          type: 'vulnerability',

          severity,

          description:
            vuln.title ||
            vuln.via ||
            'Security vulnerability detected',

          reason:
            vuln.title ||
            vuln.via ||
            'Security vulnerability',

          risk:
            `${severity.toUpperCase()} security vulnerability`,

          action: 'update',

          url: vuln.url,

          range: vuln.range,

          autoFixable: true
        });
      }
    }

    const summary = {
      typosquatting:
        warnings.filter(
          w => w.type === 'typosquatting'
        ).length,

      suspiciousScripts:
        warnings.filter(
          w => w.type === 'install_script'
        ).length,

      vulnerabilities:
        auditResults.summary?.total || 0,

      critical:
        auditResults.summary?.critical || 0,

      high:
        auditResults.summary?.high || 0
    };

    return {
      warnings,
      total: warnings.length,
      summary,
      audit: auditResults
    };

  } catch (error) {

    if (process.env.DEBUG) {

      console.error(
        '[supply-chain] Analysis failed:',
        error.message
      );
    }

    return {
      warnings: [],
      total: 0,
      summary: {
        typosquatting: 0,
        suspiciousScripts: 0,
        vulnerabilities: 0
      }
    };
  }
}

module.exports = {
  analyzeSupplyChain
};