// src/features/analyze/collectors/bundle-size.service.js

const path = require('path');
const fs = require('fs');

async function analyzeBundleSizes(projectPath, dependencies) {
  const sizes = [];
  if (!dependencies || typeof dependencies !== 'object') return sizes;

  for (const packageName of Object.keys(dependencies)) {
    try {
      const packagePath = path.join(projectPath, 'node_modules', packageName);
      if (!fs.existsSync(packagePath)) continue;

      const size = getDirectorySize(packagePath);
      const sizeInKB = Math.round(size / 1024);

      sizes.push({ name: packageName, size: sizeInKB, sizeFormatted: formatSize(sizeInKB) });
    } catch (error) {
      continue;
    }
  }

  sizes.sort((a, b) => b.size - a.size);
  return sizes;
}

function getDirectorySize(dirPath, depth = 0) {
  if (depth > 50) return 0;

  let totalSize = 0;
  let items = [];

  try {
    items = fs.readdirSync(dirPath);
  } catch (error) {
    return 0;
  }

  for (const item of items) {
    try {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      if (stats.isFile()) totalSize += stats.size;
      else if (stats.isDirectory()) totalSize += getDirectorySize(itemPath, depth + 1);
    } catch (error) {
      continue;
    }
  }

  return totalSize;
}

function formatSize(kb) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function findHeavyPackages(sizes) {
  return Array.isArray(sizes) ? sizes.filter(pkg => pkg.size > 1024) : [];
}

module.exports = { analyzeBundleSizes, findHeavyPackages, formatSize };