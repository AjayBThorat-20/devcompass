// src/services/dynamic-security.js

const { execSync } = require('child_process');
const path = require('path');

// Popular packages for typosquatting comparison
const POPULAR_PACKAGES = [
  'express', 'react', 'react-dom', 'lodash', 'axios', 'moment', 'webpack',
  'typescript', 'jquery', 'vue', 'angular', 'next', 'gatsby', 'nuxt',
  'babel', 'eslint', 'prettier', 'jest', 'mocha', 'chai', 'karma',
  'underscore', 'request', 'async', 'bluebird', 'chalk', 'commander',
  'inquirer', 'ora', 'yargs', 'minimist', 'glob', 'mkdirp', 'rimraf',
  'fs-extra', 'uuid', 'semver', 'debug', 'dotenv', 'cors', 'helmet',
  'mongoose', 'sequelize', 'knex', 'prisma', 'graphql', 'apollo',
  'socket.io', 'redis', 'mysql', 'pg', 'sqlite3', 'mongodb',
  'aws-sdk', 'firebase', 'stripe', 'paypal', 'twilio',
  'nodemailer', 'pug', 'ejs', 'handlebars', 'mustache',
  'body-parser', 'cookie-parser', 'multer', 'passport', 'bcrypt',
  'jsonwebtoken', 'validator', 'yup', 'joi', 'zod'
];

// Whitelist - legitimate packages that might look suspicious
const WHITELIST = new Set([
  'colors', 'chalk', 'ora', 'inquirer', 'prompts',
  'cross-env', 'cross-spawn', 'execa', 'shelljs',
  'node-fetch', 'axios', 'got', 'request', 'superagent',
  'nodemailer', 'sendgrid', 'mailgun',
  'bcrypt', 'bcryptjs', 'argon2', 'crypto-js',
  'jsonwebtoken', 'jose', 'passport',
  'puppeteer', 'playwright', 'selenium-webdriver',
  'sharp', 'jimp', 'canvas', 'pdf-lib',
  'esbuild', 'rollup', 'vite', 'parcel',
  'husky', 'lint-staged', 'commitlint'
]);

