// src/analyzers/supply-chain.js
const fs = require('fs');
const path = require('path');

// Known malicious packages database
const MALICIOUS_PACKAGES = [
  'epress', 'expres', 'expresss', 'requst', 'requist', 'lodas', 'loadash',
  'axois', 'axioss', 'webpak', 'webback', 'reacts', 'mongose', 'mongosse'
];

// Popular packages to check for typosquatting
const POPULAR_PACKAGES = [
  'express', 'request', 'lodash', 'axios', 'webpack', 'react', 'vue', 'angular',
  'next', 'typescript', 'eslint', 'prettier', 'jest', 'mocha', 'chai'
];

// Legitimate packages that should NOT be flagged (expanded whitelist)
const WHITELIST = [
  'chalk', 'ora', 'yargs', 'commander', 'semver', 'dotenv', 'debug', 'uuid',
  'mime', 'qs', 'joi', 'bcrypt', 'passport', 'multer', 'cors', 'helmet',
  'morgan', 'winston', 'pino', 'bunyan', 'nodemon', 'pm2', 'async', 'bluebird',
  'ramda', 'underscore', 'moment', 'dayjs', 'date-fns', 'luxon', 'validator',
  'sanitize-html', 'dompurify', 'cheerio', 'jsdom', 'puppeteer', 'playwright'
];

// Suspicious install script patterns
const SUSPICIOUS_PATTERNS = [
  'curl', 'wget', 'http://', 'https://', 'eval', 'exec', 'child_process',
  '/bin/sh', '/bin/bash', 'powershell', 'bitcoin', 'mining', 'keylogger', 'backdoor'
];

/**
 * Analyze supply chain security
 * @param {string} projectPath - Path to project
 * @param {Object} dependencies - Package dependencies
 * @returns {Promise<Object>} - Supply chain analysis results
 */
async function analyzeSupplyChain(projectPath, dependencies) {
  const warnings = [];

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { warnings: [], total: 0, summary: { malicious: 0, typosquatting: 0, suspiciousScripts: 0 } };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [pkgName, version] of Object.entries(allDeps)) {
      // Check for malicious packages
      if (MALICIOUS_PACKAGES.includes(pkgName)) {
        warnings.push({
          package: pkgName,
          type: 'malicious',
          severity: 'critical',
          description: 'Known malicious package detected',
          reason: 'This package is known to be malicious',
          action: 'Remove immediately',
          autoFixable: true,
          autoFixAction: 'remove',
          requiresConfirmation: false
        });
        continue;
      }

      // Check for typosquatting
      const typosquatCheck = checkTyposquatting(pkgName);
      if (typosquatCheck) {
        warnings.push({
          package: pkgName,
          type: 'typosquatting',
          severity: 'high',
          description: `Similar to: ${typosquatCheck.original} (official package)`,
          reason: `Potential malicious package - typo of ${typosquatCheck.original}`,
          action: `Remove ${pkgName} and install ${typosquatCheck.original}`,
          replacement: typosquatCheck.original,
          autoFixable: true,
          autoFixAction: 'replace',
          requiresConfirmation: false
        });
        continue;
      }

      // Check for suspicious install scripts
      const scriptCheck = await checkInstallScripts(projectPath, pkgName);
      if (scriptCheck) {
        warnings.push({
          package: pkgName,
          type: 'suspicious_script',
          severity: 'medium',
          description: `Install script contains suspicious patterns`,
          reason: `Suspicious install script detected`,
          action: 'Review the install script before deployment',
          script: scriptCheck.script,
          patterns: scriptCheck.patterns,
          autoFixable: true,
          autoFixAction: 'review',
          requiresConfirmation: true
        });
      }
    }

    // Calculate summary
    const summary = {
      malicious: warnings.filter(w => w.type === 'malicious').length,
      typosquatting: warnings.filter(w => w.type === 'typosquatting').length,
      suspiciousScripts: warnings.filter(w => w.type === 'suspicious_script').length
    };

    return {
      warnings,
      total: warnings.length,
      summary
    };

  } catch (error) {
    console.error('Supply chain analysis error:', error.message);
    return { warnings: [], total: 0, summary: { malicious: 0, typosquatting: 0, suspiciousScripts: 0 } };
  }
}

/**
 * Check for typosquatting using Levenshtein distance
 */
function checkTyposquatting(packageName) {
  // Skip if package is in whitelist
  if (WHITELIST.includes(packageName)) {
    return null;
  }

  for (const popular of POPULAR_PACKAGES) {
    // Skip if both are in whitelist
    if (WHITELIST.includes(popular)) {
      continue;
    }

    const distance = levenshteinDistance(packageName, popular);
    
    // Flag if 1-2 character difference
    if (distance > 0 && distance <= 2 && packageName !== popular) {
      return { original: popular, distance };
    }
  }

  return null;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Check package for suspicious install scripts
 */
async function checkInstallScripts(projectPath, packageName) {
  try {
    const pkgPath = path.join(projectPath, 'node_modules', packageName, 'package.json');
    
    if (!fs.existsSync(pkgPath)) {
      return null;
    }

    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const scripts = pkgJson.scripts || {};

    const suspiciousScripts = ['preinstall', 'install', 'postinstall'];
    
    for (const scriptName of suspiciousScripts) {
      if (scripts[scriptName]) {
        const scriptContent = scripts[scriptName];
        const foundPatterns = SUSPICIOUS_PATTERNS.filter(pattern => 
          scriptContent.toLowerCase().includes(pattern.toLowerCase())
        );

        if (foundPatterns.length > 0) {
          return {
            script: scriptName,
            content: scriptContent,
            patterns: foundPatterns
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

module.exports = { analyzeSupplyChain };