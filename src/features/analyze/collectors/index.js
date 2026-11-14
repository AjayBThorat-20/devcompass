// src/features/analyze/collectors/index.js
//
// The collector registry: every check `analyze` runs is one entry here, so
// adding a check means writing one collector file and adding one entry,
// instead of editing runAnalyze()'s hardcoded list, its result
// destructuring, and its "scan incomplete" messages separately.

const { collectCVEData } = require('./cve.collector');
const { collectLicenseData } = require('./license.collector');
const { collectQualityData } = require('./quality.collector');
const { collectSecurityData } = require('./security.collector');
const { collectOutdatedData, collectUnusedData } = require('./dependency.collector');
const { collectEcosystemData } = require('./ecosystem.collector');
const { collectPredictiveData } = require('./predictive.collector');

/**
 * @typedef {object} Collector
 * @property {string} id
 * @property {string} label  used in "<label> scan incomplete" messages
 * @property {boolean} needsNetwork  skipped by --offline
 * @property {boolean} defaultEnabled  whether it runs when nothing (a CLI
 *   flag or devcompass.config.json's checks.<id>.enabled) says otherwise
 * @property {(ctx: {projectPath: string, packageJson: object, graph: object|null}) => Promise<Array>} run
 * @property {(collector: import('../../../core/services/issue-collector').IssueCollector, data: Array) => void} addTo
 * @property {string} incompleteMessage  shown when this collector reports incomplete: true
 */
const COLLECTORS = [
  {
    id: 'cve',
    label: 'CVE',
    needsNetwork: true,
    defaultEnabled: true,
    run: (ctx) => collectCVEData(ctx.projectPath, ctx.packageJson, ctx.graph),
    addTo: (collector, data) => collector.addCVEIssues(data),
    incompleteMessage: 'Vulnerability results below may be missing entries — this is not a confirmed clean scan.'
  },
  {
    id: 'license',
    label: 'License',
    // License data comes from the npm registry (cached), so --offline skips
    // it; --fail-on-license still works offline, from the lockfile.
    needsNetwork: true,
    defaultEnabled: true,
    run: (ctx) => collectLicenseData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addLicenseIssues(data),
    incompleteMessage: 'License results below may be incomplete.'
  },
  {
    id: 'quality',
    label: 'Quality',
    needsNetwork: true,
    defaultEnabled: true,
    run: (ctx) => collectQualityData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addQualityIssues(data),
    incompleteMessage: 'Quality results below may be incomplete.'
  },
  {
    id: 'security',
    label: 'Security',
    needsNetwork: true,
    defaultEnabled: true,
    run: (ctx) => collectSecurityData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addSecurityIssues(data),
    incompleteMessage: 'Vulnerability/supply-chain warnings below may be missing entries — this is not a confirmed clean scan.'
  },
  {
    id: 'outdated',
    label: 'Outdated',
    needsNetwork: true,
    defaultEnabled: true,
    run: (ctx) => collectOutdatedData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addOutdatedIssues(data),
    incompleteMessage: 'This is not a confirmation that all packages are up to date.'
  },
  {
    id: 'unused',
    label: 'Unused',
    needsNetwork: false,
    defaultEnabled: true,
    run: (ctx) => collectUnusedData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addUnusedIssues(data),
    incompleteMessage: 'Unused-dependency results below may be incomplete.'
  },
  {
    // Off unless --ecosystem or checks.ecosystem.enabled opts in: it calls
    // GitHub's API, which allows only 60 requests an hour without a token.
    id: 'ecosystem',
    label: 'Ecosystem',
    needsNetwork: true,
    defaultEnabled: false,
    run: (ctx) => collectEcosystemData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addEcosystemIssues(data),
    incompleteMessage: 'Ecosystem alerts below may be missing entries.'
  },
  {
    // Same GitHub API limit as ecosystem, and opted into by the same flag.
    id: 'predictive',
    label: 'Predictive',
    needsNetwork: true,
    defaultEnabled: false,
    run: (ctx) => collectPredictiveData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addPredictiveIssues(data),
    incompleteMessage: 'Bug-activity warnings below may be missing entries for those packages.'
  }
];

const GITHUB_API_CHECKS = ['ecosystem', 'predictive'];

// Which collectors run: devcompass.config.json's checks.<id>.enabled wins;
// otherwise ecosystem/predictive follow includeEcosystem (--ecosystem) and
// the rest follow their own defaultEnabled. offline then drops anything
// that needs the network, whatever turned it on.
function resolveEnabledCollectors({ checksConfig = {}, offline = false, includeEcosystem = false } = {}) {
  const knownIds = COLLECTORS.map(c => c.id);
  const unknown = Object.keys(checksConfig).filter(id => !knownIds.includes(id));
  if (unknown.length > 0) {
    throw new Error(`devcompass.config.json: unknown check${unknown.length > 1 ? 's' : ''} ${unknown.map(id => `"${id}"`).join(', ')} under "checks" (valid: ${knownIds.join(', ')})`);
  }

  return COLLECTORS.filter(collector => {
    if (offline && collector.needsNetwork) return false;
    const enabled = checksConfig[collector.id]?.enabled;
    if (typeof enabled === 'boolean') return enabled;
    if (GITHUB_API_CHECKS.includes(collector.id)) return includeEcosystem;
    return collector.defaultEnabled;
  });
}

module.exports = { COLLECTORS, resolveEnabledCollectors };
