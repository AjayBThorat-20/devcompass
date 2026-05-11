const fs = require('fs');
const path = require('path');

class Validators {
  static isValidProjectPath(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      return fs.existsSync(packageJsonPath);
    } catch (error) {
      return false;
    }
  }

  static hasPackageJson(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('No package.json found in project directory');
    }
    
    try {
      require(packageJsonPath);
      return true;
    } catch (error) {
      throw new Error('Invalid package.json format');
    }
  }

  static hasPackageLock(projectPath) {
    const lockPath = path.join(projectPath, 'package-lock.json');
    return fs.existsSync(lockPath);
  }

  static isValidPackageName(name) {
    const pattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
    return pattern.test(name);
  }

  static isValidVersion(version) {
    if (version === 'latest') return true;
    const pattern = /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/;
    return pattern.test(version);
  }

  static validateIssue(issue) {
    const required = ['name', 'version', 'type', 'severity'];
    return required.every(field => issue[field] !== undefined);
  }

  static validateFixAction(action) {
    const required = ['package', 'action'];
    return required.every(field => action[field] !== undefined);
  }
}

module.exports = { Validators };