// src/core/utils/errors.js

class DepvoraError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') { super(message); this.name = 'DepvoraError'; this.code = code; }
}

class ValidationError extends DepvoraError {
  constructor(message) { super(message, 'VALIDATION_ERROR'); this.name = 'ValidationError'; }
}

class ProjectError extends DepvoraError {
  constructor(message) { super(message, 'PROJECT_ERROR'); this.name = 'ProjectError'; }
}

class AnalysisError extends DepvoraError {
  constructor(message) { super(message, 'ANALYSIS_ERROR'); this.name = 'AnalysisError'; }
}

class FixError extends DepvoraError {
  constructor(message) { super(message, 'FIX_ERROR'); this.name = 'FixError'; }
}

function handleError(error) {
  if (error instanceof DepvoraError) {
    console.error(`\n❌ ${error.message}\n`);
    if (process.env.DEBUG) console.error(error.stack);
    process.exit(1);
  } else {
    console.error('\n❌ An unexpected error occurred:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { DepvoraError, ValidationError, ProjectError, AnalysisError, FixError, handleError };
