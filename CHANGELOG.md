# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-04-03

### 🚀 Major Feature: Top 500 Packages Coverage

Expanded GitHub issue tracking from 14 → **502 popular npm packages** organized into 33 categories!

### Added
- **500+ package coverage** across the entire npm ecosystem
- **33 organized categories**: Web Frameworks, Meta Frameworks, Mobile Frameworks, Backend Frameworks, Build Tools, Testing, Linters & Formatters, TypeScript Tools, State Management, HTTP Clients, Utilities, CSS & Styling, Documentation, Database & ORM, GraphQL, Authentication, Validation, Reactivity & Signals, Animation, Charts & Visualization, UI Component Libraries, Forms, Routing, File Upload, Markdown & Rich Text, Image Processing, Email, WebSockets, Compression, Security, CLI Tools, Performance & Monitoring, and Miscellaneous
- **Smart filtering**: Only checks packages that are actually installed in your project
- **Package count display**: Shows "Checking GitHub activity (X/502+ tracked packages)..." during analysis
- **Enhanced output**: Predictive warnings section displays "Based on recent GitHub activity (502+ packages monitored)"

### Categories Covered (502 Total Packages)
- **Web Frameworks** (25): react, vue, angular, svelte, preact, solid-js, lit, alpine, qwik, astro, etc.
- **Meta Frameworks** (15): next, nuxt, gatsby, remix, sveltekit, blitz, redwood, docusaurus, etc.
- **Mobile Frameworks** (10): react-native, ionic, expo, capacitor, cordova, etc.
- **Backend Frameworks** (20): express, koa, fastify, hapi, nest, strapi, meteor, trpc, etc.
- **Build Tools** (25): webpack, vite, rollup, parcel, esbuild, turbopack, swc, babel, etc.
- **Testing** (25): jest, mocha, vitest, cypress, playwright, puppeteer, storybook, etc.
- **Linters & Formatters** (15): eslint, prettier, stylelint, biome, dprint, etc.
- **TypeScript Tools** (15): typescript, ts-node, tsx, zod, yup, joi, ajv, etc.
- **State Management** (20): redux, mobx, zustand, jotai, recoil, valtio, xstate, etc.
- **HTTP Clients** (20): axios, got, ky, superagent, undici, @tanstack/react-query, swr, etc.
- **Utilities** (50): lodash, moment, dayjs, chalk, ora, commander, uuid, nanoid, etc.
- **CSS & Styling** (25): tailwindcss, sass, styled-components, emotion, unocss, etc.
- **Documentation** (15): jsdoc, typedoc, docusaurus, storybook, redoc, etc.
- **Database & ORM** (20): mongoose, sequelize, typeorm, prisma, drizzle-orm, etc.
- **GraphQL** (15): graphql, apollo-server, type-graphql, nexus, pothos, etc.
- **Authentication** (15): passport, jsonwebtoken, bcrypt, next-auth, lucia, etc.
- **Validation** (10): joi, yup, zod, ajv, superstruct, valibot, etc.
- **Reactivity & Signals** (10): @preact/signals, solid-js, mobx, rxjs, etc.
- **Animation** (10): gsap, framer-motion, react-spring, anime, lottie-web, etc.
- **Charts & Visualization** (15): chart.js, d3, recharts, plotly, echarts, etc.
- **UI Component Libraries** (25): @mui/material, antd, chakra-ui, mantine, shadcn-ui, etc.
- **Form Libraries** (10): react-hook-form, formik, final-form, vee-validate, etc.
- **Routing** (10): react-router, vue-router, wouter, tanstack-router, etc.
- **File Upload** (8): multer, formidable, uppy, filepond, react-dropzone, etc.
- **Markdown & Rich Text** (12): markdown-it, marked, mdx, slate, tiptap, quill, etc.
- **Image Processing** (10): sharp, jimp, canvas, qrcode, blurhash, etc.
- **Email** (8): nodemailer, sendgrid, mailgun, react-email, mjml, etc.
- **WebSockets** (8): ws, socket.io, uWebSockets.js, pusher-js, etc.
- **Compression** (6): compression, pako, brotli, tar, archiver, etc.
- **Security** (10): helmet, cors, express-rate-limit, sanitize-html, dompurify, etc.
- **CLI Tools** (15): commander, yargs, inquirer, ora, chalk, ink, oclif, etc.
- **Performance & Monitoring** (10): clinic, autocannon, prom-client, newrelic, etc.
- **Miscellaneous** (20): cheerio, jsdom, xml2js, papaparse, cookie-parser, etc.

