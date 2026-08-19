// src/features/analyze/collectors/unused-deps.collector.js

const { exec, execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const OutputManager = require('../../../shared/utils/output-manager');

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

let knipConfigData = null;
try {
  knipConfigData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../../data/knip-config.json'), 'utf8')
  );
} catch (error) {
  if (process.env.DEBUG) console.error('Could not load knip-config.json:', error.message);
  knipConfigData = { skipPackages: [] };
}

// Exact-match against the skip list (or its scoped subpaths), not substring —
// "eslint" must not also swallow "eslint-plugin-unicorn", nor "next" swallow "next-auth".
function shouldSkipPackage(pkg, skipPackages) {
  return skipPackages.some(skip => pkg === skip || pkg.startsWith(`${skip}/`));
}

async function analyzeUnusedDependencies(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    }

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
      // not an execution failure), so the rejected promise still carries valid
      // JSON on stdout and must be read from there rather than treated as a failure.
      let knipOutput;
      try {
        ({ stdout: knipOutput } = await execAsync(
          `npx knip --config ${JSON.stringify(knipConfigPath)} --reporter json`,
          { cwd: projectPath, encoding: 'utf-8', timeout: 30000 }
        ));
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
      unused = unused.filter(pkg => !shouldSkipPackage(pkg, skipPackages));

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

async function checkDependencyUsage(dep, candidatePaths) {
  try {
    // execFile (no shell) so a crafted dependency name in the scanned project's
    // own package.json can't break out of the command and run arbitrary shell code.
    await execFileAsync('grep', ['-r', '-l', '--', dep, ...candidatePaths], { encoding: 'utf-8', timeout: 5000 });
    return { dep, used: true }; // exit 0: at least one match found, so the dependency is used
  } catch (grepError) {
    if (grepError.code === 1) return { dep, used: false }; // exit 1: no match anywhere
    return { dep, used: true }; // any other exit code/signal is inconclusive — don't flag it as unused
  }
}

async function fallbackUnusedCheck(projectPath, dependencies) {
  const skipPackages = knipConfigData.skipPackages || [];

  const srcDir = path.join(projectPath, 'src');
  const candidatePaths = [
    srcDir,
    path.join(projectPath, 'index.js'),
    path.join(projectPath, 'main.js'),
    path.join(projectPath, 'scripts'),
  ].filter(p => fs.existsSync(p));

  // Config files commonly reference a dependency (e.g. postcss.config.js,
  // webpack.config.js) without it ever appearing under src/ — check those too.
  const configGlobPatterns = fs.readdirSync(projectPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(config|rc)\.(js|cjs|mjs|json)$|^\.[a-z]+rc$/i.test(entry.name))
    .map(entry => path.join(projectPath, entry.name));
  candidatePaths.push(...configGlobPatterns);

  if (candidatePaths.length === 0) return [];

  const depsToCheck = Object.keys(dependencies).filter(dep => !shouldSkipPackage(dep, skipPackages));

  // Run checks concurrently (bounded) instead of serially — a serial per-dependency
  // execFileSync loop previously blocked the event loop for up to 5s * depCount,
  // stalling the other "concurrent" collectors (CVE/license network calls) in the
  // same Promise.allSettled batch.
  const CONCURRENCY = 8;
  const results = [];
  for (let i = 0; i < depsToCheck.length; i += CONCURRENCY) {
    const batch = depsToCheck.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(dep => checkDependencyUsage(dep, candidatePaths)));
    results.push(...batchResults);
  }

  return results.filter(r => !r.used).map(r => r.dep);
}

module.exports = { analyzeUnusedDependencies, fallbackUnusedCheck };
