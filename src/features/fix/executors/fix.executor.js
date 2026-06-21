// src/features/fix/executors/fix.executor.js

const { NPMExecutor } = require('./npm.executor');

class FixExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.npmExecutor = new NPMExecutor(projectPath);
    this.results = { successful: [], failed: [], skipped: [] };
  }

  async executeActions(actions, onProgress) {
    if (!Array.isArray(actions)) return this.results;

    for (const action of actions) {
      const result = await this.executeAction(action);

      if (result.success) {
        this.results.successful.push(result);
      } else {
        this.results.failed.push(result);
      }

      if (typeof onProgress === 'function') {
        try {
          onProgress(action, result.success, result);
        } catch (error) {
          if (process.env.DEBUG) console.error('Progress callback error:', error.message);
        }
      }
    }

    return this.results;
  }

  async executeAction(action) {
    if (!action || !action.action || !action.package) {
      return { success: false, action: action?.action || 'unknown', package: action?.package || 'unknown', error: 'Invalid action object' };
    }

    try {
      if (action.action === 'update') return await this.executeUpdate(action);
      if (action.action === 'remove') return await this.executeRemove(action);
      if (action.action === 'replace') return await this.executeReplace(action);
      return { success: false, action: action.action, package: action.package, error: 'Unsupported action type' };
    } catch (error) {
      return { success: false, action: action.action, package: action.package, error: error.message };
    }
  }

  async executeUpdate(action) {
    const result = this.npmExecutor.executeUpdate(action.package, action.targetVersion);
    return { ...result, action: 'update', from: action.currentVersion, to: action.targetVersion };
  }

  async executeRemove(action) {
    const result = this.npmExecutor.executeRemove(action.package);
    return { ...result, action: 'remove' };
  }

  async executeReplace(action) {
    const replacement = action.metadata?.alternative?.replacement || action.metadata?.alternative;
    if (!replacement) {
      return { success: false, action: 'replace', package: action.package, error: 'No replacement package specified' };
    }
    const result = this.npmExecutor.executeReplace(action.package, replacement, 'latest');
    return { ...result, action: 'replace', from: action.package, to: replacement };
  }

  getResults() {
    return this.results;
  }

  getSummary() {
    return {
      total: this.results.successful.length + this.results.failed.length + this.results.skipped.length,
      successful: this.results.successful.length,
      failed: this.results.failed.length,
      skipped: this.results.skipped.length
    };
  }
}

module.exports = { FixExecutor };