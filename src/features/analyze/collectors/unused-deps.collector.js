// src/features/analyze/collectors/unused-deps.collector.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

    const knipConfigPath = path.join(projectPath, 'knip.json');
    if (!fs.existsSync(knipConfigPath)) {
      try {
        fs.writeFileSync(knipConfigPath, JSON.stringify(knipConfigData, null, 2));
      } catch (error) {
        if (process.env.DEBUG) console.error('Could not write knip.json, using fallback detector:', error.message);
        return fallbackUnusedCheck(projectPath, dependencies);
      }
    }

    try {
      const knipOutput = execSync('npx knip --reporter json', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const results = JSON.parse(knipOutput);
      let unused = [];

      if (results.issues) {
        unused = results.issues
          .filter(issue => issue.type === 'unlisted' || issue.type === 'unresolved')
          .map(issue => issue.symbol)
          .filter(dep => dependencies[dep]);
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
        .filter(p => fs.existsSync(p))
        .map(p => `"${p}"`)
        .join(' ');

      if (!candidatePaths) continue;

      const grepCmd = `grep -r "${dep}" ${candidatePaths} 2>/dev/null || true`;
      const result = execSync(grepCmd, { encoding: 'utf-8', timeout: 5000 });

      if (!result || result.trim().length === 0) unused.push(dep);
    } catch (error) {
      continue;
    }
  }

  return unused;
}

module.exports = { analyzeUnusedDependencies };