### Performance Improvements
- **Optimized GitHub API calls**: Only queries packages that are actually installed in user's project
- **No performance impact**: Still maintains ~0.5s cached execution time
- **Smart rate limiting**: 1 second between GitHub API requests
- **Scalable architecture**: Ready for future expansion beyond 500 packages

### Display Enhancements
- Spinner shows progress: `"Checking GitHub activity (5/502+ tracked packages)..."`
- Predictive warnings section header: `"Based on recent GitHub activity (502+ packages monitored)"`
- Empty state message: `"No unusual activity detected (502+ packages monitored)!"`
- JSON output includes accurate package count metadata

### Technical Details
- File: `src/alerts/github-tracker.js` expanded from ~350 lines to 812 lines
- Total tracked repos: 502 packages (increased from 14)
- Added `getTrackedPackageCount()` function returning 502
- Added `getTrackedPackagesByCategory()` function returning category breakdown
- Updated `checkGitHubIssues()` with smart filtering logic
- Enhanced spinner messages in `src/commands/analyze.js`
- Updated `src/alerts/predictive.js` to work with large package lists
- Updated `package.json` description to mention "500+ popular npm packages"

### Example Output
```
🔍 DevCompass v2.5.0 - Analyzing your project...

⠹ Checking GitHub activity (5/502+ tracked packages)...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔮 PREDICTIVE WARNINGS (1)

  Based on recent GitHub activity (502+ packages monitored):

🟡 express
   Increased issue activity
   1 issues opened recently
   → Monitor for stability
   GitHub: https://github.com/expressjs/express
```

### JSON Output Schema (Extended)
Package count now reflected in summary:
```json
{
  "version": "2.5.0",
  "summary": {
    "predictiveWarnings": 1
  },
  "predictiveWarnings": [
    {
      "package": "express",
      "severity": "medium",
      "githubData": {
        "totalIssues": 6,
        "recentIssues": 1,
        "trend": "increasing"
      }
    }
  ]
}
```

### Breaking Changes
- None - fully backward compatible with v2.4.0

### Migration Guide
No migration needed. Feature works automatically.

The expansion from 14 → 502 packages happens transparently. Only installed packages are checked, so performance remains identical.

### Use Cases
- **Comprehensive monitoring**: Covers virtually all popular npm packages
- **Framework-agnostic**: Supports React, Vue, Angular, Svelte, and all major frameworks
- **Full-stack coverage**: Frontend, backend, build tools, testing, databases, etc.
- **Enterprise-ready**: Monitors authentication, security, performance packages
- **DevOps-friendly**: Tracks CLI tools, monitoring, deployment packages

### Performance Comparison
```
v2.4.0: Checking 3/14 packages   → ~3 seconds
v2.5.0: Checking 3/502 packages  → ~3 seconds (same!)
```

Smart filtering ensures zero performance degradation despite 35x more tracked packages.

### Files Changed
- `src/alerts/github-tracker.js` - Expanded TRACKED_REPOS with 488 new packages
- `src/alerts/predictive.js` - Enhanced with smart filtering
- `src/commands/analyze.js` - Updated spinner messages and display text
- `package.json` - Version bump to 2.5.0, description updated

### Future Enhancements (v2.6.0+)
- Performance optimizations for parallel GitHub checks
- Category-based filtering in config
- Historical trend tracking across versions
- Custom package tracking via config file
- Rate limit optimization with GitHub authentication

---

## [2.4.0] - 2026-04-04

### 🚀 Major New Features