// Suspicious patterns in install scripts
const SUSPICIOUS_PATTERNS = [
  /curl\s+[^\|]+\|\s*sh/i,           // curl | sh
  /wget\s+[^\|]+\|\s*sh/i,           // wget | sh
  /eval\s*\(\s*["']?http/i,          // eval with http
  /base64\s*-d/i,                     // base64 decode
  /\\x[0-9a-f]{2}/i,                 // hex escapes
  /child_process.*exec/i,             // exec with http
  /require\s*\(\s*['"]https?:/i,     // require http
  /\.env|process\.env\.(AWS|STRIPE|API_KEY|SECRET|PASSWORD|TOKEN)/i,  // credential access
  /exfiltrate|steal|harvest/i,        // obvious malicious
  /bitcoin|btc|wallet|miner/i,        // crypto mining
  /keylog|screenshot|record/i         // spyware
];


function levenshteinDistance(a, b) {
  if (!a || !b) return Infinity;
  
  const matrix = Array(b.length + 1).fill(null).map(() => 
    Array(a.length + 1).fill(null)
  );
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // insertion
        matrix[j - 1][i] + 1,      // deletion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}


function checkTyposquatting(packageName, threshold = 2) {
  if (!packageName || WHITELIST.has(packageName)) return null;
  
  const name = packageName.toLowerCase().replace(/^@[^/]+\//, ''); // Remove scope
  
  for (const popular of POPULAR_PACKAGES) {
    const distance = levenshteinDistance(name, popular);
    
    // Exact match is fine
    if (distance === 0) return null;
    
    // Within threshold and not too short
    if (distance <= threshold && name.length >= 3 && popular.length >= 3) {
      // Additional heuristics
      const isSuspicious = (
        name.includes(popular) ||                    // lodash-extra
        popular.includes(name) ||                    // lod (subset)
        name.replace(/[-_]/g, '') === popular.replace(/[-_]/g, '') || // lodash_js vs lodashjs
        name.startsWith(popular.slice(0, 3)) ||      // Same prefix
        name.endsWith(popular.slice(-3))             // Same suffix
      );
      
      if (isSuspicious || distance === 1) {
        return {
          package: packageName,
          similarTo: popular,
          distance,
          warning: `Package name "${packageName}" is similar to popular package "${popular}"`
        };
      }
    }
  }
  
  return null;
}


function checkInstallScripts(packageData) {
  if (!packageData) return null;
  
  const scripts = packageData.scripts || {};
  const installScripts = ['preinstall', 'install', 'postinstall'];
  const suspicious = [];
  
  for (const scriptName of installScripts) {
    const script = scripts[scriptName];
    if (!script) continue;
    
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(script)) {
        suspicious.push({
          script: scriptName,
          command: script.slice(0, 100) + (script.length > 100 ? '...' : ''),
          pattern: pattern.source
        });
        break; // One match per script is enough
      }
    }
  }
  
  return suspicious.length > 0 ? {
    package: packageData.name,
    suspicious,
    warning: `Package has suspicious install scripts`
  } : null;
}

function runNpmAudit(projectPath) {
  try {
    // Run npm audit in JSON mode
    const result = execSync('npm audit --json 2>/dev/null', {
      cwd: projectPath,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    const audit = JSON.parse(result);
    return parseAuditResult(audit);
  } catch (error) {
    // npm audit exits with non-zero if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        return parseAuditResult(audit);
      } catch (e) {
        // Silent fail
      }
    }
    return {
      vulnerabilities: [],
      summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 }
    };
  }
}


function parseAuditResult(audit) {
  const vulnerabilities = [];
  const summary = {
    total: 0,
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0
  };
  
  // Handle npm v7+ format
  if (audit.vulnerabilities) {
    for (const [name, data] of Object.entries(audit.vulnerabilities)) {
      if (!data.via || !Array.isArray(data.via)) continue;
      
      for (const via of data.via) {
        if (typeof via === 'object' && via.title) {
          vulnerabilities.push({
            package: name,
            severity: via.severity || 'unknown',
            title: via.title,
            url: via.url,
            range: via.range || data.range
          });
          
          const sev = (via.severity || 'low').toLowerCase();
          if (summary[sev] !== undefined) summary[sev]++;
          summary.total++;
        }
      }
    }
  }
  
  // Handle npm v6 format
  if (audit.advisories) {
    for (const [id, advisory] of Object.entries(audit.advisories)) {
      vulnerabilities.push({
        package: advisory.module_name,
        severity: advisory.severity,
        title: advisory.title,
        url: advisory.url,
        range: advisory.vulnerable_versions
      });
      
      const sev = (advisory.severity || 'low').toLowerCase();
      if (summary[sev] !== undefined) summary[sev]++;
      summary.total++;
    }
  }
  
  return { vulnerabilities, summary };
}


async function analyzeProject(projectPath, dependencies = []) {
  const result = {
    typosquatting: [],
    vulnerabilities: [],
    suspiciousScripts: [],
    summary: {
      typosquattingCount: 0,
      vulnerabilityCount: 0,
      suspiciousScriptCount: 0,
      criticalCount: 0,
      highCount: 0
    }
  };
  
  // Check for typosquatting
  for (const dep of dependencies) {
    if (!dep || WHITELIST.has(dep)) continue;
    
    const typosquat = checkTyposquatting(dep);
    if (typosquat) {
      result.typosquatting.push(typosquat);
      result.summary.typosquattingCount++;
    }
  }
  
  // Run npm audit
  if (projectPath) {
    const audit = runNpmAudit(projectPath);
    result.vulnerabilities = audit.vulnerabilities;
    result.summary.vulnerabilityCount = audit.summary.total;
    result.summary.criticalCount = audit.summary.critical;
    result.summary.highCount = audit.summary.high;
  }
  
  return result;
}

function addToWhitelist(packageName) {
  WHITELIST.add(packageName);
}

function removeFromWhitelist(packageName) {
  WHITELIST.delete(packageName);
}


function isWhitelisted(packageName) {
  return WHITELIST.has(packageName);
}

module.exports = {
  checkTyposquatting,
  checkInstallScripts,
  runNpmAudit,
  analyzeProject,
  addToWhitelist,
  removeFromWhitelist,
  isWhitelisted,
  POPULAR_PACKAGES,
  WHITELIST
};