// src/features/alerts/version-resolver.service.js

const path = require('path');
const fs = require('fs');

async function resolveInstalledVersions(projectPath, dependencies) {
  const installedVersions = {};
  if (!dependencies || typeof dependencies !== 'object') return installedVersions;

  for (const [packageName, declaredVersion] of Object.entries(dependencies)) {
    // Multi-character range operators like ">=" need a `+` quantifier here, or
    // only the first character gets stripped (">=1.2.3" -> "=1.2.3", still an
    // invalid version) when node_modules doesn't have this package installed
    // and this fallback value is used as-is downstream.
    const cleanVersion = typeof declaredVersion === 'string' ? declaredVersion.replace(/^[\^~>=<\s]+/, '') : declaredVersion;

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
        installedVersions[packageName] = { name: packageName, version: cleanVersion, declaredVersion };
      }
    } catch (error) {
      // Installed package.json exists but couldn't be read/parsed (corrupt
      // install, permission error) — fall back to the declared version
      // instead of silently dropping the package from every downstream check.
      installedVersions[packageName] = { name: packageName, version: cleanVersion, declaredVersion };
    }
  }

  return installedVersions;
}

module.exports = { resolveInstalledVersions };