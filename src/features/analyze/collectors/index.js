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
 * @property {boolean} needsNetwork
 * @property {boolean} [usesGitHubApi]  only runs when includeEcosystem is set
 * @property {(ctx: {projectPath: string, packageJson: object, graph: object|null}) => Promise<Array>} run
 * @property {(collector: import('../../../core/services/issue-collector').IssueCollector, data: Array) => void} addTo
 * @property {string} incompleteMessage  shown when this collector reports incomplete: true
 */
const COLLECTORS = [
  {
    id: 'cve',
    label: 'CVE',
    needsNetwork: true,
    run: (ctx) => collectCVEData(ctx.projectPath, ctx.packageJson, ctx.graph),
    addTo: (collector, data) => collector.addCVEIssues(data),
    incompleteMessage: 'Vulnerability results below may be missing entries — this is not a confirmed clean scan.'
  },
  {
    id: 'license',
    label: 'License',
    needsNetwork: false,
    run: (ctx) => collectLicenseData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addLicenseIssues(data),
    incompleteMessage: 'License results below may be incomplete.'
  },
  {
    id: 'quality',
    label: 'Quality',
    needsNetwork: true,
    run: (ctx) => collectQualityData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addQualityIssues(data),
    incompleteMessage: 'Quality results below may be incomplete.'
  },
  {
    id: 'security',
    label: 'Security',
    needsNetwork: true,
    run: (ctx) => collectSecurityData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addSecurityIssues(data),
    incompleteMessage: 'Vulnerability/supply-chain warnings below may be missing entries — this is not a confirmed clean scan.'
  },
  {
    id: 'outdated',
    label: 'Outdated',
    needsNetwork: true,
    run: (ctx) => collectOutdatedData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addOutdatedIssues(data),
    incompleteMessage: 'This is not a confirmation that all packages are up to date.'
  },
  {
    id: 'unused',
    label: 'Unused',
    needsNetwork: false,
    run: (ctx) => collectUnusedData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addUnusedIssues(data),
    incompleteMessage: 'Unused-dependency results below may be incomplete.'
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    needsNetwork: true,
    usesGitHubApi: true,
    run: (ctx) => collectEcosystemData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addEcosystemIssues(data),
    incompleteMessage: 'Ecosystem alerts below may be missing entries.'
  },
  {
    id: 'predictive',
    label: 'Predictive',
    needsNetwork: true,
    usesGitHubApi: true,
    run: (ctx) => collectPredictiveData(ctx.projectPath, ctx.packageJson),
    addTo: (collector, data) => collector.addPredictiveIssues(data),
    incompleteMessage: 'Bug-activity warnings below may be missing entries for those packages.'
  }
];

// The ecosystem/predictive checks call GitHub's API (60 requests/hour
// without a token), so they only run when the caller asks for them.
function resolveEnabledCollectors({ includeEcosystem = true } = {}) {
  return COLLECTORS.filter(collector => !collector.usesGitHubApi || includeEcosystem);
}

module.exports = { COLLECTORS, resolveEnabledCollectors };