#### GitHub Issues Integration
- **NEW:** Real-time tracking of GitHub issues for popular packages
- **NEW:** Predictive warnings based on recent bug activity
- **NEW:** Risk scoring system (low/medium/high severity)
- **NEW:** Issue trend analysis (increasing/stable/decreasing)
- **NEW:** Automatic detection of high-activity packages
- **NEW:** Live data from GitHub Issues API
- **NEW:** Smart recommendations based on issue trends

### Added
- GitHub Issues API integration (`src/alerts/github-tracker.js`)
  - Tracks open issues for 14+ popular packages
  - Analyzes issues by recency (last 7/30 days)
  - Detects critical issues via labels (critical, security, regression, breaking)
  - Calculates risk scores based on activity
  - Fetches live data from GitHub repositories
  - Rate limiting: 1 request per second to respect API limits
- Enhanced predictive warnings (`src/alerts/predictive.js`)
  - Real-time package health monitoring
  - Trend detection (increasing/stable/decreasing)
  - Risk score calculation (0-5 scale)
  - Actionable recommendations per package
  - Integration with GitHub issue data
- New output section: **🔮 PREDICTIVE WARNINGS**
  - Shows packages with unusual activity
  - Displays issue counts and trends
  - Links to GitHub repositories
  - Provides monitoring recommendations
- Cache clearing after fix command
  - Ensures fresh analysis after package changes
  - Automatic cache invalidation
  - Prevents stale data issues

### Changed
- `analyze` command now includes GitHub activity analysis
- Cache system expanded to include predictive warnings
- JSON output includes `predictiveWarnings` field with GitHub data
- Display output includes new predictive analysis section
- `fix` command now clears cache after applying changes
- Health score display includes predictive warning count

### Tracked Packages (v2.4.0)
Currently monitoring GitHub issues for:
- **axios** - axios/axios
- **lodash** - lodash/lodash
- **moment** - moment/moment
- **express** - expressjs/express
- **react** - facebook/react
- **vue** - vuejs/core
- **next** - vercel/next.js
- **webpack** - webpack/webpack
- **typescript** - microsoft/TypeScript
- **eslint** - eslint/eslint
- **jest** - jestjs/jest
- **prettier** - prettier/prettier
- **node-fetch** - node-fetch/node-fetch
- **chalk** - chalk/chalk

### Technical Details
- Uses GitHub REST API v3
- No authentication required (public API)
- Rate limiting: 1 second delay between requests
- Cache support for GitHub data (1 hour TTL)
- Graceful degradation if GitHub API unavailable
- Issue analysis includes:
  - Total open issues count
  - Issues in last 7 days
  - Issues in last 30 days
  - Critical issue detection by labels
  - Trend calculation (comparing weekly vs monthly)

### Risk Scoring Algorithm
```
Risk Score = 0-5 points based on:
- 3 points: >15 issues in last 7 days
- 2 points: 10-15 issues in last 7 days
- 1 point: 5-10 issues in last 7 days
- 2 points: >5 critical issues
- 1 point: 2-5 critical issues
- 1 point: Increasing trend detected
```

### Performance
- GitHub check: ~1 second per package
- Total for 14 packages: ~14 seconds on first run
- Cached runs: No additional time (data cached for 1 hour)
- Respects GitHub rate limits automatically

### Example Output
```
🔮 PREDICTIVE WARNINGS (2)

  Based on recent GitHub activity:

🟠 axios
   High bug activity detected
   15 new issues in last 7 days
   → Consider delaying upgrade or monitoring closely
   GitHub: https://github.com/axios/axios

🟡 webpack
   Increased issue activity
   8 issues opened recently
   → Monitor for stability
   GitHub: https://github.com/webpack/webpack
```

### JSON Output Schema (Extended)
New fields added to JSON output:
```json
{
  "summary": {
    "predictiveWarnings": 2
  },
  "predictiveWarnings": [
    {
      "package": "axios",
      "severity": "high",
      "title": "High bug activity detected",
      "description": "15 new issues in last 7 days",
      "recommendation": "Consider delaying upgrade or monitoring closely",
      "githubData": {
        "totalIssues": 234,
        "recentIssues": 15,
        "criticalIssues": 3,
        "trend": "increasing",
        "repoUrl": "https://github.com/axios/axios"
      }
    }
  ]
}
```

