// src/features/quality/dynamic-security.service.js

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const securityData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/popular-packages.json'), 'utf8')
);

const POPULAR_PACKAGES = securityData.packages;
const WHITELIST = new Set(securityData.whitelist);

function checkTyposquatting(packageName) {
  if (WHITELIST.has(packageName)) return null;
  for (const official of POPULAR_PACKAGES) {
    const distance = levenshteinDistance(packageName, official);
    if (distance > 0 && distance === 1) {
      return { package: packageName, similarTo: official, distance, type: 'typosquat', severity: 'high', warning: `Possible typosquatting - similar to "${official}"` };
    }
  }
  return null;
}

function checkInstallScripts(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    const suspiciousPatterns = [/curl.*\|.*sh/i, /wget.*\|.*sh/i, /eval.*\(/i, /exec.*\(/i, /child_process/i, /http:\/\//i, /bitcoin/i, /mining/i, /keylogger/i];
    const suspiciousScripts = [];
    for (const [scriptName, scriptContent] of Object.entries(scripts)) {
      if (['postinstall', 'preinstall', 'install'].includes(scriptName)) {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(scriptContent)) { suspiciousScripts.push({ script: scriptName, content: scriptContent, pattern: pattern.toString(), severity: 'medium' }); break; }
        }
      }
    }
    return suspiciousScripts;
  } catch (error) { return []; }
}

async function runNpmAudit(projectPath) {
  try {
    const output = execSync('npm audit --json', { cwd: projectPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    return parseAuditData(JSON.parse(output));
  } catch (error) {
    if (error.stdout) {
      try { return parseAuditData(JSON.parse(error.stdout)); } catch (e) { return []; }
    }
    return [];
  }
}

function parseAuditData(auditData) {
  const vulnerabilities = [];
  try {
    if (auditData.vulnerabilities && typeof auditData.vulnerabilities === 'object') {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
        vulnerabilities.push({ package: name, severity: vuln.severity || 'unknown', via: Array.isArray(vuln.via) ? vuln.via : [vuln.via], fixAvailable: vuln.fixAvailable || false });
      }
    } else if (auditData.advisories && typeof auditData.advisories === 'object') {
      for (const advisory of Object.values(auditData.advisories)) {
        vulnerabilities.push({ package: advisory.module_name || 'unknown', severity: advisory.severity || 'unknown', via: [advisory.title || 'Unknown vulnerability'], fixAvailable: true });
      }
    }
  } catch (error) { /* ignore */ }
  return vulnerabilities;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] = str2[i - 1] === str1[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[str2.length][str1.length];
}

module.exports = { checkTyposquatting, checkInstallScripts, runNpmAudit, parseAuditData, POPULAR_PACKAGES, WHITELIST };