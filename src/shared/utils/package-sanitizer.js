// src/shared/utils/package-sanitizer.js

const PACKAGE_NAME_PATTERN = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/;

function sanitizePackageName(name) {
  if (typeof name !== 'string' || !PACKAGE_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid package name: ${name}`);
  }
  return name;
}

function sanitizeVersion(version) {
  if (version === 'latest') return 'latest';
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid version: ${version}`);
  }
  return version;
}

module.exports = { sanitizePackageName, sanitizeVersion };