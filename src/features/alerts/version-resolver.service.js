// src/features/alerts/version-resolver.service.js

const path = require('path');
const fs = require('fs');

async function resolveInstalledVersions(projectPath, dependencies) {
  const installedVersions = {};
  if (!dependencies || typeof dependencies !== 'object') return installedVersions;

  for (const [packageName, declaredVersion] of Object.entries(dependencies)) {
    try {
      const packageJsonPath = path.join(projectPath, 'node_modules', packageName, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        installedVersions[packageName] = {
          name: packageName,
          version: packageJson.version,
          declaredVersion
        };
      } else {
        const cleanVersion = typeof declaredVersion === 'string' ? declaredVersion.replace(/^[\^~>=<]/, '') : declaredVersion;
        installedVersions[packageName] = { name: packageName, version: cleanVersion, declaredVersion };
      }
    } catch (error) {
      continue;
    }
  }

  return installedVersions;
}

module.exports = { resolveInstalledVersions };