# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versions before 4.0.0: see [docs/archive/CHANGELOG-1.x-3.x.md](docs/archive/CHANGELOG-1.x-3.x.md).

## [Unreleased]

Implements the correctness fixes and highest-value changes from a full
review of v4.1.8. See [MIGRATION.md](MIGRATION.md) for the breaking changes.

### Added

- `--fail-on <severity>` and `--fail-on-license <licenses>` policy gates for `analyze`, with documented exit codes (0 pass, 1 policy violation, 2 incomplete scan with `--fail-on-incomplete`, 3 crash). `--only-direct` excludes transitive findings from the gate.
- `--format sarif` and `--format markdown` output for `analyze`, alongside the existing console/`--json` output. SARIF is for GitHub's Security tab; Markdown is for PR comments and `$GITHUB_STEP_SUMMARY`.
- `devcompass baseline save` / `baseline show`, and `analyze --baseline`: only findings missing from a committed `.devcompass-baseline.json` can fail a `--fail-on` gate, so an existing project can adopt a strict gate without fixing everything on day one.
- `devcompass.config.json`: a project-level config file (`failOn`, `ignore` with required `reason` and optional `expires`, per-check `checks.<id>.enabled`). Documented on the site with no code reading it before now.
- `action.yml`: an official GitHub Action (`uses: AjayBThorat-20/devcompass@v5`).
- A public programmatic API (`require('devcompass')`): `analyze`, `createFixPlan`, `loadProjectConfig`, `applyIgnores`, `evaluatePolicy`, `saveBaseline`/`loadBaseline`/`applyBaseline`, `HealthCalculator`. These signatures are now part of the semver promise.
- `analyze --json`'s output now carries a `schemaVersion` (currently `1`), with the shape published at `schema/analysis-result-v1.json` — a CI pipeline parsing it can now detect a future incompatible change instead of silently breaking on it.
- `analyze --offline`: skips every collector that needs the network (OSV, npm audit, the npm registry, GitHub), running only the checks that work from what's already on disk (license, unused).
- Every finding now carries a `ruleId` (e.g. `vuln`, `typosquat`, `outdated/major`), a `confidence` (`high`/`medium`/`low` — heuristics like unused/typosquat are never `high`), and the full list of `advisoryIds` it merged (previously only the first GHSA/CVE id was kept, though a count was computed and silently discarded). A finding's `id` is now `<ruleId>:<package>@<version>[:<advisoryId>]`, matching the format `devcompass.config.json`'s `ignore[].id` expects.

