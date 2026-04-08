// src/analyzers/unused-deps.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


async function findUnusedDeps(projectPath, dependencies) {
  try {
    // Create a temporary knip config if it doesn't exist
    const knipConfigPath = path.join(projectPath, 'knip.json');
    const hasKnipConfig = fs.existsSync(knipConfigPath);
    
    // If no knip config exists, create a minimal one
    if (!hasKnipConfig) {
      const minimalConfig = {
        entry: ['src/index.js', 'index.js', 'main.js', 'app.js', 'server.js'],
        project: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        ignore: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '.next/**',
          'coverage/**',
          'out/**',
          '*.min.js'
        ],
        ignoreDependencies: [
          // Framework core packages that may not be directly imported
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
          
          // Build tools used in config files
          'webpack',
          'vite',
          'rollup',
          'esbuild',
          
          // Testing frameworks
          'jest',
          'vitest',
          'mocha',
          
          // CSS/PostCSS (used in config files)
          'postcss',
          'autoprefixer',
          'tailwindcss',
          'cssnano',
          
          // Linting/Formatting (used in config files)
          'prettier',
          'eslint',
          
          // Self-reference
          'devcompass'
        ]
      };
      
      // Write temporary config
      fs.writeFileSync(knipConfigPath, JSON.stringify(minimalConfig, null, 2));
    }

    // Run knip with JSON reporter
    const knipCommand = `npx knip --no-progress --reporter json`;
    
    let result;
    try {
      result = execSync(knipCommand, {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
    } catch (execError) {
      // Knip exits with code 1 if it finds issues, which is expected
      // We still want to parse the output
      if (execError.stdout) {
        result = execError.stdout;
      } else {
        throw execError;
      }
    } finally {
      // Clean up temporary config if we created it
      if (!hasKnipConfig && fs.existsSync(knipConfigPath)) {
        fs.unlinkSync(knipConfigPath);
      }
    }

    // Parse knip JSON output
    let knipResults;
    try {
      knipResults = JSON.parse(result);
    } catch (parseError) {
      console.error('Warning: Could not parse knip output');
      return [];
    }
    
    // Extract unused dependencies from knip results
    const unusedDeps = [];
    const seenDeps = new Set();
    
    // Knip output structure varies, handle different formats
    if (knipResults.issues) {
      // Format 1: issues object with file paths as keys
      for (const [file, issues] of Object.entries(knipResults.issues)) {
        if (issues.dependencies) {
          issues.dependencies.forEach(dep => {
            // Handle both string and object formats
            const depName = typeof dep === 'string' ? dep : (dep.name || dep);
            if (typeof depName === 'string' && !seenDeps.has(depName)) {
              seenDeps.add(depName);
              unusedDeps.push({ name: depName });
            }
          });
        }
      }
    } else if (knipResults.dependencies) {
      // Format 2: direct dependencies array
      knipResults.dependencies.forEach(dep => {
        const depName = typeof dep === 'string' ? dep : (dep.name || dep);
        if (typeof depName === 'string' && !seenDeps.has(depName)) {
          seenDeps.add(depName);
          unusedDeps.push({ name: depName });
        }
      });
    } else if (knipResults.files) {
      // Format 3: files array with dependency info
      knipResults.files.forEach(file => {
        if (file.dependencies) {
          file.dependencies.forEach(dep => {
            const depName = typeof dep === 'string' ? dep : (dep.name || dep);
            if (typeof depName === 'string' && !seenDeps.has(depName)) {
              seenDeps.add(depName);
              unusedDeps.push({ name: depName });
            }
          });
        }
      });
    }

    // Filter out @types packages and common false positives
    const filtered = unusedDeps.filter(dep => {
      const name = dep.name;
      
      // Safety check: ensure name is a string
      if (typeof name !== 'string') {
        return false;
      }
      
      // Keep all non-@types packages
      if (!name.startsWith('@types/')) {
        return true;
      }
      
      // For @types packages, only flag if the base package is also unused
      const baseName = name.replace('@types/', '');
      const hasBasePackage = dependencies[baseName];
      const baseIsUnused = unusedDeps.some(d => d.name === baseName);
      
      // Only flag @types if base package exists and is also unused
      return hasBasePackage && baseIsUnused;
    });

    return filtered;
    
  } catch (error) {
    // If knip fails completely, fall back to empty array
    // This prevents the entire analysis from failing
    console.error('Warning: Knip analysis failed:', error.message);
    
    // Try a simple fallback: check for obviously unused deps
    return fallbackUnusedCheck(projectPath, dependencies);
  }
}

/**
 * Fallback method if knip fails
 * Simple check for packages that are never imported
 */
function fallbackUnusedCheck(projectPath, dependencies) {
  try {
    const unusedDeps = [];
    
    // Read all JS/TS files
    const { execSync } = require('child_process');
    const projectFiles = execSync(
      'find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules',
      { cwd: projectPath, encoding: 'utf8' }
    ).split('\n').filter(Boolean);

    // Read all file contents
    let allContent = '';
    projectFiles.forEach(file => {
      try {
        const filePath = path.join(projectPath, file);
        allContent += fs.readFileSync(filePath, 'utf8');
      } catch (err) {
        // Skip files that can't be read
      }
    });

    // Check each dependency
    Object.keys(dependencies).forEach(dep => {
      // Skip certain packages that are known to be used indirectly
      const skipPackages = [
        'typescript', '@types/', 'eslint', 'prettier',
        'webpack', 'vite', 'rollup', 'esbuild',
        'jest', 'vitest', 'mocha',
        'react', 'react-dom', 'next',
        'devcompass'
      ];
      
      const shouldSkip = skipPackages.some(skip => 
        dep === skip || dep.startsWith(skip)
      );
      
      if (shouldSkip) {
        return;
      }

      // Check if package is imported anywhere
      const requirePattern = new RegExp(`require\\(['"\`]${dep}['"\`]\\)`, 'g');
      const importPattern = new RegExp(`import .* from ['"\`]${dep}['"\`]`, 'g');
      
      const hasRequire = requirePattern.test(allContent);
      const hasImport = importPattern.test(allContent);
      
      if (!hasRequire && !hasImport) {
        unusedDeps.push({ name: dep });
      }
    });

    return unusedDeps;
    
  } catch (fallbackError) {
    console.error('Warning: Fallback unused check failed:', fallbackError.message);
    return [];
  }
}

module.exports = { findUnusedDeps };