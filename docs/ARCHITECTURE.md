# DevCompass Architecture

This is internal/developer documentation: how the codebase is put together, how
data flows through a command, and where to look when adding or changing
behavior. For install/usage docs see [README.md](../README.md); for the dev
setup and PR process see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Mental model

```
bin/devcompass.js  →  src/cli/commands/*.cmd.js  →  src/features/<name>/  →  src/core/  +  src/shared/
     (entry)              (commander wiring)          (business logic)        (engine)      (infra)
```

- **`bin/devcompass.js`** — the executable. Registers one commander command per
  file in `src/cli/commands/`, plus a special case: run with **no arguments**
  and it skips commander entirely and calls
  `require('../src/features/analyze').runAnalyze({ mode: 'default' })`
  directly.
- **`src/cli/commands/*.cmd.js`** — thin commander.js wiring only. Each file
  exports `function registerXCommand(program) { ... }`. Feature modules are
  `require`d *inside* the `.action()` handler (not at file top), so command
  registration stays cheap even though there are 13 commands.
- **`src/features/<name>/`** — one directory per feature (`analyze`, `fix`,
  `cve`, `history`, `graph`, `ai`, `config`, `backup`, `clean`, `security`,
  `quality`, `alerts`). This is where the actual logic lives. A `.cmd.js` file
  only ever imports its feature's `index.js` (or `<name>.command.js`) — never
  reaches into another feature's internals directly.
- **`src/core/`** — the shared analysis engine: issue model, severity scoring,
  health score, ranking, risk classification. Feature-agnostic; features feed
  it data, it doesn't know about CLI commands.
- **`src/shared/`** — cross-cutting infrastructure used by everything:
  logging, error handling, caching, backups, encryption, the npm registry
  client, process/temp-file lifecycle management.
- **`src/dashboard/`** — a static HTML/CSS/JS app (D3-based) that the `graph`
  feature generates and writes to disk. Not a server — it's templated and
  inlined into one self-contained HTML file per run.

## Directory reference

```
bin/devcompass.js        CLI entrypoint, command registration, no-args→analyze shortcut

src/cli/commands/*.cmd.js   commander definitions, one file per top-level command

src/core/
  models/issue.model.js     canonical Issue class + factory/validator
  services/
    issue-collector.js        merges/dedupes raw collector output into Issue[]
    health-calculator.js       HealthCalculator.calculate(issues) → 0-10 score
    issue-ranker.js            priority scoring, top-N, grouping, safe/risky split
    risk-classifier.js         classifies a fix as safe/moderate/risky
    snapshot-manager.js        bridges core → features/history (the one core→feature dependency)
  formatters/console-formatter.js   shared chalk-based console rendering
  utils/
    severity.js                severity level constants + comparison helpers
    errors.js                  DevCompassError hierarchy + handleError()

src/shared/
  utils/            logger, error-handler, backup-manager/-restorer, encryption,
                     output-manager, analysis-cache, file-cache, rate-limiter,
                     semver-validator, process-manager, temp-cleaner, constants, ...
  services/registry-client.js   npm registry HTTP client (LRU + disk cache, retry/backoff)
  components/       console UI primitives (confirm prompt, header/section display, spinner)

src/features/<name>/
  index.js | <name>.command.js   the ONLY file a .cmd.js ever imports
  *.database.js                  better-sqlite3 schema + queries (singleton), where applicable
  *-loader.js / *-saver.js / *.service.js   business logic on top of the DB
  collectors/ | renderers/       analyze-specific: data gathering vs. output formatting

src/dashboard/            static HTML/CSS/JS template for `graph`/`timeline` output
  index.html                 template with {{GRAPH_DATA}} / {{CLUSTERING_CODE}} placeholders
  scripts/                   utils → tooltip → stats → controls → layouts → core (load order)
  styles/                    base/layout/controls/graph/themes.css

data/*.json                static reference tables (license risk, quality alternatives, ...)
test/unit/*.test.js         node:test unit tests, flat (not mirrored to src/ structure)
```

## Request flow: `devcompass analyze`

`src/features/analyze/index.js` is the clearest example of the whole pattern
end to end:

1. Load `package.json` via `shared/utils/file-cache.js` (mtime-cached read).
2. Run collectors concurrently with `Promise.allSettled` — a failed collector
   degrades to `[]` rather than failing the whole run (`DEBUG=1` logs which
   ones failed):
   - `collectors/cve.collector.js`, `license.collector.js`,
     `quality.collector.js`, `security.collector.js`,
     `dependency.collector.js` (outdated + unused) always run.
   - `ecosystem.collector.js` and `predictive.collector.js` call GitHub's API
     and are skipped in silent/CI mode (`includeEcosystem` option) to keep
     those paths fast.
3. Feed every collector's output into `core/services/issue-collector.js`
   (`collector.addCVEIssues(...)`, etc.) — this is the normalization point:
   it dedupes findings per package (`mergeByPackage`), picks the
   better-informed entry when e.g. both `npm audit` and a CVE lookup flag the
   same package, and maps everything to `core/models/issue.model.js` `Issue`
   instances via `createIssue()`.