- `fix --remove-unused`: uninstalls packages flagged as unused. Removal is now always an explicit choice — `--all` no longer sweeps it up, because unused detection is a heuristic.
- `devcompass why <package>`: shows every path from the project root to an installed package, so a vulnerable/outdated transitive dependency like `qs` nested under `express` is traceable back to what pulled it in.
- `devcompass clean` now has a `-p, --path <path>` option, matching every other command — previously it could only ever operate on the current directory.
- The coverage floor is raised from 20% to 40% (actual coverage is ~42.7% overall, ~60% for `src/core` + `src/features/fix`, ~81% for `src/core` alone) — CI-02 fixed the measurement, this locks in the real coverage this branch's tests added on top of it.
- A deterministic, fully-mocked full-pipeline test (`test/unit/analyze-pipeline.test.js`) exercises `analyze` end-to-end — real collectors, merge, scoring, `--fail-on`, and `--json` rendering — with every network call stubbed, so it runs in the same required `npm test` gate as everything else instead of only in the informational, live-API integration-smoke job. Building it caught two real bugs: `cve.collector.js`'s per-package merge step was silently dropping every advisory id but the first (`advisoryCount` was computed and never used) and dropping the new KEV/EPSS enrichment entirely.
- Vulnerabilities are now ranked by real exploit risk, not just CVSS severity: CISA's Known Exploited Vulnerabilities (KEV) list first, then FIRST's EPSS exploitation-probability score, then CVSS. A KEV-listed finding is labeled "KNOWN EXPLOITED" in console output, and `--fail-on kev` (FT-01) now has real data to match against instead of always finding nothing.
- A dependency graph, built from `package-lock.json` (npm only — pnpm/yarn/bun report `incomplete` rather than silently returning an empty graph), available via the public API as `loadDependencyGraph()`. Unlike the previous top-level-only `node_modules/<name>` lookups, it correctly distinguishes multiple installed versions of the same package at different nesting depths (e.g. a direct `qs@6.9.0` alongside `express`'s own nested, vulnerable `qs@6.7.0`).

### Changed

- **The OSV check now covers the whole dependency tree, not just direct dependencies.** Every installed `name@version` from the lockfile graph is checked, so a vulnerability in a transitive package is found on its own rather than only when npm audit happens to also flag it (and npm audit's results are filtered to HIGH/CRITICAL). Measured on a fixture whose only problem was a CRITICAL prototype-pollution advisory in a transitively-installed `minimist@1.2.5`: the identical project scored **9.2/10 "Excellent" before this change and 3.9/10 "Critical" after**. Projects without a usable `package-lock.json` (pnpm/yarn/bun, or no lockfile) keep the previous direct-dependency behavior rather than losing the check.
- **`npm-check-updates` is gone** (−6 MB). The outdated check now uses the npm registry client this project already ships plus `semver`. `wanted` is now the highest published version the declared range allows (e.g. `4.1.2` for `chalk@^4.0.0`); npm-check-updates always reported the latest version, even across a major the range doesn't allow.
- `osvClient.batchQuery` chunks large batches (200 per request, 4 in flight) instead of sending every package in one POST — necessary now that it receives whole trees, and it means one slow or rejected chunk no longer fails every package in the scan.
- A security finding can now only be auto-applied without `--all` when its confidence is `high` (real advisory/audit data) — `safeFix: true` alone is no longer sufficient, closing a gap where a heuristic match (e.g. typosquat) could in principle have been miscategorized as auto-fixable.
- Collectors run from one registry (`src/features/analyze/collectors/index.js`) instead of a hardcoded list in `analyze`'s core — a new check is one file plus one entry, and `--offline`/`devcompass.config.json`'s per-check `enabled` now apply to every collector uniformly instead of each needing its own bespoke wiring.
- An informational "N package(s) run code during install" list in `analyze`, sourced from the lockfile's `hasInstallScript` field — not a scored security issue.
- **`fix` never removes a package unless you pass `--remove-unused`** — including under `--all`. Unused detection is a heuristic (dynamic `require`, CLI-only packages, framework conventions), so removal is an explicit, single-purpose choice. The preview says so and names the flag when it holds removals back.
- **`fix` no longer installs a transitive dependency as a new top-level one.** A vulnerable/outdated package that isn't declared in `package.json` becomes a "Needs manual action" item with a suggested `overrides`/`resolutions` snippet, shown in its own preview section instead of being silently counted under "Will apply".
- **Semver-major npm audit fixes are no longer marked "safe".** `fixAvailable`'s `{ isSemVerMajor: true }` form is now correctly treated as breaking.
- **The health score formula changed.** Each category's penalty now approaches a cap instead of growing without limit (so a large project with only minor issues doesn't score worse than a small one with a critical vulnerability), and any CRITICAL vulnerability caps the score at 3.9, any HIGH at 5.9.
- **Typosquat detection now requires download-count evidence**, not just a one-character name difference from a popular package — this was flagging real packages (preact, vuex, nuxi, cuid, mysql2) as look-alikes. It also no longer suggests "Replace with X"; it's a review-only heuristic.
- **The install-script check now reads the lockfile's `hasInstallScript` field** (the whole dependency tree) instead of the scanned project's own `package.json` scripts, which was checking the wrong thing entirely.
- **`analyze` writes nothing to the project directory anymore** (previously created `.devcompass/cache/` and an empty `temp/`). The analysis cache moved to `~/.devcompass/cache/`, keyed by a hash of the project path.
- **`--ci --json` output is valid JSON again when the check passes** — the "CI Check Passed" line moved to stderr, and the exit code comes from a return value instead of the process exiting mid-write.
- **`clean --backups` now actually cleans backups.** It was pointed at `<project>/.devcompass/backups/`, a folder nothing ever wrote to; backups live in `<project>/.devcompass-backups/`, which `clean --backups` (and `--cache`, now also covering `~/.devcompass/cache/`) targets correctly now.
- A failed "outdated" scan is now reported as incomplete instead of silently looking like "everything is up to date".
- `npm-check-updates` and `knip` now run via their library/bundled APIs instead of `npx`, so they can't silently resolve a different version than the one DevCompass ships with, and no longer need network access to do it.
- npm install/uninstall calls go through `cross-spawn` instead of `execFileSync('npm', ...)`, which failed to spawn `npm.cmd` on Windows. The unused-dependency fallback no longer shells out to `grep` (also missing on Windows by default) — it's a plain JS file scan now.
- The four separate severity/priority tables (`severity.js`, `issue.model.js`, `data/priorities.json`, inline tables in `health-calculator.js`/`issue-ranker.js`) are down to one (`core/utils/severity.js`); everything else imports from it.
- `GITHUB_TOKEN`/`GH_TOKEN`, `NVD_API_KEY`, and `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` are read from the environment first, before the locally-stored value — no more needing to run a `config`/`llm add`/`cve key` command just to get a key into CI.
- Duplicate findings for the same package across collectors are merged correctly (an ecosystem alert typed `vulnerability` is now typed `security`, not `quality`, so it merges with the matching CVE finding instead of double-counting).
- A finding's version is always the installed one, never an advisory's vulnerable *range* (e.g. `<=4.17.23`).
- NVD enrichment now looks up the CVE id from an OSV record's `aliases` instead of passing the GHSA id straight through, which NVD's API silently never matched.
- vulnerability descriptions built from npm audit's `via` field now use the advisory's real title instead of a list of package names.
- **Ecosystem and predictive checks are off by default now.** They call GitHub's API, which allows only 60 requests/hour without a token — a review found this failing for every one of 7 sample packages. Opt in with `analyze --ecosystem`, or `checks.ecosystem.enabled: true` in `devcompass.config.json` to turn it on for good (ideally alongside `GITHUB_TOKEN`).
- **`engines.node` is now `^20.19.0 || >=22.12.0`** (was `>=20.0.0`). `uuid@14` is ESM-only and DevCompass loads it with `require()`, which only works from Node 20.19.0 / 22.12.0 (`require(esm)`); `knip` declares the same range. On Node 20.0–20.18, 21, or 22.0–22.11 the old range let installs succeed and then crash with `ERR_REQUIRE_ESM`.
- `better-sqlite3` 11 → 12 (12.11.1). 11.x crashed natively at process exit on Node 24 (`Statement::~Statement`); 12.x officially supports Node 20–26. Not 13.x, which requires Node ≥22 and would contradict the `engines` range above.
- CI now tests Node 20 alongside 22 and 24, so the declared `^20.19.0` support is actually exercised rather than assumed.

### Removed

- `analyze --ai` and `--ai-provider`: this only ever returned a fixed template sentence, never called a model. Use `devcompass ai recommend` instead.
- `fix --batch`, `--batch-mode`, `--only`, `--skip`: these only ever printed "Batch mode features are not yet available". `--dry`/`--preview` still work as aliases for `--dry-run`.
- The unused, unreachable `outdated.collector.js`, `npm-audit.collector.js`, `recommendation.service.js`, and the batch-fix service files (`batch-executor`, `batch-selector`, `supply-chain-fixer`, `license-conflict-fixer`, `quality-fixer`) — the last of those would have "fixed" a flagged typosquat by uninstalling it and installing the look-alike it matched against, which given the false positives above would have replaced `preact` with `react`.
- The `d3` npm dependency (31 packages, 6.6 MB) and its CDN `<script src="https://d3js.org/...">` tag — d3 is now a single vendored, inlined file, so the dashboard/graph/timeline HTML also works fully offline.
- The local-install warning in `devcompass.js` ("DevCompass is installed locally — npm install -g devcompass"), which fired for global installs and `npx` too and discouraged pinning DevCompass as a devDependency, the actually-recommended setup for teams/CI.

### Security

- Token/key storage is now described accurately in-product ("stored locally, obfuscated") instead of "AES-256-GCM encrypted" — the key is derived from hostname/username and a salt file stored in the same folder as the data, so it isn't meaningfully protecting anything from someone who can read that folder.

## [4.1.8] - 2026-09-11

### Fixed

- README's "Version History" section had drifted out of sync with this changelog (was missing v4.1.6/v4.1.7). No functional changes.

## [4.1.7] - 2026-09-11

### Security

- Hardened remaining `execSync`/`exec` template-literal call sites to `execFile(Sync)` with argv arrays, so shell interpretation is impossible by construction.
- AI provider `baseURL` config is now validated as http(s) before use.
- Added regression coverage for prior security fixes (shell:true removal, base-URL protocol validation, adversarial package-name payloads).

### Added

- CI version-guard job: fails a PR/push if `package.json`'s version already has a git tag or isn't strictly greater than what's published on npm.
- `release.yml` now publishes via a `vX.Y.Z` tag push, gated on the tag matching `package.json`'s version.
- CodeQL and OpenSSF Scorecard workflows, linked as README badges.
- `c8`-based `npm run test:coverage` with a 60% line floor, wired into CI.
- README AI Integration Guide now documents the exact request payload AI features send.

### Changed

- Consolidated the root-level test shell scripts into `test/integration/` and wired all of them into `npm run test:integration`; fixed a couple of stale assertions and a `.gitignore` gap.

## [4.1.6] - 2026-09-05

### Fixed

- `engines.node` understated the real requirement (said `>=14.0.0`; `commander@^14` needs `>=20`). Now `>=20.0.0`. `llms.txt` had the same wrong claim, also corrected.
- `main` pointed at a nonexistent `src/index.js`, breaking `require('devcompass')`. Removed — this is a CLI-only tool with no public programmatic API.

### Changed

- Added `prepublishOnly` to run the test suite before every `npm publish`.
- Removed `.npmignore`, which duplicated the `files` allowlist in `package.json`.

## [4.1.5] - 2026-09-05

### Added

- `devcompass fix --migrate-syntax`: for major-version updates in the fix plan, rewrites source call-sites via a built-in codemod registry, falling back to your configured AI provider. Nothing is committed.
- `devcompass fix undo`: reverts the most recent `--migrate-syntax` run from a dedicated session snapshot.
- Live `package.json` diff in `fix`'s preview, plus a note on which flagged packages are transitive.

### Fixed

- `fix` could plan to both remove and update the same package when flagged by two different collectors. The planner now dedupes in favor of `remove`.

## [4.1.4] - 2026-09-01

### Fixed

- GitHub token could leak to a third-party host on redirect; the API client now only attaches `Authorization` when the host is actually `api.github.com`, with explicit, capped redirect handling.
- Dashboard XSS: package name/version/issue-title strings are now escaped before being interpolated into dashboard HTML.
- `graph --layout analytics` was rejected due to a missing entry in `validLayouts`.
- Predictive/security/ecosystem scans silently reported "clean" on partial failure; each collector now surfaces an `incomplete` warning instead.
- A few falsy-zero/undefined bugs in snapshot persistence.

### Added

- `docs/ARCHITECTURE.md` — internal developer documentation.
- `docs/TEST_AUDIT.md` — audit of the test suite against the source it exercises.

### Removed

- Dead code: `src/shared/utils/ci-handler.js`, orphaned `devcompass.config.json`, and the duplicated `.github/CONTRIBUTING.md`.

## [4.1.3] - 2026-08-28

### Docs

- Regenerated `demo-overview.gif`, `demo-analyze.gif`, and `demo-fix.gif` — the previous recordings were five releases stale.

## [4.1.2] - 2026-08-28

### Docs

- Fixed the maintainer portfolio link across README, `llms.txt`, and `package.json` to `https://www.ajaythorat.com`.

## [4.1.1] - 2026-08-26

### Added

- FAQ section in the README.
- `llms.txt` at the repo root.
- Maintainer portfolio/LinkedIn links in README and `llms.txt`.
- Expanded `package.json` keywords and GitHub repo topics.

## [4.1.0] - 2026-08-25

### Fixed

- CVE severity/CVSS score/fix-version were never real for any `analyze` scan — OSV's batch-query endpoint only returns `{id, modified}`; each unique advisory is now hydrated via OSV's per-vulnerability endpoint before parsing.
- CVSS base score was misread as the CVSS spec version for OSV's vector-string format; replaced with an actual CVSS v3.1 base-score calculation.
- CVSS-derived severity could never reach CRITICAL due to an early return on HIGH.
- "Safe fix" always reported `false`; the patched version is now actually extracted from OSV data.
- `devcompass fix` could silently run without a backup on backup failure.
- CLI numeric flags (`--limit`, `--width`, `--height`, `--keep`, `--days`) were silently corrupted by a `parseInt`-as-option-parser bug.
- `analyze --ci --threshold 0` silently reverted to the default 7.0.
- `llm test <provider>` always reported success, even for a revoked/invalid key.
- AI chat had no real multi-turn memory.
- Batch-fix mode ran with no backup and mutated `process.cwd()` instead of `--path`.
- Outdated-dependency check silently returned "no issues" for projects without `package-lock.json`.
- Dependency graph dropped all transitive dependencies for npm lockfileVersion 1.
- NVD circuit breaker could stay permanently tripped; replaced with the shared `CircuitBreaker`.
- Assorted smaller correctness fixes: unguarded array-index crashes on AI provider responses, a UTC/local day-boundary bug in the AI daily spend cap, a `0`-token Ollama count being overwritten, a CVE cache stats double-subtraction, a `"."` backup name bypassing the path-traversal guard, and a leading-range-operator regex bug.

### Added

- Test coverage for `health-calculator.js` and `risk-classifier.js`.
- An `integration-smoke` CI job (informational, not a merge gate) against real fixture projects and live OSV/npm-registry/GitHub APIs.

### Changed

- Consolidated several duplicated implementations onto shared counterparts (sanitization, severity ranking, AI provider boilerplate, retry/backoff constants).
- Removed dead module `core/utils/validators.js`.

## [4.0.0] - 2026-08-19

### Fixed

- `analyze` hanging on real projects — `npm audit` was being run once per dependency instead of once per project; a 19-dependency project went from hanging past 120s to ~25s.
- CVE cache existed but was never actually used by `analyze`; it now is.
- CVE checks used the declared version range instead of the installed version, causing false positives/negatives.
- CVE scan failures were silently reported as "0 vulnerabilities"; now flagged as an incomplete scan.
- Duplicate issues from more than one collector double-counted the health score; now merged.
- Custom AI provider base URLs were silently ignored due to a naming mismatch.
- AI daily cost limit didn't persist across CLI invocations; now backed by persisted conversation records.
- `mysql2` was false-flagged as typosquatting `mysql`, plus a handful of smaller collector/graph/snapshot bugs.

### Removed

- `scoring.service.js` — a dead, unreferenced health-score formula that diverged from the one actually in use.

### Docs

- Added a README comparison table against `npm audit`/Dependabot and a `CONTRIBUTING.md` guide.
