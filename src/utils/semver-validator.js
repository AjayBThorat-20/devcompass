const semver = require('semver');

class SemverValidator {
  static isValid(version) {
    if (!version || typeof version !== 'string') {
      return false;
    }

    return semver.valid(semver.coerce(version)) !== null;
  }

  static coerce(version) {
    if (!version || typeof version !== 'string') {
      return null;
    }

    return semver.coerce(version);
  }

  static clean(version) {
    if (!version || typeof version !== 'string') {
      return null;
    }

    const cleaned = version.replace(/^[\^~>=<]/, '').trim();
    return this.isValid(cleaned) ? cleaned : null;
  }

  static compare(version1, version2) {
    const v1 = this.coerce(version1);
    const v2 = this.coerce(version2);

    if (!v1 || !v2) {
      return 0;
    }

    return semver.compare(v1, v2);
  }

  static satisfies(version, range) {
    const v = this.coerce(version);

    if (!v) {
      return false;
    }

    try {
      return semver.satisfies(v, range);
    } catch (error) {
      return false;
    }
  }

  static getUpdateType(current, latest) {
    const currentVer = this.coerce(current);
    const latestVer = this.coerce(latest);

    if (!currentVer || !latestVer) {
      return 'unknown';
    }

    if (semver.major(latestVer) > semver.major(currentVer)) {
      return 'major';
    }

    if (semver.minor(latestVer) > semver.minor(currentVer)) {
      return 'minor';
    }

    if (semver.patch(latestVer) > semver.patch(currentVer)) {
      return 'patch';
    }

    return 'latest';
  }

  static extractMajor(version) {
    const v = this.coerce(version);
    return v ? semver.major(v) : null;
  }

  static extractMinor(version) {
    const v = this.coerce(version);
    return v ? semver.minor(v) : null;
  }

  static extractPatch(version) {
    const v = this.coerce(version);
    return v ? semver.patch(v) : null;
  }

  static isPrerelease(version) {
    const v = this.coerce(version);
    if (!v) return false;

    const prerelease = semver.prerelease(v);
    return prerelease && prerelease.length > 0;
  }

  static maxSatisfying(versions, range) {
    const validVersions = versions
      .map(v => this.coerce(v))
      .filter(v => v !== null);

    if (validVersions.length === 0) {
      return null;
    }

    try {
      return semver.maxSatisfying(validVersions, range);
    } catch (error) {
      return null;
    }
  }
}

module.exports = SemverValidator;