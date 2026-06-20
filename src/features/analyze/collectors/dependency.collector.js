// src/features/analyze/collectors/dependency.collector.js

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const semver = require('semver');

const execAsync = promisify(exec);

async function collectOutdatedData(projectPath, packageJson = null) {
  try {
    const packageLockPath = path.join(projectPath, 'package-lock.json');
    if (!fs.existsSync(packageLockPath)) return [];

    const { stdout } = await execAsync('npx npm-check-updates --jsonUpgraded', {
      cwd: projectPath,
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    const lines = stdout.split('\n').filter(line => line.trim());
    let jsonLine = null;
    for (const line of lines) {
      if (line.startsWith('{') && line.endsWith('}')) {
        try { JSON.parse(line); jsonLine = line; break; } catch (e) { continue; }
      }
    }
    if (!jsonLine) return [];

    const outdated = JSON.parse(jsonLine);
    if (!packageJson) {
      packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    }

    return Object.entries(outdated).map(([name, latest]) => {
      const current = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name];
      const cleanCurrent = current?.replace(/^[\^~]/, '');
      return { name, current: cleanCurrent, latest, wanted: latest, updateType: getUpdateType(cleanCurrent, latest) };
    });
  } catch (error) {
    if (process.env.DEBUG) console.error('Outdated collection failed:', error.message);
    return [];
  }
}

async function collectUnusedData(projectPath, packageJson = null) {
  try {
    const knipConfigPath = path.join(projectPath, 'knip.json');
    if (!fs.existsSync(knipConfigPath)) return [];

    const { stdout } = await execAsync('npx knip --json', {
      cwd: projectPath,
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    let result;
    try { result = JSON.parse(stdout); } catch (e) { return []; }
    return result.dependencies || [];
  } catch (error) {
    if (process.env.DEBUG) console.error('Unused collection failed:', error.message);
    return [];
  }
}

function getUpdateType(current, latest) {
  if (!current || !latest) return 'unknown';
  const cv = semver.coerce(current);
  const lv = semver.coerce(latest);
  if (!cv || !lv) return 'unknown';
  if (semver.major(lv) > semver.major(cv)) return 'major';
  if (semver.minor(lv) > semver.minor(cv)) return 'minor';
  if (semver.patch(lv) > semver.patch(cv)) return 'patch';
  return 'latest';
}

module.exports = { collectOutdatedData, collectUnusedData };