const depcheck = require('depcheck');

async function findUnusedDeps(projectPath, dependencies) {
  const options = {
    ignoreBinPackage: false,
    skipMissing: true,
    ignorePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      'out/**',
      '*.min.js'
    ],
    ignoreMatches: [
      'react',
      'react-dom',
      'react-native',
      'next',
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser',
      '@nestjs/core',
      '@nestjs/common',
      '@nestjs/platform-express',
      'typescript',
      '@types/*',
      'webpack',
      'vite',
      'rollup',
      'esbuild',
      'jest',
      'vitest',
      'mocha',
      '@testing-library/*'
    ]
    // REMOVED parsers - let depcheck use defaults
  };
  
  try {
    const results = await depcheck(projectPath, options);
    const unusedDeps = results.dependencies.map(name => ({ name }));
    return unusedDeps;
  } catch (error) {
    console.error('Error in findUnusedDeps:', error.message);
    throw error;
  }
}

module.exports = { findUnusedDeps };