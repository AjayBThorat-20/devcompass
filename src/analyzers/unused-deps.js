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
      // Framework core packages
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
      
      // Build tools
      'webpack',
      'vite',
      'rollup',
      'esbuild',
      
      // Testing
      'jest',
      'vitest',
      'mocha',
      '@testing-library/*',
      
      // CSS/PostCSS (used in config files)
      'postcss',
      'autoprefixer',
      'tailwindcss',
      'cssnano',
      
      // Linting/Formatting (used in config files)
      'prettier',
      'eslint',
      'eslint-config-*',
      '@eslint/*',
      'eslint-plugin-*',
      
      // Self-reference (don't flag devcompass as unused)
      'devcompass'
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