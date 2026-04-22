// src/services/dynamic-security.js
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Load security data from JSON
const securityData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/popular-packages.json'), 'utf8')
);

const POPULAR_PACKAGES = securityData.packages;
const WHITELIST = new Set(securityData.whitelist);

/**
 * Check for typosquatting attempts
 */
function checkTyposquatting(packageName) {
  if (WHITELIST.has(packageName)) {
    return null;
  }

  for (const official of POPULAR_PACKAGES) {
    const distance = levenshteinDistance(packageName, official);
    
    if (distance > 0 && distance <= 2) {
      return {
        package: packageName,
        official: official,
        distance: distance,
        type: 'typosquat',
        severity: 'high'
      };
    }
  }

  return null;
}

/**
 * Check for suspicious install scripts
 */
function checkInstallScripts(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    const suspiciousPatterns = [
      /curl.*\|.*sh/i,
      /wget.*\|.*sh/i,
      /eval.*\(/i,
      /exec.*\(/i,
      /child_process/i,
      /\.download/i,
      /http:\/\//i,
      /https:\/\//i,
      /bitcoin/i,
      /mining/i,
      /keylogger/i
    ];

    const suspiciousScripts = [];

    for (const [scriptName, scriptContent] of Object.entries(scripts)) {
      if (['postinstall', 'preinstall', 'install'].includes(scriptName)) {
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
    }

    return suspiciousScripts;
  } catch (error) {
    return [];
  }
}

/**
 * Run npm audit - FIXED to always return array
 */
async function runNpmAudit(projectPath) {
  try {
    const output = execSync('npm audit --json', {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const auditData = JSON.parse(output);
    return parseAuditData(auditData);

  } catch (error) {
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        return parseAuditData(auditData);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Parse audit data - FIXED to always return array
 */
function parseAuditData(auditData) {
  const vulnerabilities = [];
  
  try {
    // npm v7+ format
    if (auditData.vulnerabilities && typeof auditData.vulnerabilities === 'object') {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities)) {
        vulnerabilities.push({
          package: name,
          severity: vuln.severity || 'unknown',
          via: Array.isArray(vuln.via) ? vuln.via : [vuln.via],
          fixAvailable: vuln.fixAvailable || false
        });
      }
    }
    // npm v6 format
    else if (auditData.advisories && typeof auditData.advisories === 'object') {
      for (const advisory of Object.values(auditData.advisories)) {
        vulnerabilities.push({
          package: advisory.module_name || 'unknown',
          severity: advisory.severity || 'unknown',
          via: [advisory.title || 'Unknown vulnerability'],
          fixAvailable: true
        });
      }
    }
  } catch (error) {
    console.error('Error parsing audit data:', error.message);
  }
  
  // ALWAYS return array, never undefined/null
  return vulnerabilities;
}

/**
 * Analyze entire project for security issues - FIXED to always return proper structure
 */
async function analyzeProject(projectPath) {
  const results = {
    typosquatting: [],
    suspiciousScripts: [],
    vulnerabilities: []  // Always an array
  };

  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return results;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check for typosquatting
    for (const dep of Object.keys(dependencies)) {
      const typosquat = checkTyposquatting(dep);
      if (typosquat) {
        results.typosquatting.push(typosquat);
      }
    }

    // Check for suspicious install scripts
    results.suspiciousScripts = checkInstallScripts(packageJsonPath);

    // Run npm audit - ALWAYS returns array
    results.vulnerabilities = await runNpmAudit(projectPath);

  } catch (error) {
    console.error('Security analysis failed:', error.message);
  }

  // Ensure all fields are arrays
  return {
    typosquatting: results.typosquatting || [],
    suspiciousScripts: results.suspiciousScripts || [],
    vulnerabilities: results.vulnerabilities || []
  };
}

/**
 * Levenshtein distance algorithm
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

module.exports = {
  checkTyposquatting,
  checkInstallScripts,
  runNpmAudit,
  analyzeProject,
  parseAuditData,  // Export for testing
  POPULAR_PACKAGES,
  WHITELIST
};