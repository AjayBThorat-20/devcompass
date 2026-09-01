# Test & Code Audit — 2026-08-31

Full review of `test/unit/` (the real unit test suite, run via `npm test`) cross-checked
against the `src/` logic each test exercises, plus a follow-up dive into the
highest-risk **untested** code path (`devcompass fix`, which mutates the user's
`package.json`/`node_modules` and runs `npm install`/`uninstall`).

## 1. Test suite health

`npm test` (Node's built-in test runner over `test/unit/*.test.js`): **64/64 passing**, 0 failing, 0 skipped, 0 `.todo`.

All 18 test files were read in full and each assertion was cross-checked against the
source function it exercises (not just "does it pass," but "does the expected value in
the assertion match what the source actually does, or does the test just codify a bug").

| File | Covers | Verdict |
|---|---|---|
| `severity.test.js` | `core/utils/severity.js` | Matches source exactly |
| `health-calculator.test.js` | `core/services/health-calculator.js` | Weights (CRITICAL=2.0…LOW=0.5, security=1.2…unused=0.3) match source exactly |
| `risk-classifier.test.js` | `core/services/risk-classifier.js` | Matches source exactly |
| `package-sanitizer.test.js` | `shared/utils/package-sanitizer.js` | Injection-payload coverage is real (rejects `; `, `` ` ``, `$()`, `\|`, newlines) |
| `encryption.test.js` | `shared/utils/encryption.js` | Legacy sha256 fallback path genuinely tested end-to-end |
| `backup-manager.test.js` | `shared/utils/backup-manager.js` | Path-traversal payloads genuinely rejected |
| `typosquatting.test.js` | `features/quality/dynamic-security.service.js` | mysql2/mysql false-positive guard confirmed |
| `unused-deps-fallback.test.js` | `features/analyze/collectors/unused-deps.collector.js` | Shell-injection-via-package-name guard confirmed with a real canary-file check |
| `version-resolver.test.js` | `features/alerts/version-resolver.service.js` | Corrupt-package.json fallback confirmed |
| `cve-installed-version.test.js`, `cve-scan-incomplete.test.js`, `vulnerability-cache.test.js` | `features/cve/*` | Cache-first querying, installed-version resolution, and the incomplete-scan flag all confirmed against live source |
| `ai-provider-pricing.test.js`, `ai-provider-base-url.test.js`, `ai-daily-cost-limit.test.js` | `features/ai/*` | Per-million pricing, `base_url`→`baseURL` normalization, and cross-process daily spend tracking all confirmed |
| `issue-collector.test.js` | `core/services/issue-collector.js` | Cross-collector dedup confirmed |
| `snapshot-comparator.test.js` | `features/history/*` | Preloaded-snapshot short-circuit confirmed |
| `graph-generator.test.js` | `features/graph/graph.generator.js` | Diamond-dependency de-duplication and circular-link detection confirmed |

**No false/incorrect assertions, no missing logic, and no wrong code found inside the
test suite itself.** It's a well-targeted set of regression tests — every one of them
exists because it pins down a real bug that was fixed, not incidental coverage.

## 2. Test coverage gaps

18 test files cover ~20 of the ~130 files in `src/`. That in itself isn't a problem —
most of the uncovered code is rendering/formatting. The gap that matters is
**`src/features/fix/` has zero test coverage**: every executor, planner, and service
that actually runs `npm install`/`npm uninstall`/`npm audit fix` against the user's
real project is untested. Reviewing that code by hand (since tests couldn't be relied
on to have already caught issues) surfaced the findings below.

Other untested-but-lower-risk areas, for awareness: `features/history/history.database.js`,
`features/config/*`, `features/analyze/issues-analyzer.service.js`, most
`features/analyze/collectors/*`, `features/alerts/*`, `core/services/issue-ranker.js`,
`core/services/snapshot-manager.js`, `shared/utils/backup-restorer.js` (reviewed by hand
below, no bugs found), and the `dashboard/scripts/*` client-side JS.

## 3. Bugs found and fixed

### `src/shared/utils/ci-handler.js` — dead code with a latent bug, deleted
Exported `handleCiMode(score, config, ...)`, which used
`const minScore = config?.minScore || 7;` — if `minScore` were explicitly configured
as `0` (a valid "any score passes" setting), the `||` would silently override it back
to `7`. This function was **never imported or called anywhere in the codebase**
(confirmed via repo-wide grep; only reference left was a changelog entry) — the real
`--ci --threshold` logic is implemented independently and correctly in
`src/features/analyze/index.js:144-159`, which uses a destructuring default
(`ciThreshold = 7.0`) that only applies on `undefined`, not on `0`. Since the buggy
function was unreachable, it was deleted rather than patched.

### `bin/devcompass.js` — stale `--help` text *(fixed earlier this session)*
The `New in v${version}` line under `--help` hardcoded "🔒 Dependency security update
(axios, form-data)" — leftover copy from an old release — while `package.json`'s
version had moved on to 4.1.3, whose actual changelog entry is about regenerating
stale demo GIFs. Corrected to match.

### `src/features/graph/index.js` — `--layout analytics` rejected *(fixed earlier this session)*
`validLayouts` was missing `'analytics'`, so the documented, fully-implemented 5th
graph layout failed CLI validation with `process.exit(1)` every time it was used.

### `devcompass.config.json` — orphaned, deleted
No loader in `src/` ever read this file (confirmed via repo-wide grep); its keys
(`ignore`, `minScore`, `cache`, etc.) had no corresponding config-reading code.

## 4. Round 2 — hand-reviewing the remaining untested modules

Following up on the coverage gaps listed in §2, every remaining untested area was
reviewed by hand (history/config/analyze-orchestration, all analyze collectors +
alerts, and the dashboard's client-side JS). Six more real bugs were found and fixed.

### History/snapshot persistence — four falsy-zero bugs
All four share one root cause: using `||` for a fallback where `0` is a legitimate
value, so a package or snapshot at the *worst possible health score* silently got
overwritten with a default "healthy" value instead.

- **`src/core/services/snapshot-manager.js:26`** — `totalDependencies: data.issues.length`
  used the issue count instead of the real dependency count
  (`data.metadata?.totalDependencies`), corrupting every `history`/`timeline`
  "Total Dependencies" display and trend. Fixed with `??`.
- **`src/features/history/snapshot-saver.js:22`** — `analysisData.healthScore || this.calculateOverallHealth(...)`
  discarded a real score of exactly `0`. Fixed with `??`.
- **`src/features/history/snapshot-saver.js:34`** — `node.healthScore || 8.0` turned the
  worst-scoring packages in a snapshot into a fake `8.0` ("healthy"). Fixed with `??`.
- **`src/features/history/snapshot-saver.js:61`** — same bug inside the fallback
  averaging in `calculateOverallHealth`. Fixed with `??`.

### `src/features/alerts/github-tracker.service.js` — GitHub redirects silently nulled predictive data
`makeGitHubRequest` never followed HTTP redirects. GitHub returns a 301 for
`facebook/react` (canonicalized to `react/react`) — any non-200 response fell through
to a generic error, which `fetchGitHubIssues` swallows into `return null`. Since
`react` is one of the most commonly tracked dependencies, this was a textbook
false-clean result: predictive bug-activity data silently went missing for it (and any
other renamed/moved repo) on every run. Verified live before (`301` → `null`) and
after (follows the redirect, returns real issue data) the fix. Now follows
301/302/307/308 up to 3 hops.

### Dashboard client-side JS — one XSS vector, one layout-breaking filter bug
- **`src/dashboard/scripts/tooltip.js`** — `data.name`/`data.id`/`data.version` were
  interpolated unescaped into `innerHTML`. Both fields can come directly from an
  attacker-controlled `package.json` in the analyzed project (`graph.generator.js` sets
  `version` from the raw dependency range and `name` from the raw dependency key when
  no lockfile entry exists) — a crafted package name/version could inject script into
  the graph HTML `devcompass graph` opens in a real browser. Fixed by adding an
  `escapeHtml()` helper to `utils.js` (exposed as `window.escapeHtml`) and using it in
  the tooltip.
- **`src/dashboard/scripts/layouts.js:466`** — same unescaped-`innerHTML` XSS via
  `n.name`/`n.id` in the Analytics view's "Needs Attention" card. Fixed the same way.
- **`src/dashboard/scripts/utils.js`'s `nodeMatchesFilters`** — the health-score filter
  didn't exempt the root/project node (whose `healthScore` is always a fixed `10`).
  Selecting any health bucket except "excellent"/"all" silently dropped the root node,
  and `buildHierarchyFast` would then fall back to an arbitrary `nodes[0]` as the tree
  root — producing a bogus, near-empty tree/radial layout instead of the filtered
  dependency set. Fixed by exempting the root node from the health-filter check.

### `src/features/alerts/github-tracker.service.js` + `predictive.service.js` — GitHub fetch failures were indistinguishable from "no bug activity"
Same false-clean pattern as the CVE-scan-incomplete bug this codebase already has a
regression test for (`test/unit/cve-scan-incomplete.test.js`), just not yet applied
here: `fetchGitHubIssues` returned plain `null` on *any* failure (network error, rate
limit, the redirect case just fixed above, an unexpected response shape) — identical
to what it returns for a package that isn't tracked at all. `processBatch` then
filtered every `null` out silently, so a tracked package whose GitHub check failed
produced zero predictive warnings, exactly indistinguishable from "checked it, found
nothing." Fixed by having `fetchGitHubIssues` return `{ package, failed: true, error }`
on failure instead of `null`; `generatePredictiveWarnings` now buckets those separately
and attaches `.incomplete`/`.incompleteReason` to the returned warnings array, and
`analyze/index.js` prints a warning banner (mirroring the existing CVE one) plus a new
`predictiveScanIncomplete` metadata field. Verified end-to-end with a simulated partial
failure.

### Confirmed clean (reviewed by hand, no changes)
`history.database.js`, `timeline-generator.js`, `config.database.js`,
`github-token.manager.js`, `config/index.js`, `issue-ranker.js`,
`bundle-size.service.js`, `license.collector.js`, `quality.collector.js`,
`shared/utils/backup-restorer.js`, and the rest of the dashboard scripts
(`core.js`, `controls.js`, `stats.js`) — including D3 selection scoping,
force-simulation parameters, and event-listener lifecycle.

`issues-analyzer.service.js`, `ecosystem.collector.js`, `security.collector.js`,
`predictive.service.js`, and `alerts/index.js` were also reviewed in this pass and
initially looked clean — the follow-up sweep in §5 below found the same
false-clean-on-error pattern already fixed in §4 was present in these too, once
specifically searched for.

### Also flagged — two more dead-code files (not removed, out of scope for a "fix")
`src/features/analyze/collectors/npm-audit.collector.js` and `outdated.collector.js`
are unreachable — `analyze/index.js` wires `dependency.collector.js` for
outdated/unused checks instead, and nothing in `src/` requires either file. Their
logic is internally correct, just never called. Left as-is, same category as the
`fix --batch` services below.

## 5. Round 3 — hunting the same false-clean pattern everywhere else

After fixing the GitHub-redirect/predictive bug in §4, the same anti-pattern (a
`catch` block silently returning an empty/`null` result that's indistinguishable
from "genuinely nothing found") was searched for deliberately across every other
external-call site in the codebase, rather than assuming the earlier pass had caught
every instance. It hadn't — three more chains had it, one specifically in the
*security vulnerability* scan.

### `runNpmAudit` (`src/features/quality/dynamic-security.service.js`) — the deepest instance
Every failure mode of `npm audit --json` (npm missing, timeout, permission error,
unparseable output) fell back to `{ vulnerabilities: [], summary: { total: 0, ... } }`
with zero signal distinguishing "npm audit ran and found nothing" from "npm audit
never actually ran." This fed directly into `devcompass analyze`'s security-vulnerability
warnings via `supply-chain.analyzer.js` → `security.collector.js` — a failed audit
looked exactly like a clean one. Fixed by having `runNpmAudit` return an `incomplete`
flag, but only when a `package-lock.json` is actually present (no lockfile is an
expected, benign reason for npm audit to come back empty, not a failure — verified
this doesn't false-positive). Propagated through `supply-chain.analyzer.js` →
`security.collector.js` → a new `securityScanIncomplete` metadata field and warning
banner in `analyze/index.js`. Verified live with a simulated npm-process failure
(flags `incomplete: true`) and a simulated no-lockfile project (correctly stays
`false`).

### `issues-analyzer.service.js` — the ecosystem-alerts pipeline
Two separate silent-failure points, both feeding `devcompass analyze`'s ecosystem
alerts (deprecation/maintenance/vulnerability warnings from the npm registry +
`npm audit`):
- `getProjectAudit` had the exact same npm-audit-failure-vs-no-lockfile ambiguity as
  above — fixed the same way (`_failed` flag, gated on lockfile presence).
- `getRegistryMetadata`'s network failures already returned `null` (correctly,
  distinct from a real 404 response body), but nothing upstream ever checked for
  that `null` — `getDeprecationStatus`/`getMaintenanceStatus` just silently treated a
  failed fetch as "not deprecated, not unmaintained."

Threaded a `failed` flag from both call sites through `getIssues()` →
`getBatchIssues()` (as `results.failedPackages`) → `alerts/index.js`'s
`fetchDynamicAlerts`/`checkEcosystemAlerts` (as `.incomplete`/`.incompleteReason`) →
`ecosystem.collector.js` → a new `ecosystemScanIncomplete` metadata field and warning
banner in `analyze/index.js`. Verified live with mocked registry/audit failures
(`failedPackages` correctly lists the affected package).

## 6. `devcompass fix --batch` — large orphaned feature, needs a decision

This is the most significant finding. `devcompass fix --batch`, `--batch-mode`,
`--only`, and `--skip` are all registered, documented-in-`--help` CLI flags
(`src/cli/commands/fix.cmd.js`), but `runFix()` (`src/features/fix/index.js:26-30`)
immediately short-circuits any of them with:

```
⚠️  Batch mode features are not yet available
```

Sitting unused behind that dead branch is a **fully-implemented, ~700-line feature**:

- `services/batch-selector.service.js` (86 lines) — interactive category-selection menu
- `services/batch-executor.service.js` (242 lines) — executes a chosen batch, now with
  its own pre-flight backup
- `services/license-conflict-fixer.service.js`, `quality-fixer.service.js`,
  `supply-chain-fixer.service.js` (65-68 lines each) — per-category fixers, only ever
  called from the batch executor above
- `services/recommendation.service.js` (186 lines) — not even called by the batch
  path; calls nothing and is called by nothing anywhere in `src/`

`CHANGELOG.md` explains *why* batch mode was disabled: it originally **ran with no
backup** and its fixer services **mutated `process.cwd()` instead of the target
`--path`**. Both of those specific problems appear to already be fixed in the current
code — `batch-executor.service.js` now creates a backup before running any batch
(lines 37-43), and all three fixer services take `projectPath` in their constructor
and pass it as `cwd` to every `execSync` call. The CLI was never switched back on to
reflect that, though — this needs a maintainer call, not a unilateral fix, since
re-enabling it changes real CLI behavior (multiple `npm install`/`uninstall` calls
running with reduced confirmation) and removing it deletes working code:

- **Wire it up** — replace the "not yet available" branch in `fix/index.js` with a
  real call into `BatchSelector`/`BatchExecutor`, and manually verify the backup +
  cwd fixes actually hold under a batch run before shipping it.
- **Remove it** — delete the flags from `fix.cmd.js` and the ~700 lines of dead
  service code, since the feature has been advertised-but-disabled since before this
  repo's earliest changelog entries and nothing currently depends on it.
- **Leave it flagged** — keep today's stub message, revisit later.

No code was changed for this item — see the open question raised alongside this report.
