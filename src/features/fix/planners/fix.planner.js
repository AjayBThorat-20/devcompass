// src/features/fix/planners/fix.planner.js

const semver = require('semver');
const { categorizeFixes } = require('../../../core/services/risk-classifier');

class FixPlanner {
  constructor(issues, { directDependencies = null, removeUnused = false } = {}) {
    this.issues = issues;
    // Set of names declared in package.json; null means "unknown" (treat all as direct).
    this.directDependencies = directDependencies;
    this.removeUnused = removeUnused;
  }

  isDirect(name) {
    return !this.directDependencies || this.directDependencies.has(name);
  }

  // Installing a transitive package at top level adds a new direct dependency
  // and leaves the vulnerable nested copy in place, so these become manual
  // review items (`npm audit fix`, or an `overrides` entry) instead of
  // updates.
  markTransitive(issues) {
    return issues.map(issue => {
      const updatable = issue.type === 'security' || issue.type === 'outdated';
      if (!updatable || this.isDirect(issue.name)) return issue;
      return { ...issue, safeFix: false, metadata: { ...(issue.metadata || {}), transitive: true } };
    });
  }

  generatePlan() {
    const issues = this.markTransitive(this.dedupeUnusedVsUpdate(this.issues));
    const { safe, moderate, risky } = categorizeFixes(issues);
    return {
      safe: this.createFixActions(safe, 'safe'),
      moderate: this.createFixActions(moderate, 'moderate'),
      risky: this.createFixActions(risky, 'risky'),
      summary: {
        totalIssues: this.issues.length,
        safeCount: safe.length,
        moderateCount: moderate.length,
        riskyCount: risky.length
      }
    };
  }

  // A package that's unused doesn't need a version update too — removing it
  // supersedes updating it, and without this the plan queues both a
  // 'remove' and an 'update' action for the same package (visible as
  // "removed" immediately followed by "updated" in the fix output, which
  // just re-installs the package that was supposedly unused).
  //
  // Only when removals will actually run (--remove-unused): otherwise the
  // update is all that happens to a vulnerable package, and dropping it would
  // leave the vulnerability with no action at all. Only findings that would
  // become an update or a replacement are superseded — a typosquat match on
  // an unused package still needs a human to look at it.
  dedupeUnusedVsUpdate(issues) {
    if (!this.removeUnused) return issues;
    const unusedNames = new Set(issues.filter(issue => issue.type === 'unused').map(issue => issue.name));
    if (unusedNames.size === 0) return issues;
    return issues.filter(issue => {
      if (!unusedNames.has(issue.name)) return true;
      const wouldUpdate = (issue.type === 'security' || issue.type === 'outdated') && this.extractTargetVersion(issue.fix);
      const wouldReplace = (issue.type === 'quality' || issue.type === 'license') && issue.metadata?.alternative;
      return !(wouldUpdate || wouldReplace);
    });
  }

  createFixActions(issues, riskLevel) {
    return issues.map(issue => ({
      id: issue.id,
      package: issue.name,
      currentVersion: issue.version,
      targetVersion: this.extractTargetVersion(issue.fix),
      action: this.determineAction(issue, this.extractTargetVersion(issue.fix)),
      type: issue.type,
      severity: issue.severity,
      message: issue.message,
      fix: issue.fix,
      riskLevel,
      riskInfo: issue.riskInfo,
      metadata: issue.metadata
    }));
  }

  determineAction(issue, targetVersion) {
    if (issue.type === 'unused') return 'remove';
    if (issue.type === 'security' || issue.type === 'outdated') {
      // No concrete version to move to (npm audit's "Run npm audit fix", or
      // an advisory with no fixed release yet) — installing @latest instead
      // could cross a major version, even in safe mode.
      if (issue.metadata?.transitive || !targetVersion) return 'review';
      return 'update';
    }
    if (issue.type === 'quality' || issue.type === 'license') {
      return issue.metadata?.alternative ? 'replace' : 'review';
    }
    return 'review';
  }

  extractTargetVersion(fixText) {
    if (!fixText) return null;
    const match = fixText.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  }

  getExecutableActions(plan, mode = 'safe') {
    return selectActions(plan, mode);
  }
}

function createFixPlan(issues, options = {}) {
  return new FixPlanner(issues, options).generatePlan();
}

// The one place that decides what a given mode actually applies. The fix
// preview and the executor both call this, so what a user is shown and what
// then runs can't drift apart.
//
// Removing a package is always an explicit choice: unused detection is a
// heuristic, so removals need `--remove-unused`, whatever the mode — `--all`
// on its own never uninstalls anything.
function selectActions(plan, mode = 'safe', { removeUnused = false } = {}) {
  let actions;
  if (mode === 'safe') actions = [...plan.safe];
  else if (mode === 'moderate') actions = [...plan.safe, ...plan.moderate];
  else if (mode === 'all') actions = [...plan.safe, ...plan.moderate, ...plan.risky];
  else return [];

  if (!removeUnused) return collapseUpdates(actions.filter(action => action.action !== 'remove'));

  // With the flag, removals are in regardless of mode — otherwise
  // `fix --remove-unused` on its own would silently do nothing, since
  // unused findings are always classified risky.
  const removals = [...plan.safe, ...plan.moderate, ...plan.risky].filter(a => a.action === 'remove');
  const seen = new Set(actions.map(a => a.id));
  return collapseUpdates([...actions, ...removals.filter(a => !seen.has(a.id))]);
}

// A package can have both a security fix and an outdated update selected
// (minimist 1.2.5 -> 1.2.6 and -> 1.2.8): install the highest one once,
// instead of installing twice. Both were already allowed by the mode.
function collapseUpdates(actions) {
  const best = new Map();
  for (const action of actions) {
    if (action.action !== 'update') continue;
    const current = best.get(action.package);
    if (!current || semver.gt(semver.coerce(action.targetVersion), semver.coerce(current.targetVersion))) best.set(action.package, action);
  }
  return actions.filter(action => action.action !== 'update' || best.get(action.package) === action);
}

module.exports = { FixPlanner, createFixPlan, selectActions };
