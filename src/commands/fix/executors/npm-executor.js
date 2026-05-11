const { execSync } = require('child_process');

class NPMExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  executeUpdate(packageName, version) {
    try {
      const safePackageName = this.sanitizePackageName(packageName);
      const safeVersion = this.sanitizeVersion(version);
      
      const command = `npm install ${safePackageName}@${safeVersion}`;
      
      execSync(command, {
        cwd: this.projectPath,
        stdio: 'pipe',
        timeout: 60000
      });

      return { success: true, package: packageName, version };
    } catch (error) {
      return { 
        success: false, 
        package: packageName, 
        error: error.message 
      };
    }
  }

  executeRemove(packageName) {
    try {
      const safePackageName = this.sanitizePackageName(packageName);
      
      const command = `npm uninstall ${safePackageName}`;
      
      execSync(command, {
        cwd: this.projectPath,
        stdio: 'pipe',
        timeout: 60000
      });

      return { success: true, package: packageName };
    } catch (error) {
      return { 
        success: false, 
        package: packageName, 
        error: error.message 
      };
    }
  }

  executeReplace(oldPackage, newPackage, version = 'latest') {
    try {
      const removeResult = this.executeRemove(oldPackage);
      if (!removeResult.success) {
        return removeResult;
      }

      const installResult = this.executeUpdate(newPackage, version);
      return installResult;
    } catch (error) {
      return {
        success: false,
        package: oldPackage,
        replacement: newPackage,
        error: error.message
      };
    }
  }

  sanitizePackageName(name) {
    if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
      throw new Error(`Invalid package name: ${name}`);
    }
    return name;
  }

  sanitizeVersion(version) {
    if (version === 'latest') return 'latest';
    if (!/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/.test(version)) {
      throw new Error(`Invalid version: ${version}`);
    }
    return version;
  }
}

module.exports = { NPMExecutor };