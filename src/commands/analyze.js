// src/commands/analyze.js
// v3.1.3 - Added analyzeProject() for graph enrichment
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs');

const { findUnusedDeps } = require('../analyzers/unused-deps');
const { findOutdatedDeps } = require('../analyzers/outdated');
const { calculateScore } = require('../analyzers/scoring');
const { checkEcosystemAlerts } = require('../alerts');
const { checkSecurity, calculateSecurityPenalty } = require('../analyzers/security');
const { analyzeBundleSizes, findHeavyPackages } = require('../analyzers/bundle-size');
const { checkLicenses, findProblematicLicenses } = require('../analyzers/licenses');
const { 
  formatAlerts, 
  getSeverityDisplay, 
  calculateAlertPenalty 
} = require('../alerts/formatter');
const { 
  log, 
  logSection, 
  logDivider,
  getScoreColor 
} = require('../utils/logger');
const { loadConfig, filterAlerts } = require('../config/loader');
const { getCached, setCache } = require('../cache/manager');
const { formatAsJson } = require('../utils/json-formatter');
const { handleCiMode } = require('../utils/ci-handler');

// NEW v2.7.0 imports
const { analyzeSupplyChain } = require('../analyzers/supply-chain');
const { analyzeLicenseRisks, getLicenseRiskScore } = require('../analyzers/license-risk');
const { analyzePackageQuality } = require('../analyzers/package-quality');
const { 
  generateSecurityRecommendations, 
  groupByPriority, 
  calculateExpectedImpact 
} = require('../analyzers/security-recommendations');

const packageJson = require('../../package.json');

/**
 * v3.1.3 - analyzeProject() for graph enrichment
 * Returns structured analysis data without console output
 * Used by graph command to enrich nodes with vulnerability/outdated/unused flags
 * 
 * @param {string} projectPath - Path to project directory
 * @param {object} options - Options (silent mode enabled by default)
 * @returns {object|null} Analysis results or null on failure
 */
async function analyzeProject(projectPath, options = {}) {
  const config = loadConfig(projectPath);
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }
    
    let projectPackageJson;
    try {
      const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
      projectPackageJson = JSON.parse(fileContent);
    } catch (error) {
      return null;
    }
    
    const dependencies = {
      ...(projectPackageJson.dependencies || {}),
      ...(projectPackageJson.devDependencies || {})
    };
    
    const totalDeps = Object.keys(dependencies).length;
    
    if (totalDeps === 0) {
      return {
        security: { vulnerabilities: [], metadata: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } },
        outdatedPackages: [],
        unusedDependencies: [],
        ecosystemAlerts: [],
        summary: { totalDeps: 0 }
      };
    }
    
    // Check for ecosystem alerts
    let alerts = [];
    if (config.cache) {
      alerts = getCached(projectPath, 'alerts');
    }
    if (!alerts) {
      try {
        alerts = await checkEcosystemAlerts(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'alerts', alerts);
        }
      } catch (error) {
        alerts = [];
      }
    }
    alerts = filterAlerts(alerts, config);
    
    // Unused dependencies
    let unusedDeps = [];
    if (config.cache) {
      unusedDeps = getCached(projectPath, 'unused');
    }
    if (!unusedDeps) {
      try {
        unusedDeps = await findUnusedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'unused', unusedDeps);
        }
      } catch (error) {
        unusedDeps = [];
      }
    }
    
    // Outdated packages
    let outdatedDeps = [];
    if (config.cache) {
      outdatedDeps = getCached(projectPath, 'outdated');
    }
    if (!outdatedDeps) {
      try {
        outdatedDeps = await findOutdatedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'outdated', outdatedDeps);
        }
      } catch (error) {
        outdatedDeps = [];
      }
    }
    
    // Check security vulnerabilities
    let securityData = { vulnerabilities: [], metadata: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    if (config.cache) {
      const cached = getCached(projectPath, 'security');
      if (cached) securityData = cached;
    }
    if (securityData.metadata.total === 0) {
      try {
        securityData = await checkSecurity(projectPath);
        if (config.cache) {
          setCache(projectPath, 'security', securityData);
        }
      } catch (error) {
        // Keep default empty securityData
      }
    }
    
    // Return structured data for graph enrichment
    // Format matches what enrichNodesWithAnalysis() expects
    return {
      // Security data - vulnerabilities array with package names
      security: {
        vulnerabilities: securityData.vulnerabilities || [],
        metadata: securityData.metadata || { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
        total: securityData.metadata?.total || 0,
        critical: securityData.metadata?.critical || 0,
        high: securityData.metadata?.high || 0,
        moderate: securityData.metadata?.moderate || 0,
        low: securityData.metadata?.low || 0
      },
      
      // Outdated packages - array of { name, current, latest, wanted, versionsBehind }
      outdatedPackages: (outdatedDeps || []).map(dep => ({
        name: dep.name,
        package: dep.name,
        current: dep.current,
        latest: dep.latest,
        wanted: dep.wanted,
        versionsBehind: dep.versionsBehind
      })),
      
      // Unused dependencies - array of { name } or strings
      unusedDependencies: (unusedDeps || []).map(dep => 
        typeof dep === 'string' ? dep : (dep.name || dep.package)
      ),
      
      // Ecosystem alerts - array of { package, title, severity, fix, source }
      ecosystemAlerts: (alerts || []).map(alert => ({
        package: alert.package,
        name: alert.package,
        title: alert.title,
        message: alert.title,
        severity: alert.severity,
        fix: alert.fix,
        source: alert.source,
        affected: alert.affected
      })),
      
      // Summary
      summary: {
        totalDeps,
        unusedCount: unusedDeps?.length || 0,
        outdatedCount: outdatedDeps?.length || 0,
        alertCount: alerts?.length || 0,
        vulnerabilityCount: securityData.metadata?.total || 0
      }
    };
    
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('[analyzeProject] Error:', error.message);
    }
    return null;
  }
}

