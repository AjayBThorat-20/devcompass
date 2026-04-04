// src/analyzers/supply-chain.js
const fs = require('fs');
const path = require('path');

/**
 * Load known malicious packages database
 */
function loadMaliciousDatabase() {
  try {
    const dbPath = path.join(__dirname, '../../data/known-malicious.json');
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading malicious packages database:', error.message);
    return {
      malicious_packages: [],
      typosquat_patterns: {},
      suspicious_patterns: { install_scripts: [], suspicious_dependencies: [] }
    };
  }
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
 * Detect typosquatting attempts
 */
function detectTyposquatting(packageName, packageVersion, maliciousDb) {
  const warnings = [];
  
  // Whitelist of legitimate popular packages that might have similar names
  // These should NEVER be flagged as typosquatting
  const LEGITIMATE_PACKAGES = [
    'chalk', 'chai', 'ora', 'yargs', 'meow', 'execa', 'globby', 'del', 'make-dir',
    'p-map', 'p-limit', 'p-queue', 'got', 'ky', 'node-fetch', 'cross-fetch',
    'uuid', 'nanoid', 'cuid', 'luxon', 'date-fns', 'ms', 'bytes', 'filesize',
    'fast-glob', 'chokidar', 'picomatch', 'micromatch', 'anymatch',
    'semver', 'commander', 'yargs', 'inquirer', 'prompts', 'enquirer',
    'debug', 'pino', 'winston', 'bunyan', 'signale'
  ];
  
  // Skip whitelist packages
  if (LEGITIMATE_PACKAGES.includes(packageName)) {
    return warnings;
  }
  
  // Check against known typosquat patterns
  // typosquat_patterns is an object: { "express": ["epress", "expres"], ... }
  const patterns = maliciousDb.typosquat_patterns || {};
  
  for (const officialName of Object.keys(patterns)) {
    // Skip if the official package is also whitelisted (both are legitimate)
    // This prevents false positives like "chalk" vs "chai"
    if (LEGITIMATE_PACKAGES.includes(officialName)) {
      continue;
    }
    
    const distance = levenshteinDistance(packageName, officialName);
    
    // Flag if 1-2 character difference (typosquatting likely)
    if (distance > 0 && distance <= 2 && packageName !== officialName) {
      warnings.push({
        package: `${packageName}@${packageVersion}`,
        type: 'typosquatting',
        severity: distance === 1 ? 'high' : 'medium',
        message: `Similar to: ${officialName} (official package)`,
        recommendation: `Verify if you meant to install ${officialName}`,
        official: officialName
      });
    }
  }
  
  return warnings;
}

/**
 * Check if package is known malicious
 */
function checkMaliciousPackage(packageName, database) {
  if (database.malicious_packages.includes(packageName.toLowerCase())) {
    return {
      package: packageName,
      type: 'malicious',
      severity: 'critical',
      message: `Known malicious package detected: ${packageName}`,
      recommendation: 'Remove immediately - this package is known to be malicious'
    };
  }
  return null;
}

/**
 * Analyze install scripts for suspicious patterns
 */
function analyzeInstallScripts(projectPath, dependencies) {
  const warnings = [];
  const database = loadMaliciousDatabase();
  
  try {
    for (const dep of Object.keys(dependencies)) {
      const packageJsonPath = path.join(projectPath, 'node_modules', dep, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        continue;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      // Check for install hooks
      const installHooks = ['preinstall', 'install', 'postinstall'];
      
      for (const hook of installHooks) {
        if (scripts[hook]) {
          const script = scripts[hook].toLowerCase();
          
          // Check for suspicious patterns
          const suspiciousPatterns = database.suspicious_patterns.install_scripts;
          const foundPatterns = suspiciousPatterns.filter(pattern => 
            script.includes(pattern.toLowerCase())
          );
          
          if (foundPatterns.length > 0) {
            warnings.push({
              package: `${dep}@${packageJson.version}`,
              type: 'install_script',
              severity: foundPatterns.some(p => ['curl', 'wget', 'eval', 'exec'].includes(p)) ? 'high' : 'medium',
              script: hook,
              action: scripts[hook],
              patterns: foundPatterns,
              message: `Install script contains suspicious patterns: ${foundPatterns.join(', ')}`,
              recommendation: 'Review the install script before deployment'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing install scripts:', error.message);
  }
  
  return warnings;
}

/**
 * Perform comprehensive supply chain security analysis
 */
async function analyzeSupplyChain(projectPath, dependencies) {
  const warnings = [];
  const database = loadMaliciousDatabase();
  
  // Check each dependency
  for (const [packageName, version] of Object.entries(dependencies)) {
    // 1. Check if known malicious
    const maliciousCheck = checkMaliciousPackage(packageName, database);
    if (maliciousCheck) {
      warnings.push(maliciousCheck);
    }
    
    // 2. Detect typosquatting
    const typosquatWarnings = detectTyposquatting(packageName, version, database);
    warnings.push(...typosquatWarnings);
  }
  
  // 3. Analyze install scripts
  const scriptWarnings = analyzeInstallScripts(projectPath, dependencies);
  warnings.push(...scriptWarnings);
  
  return warnings;
}

/**
 * Get supply chain statistics
 */
function getSupplyChainStats(warnings) {
  return {
    total: warnings.length,
    critical: warnings.filter(w => w.severity === 'critical').length,
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    malicious: warnings.filter(w => w.type === 'malicious').length,
    typosquatting: warnings.filter(w => w.type === 'typosquatting' || w.type === 'typosquatting_suspected').length,
    installScripts: warnings.filter(w => w.type === 'install_script').length
  };
}

module.exports = {
  analyzeSupplyChain,
  detectTyposquatting,
  checkMaliciousPackage,
  analyzeInstallScripts,
  getSupplyChainStats,
  loadMaliciousDatabase
};