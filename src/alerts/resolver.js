// src/alerts/resolver.js
const path = require('path');
const fs = require('fs');

/**
 * Resolve actual installed versions from node_modules
 * This is CRITICAL - we need installed version, not package.json version
 */
async function resolveInstalledVersions(projectPath, dependencies) {
  const installedVersions = {};
  
  for (const [packageName, declaredVersion] of Object.entries(dependencies)) {
    try {
      const packageJsonPath = path.join(
        projectPath,
        'node_modules',
        packageName,
        'package.json'
      );
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        installedVersions[packageName] = {
          name: packageName,
          version: packageJson.version, // Clean version like "1.6.0"
          declaredVersion: declaredVersion // What's in package.json like "^1.6.0"
        };
      } else {
        // Fallback: use declared version (strip prefixes)
        const cleanVersion = declaredVersion.replace(/^[\^~>=<]/, '');
        installedVersions[packageName] = {
          name: packageName,
          version: cleanVersion,
          declaredVersion: declaredVersion
        };
      }
    } catch (error) {
      // Skip packages that can't be resolved
      continue;
    }
  }
  
  return installedVersions;
}

module.exports = { resolveInstalledVersions };
