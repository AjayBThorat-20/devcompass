const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function collectOutdatedData(projectPath) {
  try {
    const packageLockPath = path.join(projectPath, 'package-lock.json');
    if (!fs.existsSync(packageLockPath)) {
      if (process.env.DEBUG) {
        console.log('No package-lock.json found, skipping outdated check');
      }
      return [];
    }

    const output = execSync('npx npm-check-updates --jsonUpgraded', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 30000
    });

    const outdated = JSON.parse(output);
    
    return Object.entries(outdated).map(([name, latest]) => {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = require(packageJsonPath);
      const current = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name];
      
      return {
        name,
        current: current?.replace(/^[\^~]/, ''),
        latest,
        wanted: latest,
        updateType: getUpdateType(current, latest)
      };
    });
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Outdated collection failed:', error.message);
    }
    return [];
  }
}

async function collectUnusedData(projectPath) {
  try {
    const knipConfigPath = path.join(projectPath, 'knip.json');
    if (!fs.existsSync(knipConfigPath)) {
      if (process.env.DEBUG) {
        console.log('No knip.json found, skipping unused check');
      }
      return [];
    }

    const output = execSync('npx knip --json', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 30000
    });

    const result = JSON.parse(output);
    return result.dependencies || [];
  } catch (error) {
    if (process.env.DEBUG) {
      console.error('Unused collection failed:', error.message);
    }
    return [];
  }
}

function getUpdateType(current, latest) {
  if (!current || !latest) return 'unknown';
  
  const currClean = current.replace(/^[\^~]/, '');
  const [currMajor, currMinor] = currClean.split('.').map(Number);
  const [latestMajor, latestMinor] = latest.split('.').map(Number);
  
  if (latestMajor > currMajor) return 'major';
  if (latestMinor > currMinor) return 'minor';
  return 'patch';
}

module.exports = {
  collectOutdatedData,
  collectUnusedData
};
