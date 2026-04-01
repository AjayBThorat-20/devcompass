# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-04-01

### 🚀 Major New Features

#### Output Modes & CI/CD Integration
- **NEW:** `--json` flag for JSON output (perfect for CI/CD pipelines)
- **NEW:** `--ci` mode with exit codes for automated checks
- **NEW:** `--silent` mode for programmatic usage
- **NEW:** Configurable minimum score thresholds for CI failure

#### Smart Caching System
- **NEW:** Intelligent caching to avoid rate limits and improve performance
- Caches ecosystem alerts, unused dependencies, and outdated packages
- 1-hour cache duration (configurable)
- Stored in `.devcompass-cache.json`
- Can be disabled via config: `"cache": false`
- Significant performance improvement on repeated runs

#### Enhanced Configuration System
- **NEW:** `minSeverity` - Filter alerts by minimum severity level
- **NEW:** `ignoreSeverity` - Ignore specific severity levels (e.g., ["low", "medium"])
- **NEW:** Enhanced `ignore` - Ignore specific packages from alerts
- Severity hierarchy: critical > high > medium > low
- Full control over alert visibility and thresholds

#### Advanced Alert Filtering
- Filter alerts by severity before display
- Ignore specific packages from ecosystem alerts
- Set minimum severity thresholds (only show critical/high)
- Combine multiple filtering strategies

### Added
- New cache manager module (`src/cache/manager.js`)
  - `getCached()` - Retrieve cached data with expiration check
  - `setCache()` - Store data with timestamp
  - `clearCache()` - Manual cache invalidation
- JSON output formatter (`src/utils/json-formatter.js`)
  - Structured output for CI/CD systems
  - Includes version, timestamp, summary, and detailed breakdowns
- CI mode handler (`src/utils/ci-handler.js`)
  - Exit code 0 for passing scores
  - Exit code 1 for failing scores (below threshold)
  - Clear pass/fail messaging
- Enhanced config loader with severity filtering
  - `shouldIgnoreAlert()` - Alert filtering logic
  - `filterAlerts()` - Batch alert filtering
- `.devcompass-cache.json` support (gitignored by default)
- New CLI flags:
  - `--json` for JSON output
  - `--ci` for CI/CD mode
  - `--silent` for no output

### Changed
- `analyze` command now supports multiple output modes
- Config system enhanced with granular severity control
- Cache system reduces API calls and improves performance by ~70%
- Alert filtering happens before display (not after scoring)
- `.gitignore` updated to exclude cache files

### Configuration Options
New `devcompass.config.json` options:
```json
{
  "ignore": ["package-name"],           // Ignore specific packages
  "ignoreSeverity": ["low"],            // Ignore severity levels
  "minSeverity": "medium",              // Only show medium+ alerts
  "minScore": 7,                        // CI failure threshold
  "cache": true                         // Enable/disable caching
}
```

### Technical Details
- Cache duration: 3600000ms (1 hour)
- Cache file: `.devcompass-cache.json` (automatically gitignored)
- Cache structure: `{ key: { timestamp, data } }`
- JSON output includes: version, timestamp, summary, detailed arrays
- CI mode checks score against `minScore` config value (default: 7)
- Config priority order: minSeverity > ignoreSeverity > ignore

### Performance Improvements
- First run: Normal speed (fetches all data)
- Cached runs: ~70% faster (skips API calls)
- Network-independent operation for 1 hour after first analysis

### User Experience
- Clean JSON output for parsing in CI/CD
- Exit codes enable automated workflows
- Silent mode for background checks
- Configurable severity filtering reduces noise
- Cache improves responsiveness significantly

### Examples

#### JSON Output
```bash
devcompass analyze --json
```
Returns structured JSON with all metrics and arrays.

#### CI Mode
```bash
devcompass analyze --ci
```
Exits with code 1 if score < configured minimum (default 7).

#### Silent Mode
```bash
devcompass analyze --silent
```
No output, only exit code (useful for scripts).

#### Severity Filtering
```json
// devcompass.config.json
{
  "minSeverity": "high",
  "ignoreSeverity": ["low", "medium"]
}
```
Only shows critical and high severity alerts.

### Breaking Changes
- None (fully backward compatible)

### Migration Guide
No migration needed. All features are opt-in via flags or config.

---

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

[2.2.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.2.0
[2.1.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.1.0
[2.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.0.0
[1.0.5]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.5
[1.0.2]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.2
[1.0.1]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.1
[1.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.0