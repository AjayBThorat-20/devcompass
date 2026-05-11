class DevCompassError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'DevCompassError';
    this.code = code;
  }
}

class ValidationError extends DevCompassError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class ProjectError extends DevCompassError {
  constructor(message) {
    super(message, 'PROJECT_ERROR');
    this.name = 'ProjectError';
  }
}

class AnalysisError extends DevCompassError {
  constructor(message) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}

class FixError extends DevCompassError {
  constructor(message) {
    super(message, 'FIX_ERROR');
    this.name = 'FixError';
  }
}

function handleError(error) {
  if (error instanceof DevCompassError) {
    console.error(`\n❌ ${error.message}\n`);
    
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    
    process.exit(1);
  } else {
    console.error('\n❌ An unexpected error occurred:', error.message);
    
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

module.exports = {
  DevCompassError,
  ValidationError,
  ProjectError,
  AnalysisError,
  FixError,
  handleError
};