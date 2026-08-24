// src/features/fix/executors/npm.executor.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sanitizePackageName, sanitizeVersion } = require('../../../shared/utils/package-sanitizer');

class NPMExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  executeUpdate(packageName, version) {
    try {
      const safePackageName = sanitizePackageName(packageName);
      const safeVersion = sanitizeVersion(version);
      execSync(`npm install ${safePackageName}@${safeVersion}`, { cwd: this.projectPath, stdio: 'pipe', timeout: 60000 });
      return { success: true, package: packageName, version };
    } catch (error) {
      return { success: false, package: packageName, error: error.message };
    }
  }

  executeRemove(packageName) {
    try {
      const safePackageName = sanitizePackageName(packageName);
      execSync(`npm uninstall ${safePackageName}`, { cwd: this.projectPath, stdio: 'pipe', timeout: 60000 });
      return { success: true, package: packageName };
    } catch (error) {
      return { success: false, package: packageName, error: error.message };
    }
  }

  executeReplace(oldPackage, newPackage, version = 'latest') {
    try {
      const oldVersion = this.getInstalledVersion(oldPackage);
      const removeResult = this.executeRemove(oldPackage);
      if (!removeResult.success) return removeResult;

      const installResult = this.executeUpdate(newPackage, version);
      if (!installResult.success) {
        const rollback = oldVersion ? this.executeUpdate(oldPackage, oldVersion) : { success: false };
        return {
          ...installResult,
          rolledBack: rollback.success,
          error: rollback.success
            ? `${installResult.error} (rolled back to ${oldPackage}@${oldVersion})`
            : `${installResult.error} (rollback failed: project now has neither ${oldPackage} nor ${newPackage})`
        };
      }
      return installResult;
    } catch (error) {
      return { success: false, package: oldPackage, replacement: newPackage, error: error.message };
    }
  }

  getInstalledVersion(packageName) {
    // Uses Node's own module resolution (walks up node_modules the same way
    // require() does) instead of only checking the flat top-level path, so
    // hoisting differences / nested-only installs are still found. A false
    // null here means executeReplace can't roll back a failed replacement,
    // leaving the project with neither the old nor the new package installed.
    try {
      const resolvedPkgJsonPath = require.resolve(`${packageName}/package.json`, { paths: [this.projectPath] });
      const installed = JSON.parse(fs.readFileSync(resolvedPkgJsonPath, 'utf8'));
      if (installed.version) return installed.version;
    } catch (error) { /* fall through */ }
    return null;
  }
}

module.exports = { NPMExecutor };