4. `collector.getAll()` → `core/services/health-calculator.js`
   `HealthCalculator.calculate(issues)`: starts at `10.0`, subtracts
   `severityPenalty × typePenalty` per issue (severity: CRITICAL 2.0 / HIGH
   1.5 / MEDIUM 1.0 / LOW 0.5; type: security 1.2 / license 1.0 / quality 0.8
   / outdated 0.5 / unused 0.3), clamps to `[0, 10]`.
5. Cache the result (`shared/utils/analysis-cache.js`, 24h TTL, versioned
   against the installed devcompass version) and render it — `renderers/`
   picks default / `--deep` / `--json` output.
6. Unless `--no-history`/silent, `core/services/snapshot-manager.js` →
   `features/history/snapshot-saver.js` persists a snapshot to
   `~/.devcompass/history.db` for later `history`/`compare`/`timeline` use.
7. If `--ci`, compare `healthScore` against `--ci-threshold` (default 7.0) and
   `process.exit(0|1)` — this is what CI gates check.

Other features follow the same shape with less machinery: a command file
dispatches on a subcommand, delegates to a `*.database.js` singleton for
persistence and one or more `*.service.js`/`*-loader.js` files for logic, and
renders with `chalk` directly or via `core/formatters/console-formatter.js`.

## The `Issue` model and scoring pipeline

Every finding — CVE, license conflict, outdated package, unused dependency,
supply-chain flag — is normalized into a `core/models/issue.model.js` `Issue`
before it's scored, ranked, or rendered. This is the contract between
collectors and everything downstream:

```
collector output (raw, shape varies per collector)
  → IssueCollector.add*Issues()   (core/services/issue-collector.js)
  → IssueCollector.getAll()        merges duplicates, returns Issue[]
  → HealthCalculator.calculate()   Issue[] → 0-10 score
  → IssueRanker                    Issue[] → priority-sorted / grouped / safe-vs-risky
  → risk-classifier.classifyFixRisk()   per-issue: safe | moderate | risky
```

If you're adding a new collector (a new source of findings), the integration
point is `IssueCollector` — add an `addXIssues()` method there and a
corresponding `add*Issues()` call in the feature that wires it in (see
`features/analyze/index.js`), not a bespoke scoring path.

> **Known duplication** (worth knowing before you touch severity/priority
> logic): there are four independent severity/priority tables in this
> codebase — `core/utils/severity.js`, the `SEVERITY_WEIGHTS`/`SEVERITY_COLORS`
> exports in `core/models/issue.model.js`, `data/priorities.json`, and the
> inline penalty tables in `health-calculator.js`/`issue-ranker.js`. They
> mostly agree today but aren't derived from one source — if you change
> severity weighting, check all four.

## CLI command pattern

```js
// src/cli/commands/<name>.cmd.js
module.exports = function registerXCommand(program) {
  program
    .command('x <subcommand>')          // or a flat command with --flags
    .description('...')
    .option('--limit <number>', '...', parseIntOption, 30)  // see gotcha below
    .action(async (subcommand, options) => {
      const xCommand = require('../../features/x/x.command');  // lazy require
      await xCommand({ ...options, _: ['x', subcommand] });
    });
};
```

**Commander numeric-option gotcha**: commander calls an option parser as
`parseArg(value, previousValue)`. Passing the bare `parseInt` breaks, because
`previousValue` becomes the radix argument. Every command with a numeric flag
defines a local wrapper:

```js
const parseIntOption = (value) => parseInt(value, 10);
```

Follow this pattern (see `history.cmd.js`, `graph.cmd.js`) rather than passing
`parseInt` directly.

## Databases

better-sqlite3, four independent single-file databases, all global
(`~/.devcompass/*.db`, per-user — distinct from the project-local
`.devcompass/` directory that `shared/utils/output-manager.js` manages for
cache/backups/graphs/reports per analyzed project):

| DB file | Feature | Purpose |
|---|---|---|
| `~/.devcompass/history.db` | `features/history/history.database.js` | `snapshots` / `packages` / `dependencies` tables — every `analyze` run's results, for `history`/`compare`/`timeline` |
| `~/.devcompass/cve.db` | `features/cve/database.js` | `vulnerability_cache` (per name+version+ecosystem, versioned/expiring) + `api_keys` |
| `~/.devcompass/ai.db` | `features/ai/ai.database.js` | `llm_providers`, `ai_conversations`, `ai_usage` (monthly cost/token tracking) |
| `~/.devcompass/config.db` | `features/config/config.database.js` | generic key/value store (`config` table), used by CLI settings and the GitHub token manager |

All are opened in WAL mode with tuned pragmas (`history.database.js`'s
`optimizeDatabase()` is the most complete example: `synchronous=NORMAL`,
`cache_size=10000`, 64MB mmap, `foreign_keys=ON`) and close cleanly on
`SIGINT`/`SIGTERM`/`exit` via a `wal_checkpoint(TRUNCATE)`.

