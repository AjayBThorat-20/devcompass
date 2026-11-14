// src/index.js
//
// AR-07: a public programmatic API, so other tools (bots, dashboards, CI
// wrappers) can build on DevCompass's core without shelling out to the CLI
// and parsing text/JSON output. These signatures are part of the semver
// promise (see package.json's "exports" field) — a breaking change to any
// of them is a major-version bump, same as a removed CLI flag.

const { runAnalyze } = require('./features/analyze');
const { createFixPlan } = require('./features/fix/planners/fix.planner');
const { loadProjectConfig, applyIgnores } = require('./core/config/project-config');
const { evaluatePolicy } = require('./core/services/policy-gate');
const { saveBaseline, loadBaseline, applyBaseline } = require('./core/services/baseline');
const { HealthCalculator } = require('./core/services/health-calculator');
const { loadDependencyGraph } = require('./core/graph');
const { why } = require('./core/graph/why');

module.exports = {
  analyze: runAnalyze,
  createFixPlan,
  loadProjectConfig,
  applyIgnores,
  evaluatePolicy,
  saveBaseline,
  loadBaseline,
  applyBaseline,
  HealthCalculator,
  loadDependencyGraph,
  why
};
