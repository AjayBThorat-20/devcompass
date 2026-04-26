// src/analyzers/unused-deps.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load knip configuration from JSON
const knipConfigData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/knip-config.json'), 'utf8')
);

async function analyzeUnusedDependencies(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return [];
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    };

    // Create knip config if it doesn't exist
    const knipConfigPath = path.join(projectPath, 'knip.json');
    if (!fs.existsSync(knipConfigPath)) {
      fs.writeFileSync(
        knipConfigPath,
        JSON.stringify(knipConfigData, null, 2)
      );
    }

    try {
      // Run knip to detect unused dependencies
      const knipOutput = execSync('npx knip --reporter json', {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const results = JSON.parse(knipOutput);
      let unused = [];

      // Parse knip output
      if (results.issues) {
        unused = results.issues
          .filter(issue => issue.type === 'unlisted' || issue.type === 'unresolved')
          .map(issue => issue.symbol)
          .filter(dep => dependencies[dep]);
      }

      // Filter out packages from skipPackages
      unused = unused.filter(pkg => 
        !knipConfigData.skipPackages.some(skip => pkg.includes(skip))
      );

      // ✅ RETURN STRINGS (not objects) - this is what the code expects
      return unused;

    } catch (knipError) {
      // Fallback if knip fails
       console.log('Knip analysis unavailable, using fallback');
      return fallbackUnusedCheck(projectPath, dependencies);
    }

  } catch (error) {
    console.error('Unused dependencies analysis failed:', error.message);
    return [];
  }
}

/**
 * Fallback mechanism when knip fails
 */
function fallbackUnusedCheck(projectPath, dependencies) {
  const unused = [];

  for (const dep of Object.keys(dependencies)) {
    // Skip packages from skipPackages
    if (knipConfigData.skipPackages.some(skip => dep.includes(skip))) {
      continue;
    }

    try {
      // Simple check: does package appear in any JS/TS files?
      const grepCmd = `grep -r "${dep}" ${projectPath}/src ${projectPath}/index.js ${projectPath}/main.js 2>/dev/null || true`;
      const result = execSync(grepCmd, { encoding: 'utf-8', timeout: 5000 });

      if (!result || result.trim().length === 0) {
        unused.push(dep);
      }
    } catch {
      // If grep fails, skip this package
      continue;
    }
  }

  // ✅ RETURN STRINGS (not objects)
  return unused;
}

// Export all expected function names
module.exports = { 
  analyzeUnusedDependencies,
  findUnusedDeps: analyzeUnusedDependencies  // Alias for backward compatibility
};