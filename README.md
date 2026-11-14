# 🧭 DevCompass

Check your npm dependencies for known vulnerabilities, risky licenses, unused and outdated packages in one command, with a CI gate.

[![CI](https://github.com/AjayBThorat-20/devcompass/actions/workflows/ci.yml/badge.svg)](https://github.com/AjayBThorat-20/devcompass/actions/workflows/ci.yml)
[![CodeQL](https://github.com/AjayBThorat-20/devcompass/actions/workflows/codeql.yml/badge.svg)](https://github.com/AjayBThorat-20/devcompass/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/AjayBThorat-20/devcompass/badge)](https://securityscorecards.dev/viewer/?uri=github.com/AjayBThorat-20/devcompass)
[![npm](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![devcompass analyze on a project with vulnerable dependencies](docs/assets/demo-analyze.gif)

`npm audit` and Dependabot are already in your workflow — DevCompass isn't trying to replace them. It adds license-conflict detection, unused-dependency detection, a historical health score, and safe auto-fix with automatic backup, in one local CLI with no GitHub integration required.

## Requirements

Node.js 20.19+ or 22.12+ (DevCompass `require()`s ESM-only dependencies such as `uuid`, which needs the built-in `require(esm)` support those versions added; Node 21 and 22.0–22.11 aren't supported). Full coverage needs npm's `package-lock.json`; pnpm/yarn/bun projects still get most checks, just not npm audit's whole-tree scan or the dependency graph (see Limitations).

## Quick start

```bash
npx devcompass analyze
```

Pin it for your team:

```bash
npm install --save-dev devcompass
npx devcompass analyze
```

## Why not just npm audit or Dependabot?

| | npm audit | Dependabot | DevCompass |
|---|---|---|---|
| CVE scanning | ✅ (GitHub Advisory DB) | ✅ | ✅ (OSV + npm audit) |
| License-conflict detection | ❌ | ❌ | ✅ |
| Unused-dependency detection | ❌ | ❌ | ✅ |
| Historical health score | ❌ | ❌ | ✅ |
| Safe auto-fix with backup | ❌ | PR-based | ✅ |
| Requires GitHub integration | no | yes | no |

## What it checks

| Check | Source | Notes |
|---|---|---|
| Known vulnerabilities | OSV (whole tree via the lockfile) + npm audit (full tree, HIGH/CRITICAL) | Cached for 24 h |
| License risk | Installed package metadata | GPL/AGPL-family licenses flagged |
| Unused dependencies | knip | Heuristic: never removed automatically |
| Outdated packages | npm registry | Patch, minor and major |
| Typosquatting | Name similarity + download-count popularity vs. popular packages | Heuristic: review only |

## AI features (optional)

`devcompass ai recommend`, `ai ask "<question>"`, and `ai alternatives <package>` use your own OpenAI, Anthropic, Google, or local Ollama key — configured with `devcompass llm add --provider <name>`. Off by default; only dependency names/versions (never source code) are sent to the configured provider.

## Use it in CI

```yaml
- run: npx devcompass analyze --fail-on high --format sarif > devcompass.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: devcompass.sarif
```

`--fail-on <critical|high|medium|low|kev>` exits 1 when a finding at or above that severity exists — the recommended way to gate CI, since it targets a specific kind of finding rather than an aggregate score. Add `--baseline` (after `devcompass baseline save`) so an existing project can adopt a gate without fixing every pre-existing finding first. `--format json` (or the `--json` shorthand) prints machine-readable output; `--ci --threshold <score>` (the older health-score gate) still works too. Or use the official [`action.yml`](action.yml): `uses: AjayBThorat-20/devcompass@v5` with `fail-on: high`.

A project-level `devcompass.config.json` can set the same `failOn` policy, plus an `ignore` list (each entry needs a `reason`) and per-check toggles — see the [docs](https://devcompass.ajaythorat.com) for the schema.

## Fix issues

```bash
devcompass fix --dry-run      # preview every change
devcompass fix                # apply safe fixes (package.json is backed up first)
devcompass fix --all          # include riskier fixes — still never removes a package
devcompass fix --remove-unused  # also uninstall packages flagged unused (heuristic — check first)
devcompass backup list        # find the backup to restore if you need to roll back
```

## Other commands

- `devcompass baseline save` — snapshot today's findings so `analyze --baseline --fail-on high` only fails on new ones
- `devcompass why <package>` — show every path from the project root to an installed package (npm only)
- `devcompass graph` — interactive dependency graph (5 layouts), `--open` to view in a browser
- `devcompass snapshot` / `compare` / `history` / `timeline` — track the health score over time
- `devcompass cve` — manage the optional NVD API key and CVE cache
- `devcompass llm` — configure an AI provider
- `devcompass config` — view/set configuration
- `devcompass clean` — clear cached output

## Limitations

- Full coverage needs `package-lock.json`: without one (pnpm/yarn/bun), npm audit's whole-tree scan, the dependency graph, and `devcompass why` don't run. OSV vulnerability, license, outdated and unused-dependency checks work from `package.json`/the npm registry regardless, so pnpm/yarn/bun projects get partial coverage, not none.
- With a `package-lock.json`, OSV checks the whole dependency tree; without one, it falls back to direct dependencies only. npm audit covers the full tree either way, but only its HIGH and CRITICAL findings are reported.
- Unused-dependency and typosquat detection are heuristics (static-import analysis and name-similarity checks) — check before acting on them, especially before removing a package.
- Package names and versions are sent to OSV, the npm registry and GitHub. Source code is never uploaded. AI features are optional and off by default.
- API keys/tokens saved via `devcompass config`/`devcompass cve key` are stored locally, obfuscated, not strongly encrypted — prefer environment variables (`GITHUB_TOKEN`, `OPENAI_API_KEY`, etc.), especially in CI.

## Documentation

Full flag reference for every command, configuration, and FAQ: https://devcompass.ajaythorat.com

Version history: [CHANGELOG.md](CHANGELOG.md). Breaking-change notes (there haven't been any yet): [MIGRATION.md](MIGRATION.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues are labeled [`good first issue`](https://github.com/AjayBThorat-20/devcompass/labels/good%20first%20issue).

## License

MIT © Ajay Thorat