## Dashboard (`graph` / `timeline` output)

The dashboard is not a running server — `features/graph/graph.exporter.js`
(`GraphExporter.generateHTML()`) treats `src/dashboard/index.html` as a
template:

1. String-replaces `{{GRAPH_DATA}}` with `JSON.stringify(...)` of the
   enriched nodes/links/metadata as `window.graphData = {...}`.
2. String-replaces `{{CLUSTERING_CODE}}` with the contents of
   `features/graph/graph.clustering.js` (its `module.exports` stripped),
   inlined straight into a `<script>` tag.
3. `inlineAllAssets()` inlines every file under `styles/*.css` and
   `scripts/*.js` into the HTML too, producing a single self-contained file
   with no dependency beyond the D3 CDN script tag. `generateFallbackHTML()`
   provides a minimal D3 force-graph if the template file is somehow missing.

Client-side JS load order (and rough responsibility split):
`utils.js` (pure helpers) → `tooltip.js` → `stats.js` → `controls.js`
(zoom/pan/search/theme/keyboard shortcuts/export) → `layouts.js` (the
`LayoutEngine` with 5 renderers: tree/force/radial/conflict/analytics) →
`core.js` (bootstrap: validates `window.graphData`, wires everything up,
exposes `window.DevCompass` as the page's public API, defaults to the tree
layout).

If you're changing how the graph looks, `layouts.js` is almost always the
right file. If you're changing what data reaches the page, it's
`graph.exporter.js` and `graph.generator.js`.

## `data/*.json` reference tables

Static lookup tables consumed by collectors/services, not generated at
runtime:

- `license-risks.json` — SPDX id → risk level (AGPL=critical, GPL=high,
  LGPL/MPL/EPL/CDDL=medium, MIT/ISC/BSD/Apache=low). The authoritative table
  for the license collector.
- `licenses.json` — coarser `{restrictive, permissive}` lists; overlaps with
  `license-risks.json`.
- `gpl-alternatives.json` / `quality-alternatives.json` — package name →
  `{replacement, reason}` for the "suggest an alternative" fix path. Adding
  entries here is a listed "good first issue" in CONTRIBUTING.md.
- `popular-packages.json` — known-package whitelist, used to avoid
  false-positive typosquat/unused flags on well-known packages.
- `knip-config.json` — passed straight to the `knip` dependency for unused-
  dependency detection (entry points, ignore globs, framework skip-list).
- `tracked-repos.json` — GitHub repo metadata backing
  `features/alerts/github-tracker.service.js` and the predictive collector.
- `priorities.json` — a fourth severity/priority table (see the duplication
  note above).
- `batch-categories.json` — categories for the (not-yet-implemented) batch
  fix mode.

## Testing

- `npm test` → `node --test test/unit/` (Node's built-in test runner). Flat
  directory, **not** mirrored 1:1 to `src/` — files are named for the
  behavior/regression under test (e.g. `cve-installed-version.test.js`,
  `unused-deps-fallback.test.js`), each importing its target module directly
  by relative path. Most files lead with a comment on *why* that path was
  worth testing (a prior bug, an easy-to-miss edge case) — follow that
  convention for new tests rather than testing-for-coverage's-sake.
- Manual/integration coverage lives in root-level shell scripts
  (`test-all-commands.sh`, `test-production-scenarios.sh`,
  `test-complete-suite.sh`, etc.), run against fixture projects generated by
  `create-test-projects.sh` into `test/project1-simple/` …
  `test/project5-deprecated/` (gitignored, regenerated on demand). These are
  **not** part of `npm test` — CI runs them as an informational, non-blocking
  (`continue-on-error: true`) job (`.github/workflows/ci.yml`,
  `integration-smoke`) against live OSV/npm-registry/GitHub APIs. The
  blocking CI job is `test-and-audit`: `npm ci`, `npm test`,
  `npm audit --audit-level=high`.

## Adding a new command or feature

1. Create `src/features/<name>/` with an `index.js` (or `<name>.command.js`)
   exporting the entrypoint function(s) — this is the only file the CLI layer
   will ever import.
2. If it needs persistence, add `<name>.database.js` following the singleton
   pattern in `features/history/history.database.js` (WAL mode, pragmas,
   close-on-exit handlers) and keep it under `~/.devcompass/` for global state
   or route through `shared/utils/output-manager.js` for per-project state.
3. If it produces findings that should affect the health score, feed them
   through `core/services/issue-collector.js` (`Issue` model) rather than
   building a parallel scoring path.
4. Add `src/cli/commands/<name>.cmd.js`: `program.command(...)`, lazy-require
   the feature inside `.action()`, use the `parseIntOption` wrapper for any
   numeric flags.
5. Register it in `bin/devcompass.js` alongside the other 13
   `require('../src/cli/commands/...')(program)` calls.
6. Add a `test/unit/<behavior>.test.js` for the non-obvious logic, and update
   the README command reference + CHANGELOG for user-facing behavior (per the
   CONTRIBUTING.md PR checklist).
