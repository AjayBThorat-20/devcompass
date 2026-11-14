# Migration Guide

Every release through 4.1.8 was additive or a bug fix — no breaking change
until the [Unreleased] entry below, the first real one. See
[CONTRIBUTING.md](CONTRIBUTING.md#versioning-policy) for what qualifies as a
breaking (major-version) change.

## Unreleased

- **`analyze --ai` and `--ai-provider` are gone.** These only ever returned a
  fixed template sentence — no model was ever called. Use
  `devcompass ai recommend` (or `ai ask`/`ai alternatives`) instead, which do
  call your configured provider.
- **`fix --batch`, `--batch-mode <mode>`, `--only <categories>`, and
  `--skip <categories>` are gone.** They only ever printed "Batch mode
  features are not yet available" — there is nothing to switch to; use plain
  `devcompass fix`, `fix --all`, or `fix --yes`. `--dry-run` (and its
  `--dry`/`--preview` aliases) are unaffected.
- **`fix` never removes a package unless you pass `--remove-unused`.**
  Removal was previously bucketed as "safe" and applied by plain
  `devcompass fix`. It now requires the explicit flag — and `--all` does
  *not* imply it, because unused detection is a heuristic (dynamic
  `require`, CLI-only packages, framework conventions). If a script relied
  on `devcompass fix` or `fix --all` removing unused packages, add
  `--remove-unused`. `fix --remove-unused` on its own applies safe fixes
  plus removals; `fix --all --remove-unused` applies everything.
- **`fix` without `--all` no longer installs a transitive dependency as a new
  top-level one.** A vulnerable/outdated package that isn't in your
  `package.json` now shows up as a "Needs manual action" item with a
  suggested `overrides`/`resolutions` entry, instead of being installed
  directly (which added it as a new direct dependency and left the parent
  package's own vulnerable copy in place). If your CI parsed `fix`'s output
  expecting those packages to be updated automatically, add the suggested
  override instead.
- **The health score formula changed** (see CHANGELOG.md). A project's exact
  score will shift — usually upward for projects whose only issues are many
  low-severity ones, and it now caps at 3.9/5.9 for any CRITICAL/HIGH
  vulnerability regardless of everything else. If you gate CI on
  `--ci --threshold <N>`, re-check your threshold against the new scores; the
  newer `--fail-on <severity>` gate (see README) targets a specific severity
  directly and isn't affected by this change at all.
- **The analysis cache moved from `<project>/.devcompass/cache/` to
  `~/.devcompass/cache/`.** `analyze` no longer writes anything into the
  scanned project. If you had `.devcompass/` checked in (you shouldn't — see
  the README's tip to `.gitignore` it), the cache file it contained is gone;
  nothing reads the old location any more.
- **Vulnerability counts will go up on projects with a `package-lock.json`.**
  The OSV check now covers the whole dependency tree rather than only direct
  dependencies, so transitive vulnerabilities that were previously invisible
  now appear — and because a CRITICAL finding caps the health score at 3.9,
  a project that scored "Excellent" can legitimately drop to "Critical"
  without anything about the project itself having changed. This is the
  scanner getting more accurate, not a regression. If you gate CI on
  `--ci --threshold`, re-check the threshold after the first run.
- **Ecosystem and predictive checks no longer run by default.** If you relied
  on their findings, add `--ecosystem` to your `analyze` invocation, or set
  `checks.ecosystem.enabled: true` in `devcompass.config.json` — pairing
  either with a `GITHUB_TOKEN` environment variable avoids the 60
  requests/hour limit that made this check unreliable in the first place.
- **`clean --backups` now actually removes
  `<project>/.devcompass-backups/`** (previously it targeted
  `<project>/.devcompass/backups/`, a folder `fix` never wrote to, so
  `clean --backups` silently did nothing). If you were relying on that
  no-op, note that it now really deletes your backups.

## Rolling back

```bash
# Install a specific previous version
npm install -g devcompass@<version>

# Restore package.json/package-lock.json from a DevCompass backup if needed
devcompass backup list
devcompass backup restore --name <backup-name>
```

## Need help?

- [CHANGELOG.md](CHANGELOG.md) — full version history
- [GitHub Issues](https://github.com/AjayBThorat-20/devcompass/issues)
