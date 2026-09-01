// src/features/quality/dynamic-security.service.js

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const securityData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../data/popular-packages.json'), 'utf8')
);

const POPULAR_PACKAGES = securityData.packages || [];
const WHITELIST = new Set(securityData.whitelist || []);

function checkTyposquatting(packageName) {
  if (!packageName || typeof packageName !== 'string') return null;
  if (WHITELIST.has(packageName)) return null;

  for (const official of POPULAR_PACKAGES) {
    if (official === packageName) continue;
    const distance = levenshteinDistance(packageName, official);
    if (distance === 1) {
      return {
        package: packageName,
        similarTo: official,
        distance,
        type: 'typosquat',
        severity: 'high',
        warning: `Possible typosquatting - similar to "${official}"`
      };
    }
  }
  return null;
}

function checkInstallScripts(packageJsonPath) {
  try {
    if (!fs.existsSync(packageJsonPath)) return [];
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    const suspiciousPatterns = [
      /curl.*\|.*sh/i,
      /wget.*\|.*sh/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /child_process/i,
      /http:\/\//i,
      /https:\/\//i,
      /bitcoin/i,
      /mining/i,
      /keylogger/i
    ];

    const suspiciousScripts = [];

    for (const [scriptName, scriptContent] of Object.entries(scripts)) {
      if (!['postinstall', 'preinstall', 'install'].includes(scriptName)) continue;
      if (typeof scriptContent !== 'string') continue;

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(scriptContent)) {
          suspiciousScripts.push({
            script: scriptName,
            content: scriptContent,
            pattern: pattern.toString(),
            severity: 'medium'
          });
          break;
        }
      }
    }
    return suspiciousScripts;
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-security] checkInstallScripts failed:', error.message);
    return [];
  }
}

async function runNpmAudit(projectPath) {
  // No package-lock.json is an expected reason for npm audit to come back
  // empty — not a failure worth flagging. Any other failure (npm missing,
  // timeout, permission error, unparseable output) with a lockfile present
  // means the audit genuinely didn't run, so callers must not treat the
  // resulting empty vulnerability list as a confirmed clean scan.
  const hasLockfile = fs.existsSync(path.join(projectPath, 'package-lock.json'));

  try {
    const output = execSync('npm audit --json', {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });
    return parseAuditData(JSON.parse(output));
  } catch (error) {
    if (error.stdout) {
      try {
        const stdoutText = Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf-8') : error.stdout;
        return parseAuditData(JSON.parse(stdoutText));
      } catch (parseError) {
        if (process.env.DEBUG) console.error('[dynamic-security] failed to parse npm audit error output:', parseError.message);
        return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 }, incomplete: hasLockfile };
      }
    }
    if (process.env.DEBUG) console.error('[dynamic-security] npm audit execSync failed with no stdout:', error.message);
    return { vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 }, incomplete: hasLockfile };
  }
}

function parseAuditData(auditData) {
  const vulnerabilities = [];
  let critical = 0, high = 0, moderate = 0, low = 0;

  try {
    if (auditData.vulnerabilities && typeof auditData.vulnerabilities === 'object') {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
        const severity = vuln.severity || 'unknown';
        vulnerabilities.push({
          package: name,
          severity,
          via: Array.isArray(vuln.via) ? vuln.via : [vuln.via],
          fixAvailable: vuln.fixAvailable || false
        });
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'moderate') moderate++;
        else if (severity === 'low') low++;
      }
    } else if (auditData.advisories && typeof auditData.advisories === 'object') {
      for (const advisory of Object.values(auditData.advisories)) {
        const severity = advisory.severity || 'unknown';
        vulnerabilities.push({
          package: advisory.module_name || 'unknown',
          severity,
          via: [advisory.title || 'Unknown vulnerability'],
          fixAvailable: true
        });
        if (severity === 'critical') critical++;
        else if (severity === 'high') high++;
        else if (severity === 'moderate') moderate++;
        else if (severity === 'low') low++;
      }
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-security] parseAuditData failed:', error.message);
  }

  return { vulnerabilities, summary: { total: vulnerabilities.length, critical, high, moderate, low } };
}

async function analyzeProject(projectPath, dependencyNames = []) {
  const results = { typosquatting: [], suspiciousScripts: [], vulnerabilities: [], summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return results;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = Array.isArray(dependencyNames) && dependencyNames.length > 0
      ? dependencyNames
      : Object.keys({ ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) });

    for (const dep of dependencies) {
      const typosquat = checkTyposquatting(dep);
      if (typosquat) results.typosquatting.push(typosquat);
    }

    results.suspiciousScripts = checkInstallScripts(packageJsonPath);

    const auditResult = await runNpmAudit(projectPath);
    results.vulnerabilities = auditResult.vulnerabilities || [];
    results.summary = auditResult.summary || { total: results.vulnerabilities.length, critical: 0, high: 0, moderate: 0, low: 0 };
  } catch (error) {
    if (process.env.DEBUG) console.error('[dynamic-security] analyzeProject failed:', error.message);
  }

  return results;
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

module.exports = {
  checkTyposquatting,
  checkInstallScripts,
  runNpmAudit,
  parseAuditData,
  analyzeProject,
  POPULAR_PACKAGES,
  WHITELIST
};