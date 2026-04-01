const { matchIssues } = require('./matcher');
const { formatAlerts } = require('./formatter');
const { resolveInstalledVersions } = require('./resolver');
const path = require('path');
const fs = require('fs');

async function checkEcosystemAlerts(projectPath, dependencies) {
  try {
    // Load issues database
    const issuesDbPath = path.join(__dirname, '../../data/issues-db.json');
    
    if (!fs.existsSync(issuesDbPath)) {
      return []; // No alerts if database doesn't exist
    }
    
    const issuesDb = JSON.parse(fs.readFileSync(issuesDbPath, 'utf8'));
    
    // Resolve installed versions from node_modules
    const installedVersions = await resolveInstalledVersions(projectPath, dependencies);
    
    // Match issues against installed versions
    const alerts = matchIssues(installedVersions, issuesDb);
    
    return alerts;
  } catch (error) {
    console.error('Error in checkEcosystemAlerts:', error.message);
    return []; // Return empty array on error, don't break analysis
  }
}

module.exports = { checkEcosystemAlerts };
