# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-04-01

### 🚀 Major New Features

#### Auto-Fix Command
- **NEW:** `devcompass fix` command for automatic issue resolution
- Automatically fixes critical security vulnerabilities
- Removes unused dependencies
- Applies safe updates (patch and minor versions)
- Skips major updates to prevent breaking changes
- Interactive confirmation before applying changes
- `--yes` flag for non-interactive mode (CI/CD friendly)

### Added
- New `fix` command with smart prioritization:
  - Fixes critical security issues first
  - Removes unused dependencies second
  - Updates safe versions (patch/minor) third
  - Shows major updates but doesn't auto-apply
- `--yes` / `-y` flag for auto-applying fixes without confirmation
- Fix summary showing impact breakdown
- Post-fix suggestion to run `devcompass analyze`
- Safety features: confirmation prompts, clear action preview

### Changed
- CLI now supports two main commands: `analyze` and `fix`
- Updated help text to include new fix command
- Enhanced user workflow: analyze → fix → verify

### Technical Details
- New file: `src/commands/fix.js` with fix logic
- Uses `child_process.execSync` for npm operations
- Integrates with existing alerts, unused, and outdated analyzers
- Graceful error handling during fix operations

### User Experience
- Shows detailed plan before making any changes
- Groups actions by type and priority
- Color-coded output (critical=red, info=cyan, success=green)
- Clear progress indicators during fix process

---

## [2.0.0] - 2025-04-01

### 🚀 Major New Features

#### Ecosystem Intelligence System
- **NEW:** Real-time alerts for known issues in dependencies
- **NEW:** Severity classification (Critical/High/Medium/Low)
- **NEW:** Version-specific issue matching using semver
- **NEW:** Source attribution (GitHub Issues, npm advisories)
- **NEW:** Smart fix recommendations
- **NEW:** Resolves actual installed versions from node_modules

#### Enhanced Health Scoring
- Health score now includes ecosystem alerts impact
- Critical issues: −2.0 points per issue
- High severity: −1.5 points per issue
- Medium severity: −0.5 points per issue
- Low severity: −0.2 points per issue
- Maximum penalty cap at 5 points to maintain scoring balance

#### Improved Analysis
- Resolves actual installed versions from `node_modules` (not just package.json)
- Better version normalization (handles `^`, `~`, `>=`, etc.)
- Grouped alerts by package for cleaner output
- Semantic versioning for precise issue matching

#### Smart Prioritization
- Quick Wins now prioritizes critical security fixes first
- Shows expected health score improvement after fixes
- Actionable npm commands for immediate resolution
- Separate sections for critical alerts vs. routine cleanup

### Added
- Issues database (`data/issues-db.json`) with curated package issues
- New `src/alerts/` module for ecosystem intelligence:
  - `index.js` - Main alert checking logic
  - `matcher.js` - Semver-based issue matching
  - `resolver.js` - Installed version detection
  - `formatter.js` - Alert output formatting
- `semver` dependency (^7.6.0) for precise version matching
- Config system foundation (`src/config/loader.js`)
- Emoji severity indicators (🔴🟠🟡⚪)

### Changed
- Health score calculation now includes alert penalties
- Output format enhanced with color-coded severity levels
- Quick wins section shows prioritized actions
- Version bump from 1.0.5 → 2.0.0 (breaking changes in health score)

### Tracked Packages (v2.0.0 Database)
- **axios** - Memory leaks in interceptors, breaking changes
- **lodash** - Prototype pollution vulnerability (CVE-2019-10744)
- **moment** - Official deprecation notice
- **express** - Security vulnerabilities in `qs` dependency
- **request** - Package deprecated (unmaintained since 2020)

### Technical Details
- New dependencies: `semver@^7.6.0`
- New modules: 4 files in `src/alerts/`
- Enhanced scoring algorithm with multi-factor analysis
- Graceful error handling for missing issues database

### Breaking Changes
- Health score calculation changed (includes new penalty factors)
- Projects with critical alerts may see lower scores
- Output format includes new Ecosystem Alerts section

---

## [1.0.5] - 2025-03-20

### Fixed
- Minor bug fixes and improvements
- Stability enhancements

---

## [1.0.2] - 2025-03-20

### Fixed
- Added autoprefixer, postcss, tailwindcss to framework ignore list (fixes false positives)
- Added prettier, eslint, and related configs to ignore list
- Prevent DevCompass from flagging itself as unused when installed locally
- Better detection of config-based dependencies

### Added
- Warning message when DevCompass is installed locally instead of globally
- Improved ignore patterns for CSS/PostCSS tooling
- Better ESLint plugin detection

### Changed
- Enhanced documentation about installation methods

---

## [1.0.1] - 2025-03-20

### Added
- CHANGELOG.md with version history
- MIT LICENSE file

---

## [1.0.0] - 2025-03-20

### Added
- Initial release of DevCompass
- Unused dependency detection using depcheck
- Outdated package detection using npm-check-updates
- Project health score calculation (0-10 scale)
- Beautiful terminal UI with colored output
- Loading spinners and progress indicators
- Framework-aware detection (React, Next.js, Angular, NestJS)
- Quick win recommendations for cleanup
- CLI command: `devcompass analyze`
- Support for JavaScript and TypeScript projects
- Automatic exclusion of build folders and node_modules

### Features
- AST-based dependency scanning
- Smart detection of implicit dependencies (e.g., React in JSX)
- Version comparison with npm registry
- Penalty-based scoring algorithm
- Error handling for invalid package.json
- Graceful degradation when tools fail

### Technical Details
- Built with Node.js >= 14.0.0
- Dependencies: chalk, commander, depcheck, npm-check-updates, ora
- Package size: 4.3 kB
- Total files: 10

### Documentation
- Comprehensive README with examples
- MIT License
- GitHub repository setup
- npm package published

---

[2.1.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.1.0
[2.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.0.0
[1.0.5]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.5
[1.0.2]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.2
[1.0.1]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.1
[1.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.0
