# Contributing to DevCompass

Thanks for considering a contribution — this is a solo-maintained project, and
even small PRs (a typo fix, a new package alternative) genuinely help.

## Ground rules

- Be respectful — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- Open an issue before starting anything larger than ~50 lines, so we can
  agree on the approach before you invest the time.
- Security issues: **do not** open a public issue. Email
  ajaythorat988@gmail.com instead.

## Development setup

```bash
git clone https://github.com/YOUR_USERNAME/devcompass.git
cd devcompass
npm install

# Link the CLI so `devcompass` resolves to your local checkout
npm link

# Run it against any project
cd /path/to/some-project
devcompass analyze
```

## Project layout

```
bin/                 CLI entrypoint
src/cli/              Command definitions (commander)
src/core/              Shared engine logic (health scoring, config, etc.)
src/features/          One directory per feature area:
  analyze/              Core analysis + renderers (default/deep/json output)
  ai/                    LLM providers, prompts, chat/conversation state
  cve/                   OSV/NVD clients, CVE caching
  security/              Supply-chain analysis (typosquatting, install scripts)
  quality/               License, dependency, and security quality checks
  fix/                   Auto-fix services and risk classification
  backup/, clean/        Pre-fix backups and rollback/cleanup
  history/               SQLite-backed tracking, snapshots, and comparisons
  graph/                 Dependency graph generation/export/clustering
  alerts/, config/       Update tracking and user/CLI configuration
src/dashboard/          Interactive graph/timeline HTML + client-side JS
data/                  JSON reference data (license lists, alternatives, priorities)
test/unit/             Unit tests (node:test)
test/project*/         Fixture projects used by the manual test-*.sh scripts
```

If you're not sure where something belongs, open a draft PR early and ask —
better than guessing and having to move files later.

## Running tests

```bash
npm test          # unit tests (node --test test/unit/)
```

There are also broader manual smoke-test scripts at the repo root
(`test-all-commands.sh`, `test-production-scenarios.sh`, etc.) that exercise
the CLI end-to-end against the fixture projects in `test/`. These aren't part
of `npm test` — run them directly if you're touching CLI wiring, output
rendering, or anything that spans multiple commands.

## Making changes

1. Fork the repo and create a branch: `git checkout -b feature/short-name`
2. Make your change, add/update tests under `test/unit/` for anything in
   `src/`
3. Run `npm test` and confirm it passes
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`
5. Push and open a PR against `main`. Describe *why*, not just *what* — link
   the issue if there is one.

### PR checklist

- [ ] `npm test` passes
- [ ] New/changed behavior has a test in `test/unit/`
- [ ] No hardcoded secrets, API keys, or absolute local paths
- [ ] README/CHANGELOG updated if user-facing behavior changed

## Good first issues

Low-risk areas that don't require deep familiarity with the codebase:

- **Package alternatives** — add entries to `data/quality-alternatives.json`
  (deprecated/heavy packages → lighter modern replacements) or
  `data/gpl-alternatives.json` (GPL-licensed packages → permissively-licensed
  alternatives)
- **AI prompts** — improve wording/structure in
  `src/features/ai/prompt.templates.js`
- **Graph layouts** — enhance `src/dashboard/scripts/layouts.js` (tree,
  force-directed, radial, conflict views)
- **Docs** — fix typos, clarify unclear sections, add missing examples to
  the README's command reference
- **Test coverage** — `test/unit/` has room to grow; picking an untested
  file under `src/features/` and adding a test is always welcome

Issues labeled `good first issue` on GitHub are pre-scoped starting points if
you'd rather not pick your own.

## Questions

Open a [GitHub issue](https://github.com/AjayBThorat-20/devcompass/issues) or
email ajaythorat988@gmail.com.
