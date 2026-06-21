// src/features/analyze/collectors/outdated.collector.js

const ncu = require('npm-check-updates');
const path = require('path');
const fs = require('fs');

async function findOutdatedDeps(projectPath, dependencies = {}) {
  try {
    const packageFilePath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageFilePath)) return [];

    const upgraded = await ncu.run({
      packageFile: packageFilePath,
      upgrade: false,
      silent: true,
      jsonUpgraded: true,
      timeout: 30000,
      dep: 'prod,dev'
    });

    if (!upgraded || typeof upgraded !== 'object') return [];

    return Object.entries(upgraded).map(([name, latest]) => {
      const declared = dependencies[name] || '';
      const current = typeof declared === 'string' ? declared.replace(/^[\^~]/, '') : declared;

      return { name, current, latest, versionsBehind: getVersionDiff(current, latest) };
    });
  } catch (error) {
    if (process.env.DEBUG) console.error('Error in findOutdatedDeps:', error.message);
    return [];
  }
}

function getVersionDiff(current, latest) {
  if (!current || !latest) return 'unknown';

  const currParts = String(current).split('.').map(Number);
  const latestParts = String(latest).split('.').map(Number);

  while (currParts.length < 3) currParts.push(0);
  while (latestParts.length < 3) latestParts.push(0);

  if (currParts.some(isNaN) || latestParts.some(isNaN)) return 'unknown';

  if (currParts[0] !== latestParts[0]) return 'major update';
  if (currParts[1] !== latestParts[1]) return 'minor update';
  return 'patch update';
}

module.exports = { findOutdatedDeps };