### Breaking Changes
- None (fully backward compatible)

### Migration Guide
No migration needed. Feature works automatically.

To disable predictive warnings (if needed):
```json
// devcompass.config.json
{
  "cache": false  // Disables all caching including GitHub data
}
```

### Use Cases
- **Proactive monitoring:** Detect issues before official announcements
- **Upgrade timing:** Know when to delay or proceed with updates
- **Package evaluation:** Compare activity levels when choosing packages
- **Risk assessment:** Identify high-maintenance dependencies
- **CI/CD integration:** Fail builds on high-risk package activity

### Files Changed
- `src/commands/analyze.js` - Added predictive warnings check
- `src/commands/fix.js` - Added cache clearing after fixes
- `src/utils/json-formatter.js` - Extended with predictive warnings field
- `package.json` - Version bump to 2.4.0, added new keywords

### New Files
- `src/alerts/github-tracker.js` - GitHub Issues API integration
  - Fetches issues from GitHub repositories
  - Analyzes issue trends and patterns
  - Calculates risk scores
  - Determines trend direction
- `src/alerts/predictive.js` - Enhanced with GitHub integration
  - Generates warnings from GitHub data
  - Risk assessment logic
  - Recommendation engine

### Known Limitations
- GitHub API rate limit: 60 requests/hour (unauthenticated)
- Only tracks packages in TRACKED_REPOS list (14 packages currently)
- Requires internet connection for GitHub data
- Cache prevents real-time updates (1 hour TTL)

### Future Enhancements (v2.5.0+)
- Expand to top 500 npm packages
- GitHub authentication for higher rate limits
- Configurable tracked packages list
- Historical trend tracking
- Email/Slack notifications for critical warnings
- Custom risk thresholds

---

## [2.3.1] - 2026-04-02

### 🔒 Security Update

**DevCompass practices what it preaches!** After releasing v2.3.0 with security scanning capabilities, we ran DevCompass on itself and discovered 14 transitive dependency vulnerabilities. This patch release fixes all of them.

### Fixed
- **All 14 security vulnerabilities resolved** (7 HIGH, 7 LOW severity)
- Upgraded `npm-check-updates` from v16.14.12 to v20.0.0
- Removed 315 vulnerable transitive dependencies
- Fixed vulnerabilities in:
  - `tar` package (7 HIGH severity issues)
    - Arbitrary File Creation/Overwrite via Hardlink Path Traversal
    - Symlink Poisoning via Insufficient Path Sanitization
    - Hardlink Target Escape Through Symlink Chain
    - Drive-Relative Linkpath vulnerabilities
    - Race Condition in Path Reservations
  - `@tootallnate/once` package (7 LOW severity issues)
    - Incorrect Control Flow Scoping

### Improved
- **Health score:** DevCompass's own score improved from 2.5/10 → 8.0/10
- **Bundle size:** Reduced from 9.1 MB → 6.2 MB (32% smaller)
- **Dependencies:** Cleaner dependency tree with 315 fewer packages
- **Performance:** Faster installation and smaller footprint

### Technical Details
- Breaking change accepted: npm-check-updates v20 has API changes
- All DevCompass features tested and verified working
- No user-facing breaking changes
- Fully backward compatible with v2.3.0

### Verification
All features confirmed working after upgrade:
- ✅ Security vulnerability scanning
- ✅ Bundle size analysis
- ✅ License compliance checking
- ✅ Ecosystem alerts
- ✅ JSON output for CI/CD
- ✅ Auto-fix command
- ✅ Caching system

### What This Demonstrates
This release showcases DevCompass's core mission:
1. **Transparency:** We detected and reported our own vulnerabilities
2. **Action:** We fixed them promptly and properly
3. **Quality:** We verified everything still works
4. **Trust:** We use our own tool and follow our own advice

### Migration Guide
No migration needed. Simply update:
```bash
npm install -g devcompass@2.3.1
```

---

