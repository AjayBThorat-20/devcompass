// src/analyzers/bundle-size.js
const path = require('path');
const fs = require('fs');

/**
 * Get package sizes from node_modules
 */
async function analyzeBundleSizes(projectPath, dependencies) {
  const sizes = [];
  
  for (const packageName of Object.keys(dependencies)) {
    try {
      const packagePath = path.join(projectPath, 'node_modules', packageName);
      
      if (!fs.existsSync(packagePath)) {
        continue;
      }
      
      const size = await getDirectorySize(packagePath);
      const sizeInKB = Math.round(size / 1024);
      
      sizes.push({
        name: packageName,
        size: sizeInKB,
        sizeFormatted: formatSize(sizeInKB)
      });
      
    } catch (error) {
      // Skip packages we can't measure
      continue;
    }
  }
  
  // Sort by size (largest first)
  sizes.sort((a, b) => b.size - a.size);
  
  return sizes;
}

/**
 * Get total size of directory recursively
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      totalSize += getDirectorySize(itemPath);
    }
  }
  
  return totalSize;
}

/**
 * Format size in human-readable format
 */
function formatSize(kb) {
  if (kb < 1024) {
    return `${kb} KB`;
  } else {
    const mb = (kb / 1024).toFixed(1);
    return `${mb} MB`;
  }
}

/**
 * Identify heavy packages (> 1MB)
 */
function findHeavyPackages(sizes) {
  return sizes.filter(pkg => pkg.size > 1024); // > 1MB
}

module.exports = { 
  analyzeBundleSizes,
  findHeavyPackages,
  formatSize
};