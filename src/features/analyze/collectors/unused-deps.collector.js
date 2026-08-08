// src/features/analyze/collectors/unused-deps.collector.js

const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const OutputManager = require('../../../shared/utils/output-manager');

let knipConfigData = null;
try {
  knipConfigData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../../data/knip-config.json'), 'utf8')
  );
} catch (error) {
  if (process.env.DEBUG) console.error('Could not load knip-config.json:', error.message);
  knipConfigData = { skipPackages: [] };
}

async function analyzeUnusedDependencies(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return [];

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };

    // Written under .devcompass/temp instead of the project root — a bare
    // "knip.json" there would leak into the scanned project's own repo/git status.
    const outputManager = new OutputManager(projectPath);
    const knipConfigPath = outputManager.getTempPath('knip.json');
    try {
      // skipPackages is not part of knip's config schema; it's applied separately
      // below (JS-side) and must not be written into the knip.json file itself.
      const { skipPackages, ...knipSchemaConfig } = knipConfigData;
      fs.writeFileSync(knipConfigPath, JSON.stringify(knipSchemaConfig, null, 2));
    } catch (error) {
      if (process.env.DEBUG) console.error('Could not write knip.json, using fallback detector:', error.message);
      return fallbackUnusedCheck(projectPath, dependencies);
    }

    try {
      // knip exits non-zero whenever it finds issues (its normal/expected behavior,
      // not an execution failure), so execSync's thrown error still carries valid
      // JSON on stdout and must be read from there rather than treated as a failure.
      let knipOutput;
      try {
        knipOutput = execSync(`npx knip --config ${JSON.stringify(knipConfigPath)} --reporter json`, {
          cwd: projectPath,
          encoding: 'utf-8',
          timeout: 30000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (execError) {
        if (typeof execError.stdout !== 'string' || !execError.stdout.trim()) throw execError;
        knipOutput = execError.stdout;
      }

      const results = JSON.parse(knipOutput);
      let unused = [];

      if (Array.isArray(results.issues)) {
        const names = new Set();
        results.issues.forEach(fileIssue => {
          [...(fileIssue.dependencies || []), ...(fileIssue.devDependencies || [])].forEach(dep => {
            if (dep?.name) names.add(dep.name);
          });
        });
        unused = Array.from(names).filter(dep => dependencies[dep]);
      }

      const skipPackages = knipConfigData.skipPackages || [];
      unused = unused.filter(pkg => !skipPackages.some(skip => pkg.includes(skip)));

      return unused;
    } catch (knipError) {
      if (process.env.DEBUG) console.error('Knip analysis unavailable, using fallback:', knipError.message);
      return fallbackUnusedCheck(projectPath, dependencies);
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('Unused dependencies analysis failed:', error.message);
    return [];
  }
}

function fallbackUnusedCheck(projectPath, dependencies) {
  const unused = [];
  const skipPackages = knipConfigData.skipPackages || [];

  for (const dep of Object.keys(dependencies)) {
    if (skipPackages.some(skip => dep.includes(skip))) continue;

    try {
      const srcDir = path.join(projectPath, 'src');
      const candidatePaths = [srcDir, path.join(projectPath, 'index.js'), path.join(projectPath, 'main.js')]
        .filter(p => fs.existsSync(p));

      if (candidatePaths.length === 0) continue;

      // execFile (no shell) so a crafted dependency name in the scanned project's
      // own package.json can't break out of the command and run arbitrary shell code.
      try {
        execFileSync('grep', ['-r', '-l', '--', dep, ...candidatePaths], { encoding: 'utf-8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
        // exit 0: at least one match found, so the dependency is used
      } catch (grepError) {
        if (grepError.status === 1) unused.push(dep); // exit 1: no match anywhere
        // any other exit code/signal is inconclusive — don't flag it as unused
      }
    } catch (error) {
      continue;
    }
  }

  return unused;
}

module.exports = { analyzeUnusedDependencies, fallbackUnusedCheck };