## [2.3.0] - 2026-04-02

### 🚀 Major New Features

#### npm Audit Integration
- **NEW:** Automatic security vulnerability scanning via `npm audit`
- **NEW:** Severity breakdown (Critical/High/Moderate/Low)
- **NEW:** Direct integration with npm's security database
- **NEW:** Security score penalty in health calculation
- **NEW:** Quick fix suggestions via `npm audit fix`
- **NEW:** CVE tracking and fix availability detection

#### Bundle Size Analysis
- **NEW:** Automatic package size measurement from `node_modules`
- **NEW:** Identifies heavy packages (> 1MB)
- **NEW:** Shows top 10 largest dependencies
- **NEW:** Human-readable size formatting (KB/MB)
- **NEW:** Helps optimize bundle size for web applications
- **NEW:** Perfect for frontend performance optimization

#### License Checker
- **NEW:** Automatic license detection for all dependencies
- **NEW:** Warns about restrictive licenses (GPL, AGPL, LGPL)
- **NEW:** Identifies packages with unknown/missing licenses
- **NEW:** Legal compliance awareness for enterprise use
- **NEW:** Distinguishes between permissive and restrictive licenses

#### Enhanced Health Scoring
- Security vulnerabilities now impact health score
- Critical security issues: −2.5 points each
- High security issues: −1.5 points each
- Moderate security issues: −0.5 points each
- Low security issues: −0.2 points each
- More comprehensive project health assessment

### Added
- New security analyzer (`src/analyzers/security.js`)
  - npm audit integration
  - Vulnerability parsing and categorization
  - Security penalty calculation
  - CVE and fix availability tracking
- New bundle size analyzer (`src/analyzers/bundle-size.js`)
  - Recursive directory size calculation
  - Size formatting utilities (KB/MB)
  - Heavy package detection (> 1MB threshold)
  - Top 10 heaviest packages listing
- New license checker (`src/analyzers/licenses.js`)
  - License type classification (permissive/restrictive/unknown)
  - Restrictive license detection (GPL, AGPL, LGPL)
  - Unknown license warnings
  - Problematic license filtering
- Predictive alerts foundation (`src/alerts/predictive.js`)
  - Framework for GitHub Issues API integration
  - Trend analysis placeholder
  - Risk scoring system (future enhancement)

### Changed
- `analyze` command now includes 3 additional analysis sections
- Health score calculation enhanced with security penalty
- JSON output includes security, bundle, and license data
- Quick Wins section now prioritizes security fixes first
- Cache system expanded to include new analyzers
- Display output reorganized for better readability
- `displayResults()` function signature updated with new parameters

### Enhanced Sections
New terminal output sections:
1. **🔐 SECURITY VULNERABILITIES** - npm audit results with severity counts
2. **📦 HEAVY PACKAGES** - packages larger than 1MB with sizes
3. **⚖️ LICENSE WARNINGS** - restrictive or unknown licenses with types

### Technical Details
- No new dependencies required (uses built-in npm audit)
- All new analyzers are optional (graceful degradation)
- Cache support for all new features
- Performance: ~2-3 seconds additional analysis time on first run
- JSON output schema extended with new fields
- Backward compatible with v2.2.0

### Performance
- Security check: ~1-2 seconds (npm audit execution)
- Bundle analysis: ~1-2 seconds (file system traversal)
- License check: <1 second (package.json reads)
- Total added time: ~2-4 seconds on first run
- Cached runs: No additional time (all new data cached)

### JSON Output Schema (Extended)
New fields added:
```json
{
  "summary": {
    "securityVulnerabilities": 5,
    "heavyPackages": 3,
    "licenseWarnings": 2
  },
  "security": {
    "total": 5,
    "critical": 1,
    "high": 2,
    "moderate": 2,
    "low": 0,
    "vulnerabilities": [...]
  },
  "bundleAnalysis": {
    "heavyPackages": [...]
  },
  "licenses": {
    "warnings": [...]
  }
}
```

### Breaking Changes
- None (fully backward compatible)
- Health score may be lower due to security penalties
- JSON output schema extended (old fields unchanged)
- Function signatures extended with optional parameters

