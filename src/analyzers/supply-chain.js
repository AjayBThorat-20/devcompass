// src/analyzers/supply-chain.js
// v3.1.4 - Dynamic supply chain security analysis

const { analyzer } = require('../services');

/**
 * Analyze supply chain security for project dependencies
 */
async function analyzeSupplyChain(projectPath, dependencies = {}) {
  const packages = Object.keys(dependencies);
  
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
    
    // 1. Check for typosquatting (dynamic)
    for (const pkg of packages) {
      const typosquat = analyzer.security.checkTyposquatting(pkg);
      
      if (typosquat) {
        warnings.push({
          package: pkg,
          type: 'typosquatting',
          severity: 'high',
          description: typosquat.warning,
          correctPackage: typosquat.similarTo,
          distance: typosquat.distance,
          reason: `Package name is ${typosquat.distance} character(s) different from popular package "${typosquat.similarTo}"`,
          risk: 'Possible typosquatting attack - malicious package mimicking popular library',
          action: 'remove',
          autoFixable: false // Too risky to auto-remove
        });
      }
    }
    
    // 2. Run npm audit for vulnerabilities (dynamic)
    let auditResults = { vulnerabilities: [], summary: { total: 0 } };
    
    try {
      auditResults = analyzer.security.runNpmAudit(projectPath);
    } catch (error) {
      // npm audit may fail in some environments, continue anyway
    }
    
    // Add high/critical vulnerabilities to warnings
    for (const vuln of auditResults.vulnerabilities) {
      const severity = (vuln.severity || 'moderate').toLowerCase();
      
      if (severity === 'critical' || severity === 'high') {
        warnings.push({
          package: vuln.package,
          type: 'vulnerability',
          severity: severity,
          description: vuln.title,
          reason: vuln.title,
          risk: `${severity.toUpperCase()} security vulnerability`,
          action: 'update',
          url: vuln.url,
          range: vuln.range,
          autoFixable: true // npm audit fix can handle this
        });
      }
    }
    
    // Summary statistics
    const summary = {
      typosquatting: warnings.filter(w => w.type === 'typosquatting').length,
      suspiciousScripts: warnings.filter(w => w.type === 'install_script').length,
      vulnerabilities: auditResults.summary.total,
      critical: auditResults.summary.critical || 0,
      high: auditResults.summary.high || 0
    };
    
    return {
      warnings,
      total: warnings.length,
      summary,
      audit: auditResults
    };
    
  } catch (error) {
    console.error('[supply-chain] Analysis failed:', error.message);
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

function addToWhitelist(packageName) {
  analyzer.security.addToWhitelist(packageName);
}


function removeFromWhitelist(packageName) {
  analyzer.security.removeFromWhitelist(packageName);
}


function isWhitelisted(packageName) {
  return analyzer.security.isWhitelisted(packageName);
}

module.exports = {
  analyzeSupplyChain,
  addToWhitelist,
  removeFromWhitelist,
  isWhitelisted
};