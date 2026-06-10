
// src/services/index.js
const registryClient = require('./registry-client');
const dynamicQuality = require('./dynamic-quality');
const dynamicLicense = require('./dynamic-license');
const dynamicSecurity = require('./dynamic-security');

class DynamicAnalyzer {
  constructor() {
    this.quality = dynamicQuality;
    this.license = dynamicLicense;
    this.security = dynamicSecurity;
    this.registry = registryClient;
  }

  async analyzePackage(packageName) {
    const packageData = await this.registry.fetchPackage(packageName);
    if (!packageData) return null;
    
    const [qualityResult, licenseResult] = await Promise.all([
      this.quality.analyzePackageData(packageData),
      this.license.analyzePackageData(packageData)
    ]);
    
    const typosquatResult = this.security.checkTyposquatting(packageName);
    
    return {
      name: packageName,
      quality: qualityResult,
      license: licenseResult,
      security: {
        typosquatting: typosquatResult,
        isWhitelisted: this.security.WHITELIST.has(packageName)
      },
      hasIssues: (
        (qualityResult && qualityResult.status !== 'healthy') ||
        (licenseResult && licenseResult.riskLevel !== 'low') ||
        typosquatResult !== null
      )
    };
  }

  async analyzePackages(packageNames) {
    const packageDataMap = await this.registry.fetchBatch(packageNames);
    const results = new Map();
    
    for (const name of packageNames) {
      const packageData = packageDataMap.get(name);
      
      if (packageData) {
        const [quality, license] = await Promise.all([
          this.quality.analyzePackageData(packageData),
          this.license.analyzePackageData(packageData)
        ]);
        
        const typosquat = this.security.checkTyposquatting(name);
        
        results.set(name, {
          name,
          quality: quality || { status: 'UNKNOWN' },
          license: license || { hasIssue: false },
          security: {
            typosquatting: typosquat,
            isWhitelisted: this.security.WHITELIST.has(name)
          },
          hasIssues: (
            (quality && quality.status !== 'healthy') ||
            (license && license.riskLevel !== 'low') ||
            typosquat !== null
          )
        });
      }
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
      this.quality.analyzeBatch(deps.map(name => ({ name }))).then(results => 
        this.quality.getProjectQualitySummary(results)
      ),
      this.license.analyzeBatch(deps.map(name => ({ name }))).then(results =>
        this.license.getLicenseConflicts(results)
      )
    ]);
    
    const warnings = [];
    
    for (const [name, result] of packageResults) {
      if (result.quality && result.quality.status !== 'healthy') {
        warnings.push({
          type: result.quality.status.toUpperCase(),
          package: name,
          message: `Package is ${result.quality.status}`,
          alternative: result.quality.alternative,
          category: 'quality'
        });
      }
      
      if (result.license && (result.license.riskLevel === 'critical' || result.license.riskLevel === 'high')) {
        warnings.push({
          type: 'LICENSE',
          package: name,
          message: `${result.license.license}: ${result.license.risk}`,
          alternative: result.license.alternative,
          category: 'license'
        });
      }
      
      if (result.security.typosquatting) {
        warnings.push({
          type: 'TYPOSQUAT',
          package: name,
          message: result.security.typosquatting.warning,
          similarTo: result.security.typosquatting.similarTo,
          category: 'security'
        });
      }
    }
    
    if (securityResults.vulnerabilities) {
      securityResults.vulnerabilities.forEach(vuln => {
        warnings.push({
          type: (vuln.severity || 'UNKNOWN').toUpperCase(),
          package: vuln.package,
          message: vuln.title || 'Security vulnerability',
          url: vuln.url,
          category: 'security'
        });
      });
    }
    
    return {
      projectPath,
      totalDependencies: deps.length,
      summary: {
        quality: qualitySummary,
        license: licenseConflicts,
        security: securityResults.summary || {}
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
    
    recommendations.sort((a, b) => a.priority - b.priority);
    
    return recommendations;
  }

  clearCache() {
    this.registry.clearCache();
  }

  getCacheStats() {
    return this.registry.getCacheStats();
  }
}

const analyzer = new DynamicAnalyzer();

module.exports = {
  DynamicAnalyzer,
  analyzer,
  registryClient,
  dynamicQuality,
  dynamicLicense,
  dynamicSecurity
};
