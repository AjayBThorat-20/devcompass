// src/analyzers/outdated.js

const ncu = require('npm-check-updates');
const path = require('path');

async function findOutdatedDeps(projectPath, dependencies) {
  try {
    const upgraded = await ncu.run({
      packageFile: path.join(projectPath, 'package.json'),
      upgrade: false,
      silent: true,
      jsonUpgraded: true,
      timeout: 30000,
      dep: 'prod,dev'
    });
    
    const outdatedDeps = Object.entries(upgraded || {}).map(
      ([name, latest]) => {
        const current = (dependencies[name] || '')
          .replace(/^[\^~]/, '');
        
        return {
          name,
          current,
          latest,
          versionsBehind: getVersionDiff(current, latest)
        };
      }
    );
    
    return outdatedDeps;
  } catch (error) {
    console.error('Error in findOutdatedDeps:', error.message);
    throw error;
  }
}

function getVersionDiff(current, latest) {
  const currParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  while (currParts.length < 3) currParts.push(0);
  while (latestParts.length < 3) latestParts.push(0);
  
  if (currParts[0] !== latestParts[0]) {
    return 'major update';
  } else if (currParts[1] !== latestParts[1]) {
    return 'minor update';
  } else {
    return 'patch update';
  }
}

module.exports = { findOutdatedDeps };