// src/services/index.js

const registryClient = require('./registry-client');
const dynamicQuality = require('./dynamic-quality');
const dynamicLicense = require('./dynamic-license');
const dynamicSecurity = require('./dynamic-security');

/**
 * DynamicAnalyzer class - unified interface for all dynamic services
 */
class DynamicAnalyzer {
  constructor() {
    this.quality = dynamicQuality;
    this.license = dynamicLicense;
    this.security = dynamicSecurity;
    this.registry = registryClient;
  }

  async analyzePackage(packageName) {
    const [qualityResult, licenseResult] = await Promise.all([
      this.quality.analyzePackage(packageName),
      this.license.analyzePackage(packageName)
    ]);
    
    const typosquatResult = this.security.checkTyposquatting(packageName);
    
    return {
      name: packageName,
      quality: qualityResult,
      license: licenseResult,
      security: {
        typosquatting: typosquatResult,
        isWhitelisted: this.security.isWhitelisted(packageName)
      },
      hasIssues: (
        qualityResult.status !== 'HEALTHY' ||
        licenseResult.hasIssue ||
        typosquatResult !== null
      )
    };
  }

  async analyzePackages(packageNames) {
    const results = new Map();
    
    const [qualityResults, licenseResults] = await Promise.all([
      this.quality.analyzeBatch(packageNames),
      this.license.analyzeBatch(packageNames)
    ]);
    
    for (const name of packageNames) {
      const quality = qualityResults.get(name) || { status: 'UNKNOWN' };
      const license = licenseResults.get(name) || { hasIssue: false };
      const typosquat = this.security.checkTyposquatting(name);
      
      results.set(name, {
        name,
        quality,
        license,
        security: {
          typosquatting: typosquat,
          isWhitelisted: this.security.isWhitelisted(name)
        },
        hasIssues: (
          quality.status !== 'HEALTHY' ||
          license.hasIssue ||
          typosquat !== null
        )
      });
    }
    
    return results;
  }

  async analyzeProject(projectPath, packageJson = {}) {
    const deps = [
      ...Object.keys(packageJson.dependencies || {}),
      ...Object.keys(packageJson.devDependencies || {})
    ];
    
    const [packageResults, securityResults, qualitySummary, licenseConflicts] = await Promise.all([
      this.analyzePackages(deps),
      this.security.analyzeProject(projectPath, deps),
      this.quality.getProjectQualitySummary(deps),
      this.license.getLicenseConflicts(deps)
    ]);
    
    // Compile warnings
    const warnings = [];
    
    // Quality warnings
    for (const issue of qualitySummary.issues) {
      warnings.push({
        type: issue.type.toUpperCase(),
        package: issue.package,
        message: issue.message,
        alternative: issue.alternative,
        category: 'quality'
      });
    }
    
    // License warnings
    for (const conflict of [...licenseConflicts.critical, ...licenseConflicts.high]) {
      warnings.push({
        type: 'LICENSE',
        package: conflict.package,
        message: `${conflict.license}: ${conflict.message}`,
        alternative: conflict.alternative,
        category: 'license'
      });
    }
    
    // Security warnings
    for (const typosquat of securityResults.typosquatting) {
      warnings.push({
        type: 'TYPOSQUAT',
        package: typosquat.package,
        message: typosquat.warning,
        similarTo: typosquat.similarTo,
        category: 'security'
      });
    }
    
    for (const vuln of securityResults.vulnerabilities) {
      warnings.push({
        type: vuln.severity.toUpperCase(),
        package: vuln.package,
        message: vuln.title,
        url: vuln.url,
        category: 'security'
      });
    }
    
    return {
      projectPath,
      totalDependencies: deps.length,
      summary: {
        quality: qualitySummary,
        license: licenseConflicts,
        security: securityResults.summary
      },
      warnings,
      details: packageResults
    };
  }
  

  getAutofixRecommendations(analysisResult) {
    const recommendations = [];
    
    for (const warning of analysisResult.warnings || []) {
      if (warning.alternative) {
        recommendations.push({
          action: 'replace',
          package: warning.package,
          replacement: warning.alternative,
          reason: warning.message,
          category: warning.category,
          priority: warning.type === 'CRITICAL' ? 1 : 
                    warning.type === 'HIGH' ? 2 :
                    warning.type === 'DEPRECATED' ? 3 : 4
        });
      } else if (warning.type === 'TYPOSQUAT') {
        recommendations.push({
          action: 'remove',
          package: warning.package,
          reason: warning.message,
          category: 'security',
          priority: 1
        });
      } else if (warning.type === 'CRITICAL' || warning.type === 'HIGH') {
        recommendations.push({
          action: 'update',
          package: warning.package,
          reason: warning.message,
          category: 'security',
          priority: warning.type === 'CRITICAL' ? 1 : 2
        });
      }
    }
    
    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);
    
    return recommendations;
  }
  
  /**
   * Clear all caches
   */
  clearCache() {
    this.registry.clearCache();
  }
  
  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return this.registry.getCacheStats();
  }
}

// Export singleton instance
const analyzer = new DynamicAnalyzer();

module.exports = {
  DynamicAnalyzer,
  analyzer,
  // Re-export individual services
  registryClient,
  dynamicQuality,
  dynamicLicense,
  dynamicSecurity
};