async function analyze(options) {
  const projectPath = options.path || process.cwd();
  
  // Load config
  const config = loadConfig(projectPath);
  
  // Handle output modes
  const outputMode = options.json ? 'json' : (options.ci ? 'ci' : (options.silent ? 'silent' : 'normal'));
  
  // Only show header for normal and CI modes
  if (outputMode !== 'silent' && outputMode !== 'json') {
    console.log('\n');
    log(chalk.cyan.bold(`🔍 DevCompass v${packageJson.version}`) + ' - Analyzing your project...\n');
  }
  
  // Create spinner (disabled for json/silent modes to prevent EPIPE errors)
  const spinner = (outputMode === 'json' || outputMode === 'silent')
    ? { 
        start: function() { return this; },
        succeed: function() {},
        fail: function(msg) { if (msg) console.error(msg); },
        text: '',
        set text(val) {}
      }
    : ora({
        text: 'Loading project...',
        color: 'cyan'
      }).start();
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      spinner.fail(chalk.red('No package.json found in current directory'));
      console.log(chalk.yellow('\n💡 Make sure you run this command in a project directory.\n'));
      process.exit(1);
    }
    
    let projectPackageJson;
    try {
      const fileContent = fs.readFileSync(packageJsonPath, 'utf8');
      projectPackageJson = JSON.parse(fileContent);
    } catch (error) {
      spinner.fail(chalk.red('Invalid package.json format'));
      console.log(chalk.yellow(`\n💡 Error: ${error.message}\n`));
      process.exit(1);
    }
    
    const dependencies = {
      ...(projectPackageJson.dependencies || {}),
      ...(projectPackageJson.devDependencies || {})
    };
    
    const totalDeps = Object.keys(dependencies).length;
    
    if (totalDeps === 0) {
      spinner.succeed(chalk.green('No dependencies found'));
      console.log(chalk.gray('\n✨ Nothing to analyze - your project has no dependencies.\n'));
      process.exit(0);
    }
    
    // Check for ecosystem alerts (with cache)
    spinner.text = 'Checking ecosystem alerts...';
    let alerts = [];
    
    if (config.cache) {
      alerts = getCached(projectPath, 'alerts');
    }
    
    if (!alerts) {
      try {
        alerts = await checkEcosystemAlerts(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'alerts', alerts);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check ecosystem alerts'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        alerts = [];
      }
    }
    
    // Filter alerts based on config
    alerts = filterAlerts(alerts, config);
    
    // Unused dependencies
    spinner.text = 'Detecting unused dependencies...';
    let unusedDeps = [];
    
    if (config.cache) {
      unusedDeps = getCached(projectPath, 'unused');
    }
    
    if (!unusedDeps) {
      try {
        unusedDeps = await findUnusedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'unused', unusedDeps);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not detect unused dependencies'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        unusedDeps = [];
      }
    }
    
    // Outdated packages
    spinner.text = 'Checking for outdated packages...';
    let outdatedDeps = [];
    
    if (config.cache) {
      outdatedDeps = getCached(projectPath, 'outdated');
    }
    
    if (!outdatedDeps) {
      try {
        outdatedDeps = await findOutdatedDeps(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'outdated', outdatedDeps);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check for outdated packages'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        outdatedDeps = [];
      }
    }
    
    // Check security vulnerabilities
    spinner.text = 'Checking security vulnerabilities...';
    let securityData = { vulnerabilities: [], metadata: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 } };
    
    if (config.cache) {
      const cached = getCached(projectPath, 'security');
      if (cached) securityData = cached;
    }
    
    if (securityData.metadata.total === 0) {
      try {
        securityData = await checkSecurity(projectPath);
        if (config.cache) {
          setCache(projectPath, 'security', securityData);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check security vulnerabilities'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
      }
    }
    
    // Check for predictive warnings (GitHub Issues) - v2.6.0
    const { getTrackedPackageCount, TRACKED_REPOS } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    // Count how many installed packages are tracked
    const installedTrackedCount = Object.keys(dependencies).filter(pkg => TRACKED_REPOS[pkg]).length;
    
    if (installedTrackedCount > 0) {
      spinner.text = `Checking GitHub activity (0/${installedTrackedCount} packages)...`;
    } else {
      spinner.text = 'Checking GitHub activity...';
    }
    
    let predictiveWarnings = [];
    let githubCheckTime = 0;
    let githubData = [];
    
    if (config.cache) {
      predictiveWarnings = getCached(projectPath, 'predictive');
    }
    
    if (!predictiveWarnings) {
      try {
        const { generatePredictiveWarnings } = require('../alerts/predictive');
        const { checkGitHubIssues } = require('../alerts/github-tracker');
        
        // Track performance
        const startTime = Date.now();
        
        // Get raw GitHub data for quality analysis
        githubData = await checkGitHubIssues(dependencies, {
          concurrency: 5,
          onProgress: (current, total, packageName) => {
            if (outputMode === 'normal') {
              spinner.text = `Checking GitHub activity (${current}/${total} packages) - ${packageName}`;
            }
          }
        });
        
        // Generate predictive warnings
        predictiveWarnings = await generatePredictiveWarnings(dependencies, {
          onProgress: (current, total, packageName) => {
            if (outputMode === 'normal') {
              spinner.text = `Checking GitHub activity (${current}/${total} packages) - ${packageName}`;
            }
          }
        });
        
        githubCheckTime = Date.now() - startTime;
        
        if (config.cache && predictiveWarnings.length > 0) {
          setCache(projectPath, 'predictive', predictiveWarnings);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not check GitHub activity'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        predictiveWarnings = [];
      }
    }
    
    // Analyze bundle sizes
    spinner.text = 'Analyzing bundle sizes...';
    let bundleSizes = [];
    
    if (config.cache) {
      const cached = getCached(projectPath, 'bundleSizes');
      if (cached) bundleSizes = cached;
    }
    
    if (bundleSizes.length === 0) {
      try {
        bundleSizes = await analyzeBundleSizes(projectPath, dependencies);
        if (config.cache && bundleSizes.length > 0) {
          setCache(projectPath, 'bundleSizes', bundleSizes);
        }
      } catch (error) {
        // Bundle size analysis is optional
      }
    }
    
    // Check licenses
    spinner.text = 'Checking licenses...';
    let licenses = [];
    
    if (config.cache) {
      const cached = getCached(projectPath, 'licenses');
      if (cached) licenses = cached;
    }
    
    if (licenses.length === 0) {
      try {
        licenses = await checkLicenses(projectPath, dependencies);
        if (config.cache && licenses.length > 0) {
          setCache(projectPath, 'licenses', licenses);
        }
      } catch (error) {
        // License checking is optional
      }
    }
    
    // v2.7.0 - Supply Chain Analysis
    spinner.text = 'Analyzing supply chain security...';
    let supplyChainData = { warnings: [], total: 0, summary: {} };
    
    if (config.cache) {
      const cached = getCached(projectPath, 'supplyChain');
      if (cached) supplyChainData = cached;
    }
    
    if (!supplyChainData.warnings || supplyChainData.warnings.length === 0) {
      try {
        supplyChainData = await analyzeSupplyChain(projectPath, dependencies);
        if (config.cache) {
          setCache(projectPath, 'supplyChain', supplyChainData);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not analyze supply chain'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
        supplyChainData = { warnings: [], total: 0, summary: {} };
      }
    }
    
    // NEW v2.7.0 - Enhanced License Risk Analysis
    spinner.text = 'Analyzing license risks...';
    let licenseRiskData = { warnings: [], stats: {}, projectLicense: 'MIT' };
    
    if (config.cache) {
      const cached = getCached(projectPath, 'licenseRisk');
      if (cached) licenseRiskData = cached;
    }
    
    if (!licenseRiskData.warnings || licenseRiskData.warnings.length === 0) {
      try {
        licenseRiskData = await analyzeLicenseRisks(projectPath, licenses);
        if (config.cache) {
          setCache(projectPath, 'licenseRisk', licenseRiskData);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not analyze license risks'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
      }
    }
    
    // NEW v2.7.0 - Package Quality Analysis
    spinner.text = 'Analyzing package quality...';
    let qualityData = { results: [], stats: {} };
    
    if (config.cache) {
      const cached = getCached(projectPath, 'quality');
      if (cached) qualityData = cached;
    }
    
    if (!qualityData.results || qualityData.results.length === 0) {
      try {
        qualityData = await analyzePackageQuality(dependencies, githubData);
        if (config.cache) {
          setCache(projectPath, 'quality', qualityData);
        }
      } catch (error) {
        if (outputMode !== 'silent') {
          console.log(chalk.yellow('\n⚠️  Could not analyze package quality'));
          console.log(chalk.gray(`   Error: ${error.message}\n`));
        }
      }
    }
    
    // Calculate score
    const alertPenalty = calculateAlertPenalty(alerts);
    const securityPenalty = calculateSecurityPenalty(securityData.metadata);
    
    const score = calculateScore(
      totalDeps,
      unusedDeps.length,
      outdatedDeps.length,
      alerts.length,
      alertPenalty,
      securityPenalty
    );
    
    spinner.succeed(chalk.green(`Scanned ${totalDeps} dependencies in project`));
    
    // Show performance info if GitHub check was performed
    if (githubCheckTime > 0 && outputMode === 'normal' && installedTrackedCount > 0) {
      const timeInSeconds = (githubCheckTime / 1000).toFixed(2);
      console.log(chalk.gray(`⚡ GitHub check completed in ${timeInSeconds}s (parallel processing)`));
    }
    
    // NEW v2.7.0 - Generate Security Recommendations
    // ✅ FIXED: Ensure supplyChainData.warnings is always an array
    const safeSupplyChainWarnings = Array.isArray(supplyChainData.warnings) 
      ? supplyChainData.warnings 
      : [];
    
    const recommendations = generateSecurityRecommendations({
      supplyChainWarnings: safeSupplyChainWarnings,
      licenseWarnings: licenseRiskData.warnings || [],
      qualityResults: qualityData.results || [],
      securityVulnerabilities: securityData.metadata,
      ecosystemAlerts: alerts,
      unusedDeps,
      outdatedPackages: outdatedDeps
    });
    
    // Handle different output modes
    if (outputMode === 'json') {
      // ✅ FIXED: Create safe supply chain data for JSON output
      const safeSupplyChainData = {
        ...supplyChainData,
        warnings: Array.isArray(supplyChainData.warnings) ? supplyChainData.warnings : []
      };

      const jsonOutput = formatAsJson(
        alerts, 
        unusedDeps, 
        outdatedDeps, 
        score, 
        totalDeps, 
        securityData, 
        bundleSizes, 
        licenses, 
        predictiveWarnings,
        safeSupplyChainData,
        licenseRiskData,
        qualityData,
        recommendations
      );
      console.log(jsonOutput);
    } else if (outputMode === 'ci') {
      displayResults(
        alerts, 
        unusedDeps, 
        outdatedDeps, 
        score, 
        totalDeps, 
        securityData, 
        bundleSizes, 
        licenses, 
        predictiveWarnings,
        supplyChainData,
        licenseRiskData,
        qualityData,
        recommendations
      );
      handleCiMode(score, config, alerts, unusedDeps);
    } else if (outputMode === 'silent') {
      // Silent mode - no output
    } else {
      displayResults(
        alerts, 
        unusedDeps, 
        outdatedDeps, 
        score, 
        totalDeps, 
        securityData, 
        bundleSizes, 
        licenses, 
        predictiveWarnings,
        supplyChainData,
        licenseRiskData,
        qualityData,
        recommendations
      );
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (process.env.DEBUG) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

function displayResults(
  alerts, 
  unusedDeps, 
  outdatedDeps, 
  score, 
  totalDeps, 
  securityData, 
  bundleSizes, 
  licenses, 
  predictiveWarnings,
  supplyChainData = { warnings: [], total: 0 },
  licenseRiskData = {},
  qualityData = {},
  recommendations = []
) {
  logDivider();
  
  // SECURITY VULNERABILITIES
  if (securityData.metadata.total > 0) {
    const criticalCount = securityData.metadata.critical;
    const highCount = securityData.metadata.high;
    const moderateCount = securityData.metadata.moderate;
    const lowCount = securityData.metadata.low;
    
    logSection('🔐 SECURITY VULNERABILITIES', securityData.metadata.total);
    
    if (criticalCount > 0) {
      log(chalk.red.bold(`\n  🔴 CRITICAL: ${criticalCount}`));
    }
    if (highCount > 0) {
      log(chalk.red(`  🟠 HIGH: ${highCount}`));
    }
    if (moderateCount > 0) {
      log(chalk.yellow(`  🟡 MODERATE: ${moderateCount}`));
    }
    if (lowCount > 0) {
      log(chalk.gray(`  ⚪ LOW: ${lowCount}`));
    }
    
    log(chalk.cyan('\n  Run') + chalk.bold(' npm audit fix ') + chalk.cyan('to fix vulnerabilities\n'));
  } else {
    logSection('✅ SECURITY VULNERABILITIES');
    log(chalk.green('  No vulnerabilities detected!\n'));
  }
  
  logDivider();
  
  // NEW v2.7.0 / v3.1.0 - SUPPLY CHAIN SECURITY (✅ FIXED)
  // ✅ FIXED: Always ensure warnings is an array before any operations
  const safeWarnings = Array.isArray(supplyChainData.warnings) ? supplyChainData.warnings : [];
  
  if (supplyChainData.total > 0 && safeWarnings.length > 0) {
    logSection('🛡️  SUPPLY CHAIN SECURITY', supplyChainData.total);
    
    // Group by type
    const malicious = safeWarnings.filter(w => w.type === 'malicious');
    const typosquatting = safeWarnings.filter(w => w.type === 'typosquatting');
    const suspiciousScripts = safeWarnings.filter(w => w.type === 'install_script');
    
    // Malicious packages (CRITICAL)
    if (malicious.length > 0) {
      log(chalk.red.bold('\n  🔴 MALICIOUS PACKAGES DETECTED\n'));
      malicious.forEach(w => {
        log(`  ${chalk.red.bold(w.package)}`);
        log(`    ${chalk.red(w.description)}`);
        log(`    ${chalk.yellow('→')} ${w.reason}\n`);
      });
    }
    
    // Typosquatting (HIGH)
    if (typosquatting.length > 0) {
      log(chalk.yellow.bold('\n  🟠 TYPOSQUATTING RISK\n'));
      typosquatting.forEach(w => {
        log(`  ${chalk.yellow.bold(w.package)}`);
        log(`    Similar to: ${chalk.green(w.correctPackage)} (official package)`);
        log(`    Risk: ${w.risk} - ${w.reason}`);
        log(`    ${chalk.yellow('→')} Remove ${w.package} and install ${w.correctPackage}\n`);
      });
    }
    
    // Suspicious install scripts (MEDIUM/HIGH)
    if (suspiciousScripts.length > 0) {
      log(chalk.cyan.bold('\n  🟡 INSTALL SCRIPT WARNINGS\n'));
      suspiciousScripts.slice(0, 3).forEach(w => {
        log(`  ${chalk.bold(w.package)}`);
        log(`    Script: ${chalk.gray(w.script)}`);
        log(`    Patterns: ${chalk.yellow(w.patterns.join(', '))}`);
        log(`    Risk: ${w.risk} - Review install script before use`);
        log(`    ${chalk.yellow('→')} Review the install script before deployment\n`);
      });
      
      if (suspiciousScripts.length > 3) {
        log(chalk.gray(`  ... and ${suspiciousScripts.length - 3} more install script warnings\n`));
      }
    }
    
    log(chalk.cyan('  💡 Run') + chalk.bold(' devcompass fix ') + chalk.cyan('to automatically fix supply chain issues\n'));
  } else {
    logSection('✅ SUPPLY CHAIN SECURITY');
    log(chalk.green('  No supply chain risks detected!\n'));
  }
  
  logDivider();
  
  // ECOSYSTEM ALERTS
  if (alerts.length > 0) {
    logSection('🚨 ECOSYSTEM ALERTS', alerts.length);
    
    const grouped = formatAlerts(alerts);
    
    Object.entries(grouped).forEach(([packageName, packageAlerts]) => {
      const firstAlert = packageAlerts[0];
      const display = getSeverityDisplay(firstAlert.severity);
      
      log(`\n${display.emoji} ${display.color(display.label)}`);
      log(`  ${chalk.bold(packageName)}${chalk.gray('@' + firstAlert.version)}`);
      
      packageAlerts.forEach((alert, index) => {
        if (index > 0) {
          const alertDisplay = getSeverityDisplay(alert.severity);
          log(`\n  ${alertDisplay.emoji} ${alertDisplay.color(alertDisplay.label)}`);
        }
        
        log(`    ${chalk.yellow('Issue:')} ${alert.title}`);
        log(`    ${chalk.gray('Affected:')} ${alert.affected}`);
        
        if (alert.fix) {
          log(`    ${chalk.green('Fix:')} ${alert.fix}`);
        }
        
        if (alert.source) {
          log(`    ${chalk.gray('Source:')} ${alert.source}`);
        }
      });
    });
    
    log('');
  } else {
    logSection('✅ ECOSYSTEM ALERTS');
    log(chalk.green('  No known issues detected!\n'));
  }
  
  logDivider();
  
  // PREDICTIVE WARNINGS
  if (predictiveWarnings.length > 0) {
    const { getTrackedPackageCount } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    logSection('🔮 PREDICTIVE WARNINGS', predictiveWarnings.length);
    
    log(chalk.gray(`  Based on recent GitHub activity (${totalTracked}+ packages monitored):\n`));
    
    predictiveWarnings.forEach(warning => {
      const display = getSeverityDisplay(warning.severity);
      
      log(`${display.emoji} ${display.color(warning.package)}`);
      log(`   ${chalk.yellow(warning.title)}`);
      log(`   ${warning.description}`);
      log(`   ${chalk.cyan('→')} ${warning.recommendation}`);
      
      if (warning.data && warning.data.repoUrl) {
        log(chalk.gray(`   GitHub: ${warning.data.repoUrl}`));
      }
      
      log('');
    });
  } else {
    const { getTrackedPackageCount } = require('../alerts/github-tracker');
    const totalTracked = getTrackedPackageCount();
    
    logSection('✅ PREDICTIVE ANALYSIS');
    log(chalk.green(`  No unusual activity detected (${totalTracked}+ packages monitored)!\n`));
  }
  
  logDivider();
  
  // NEW v2.7.0 - LICENSE RISK ANALYSIS
  if (licenseRiskData.warnings && licenseRiskData.warnings.length > 0) {
    logSection('⚖️  LICENSE RISK ANALYSIS', licenseRiskData.warnings.length);
    
    const { warnings, projectLicense } = licenseRiskData;
    
    log(chalk.gray(`  Project License: ${projectLicense}\n`));
    
    // Group by severity
    const critical = warnings.filter(w => w.severity === 'critical');
    const high = warnings.filter(w => w.severity === 'high');
    const medium = warnings.filter(w => w.severity === 'medium');
    
    if (critical.length > 0) {
      log(chalk.red.bold('🔴 CRITICAL LICENSE RISKS\n'));
      critical.forEach(w => {
        log(`  ${chalk.red.bold(w.package)}`);
        log(`    License: ${chalk.red(w.license)}`);
        log(`    ${chalk.yellow(w.message)}`);
        log(`    ${chalk.cyan('→')} ${w.recommendation}\n`);
      });
    }
    
    if (high.length > 0) {
      log(chalk.red('\n🟠 HIGH RISK LICENSES\n'));
      high.slice(0, 3).forEach(w => {
        log(`  ${chalk.bold(w.package)}`);
        log(`    License: ${chalk.yellow(w.license)}`);
        log(`    ${chalk.gray(w.message)}`);
        log(`    ${chalk.cyan('→')} ${w.recommendation}\n`);
      });
      
      if (high.length > 3) {
        log(chalk.gray(`  ... and ${high.length - 3} more high-risk licenses\n`));
      }
    }
    
    if (medium.length > 0) {
      log(chalk.gray(`\n  ${medium.length} medium-risk licenses detected\n`));
    }
  } else {
    logSection('✅ LICENSE COMPLIANCE');
    log(chalk.green('  All licenses are compliant!\n'));
  }
  
  logDivider();
  
  // NEW v2.7.0 - PACKAGE QUALITY METRICS
  if (qualityData.results && qualityData.results.length > 0) {
    const { results, stats } = qualityData;
    
    logSection('📊 PACKAGE QUALITY METRICS', results.length);
    
    // Healthy packages
    if (stats.healthy > 0) {
      log(chalk.green(`\n✅ HEALTHY PACKAGES (${stats.healthy})\n`));
      const healthy = results.filter(r => r.status === 'healthy');
      const display = healthy.slice(0, 10).map(r => r.package).join(', ');
      log(chalk.gray(`  ${display}${healthy.length > 10 ? '...' : ''}\n`));
    }
    
    // Needs attention
    if (stats.needsAttention > 0) {
      log(chalk.yellow(`\n🟡 NEEDS ATTENTION (${stats.needsAttention})\n`));
      const attention = results.filter(r => r.status === 'needs_attention');
      attention.slice(0, 3).forEach(r => {
        log(`  ${chalk.bold(r.package)}`);
        log(`    Health Score: ${chalk.yellow(r.healthScore + '/10')}`);
        log(`    Last Update: ${chalk.gray(r.daysSincePublish)} days ago`);
        if (r.githubMetrics) {
          log(`    Open Issues: ${chalk.gray(r.githubMetrics.totalIssues)}`);
        }
        log('');
      });
    }
    
    // Stale packages
    if (stats.stale > 0) {
      log(chalk.red(`\n🟠 STALE PACKAGES (${stats.stale})\n`));
      const stale = results.filter(r => r.status === 'stale');
      stale.slice(0, 3).forEach(r => {
        log(`  ${chalk.bold(r.package)}`);
        log(`    Health Score: ${chalk.red(r.healthScore + '/10')}`);
        log(`    Last Update: ${chalk.red(Math.floor(r.daysSincePublish / 30))} months ago`);
        log(`    ${chalk.cyan('→')} Consider finding actively maintained alternative\n`);
      });
    }
    
    // Abandoned packages
    if (stats.abandoned > 0) {
      log(chalk.red.bold(`\n🔴 ABANDONED PACKAGES (${stats.abandoned})\n`));
      const abandoned = results.filter(r => r.status === 'abandoned');
      abandoned.forEach(r => {
        log(`  ${chalk.red.bold(r.package)}`);
        log(`    Health Score: ${chalk.red(r.healthScore + '/10')}`);
        log(`    Last Update: ${chalk.red(Math.floor(r.daysSincePublish / 365))} years ago`);
        log(`    Maintainer: ${chalk.red('Inactive')}`);
        log(`    ${chalk.cyan('→')} Migrate to actively maintained alternative\n`);
      });
    }
    
    // Deprecated packages
    if (stats.deprecated > 0) {
      log(chalk.red.bold(`\n🔴 DEPRECATED PACKAGES (${stats.deprecated})\n`));
      const deprecated = results.filter(r => r.status === 'deprecated');
      deprecated.forEach(r => {
        log(`  ${chalk.red.bold(r.package)}`);
        log(`    ${chalk.red('Package is officially deprecated')}`);
        log(`    ${chalk.cyan('→')} Find alternative immediately\n`);
      });
    }
  } else {
    logSection('📊 PACKAGE QUALITY');
    log(chalk.green('  Quality analysis in progress...\n'));
  }
  
  logDivider();
  
  // UNUSED DEPENDENCIES
  if (unusedDeps.length > 0) {
    logSection('🔴 UNUSED DEPENDENCIES', unusedDeps.length);
    
unusedDeps.forEach(dep => {
      // ✅ FIXED: Handle both string and object formats
      const depName = typeof dep === 'string' ? dep : (dep.name || dep.package || dep);
      log(`  ${chalk.red('●')} ${typeof dep === 'string' ? dep : (dep.name || dep)}`);
    });
    
    log(chalk.gray('\n  Why marked unused:'));
    log(chalk.gray('  • No import/require found in source files'));
    log(chalk.gray('  • Excludes node_modules, build folders'));
    log(chalk.gray('  • May include false positives - verify before removing\n'));
  } else {
    logSection('✅ UNUSED DEPENDENCIES');
    log(chalk.green('  No unused dependencies detected!\n'));
  }
  
  logDivider();
  
  // OUTDATED PACKAGES
  if (outdatedDeps.length > 0) {
    logSection('🟡 OUTDATED PACKAGES', outdatedDeps.length);
    
    outdatedDeps.forEach(dep => {
      const nameCol = dep.name.padEnd(20);
      const currentVer = chalk.yellow(dep.current);
      const arrow = chalk.gray('→');
      const latestVer = chalk.green(dep.latest);
      const updateType = chalk.gray(`(${dep.versionsBehind})`);
      
      log(`  ${nameCol} ${currentVer} ${arrow} ${latestVer}  ${updateType}`);
    });
    
    log('');
  } else {
    logSection('✅ OUTDATED PACKAGES');
    log(chalk.green('  All packages are up to date!\n'));
  }
  
  logDivider();
  
  // BUNDLE SIZE
  const heavyPackages = findHeavyPackages(bundleSizes);
  if (heavyPackages.length > 0) {
    logSection('📦 HEAVY PACKAGES', heavyPackages.length);
    
    log(chalk.gray('  Packages larger than 1MB:\n'));
    
    heavyPackages.slice(0, 10).forEach(pkg => {
      const nameCol = pkg.name.padEnd(25);
      const size = pkg.size > 5120 
        ? chalk.red(pkg.sizeFormatted)
        : chalk.yellow(pkg.sizeFormatted);
      
      log(`  ${nameCol} ${size}`);
    });
    
    log('');
    logDivider();
  }
  
  // LICENSE WARNINGS (legacy - for packages not caught by license risk)
  const problematicLicenses = findProblematicLicenses(licenses);
  if (problematicLicenses.length > 0 && (!licenseRiskData.warnings || licenseRiskData.warnings.length === 0)) {
    logSection('⚖️  LICENSE WARNINGS', problematicLicenses.length);
    
    problematicLicenses.forEach(pkg => {
      const type = pkg.type === 'restrictive' 
        ? chalk.red('Restrictive') 
        : chalk.yellow('Unknown');
      log(`  ${chalk.bold(pkg.package)} - ${type} (${pkg.license})`);
    });
    
    log(chalk.gray('\n  Note: Restrictive licenses may require legal review\n'));
    logDivider();
  }
  
  // PROJECT HEALTH
  logSection('📊 PROJECT HEALTH');
  
  const scoreColor = getScoreColor(score.total);
  log(`  Overall Score:              ${scoreColor(score.total + '/10')}`);
  log(`  Total Dependencies:         ${chalk.cyan(totalDeps)}`);
  
  if (securityData.metadata.total > 0) {
    log(`  Security Vulnerabilities:   ${chalk.red(securityData.metadata.total)}`);
  }
  
  if (supplyChainData.total > 0) {
    log(`  Supply Chain Warnings:      ${chalk.red(supplyChainData.total)}`);
  }
  
  if (alerts.length > 0) {
    log(`  Ecosystem Alerts:           ${chalk.red(alerts.length)}`);
  }
  
  if (predictiveWarnings.length > 0) {
    log(`  Predictive Warnings:        ${chalk.yellow(predictiveWarnings.length)}`);
  }
  
  if (licenseRiskData.warnings && licenseRiskData.warnings.length > 0) {
    log(`  License Risks:              ${chalk.yellow(licenseRiskData.warnings.length)}`);
  }
  
  if (qualityData.stats) {
    const { abandoned, deprecated, stale } = qualityData.stats;
    const total = (abandoned || 0) + (deprecated || 0) + (stale || 0);
    if (total > 0) {
      log(`  Quality Issues:             ${chalk.yellow(total)}`);
    }
  }
  
  log(`  Unused:                     ${chalk.red(unusedDeps.length)}`);
  log(`  Outdated:                   ${chalk.yellow(outdatedDeps.length)}\n`);
  
  logDivider();
  
  // NEW v2.7.0 - SECURITY RECOMMENDATIONS
  if (recommendations.length > 0) {
    displaySecurityRecommendations(recommendations, score.total);
  } else {
    displayQuickWins(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData);
  }
}

// NEW v2.7.0 - Display Security Recommendations
function displaySecurityRecommendations(recommendations, currentScore) {
  const grouped = groupByPriority(recommendations);
  const impact = calculateExpectedImpact(recommendations, currentScore);
  
  logSection('💡 SECURITY RECOMMENDATIONS (Prioritized)');
  
  // CRITICAL
  if (grouped.critical.length > 0) {
    log(chalk.red.bold('\n🔴 CRITICAL (Fix Immediately)\n'));
    grouped.critical.forEach((rec, index) => {
      log(`  ${index + 1}. ${chalk.bold(rec.issue)}`);
      if (rec.package) {
        log(`     Package: ${chalk.red(rec.package)}`);
      }
      log(`     ${chalk.cyan('Action:')} ${rec.action}`);
      if (rec.command) {
        log(chalk.gray(`     $ ${rec.command}`));
      }
      if (rec.alternative) {
        log(chalk.gray(`     ${rec.alternative}`));
      }
      log('');
    });
  }
  
  // HIGH
  if (grouped.high.length > 0) {
    log(chalk.red('\n🟠 HIGH (Fix Soon)\n'));
    grouped.high.slice(0, 5).forEach((rec, index) => {
      log(`  ${index + 1}. ${rec.issue}`);
      if (rec.package) {
        log(`     Package: ${chalk.yellow(rec.package)}`);
      }
      log(`     ${chalk.cyan('Action:')} ${rec.action}`);
      if (rec.command) {
        log(chalk.gray(`     $ ${rec.command}`));
      }
      log('');
    });
    
    if (grouped.high.length > 5) {
      log(chalk.gray(`  ... and ${grouped.high.length - 5} more high-priority items\n`));
    }
  }
  
  // MEDIUM
  if (grouped.medium.length > 0) {
    log(chalk.yellow('\n🟡 MEDIUM (Plan to Fix)\n'));
    grouped.medium.slice(0, 3).forEach((rec, index) => {
      log(`  ${index + 1}. ${rec.issue}`);
      if (rec.package) {
        log(`     Package: ${chalk.gray(rec.package)}`);
      }
      log(`     ${chalk.cyan('Action:')} ${rec.action}`);
      log('');
    });
    
    if (grouped.medium.length > 3) {
      log(chalk.gray(`  ... and ${grouped.medium.length - 3} more medium-priority items\n`));
    }
  }
  
  // Expected Impact
  log(chalk.cyan.bold('\n📈 Expected Impact:\n'));
  log(`  ${chalk.green('✓')} Current Health Score: ${chalk.yellow(impact.currentScore + '/10')}`);
  log(`  ${chalk.green('✓')} Expected Score: ${chalk.green(impact.expectedScore + '/10')}`);
  log(`  ${chalk.green('✓')} Improvement: ${chalk.cyan('+' + impact.improvement)} points (${impact.percentageIncrease}% increase)`);
  log(`  ${chalk.green('✓')} Issues Resolved: ${impact.critical + impact.high + impact.medium} critical/high/medium`);
  
  if (grouped.critical.length > 0) {
    log(`  ${chalk.green('✓')} Eliminate ${impact.critical} critical security risks`);
  }
  if (grouped.high.length > 0) {
    log(`  ${chalk.green('✓')} Resolve ${impact.high} high-priority issues`);
  }
  
  log(chalk.cyan('\n💡 TIP: Run') + chalk.bold(' devcompass fix ') + chalk.cyan('to apply automated fixes!\n'));
  
  logDivider();
}

// Original Quick Wins (fallback)
function displayQuickWins(alerts, unusedDeps, outdatedDeps, score, totalDeps, securityData) {
  const hasCriticalAlerts = alerts.some(a => a.severity === 'critical' || a.severity === 'high');
  const hasCriticalSecurity = securityData.metadata.critical > 0 || securityData.metadata.high > 0;
  
  if (hasCriticalSecurity || hasCriticalAlerts || unusedDeps.length > 0) {
    logSection('💡 QUICK WINS');
    
    // Fix security vulnerabilities first
    if (hasCriticalSecurity) {
      log('  🔐 Fix security vulnerabilities:\n');
      log(chalk.cyan(`  npm audit fix\n`));
    }
    
    // Fix critical alerts
    if (hasCriticalAlerts) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
      
      log('  🔴 Fix critical issues:\n');
      
      criticalAlerts.forEach(alert => {
        if (alert.fix && alert.fix.includes('.')) {
          // It's a version number
          log(chalk.cyan(`  npm install ${alert.package}@${alert.fix}`));
        } else {
          log(chalk.gray(`  ${alert.package}: ${alert.fix}`));
        }
      });
      
      log('');
    }
    
    // Remove unused deps
    if (unusedDeps.length > 0) {
      log('  🧹 Clean up unused dependencies:\n');
      
      const packagesToRemove = unusedDeps.map(d => d.name).join(' ');
      log(chalk.cyan(`  npm uninstall ${packagesToRemove}\n`));
    }
    
    // Show expected impact
    const alertPenalty = calculateAlertPenalty(alerts.filter(a => a.severity !== 'critical' && a.severity !== 'high'));
    const improvedScore = calculateScore(
      totalDeps - unusedDeps.length,
      0,
      outdatedDeps.length,
      alerts.length - alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
      alertPenalty,
      0 // Assume security issues fixed
    );
    
    log('  Expected impact:');
    
    if (hasCriticalSecurity) {
      log(`  ${chalk.green('✓')} Resolve security vulnerabilities`);
    }
    
    if (hasCriticalAlerts) {
      log(`  ${chalk.green('✓')} Resolve critical stability issues`);
    }
    
    if (unusedDeps.length > 0) {
      log(`  ${chalk.green('✓')} Remove ${unusedDeps.length} unused package${unusedDeps.length > 1 ? 's' : ''}`);
      log(`  ${chalk.green('✓')} Reduce node_modules size`);
    }
    
    const improvedScoreColor = getScoreColor(improvedScore.total);
    log(`  ${chalk.green('✓')} Improve health score → ${improvedScoreColor(improvedScore.total + '/10')}\n`);
    
    log(chalk.cyan('💡 TIP: Run') + chalk.bold(' devcompass fix ') + chalk.cyan('to apply these fixes automatically!\n'));
    
    logDivider();
  }
}

// v3.1.3 - Export both analyze (CLI command) and analyzeProject (for internal use)
module.exports = { analyze, analyzeProject };