const { NPMExecutor } = require('./npm-executor');

class FixExecutor {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.npmExecutor = new NPMExecutor(projectPath);
    this.results = {
      successful: [],
      failed: [],
      skipped: []
    };
  }

  async executeActions(actions) {
    for (const action of actions) {
      const result = await this.executeAction(action);
      
      if (result.success) {
        this.results.successful.push(result);
      } else {
        this.results.failed.push(result);
      }
    }

    return this.results;
  }

  async executeAction(action) {
    try {
      if (action.action === 'update') {
        return await this.executeUpdate(action);
      } else if (action.action === 'remove') {
        return await this.executeRemove(action);
      } else if (action.action === 'replace') {
        return await this.executeReplace(action);
      } else {
        return {
          success: false,
          action: action.action,
          package: action.package,
          error: 'Unsupported action type'
        };
      }
    } catch (error) {
      return {
        success: false,
        action: action.action,
        package: action.package,
        error: error.message
      };
    }
  }

  async executeUpdate(action) {
    const result = this.npmExecutor.executeUpdate(
      action.package,
      action.targetVersion
    );

    return {
      ...result,
      action: 'update',
      from: action.currentVersion,
      to: action.targetVersion
    };
  }

  async executeRemove(action) {
    const result = this.npmExecutor.executeRemove(action.package);

    return {
      ...result,
      action: 'remove'
    };
  }

  async executeReplace(action) {
    const replacement = action.metadata?.alternative?.replacement;
    
    if (!replacement) {
      return {
        success: false,
        action: 'replace',
        package: action.package,
        error: 'No replacement package specified'
      };
    }

    const result = this.npmExecutor.executeReplace(
      action.package,
      replacement,
      'latest'
    );

    return {
      ...result,
      action: 'replace',
      from: action.package,
      to: replacement
    };
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