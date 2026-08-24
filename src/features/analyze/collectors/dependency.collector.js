// src/features/analyze/collectors/dependency.collector.js

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const SemverValidator = require('../../../shared/utils/semver-validator');
const { analyzeUnusedDependencies } = require('./unused-deps.collector');

const execAsync = promisify(exec);

async function collectOutdatedData(projectPath, packageJson = null) {
  try {
    // npm-check-updates compares package.json's declared ranges against the npm
    // registry — it doesn't read package-lock.json at all. Gating on the
    // lockfile's existence meant any yarn/pnpm project (no package-lock.json)
    // or a freshly-cloned npm project (not yet `npm install`ed) silently got
    // zero "outdated" findings, indistinguishable from being fully up to date.
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
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    return Object.entries(outdated).map(([name, latest]) => {
      const current = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name];
      const cleanCurrent = typeof current === 'string' ? current.replace(/^[\^~]/, '') : current;
      return { name, current: cleanCurrent, latest, wanted: latest, updateType: SemverValidator.getUpdateType(cleanCurrent, latest) };
    });
  } catch (error) {
    if (process.env.DEBUG) console.error('Outdated collection failed:', error.message);
    return [];
  }
}

async function collectUnusedData(projectPath, packageJson = null) {
  try {
    return await analyzeUnusedDependencies(projectPath, packageJson);
  } catch (error) {
    if (process.env.DEBUG) console.error('Unused collection failed:', error.message);
    return [];
  }
}

module.exports = { collectOutdatedData, collectUnusedData };