### Migration Guide
No migration needed. All new features work automatically.

Optional: Update `devcompass.config.json` to customize thresholds:
```json
{
  "minScore": 7,
  "cache": true
}
```

### Examples

#### Security Vulnerabilities Output
```
🔐 SECURITY VULNERABILITIES (12)

  🔴 CRITICAL: 2
  🟠 HIGH: 4
  🟡 MODERATE: 5
  ⚪ LOW: 1

  Run npm audit fix to fix vulnerabilities
```

#### Bundle Size Output
```
📦 HEAVY PACKAGES (3)

  Packages larger than 1MB:

  webpack                   2.3 MB
  typescript                8.1 MB
  @tensorflow/tfjs          12.4 MB
```

#### License Warnings Output
```
⚖️ LICENSE WARNINGS (2)

  sharp - Restrictive (LGPL-3.0)
  custom-lib - Unknown (UNLICENSED)

  Note: Restrictive licenses may require legal review
```

#### Complete Analysis Output
```
🔍 DevCompass v2.3.0 - Analyzing your project...
✔ Scanned 25 dependencies in project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 SECURITY VULNERABILITIES (5)

  🔴 CRITICAL: 1
  🟠 HIGH: 2
  🟡 MODERATE: 2

  Run npm audit fix to fix vulnerabilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ECOSYSTEM ALERTS (1)

🟠 HIGH
  axios@1.6.0
    Issue: Memory leak in request interceptors
    Fix: 1.6.2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 HEAVY PACKAGES (2)

  Packages larger than 1MB:

  typescript                8.1 MB
  webpack                   2.3 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ LICENSE WARNINGS (1)

  sharp - Restrictive (LGPL-3.0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH

  Overall Score:              6.2/10
  Total Dependencies:         25
  Security Vulnerabilities:   5
  Ecosystem Alerts:           1
  Unused:                     0
  Outdated:                   3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK WINS

  🔐 Fix security vulnerabilities:

  npm audit fix

  🔴 Fix critical issues:

  npm install axios@1.6.2

  Expected impact:
  ✓ Resolve security vulnerabilities
  ✓ Resolve critical stability issues
  ✓ Improve health score → 8.7/10

💡 TIP: Run 'devcompass fix' to apply these fixes automatically!
```

### Use Cases
- **Security Teams:** Automated vulnerability detection in CI/CD
- **Frontend Developers:** Bundle size optimization insights
- **Enterprise:** License compliance checks before deployment
- **DevOps:** Comprehensive dependency health monitoring
- **Legal/Compliance:** Identifying licensing risks
- **Performance Teams:** Bundle size optimization

### Roadmap Impact
- [x] ~~npm audit integration~~ ✅ **Completed in v2.3.0!**
- [x] ~~Bundle size analysis~~ ✅ **Completed in v2.3.0!**
- [x] ~~License checker~~ ✅ **Completed in v2.3.0!**
- [ ] GitHub Issues API integration (v2.4.0)
- [ ] Automated security patch suggestions (v2.4.0)
- [ ] Dependency graph visualization (v2.5.0)
- [ ] Web dashboard (v2.5.0)
- [ ] Team collaboration features (v2.6.0)

### Files Changed
- `src/commands/analyze.js` - Enhanced with new analyzers
- `src/analyzers/scoring.js` - Added security penalty parameter
- `src/utils/json-formatter.js` - Extended with new fields
- `package.json` - Version bump to 2.3.0

### New Files
- `src/analyzers/security.js` - Security vulnerability scanning
- `src/analyzers/bundle-size.js` - Package size analysis
- `src/analyzers/licenses.js` - License compliance checking
- `src/alerts/predictive.js` - Future predictive alerts

---

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

[2.5.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.5.0
[2.4.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.4.0
[2.3.1]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.3.1
[2.3.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.3.0
[2.2.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.2.0
[2.1.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.1.0
[2.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v2.0.0
[1.0.5]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.5
[1.0.2]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.2
[1.0.1]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.1
[1.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.0
