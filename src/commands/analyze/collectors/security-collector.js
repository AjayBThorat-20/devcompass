const dynamicSecurity = require('../../../services/dynamic-security');

async function collectSecurityData(projectPath) {
  try {
    const result = await dynamicSecurity.analyzeProject(projectPath);
    
    return {
      typosquatting: result.typosquatting || [],
      suspiciousScripts: result.suspiciousScripts || [],
      vulnerabilities: result.vulnerabilities || []
    };
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Security collection failed:', error.message);
    }
    return {
      typosquatting: [],
      suspiciousScripts: [],
      vulnerabilities: []
    };
  }
}

module.exports = { collectSecurityData };