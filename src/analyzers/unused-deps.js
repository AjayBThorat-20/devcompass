// src/analyzers/unused-deps.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


async function findUnusedDeps(projectPath, dependencies) {
  // ✅ FIXED: Validate inputs
  if (!projectPath || typeof projectPath !== 'string') {
    console.error('Invalid project path provided to findUnusedDeps');
    return [];
  }

  if (!dependencies || typeof dependencies !== 'object') {
    console.error('Invalid dependencies object provided to findUnusedDeps');
    return [];
  }

  try {
    // Create a temporary knip config if it doesn't exist
    const knipConfigPath = path.join(projectPath, 'knip.json');
    let hasKnipConfig = false;
    
    // ✅ FIXED: Safe file existence check
    try {
      hasKnipConfig = fs.existsSync(knipConfigPath);
    } catch (error) {
      console.error('Warning: Could not check for knip config:', error.message);
      hasKnipConfig = false;
    }
    
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
      
      // Write temporary config with error handling
      try {
        fs.writeFileSync(knipConfigPath, JSON.stringify(minimalConfig, null, 2));
      } catch (writeError) {
        console.error('Warning: Could not create temporary knip config:', writeError.message);
        // Continue without config - knip will use defaults
      }
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
      if (!hasKnipConfig) {
        try {
          if (fs.existsSync(knipConfigPath)) {
            fs.unlinkSync(knipConfigPath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors - file system might be locked
          console.error('Warning: Could not clean up temporary knip config:', cleanupError.message);
        }
      }
    }

    // ✅ FIXED: Validate result before parsing
    if (!result || typeof result !== 'string') {
      console.error('Warning: Knip returned invalid output');
      return fallbackUnusedCheck(projectPath, dependencies);
    }

    // Parse knip JSON output
    let knipResults;
    try {
      knipResults = JSON.parse(result);
    } catch (parseError) {
      console.error('Warning: Could not parse knip output:', parseError.message);
      return fallbackUnusedCheck(projectPath, dependencies);
    }
    
    // ✅ FIXED: Validate knipResults is an object
    if (!knipResults || typeof knipResults !== 'object') {
      console.error('Warning: Knip returned invalid results structure');
      return fallbackUnusedCheck(projectPath, dependencies);
    }

    // Extract unused dependencies from knip results
    const unusedDeps = [];
    const seenDeps = new Set();
    
    // Knip output structure varies, handle different formats
    if (knipResults.issues && typeof knipResults.issues === 'object') {
      // Format 1: issues object with file paths as keys
      for (const [file, issues] of Object.entries(knipResults.issues)) {
        // ✅ FIXED: Validate issues object
        if (!issues || typeof issues !== 'object') continue;
        
        if (Array.isArray(issues.dependencies)) {
          issues.dependencies.forEach(dep => {
            // Handle both string and object formats
            const depName = typeof dep === 'string' ? dep : (dep?.name || null);
            if (typeof depName === 'string' && depName.length > 0 && !seenDeps.has(depName)) {
              seenDeps.add(depName);
              unusedDeps.push({ name: depName });
            }
          });
        }
      }
    } else if (Array.isArray(knipResults.dependencies)) {
      // Format 2: direct dependencies array
      knipResults.dependencies.forEach(dep => {
        const depName = typeof dep === 'string' ? dep : (dep?.name || null);
        if (typeof depName === 'string' && depName.length > 0 && !seenDeps.has(depName)) {
          seenDeps.add(depName);
          unusedDeps.push({ name: depName });
        }
      });
    } else if (Array.isArray(knipResults.files)) {
      // Format 3: files array with dependency info
      knipResults.files.forEach(file => {
        // ✅ FIXED: Validate file object
        if (!file || typeof file !== 'object') return;
        
        if (Array.isArray(file.dependencies)) {
          file.dependencies.forEach(dep => {
            const depName = typeof dep === 'string' ? dep : (dep?.name || null);
            if (typeof depName === 'string' && depName.length > 0 && !seenDeps.has(depName)) {
              seenDeps.add(depName);
              unusedDeps.push({ name: depName });
            }
          });
        }
      });
    }

    // Filter out @types packages and common false positives
    const filtered = unusedDeps.filter(dep => {
      // ✅ FIXED: Validate dep object
      if (!dep || typeof dep !== 'object') {
        return false;
      }

      const name = dep.name;
      
      // Safety check: ensure name is a string
      if (typeof name !== 'string' || name.length === 0) {
        return false;
      }
      
      // Keep all non-@types packages
      if (!name.startsWith('@types/')) {
        return true;
      }
      
      // For @types packages, only flag if the base package is also unused
      const baseName = name.replace('@types/', '');
      const hasBasePackage = dependencies[baseName] !== undefined;
      const baseIsUnused = unusedDeps.some(d => d?.name === baseName);
      
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
  // ✅ FIXED: Validate inputs
  if (!projectPath || typeof projectPath !== 'string') {
    console.error('Invalid project path in fallback check');
    return [];
  }

  if (!dependencies || typeof dependencies !== 'object') {
    console.error('Invalid dependencies in fallback check');
    return [];
  }

  try {
    const unusedDeps = [];
    
    // Read all JS/TS files
    let projectFiles = [];
    
    try {
      const findResult = execSync(
        'find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules',
        { 
          cwd: projectPath, 
          encoding: 'utf8',
          timeout: 10000, // 10 second timeout
          maxBuffer: 5 * 1024 * 1024 // 5MB buffer
        }
      );
      
      // ✅ FIXED: Validate findResult
      if (typeof findResult === 'string') {
        projectFiles = findResult.split('\n').filter(file => 
          typeof file === 'string' && file.length > 0
        );
      }
    } catch (findError) {
      console.error('Warning: Could not find project files:', findError.message);
      return [];
    }

    // ✅ FIXED: Return early if no files found
    if (projectFiles.length === 0) {
      console.error('Warning: No project files found for unused dependency check');
      return [];
    }

    // Read all file contents
    let allContent = '';
    projectFiles.forEach(file => {
      try {
        const filePath = path.join(projectPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // ✅ FIXED: Validate content
        if (typeof content === 'string') {
          allContent += content;
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });

    // ✅ FIXED: Return early if no content
    if (allContent.length === 0) {
      console.error('Warning: No content found in project files');
      return [];
    }

    // Check each dependency
    Object.keys(dependencies).forEach(dep => {
      // ✅ FIXED: Validate dependency name
      if (typeof dep !== 'string' || dep.length === 0) {
        return;
      }

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

      // ✅ FIXED: Wrap regex creation in try-catch
      try {
        // Escape special regex characters in package name
        const escapedDep = dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Check if package is imported anywhere
        const requirePattern = new RegExp(`require\\(['"\`]${escapedDep}['"\`]\\)`, 'g');
        const importPattern = new RegExp(`import .* from ['"\`]${escapedDep}['"\`]`, 'g');
        
        const hasRequire = requirePattern.test(allContent);
        const hasImport = importPattern.test(allContent);
        
        if (!hasRequire && !hasImport) {
          unusedDeps.push({ name: dep });
        }
      } catch (regexError) {
        // Skip packages that cause regex errors (likely malformed names)
        console.error(`Warning: Could not check dependency "${dep}":`, regexError.message);
      }
    });

    return unusedDeps;
    
  } catch (fallbackError) {
    console.error('Warning: Fallback unused check failed:', fallbackError.message);
    return [];
  }
}

module.exports = { findUnusedDeps };