# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence and real-time GitHub issue tracking for 500+ popular npm packages**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **check bundle sizes**, **verify licenses**, and **automatically fix issues** with a single command. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **NEW in v2.5.0:** Expanded to 502 packages across 33 categories! 🎯  
> **NEW in v2.4.0:** Real-time GitHub issue tracking & predictive warnings! 🔮  
> **NEW in v2.3.1:** Fixed all security vulnerabilities! Health score: 2.5/10 → 8/10 🔒  
> **NEW in v2.3:** Security scanning, bundle analysis & license checker! 🔐  
> **NEW in v2.2:** CI/CD integration with JSON output & smart caching! 🚀

## 🎉 Latest Update: v2.5.0

**500+ package coverage is here!** DevCompass now monitors live GitHub activity across the entire npm ecosystem:

- 🎯 **502 tracked packages** organized into 33 categories
- 🌐 **Full ecosystem coverage** - Frontend, backend, build tools, testing, databases, and more
- ⚡ **Zero performance impact** - Smart filtering only checks installed packages
- 📊 **Comprehensive monitoring** - React, Vue, Angular, Next.js, Express, and 497+ more
- 🔧 **Framework-agnostic** - Supports all major JavaScript frameworks and tools

**What's tracked:**
- Web Frameworks (25): react, vue, angular, svelte, preact, solid-js, etc.
- Backend Frameworks (20): express, koa, fastify, hapi, nest, strapi, etc.
- Build Tools (25): webpack, vite, rollup, parcel, esbuild, turbopack, etc.
- Testing (25): jest, mocha, vitest, cypress, playwright, storybook, etc.
- And 29 more categories covering the entire JavaScript ecosystem!

**Example output:**
```
🔮 PREDICTIVE WARNINGS (1)

  Based on recent GitHub activity (502+ packages monitored):

🟡 express
   Increased issue activity
   1 issues opened recently
   → Monitor for stability
   GitHub: https://github.com/expressjs/express
```

## ✨ Features

- 🎯 **500+ Package Coverage** (v2.5) - Comprehensive ecosystem monitoring
- 🔮 **GitHub Issue Tracking** (v2.4) - Real-time monitoring of package health
- 📈 **Predictive Warnings** (v2.4) - Detect issues before they're announced
- 🔐 **Security Scanning** (v2.3) - npm audit integration with severity breakdown
- 📦 **Bundle Size Analysis** (v2.3) - Identify heavy packages (> 1MB)
- ⚖️ **License Checker** (v2.3) - Detect restrictive licenses (GPL, AGPL)
- 🚀 **CI/CD Integration** (v2.2) - JSON output, exit codes, and silent mode
- ⚡ **Smart Caching** (v2.2) - 93% faster on repeated runs
- 🎛️ **Advanced Filtering** (v2.2) - Control alerts by severity level
- 🔧 **Auto-Fix Command** (v2.1) - Fix issues automatically with one command
- 🚨 **Ecosystem Intelligence** (v2.0) - Detect known issues before they break production
- 🔍 **Detect unused dependencies** - Find packages you're not actually using
- 📊 **Project health score** - Get a 0-10 rating for your dependencies
- 🎨 **Beautiful terminal UI** - Colored output with severity indicators
- 🔧 **Framework-aware** - Handles React, Next.js, Angular, NestJS, PostCSS, Tailwind

## 🚀 Installation

**Global installation (recommended):**
```bash
npm install -g devcompass
```

**Local installation:**
```bash
npm install --save-dev devcompass
```

**One-time use (no installation):**
```bash
npx devcompass analyze
```

## 📖 Usage

### Basic Commands
```bash
# Analyze your project
devcompass analyze

# Auto-fix issues
devcompass fix

# JSON output (for CI/CD)
devcompass analyze --json

# CI mode (exit code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent
```

## 🔮 Predictive Warnings (v2.5.0)

DevCompass now monitors **real-time GitHub activity for 500+ packages** to detect potential issues before they're officially reported!

### What it tracks:
- 🐛 **Open bug reports** in the last 7/30 days
- 🔥 **High-activity packages** with unusual issue spikes
- 📈 **Trend analysis** (increasing/stable/decreasing)
- ⚠️ **Critical issues** flagged by maintainers

### Currently tracked packages (502+):
Organized into 33 categories covering the entire JavaScript ecosystem:

**Web & UI Frameworks (25):** react, vue, angular, svelte, preact, solid-js, lit, alpine, qwik, astro, etc.

**Meta Frameworks (15):** next, nuxt, gatsby, remix, sveltekit, blitz, redwood, docusaurus, etc.

**Mobile Frameworks (10):** react-native, ionic, expo, capacitor, cordova, etc.

**Backend Frameworks (20):** express, koa, fastify, hapi, nest, strapi, meteor, trpc, apollo-server, etc.

**Build Tools (25):** webpack, vite, rollup, parcel, esbuild, turbopack, swc, babel, rome, etc.

**Testing Frameworks (25):** jest, mocha, vitest, cypress, playwright, puppeteer, storybook, etc.

**Linters & Formatters (15):** eslint, prettier, stylelint, biome, dprint, etc.

**TypeScript Tools (15):** typescript, ts-node, tsx, zod, yup, joi, ajv, etc.

**State Management (20):** redux, mobx, zustand, jotai, recoil, valtio, xstate, etc.

**HTTP Clients (20):** axios, got, ky, superagent, undici, @tanstack/react-query, swr, etc.

**Utilities (50):** lodash, moment, dayjs, chalk, ora, commander, uuid, nanoid, etc.

**CSS & Styling (25):** tailwindcss, sass, styled-components, emotion, unocss, etc.

**Plus 21 more categories:** Documentation, Database & ORM, GraphQL, Authentication, Validation, Reactivity, Animation, Charts, UI Libraries, Forms, Routing, File Upload, Markdown, Image Processing, Email, WebSockets, Compression, Security, CLI Tools, Performance, and Miscellaneous.

### Example Output:
```
🔮 PREDICTIVE WARNINGS (2)

  Based on recent GitHub activity (502+ packages monitored):

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

### How it works:
1. Fetches live issue data from GitHub API
2. Analyzes issue frequency (last 7/30 days)
3. Detects critical issues via labels
4. Calculates risk scores
5. Provides actionable recommendations
6. **Smart filtering:** Only checks packages you've actually installed

### Performance:
- **Smart filtering:** Only checks installed packages from your project
- **First run:** ~1 second per installed tracked package
- **Cached runs:** ~0.5 seconds (93% faster!)
- **Cache duration:** 1 hour
- **Zero overhead:** Uninstalled packages aren't checked

> **Performance Example:** If you have 5 tracked packages installed (e.g., react, axios, lodash, express, webpack), DevCompass only checks those 5, not all 502!

## 🔐 Security & Compliance Features

### Security Vulnerability Scanning

DevCompass integrates with **npm audit** to detect security vulnerabilities automatically!

**Example Output:**
```
🔐 SECURITY VULNERABILITIES (12)

  🔴 CRITICAL: 2
  🟠 HIGH: 4
  🟡 MODERATE: 5
  ⚪ LOW: 1

  Run npm audit fix to fix vulnerabilities
```

**How it works:**
1. Runs `npm audit` in the background
2. Parses vulnerability data
3. Shows severity breakdown
4. Impacts health score (-2.5 per critical issue)
5. Suggests fix commands

**Health Score Impact:**
- Critical: −2.5 points each
- High: −1.5 points each
- Moderate: −0.5 points each
- Low: −0.2 points each

### Bundle Size Analysis

Identify large dependencies that bloat your `node_modules`!

**Example Output:**
```
📦 HEAVY PACKAGES (3)

  Packages larger than 1MB:

  webpack                   2.3 MB
  typescript                8.1 MB
  @tensorflow/tfjs          12.4 MB
```

**Perfect for:**
- Frontend developers optimizing bundle size
- Identifying unnecessary large dependencies
- Web performance optimization
- Docker image size reduction

### License Compliance Checker

Detect restrictive licenses that may require legal review!

**Example Output:**
```
⚖️ LICENSE WARNINGS (2)

  sharp - Restrictive (LGPL-3.0)
  custom-lib - Unknown (UNLICENSED)

  Note: Restrictive licenses may require legal review
```

**What gets flagged:**
- **Restrictive licenses:** GPL, AGPL, LGPL (may require source code disclosure)
- **Unknown licenses:** Packages without license information
- **Unlicensed packages:** Legal risk for commercial use

**Supported licenses:**
- ✅ **Safe:** MIT, Apache-2.0, BSD, ISC, CC0
- ⚠️ **Restrictive:** GPL, AGPL, LGPL
- ❓ **Unknown:** Missing or custom licenses

### Combined Analysis Example

**Full Output:**
```
🔍 DevCompass v2.5.0 - Analyzing your project...
✔ Scanned 25 dependencies in project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SECURITY VULNERABILITIES

  No vulnerabilities detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ECOSYSTEM ALERTS (1)

🟠 HIGH
  axios@1.6.0
    Issue: Memory leak in request interceptors
    Fix: 1.6.2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔮 PREDICTIVE WARNINGS (1)

  Based on recent GitHub activity (502+ packages monitored):

🟡 express
   Increased issue activity
   8 issues opened recently
   → Monitor for stability
   GitHub: https://github.com/expressjs/express

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 HEAVY PACKAGES (2)

  Packages larger than 1MB:

  typescript                8.1 MB
  webpack                   2.3 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ LICENSE COMPLIANCE

  All licenses are permissive!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH

  Overall Score:              8.5/10
  Total Dependencies:         25
  Ecosystem Alerts:           1
  Predictive Warnings:        1
  Unused:                     0
  Outdated:                   2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK WINS

  🔴 Fix critical issues:

  npm install axios@1.6.2

  Expected impact:
  ✓ Resolve critical stability issues
  ✓ Improve health score → 10/10

💡 TIP: Run 'devcompass fix' to apply these fixes automatically!
```

## 🚀 CI/CD Integration

### JSON Output
Perfect for parsing in CI/CD pipelines:
```bash
devcompass analyze --json
```

**Output:**
```json
{
  "version": "2.5.0",
  "timestamp": "2026-04-04T10:30:00.000Z",
  "summary": {
    "healthScore": 8.5,
    "totalDependencies": 25,
    "securityVulnerabilities": 0,
    "ecosystemAlerts": 1,
    "predictiveWarnings": 1,
    "unusedDependencies": 0,
    "outdatedPackages": 2,
    "heavyPackages": 2,
    "licenseWarnings": 0
  },
  "security": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0,
    "vulnerabilities": []
  },
  "predictiveWarnings": [
    {
      "package": "express",
      "severity": "medium",
      "title": "Increased issue activity",
      "description": "8 issues opened recently",
      "recommendation": "Monitor for stability",
      "githubData": {
        "totalIssues": 234,
        "recentIssues": 8,
        "trend": "increasing",
        "repoUrl": "https://github.com/expressjs/express"
      }
    }
  ],
  "bundleAnalysis": {
    "heavyPackages": [
      { "name": "typescript", "size": "8.1 MB" },
      { "name": "webpack", "size": "2.3 MB" }
    ]
  },
  "licenses": {
    "warnings": []
  },
  "ecosystemAlerts": [...],
  "unusedDependencies": [],
  "outdatedPackages": [...]
}
```

### CI Mode
Automatically fail builds if health score is too low:
```bash
devcompass analyze --ci
```

- ✅ **Exit code 0** if score ≥ threshold (default: 7/10)
- ❌ **Exit code 1** if score < threshold

**GitHub Actions Example:**
```yaml
name: Dependency Health Check

on: [push, pull_request]

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx devcompass analyze --ci
```

### Silent Mode
For background checks or scripts:
```bash
devcompass analyze --silent
echo $?  # Check exit code
```

## ⚡ Smart Caching

DevCompass caches results to improve performance:

- **First run:** ~8 seconds (fetches GitHub + npm data)
- **Cached runs:** ~0.5 seconds (93% faster!)
- **Cache duration:** 1 hour
- **Cache file:** `.devcompass-cache.json` (auto-gitignored)

**What gets cached:**
- GitHub issue data (v2.4+)
- Predictive warnings (v2.4+)
- Security vulnerabilities
- Ecosystem alerts
- Unused dependencies
- Outdated packages
- Bundle sizes
- License information

**Disable caching:**
```json
// devcompass.config.json
{
  "cache": false
}
```

## 🎛️ Advanced Configuration

Create `devcompass.config.json` in your project root:
```json
{
  "ignore": ["lodash", "moment"],
  "ignoreSeverity": ["low"],
  "minSeverity": "medium",
  "minScore": 7,
  "cache": true
}
```

### Configuration Options

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `ignore` | `string[]` | Ignore specific packages from alerts | `["lodash", "axios"]` |
| `ignoreSeverity` | `string[]` | Ignore severity levels | `["low", "medium"]` |
| `minSeverity` | `string` | Only show alerts above this level | `"high"` (shows critical + high) |
| `minScore` | `number` | Minimum score for CI mode | `7` (fails if < 7) |
| `cache` | `boolean` | Enable/disable caching | `true` |

### Severity Levels (highest to lowest)
1. **critical** - Immediate security risk
2. **high** - Production stability issues
3. **medium** - Maintenance concerns
4. **low** - Minor issues

### Example Configurations

**Security-focused (strict):**
```json
{
  "minSeverity": "critical",
  "minScore": 9
}
```

**Balanced (recommended):**
```json
{
  "ignoreSeverity": ["low"],
  "minScore": 7
}
```

**Relaxed (development):**
```json
{
  "ignoreSeverity": ["low", "medium"],
  "minScore": 5
}
```

## 🔧 Auto-Fix Command

DevCompass can **automatically fix issues** in your project!

### What it does:
- 🔴 **Fixes critical security issues** - Upgrades packages with known vulnerabilities
- 🧹 **Removes unused dependencies** - Cleans up packages you're not using
- ⬆️ **Safe updates** - Applies patch and minor updates automatically
- ⚠️ **Skips breaking changes** - Major updates require manual review
- 🔄 **Clears cache** - Ensures fresh analysis after fixes (v2.4+)

### Usage
```bash
# Interactive mode (asks for confirmation)
devcompass fix

# Auto-apply without confirmation (for CI/CD)
devcompass fix --yes
devcompass fix -y

# Fix specific directory
devcompass fix --path /path/to/project
```

### Safety Features
- ✅ Shows what will be changed before applying
- ✅ Requires confirmation (unless `--yes` flag used)
- ✅ Skips major updates (may have breaking changes)
- ✅ Groups actions by priority (critical → cleanup → updates)
- ✅ Clears cache after fixes (v2.4+)
- ✅ Provides clear summary of changes

### Workflow Example
```bash
# 1. Analyze your project
devcompass analyze

# 2. If issues found, auto-fix them
devcompass fix

# 3. Verify the improvements
devcompass analyze
```

## 🚨 Ecosystem Intelligence

DevCompass tracks **real-world issues** in 500+ popular packages and warns you before they break production!

### What Gets Detected:
- 🔴 **Critical security vulnerabilities** - Zero-day exploits, prototype pollution
- 🟠 **High-severity bugs** - Memory leaks, data corruption, breaking changes
- 🟡 **Deprecated packages** - Unmaintained dependencies
- ⚪ **Low-priority issues** - Minor bugs, cosmetic problems

### Severity Levels:
- **CRITICAL** - Immediate security risk or data loss (−2.0 points per issue)
- **HIGH** - Production stability issues (−1.5 points per issue)
- **MEDIUM** - Maintenance concerns, deprecations (−0.5 points per issue)
- **LOW** - Minor issues (−0.2 points per issue)

### How It Works:
1. Reads your actual installed versions from `node_modules`
2. Matches against curated issues database
3. Uses semantic versioning for precise detection
4. Checks live GitHub activity for 502+ packages
5. Shows actionable fix commands

## 🎯 What It Detects

### Unused Dependencies
- Uses AST parsing via [depcheck](https://github.com/depcheck/depcheck)
- Scans all `.js`, `.jsx`, `.ts`, `.tsx` files
- Excludes `node_modules`, `dist`, `build` folders
- Framework-aware (automatically ignores framework core packages)

### Automatically Ignored Packages
DevCompass won't flag these as unused (they're typically used in config files):
- **Frameworks:** React, Next.js, Angular, NestJS
- **Build tools:** Webpack, Vite, Rollup, ESBuild
- **Testing:** Jest, Vitest, Mocha, Testing Library
- **CSS/PostCSS:** PostCSS, Autoprefixer, Tailwind CSS, cssnano
- **Linting/Formatting:** ESLint, Prettier, ESLint plugins/configs
- **TypeScript:** TypeScript, @types/* packages

### Outdated Packages
- Checks against npm registry
- Shows current vs latest versions
- Indicates update type (major/minor/patch)

### Health Score
Calculated from 0-10 based on:
- Percentage of unused dependencies (−4 points per 100%)
- Percentage of outdated packages (−3 points per 100%)
- Ecosystem alerts by severity (−0.2 to −2.0 per issue)
- Security vulnerabilities by severity (−0.2 to −2.5 per issue)
- Higher score = healthier project

## ⚙️ Commands & Options

### Commands
```bash
# Analyze project dependencies
devcompass analyze

# Auto-fix issues
devcompass fix

# Show version
devcompass --version
devcompass -v

# Show help
devcompass --help
devcompass -h
```

### Analyze Options
```bash
# Analyze specific directory
devcompass analyze --path /path/to/project

# JSON output (for CI/CD)
devcompass analyze --json

# CI mode (fail if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent

# Combine options
devcompass analyze --path ./my-project --json
```

### Fix Options
```bash
# Fix specific directory
devcompass fix --path /path/to/project

# Auto-apply without confirmation
devcompass fix --yes
devcompass fix -y
```

## 🔄 Complete Workflows

### Local Development Workflow
```bash
# Check project health
devcompass analyze

# Fix issues automatically
devcompass fix

# Verify improvements
devcompass analyze
```

### CI/CD Pipeline Workflow
```bash
# Analyze and export JSON
devcompass analyze --json > health-report.json

# Fail build if score too low
devcompass analyze --ci

# Or combine with other checks
devcompass analyze --ci && npm test && npm run build
```

### Pre-commit Hook Workflow
```bash
# .husky/pre-commit
#!/bin/sh
devcompass analyze --silent
if [ $? -ne 0 ]; then
  echo "❌ Dependency health check failed!"
  exit 1
fi
```

### Security-Focused Workflow
```bash
# 1. Run security scan
devcompass analyze

# 2. Check for critical vulnerabilities
devcompass analyze --json | jq '.security.critical'

# 3. Auto-fix if possible
npm audit fix

# 4. Verify fixes
devcompass analyze
```

## ⚠️ Known Issues & Best Practices

### Installation
- **Recommended:** Install globally with `npm install -g devcompass`
- If installed locally, DevCompass may appear in the unused dependencies list (this is expected)
- You'll see a warning if running from local installation

### Dependency Warnings
Some deprecation warnings may appear during installation. These come from third-party dependencies (depcheck, npm-check-updates) and don't affect functionality.

### False Positives
DevCompass is smart about config-based dependencies, but occasionally may flag packages that are only used in:
- Config files (webpack.config.js, next.config.js, etc.)
- Build scripts
- Type definitions

If you encounter a false positive, please [report it](https://github.com/AjayBThorat-20/devcompass/issues)!

### Cache Management
- Cache files (`.devcompass-cache.json`) are automatically gitignored
- Cache expires after 1 hour
- Delete cache file manually if needed: `rm .devcompass-cache.json`

## 🛠️ Requirements

- Node.js >= 14.0.0
- npm or yarn

## 💡 Tips

1. **Run regularly** - Add to your CI/CD pipeline or git hooks
2. **Use fix command** - Let DevCompass handle routine maintenance
3. **Check security first** - Prioritize fixing critical vulnerabilities
4. **Monitor bundle size** - Keep an eye on heavy packages
5. **Review licenses** - Ensure compliance with your legal requirements
6. **Configure severity levels** - Filter out noise with `minSeverity`
7. **Enable CI mode** - Catch issues before they reach production
8. **Use JSON output** - Integrate with your monitoring tools
9. **Review major updates** - Always check changelogs before major version bumps
10. **Verify before uninstalling** - DevCompass helps identify candidates, but always verify
11. **Watch predictive warnings** - Monitor packages with increasing issue activity
12. **Cache for speed** - First run takes ~8s, cached runs ~0.5s

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding Issues to Database
Want to add known issues for a package?

1. Edit `data/issues-db.json`
2. Follow the existing format:
```json
{
  "package-name": [
    {
      "title": "Brief issue description",
      "severity": "critical|high|medium|low",
      "affected": "semver range (e.g., >=1.0.0 <2.0.0)",
      "fix": "Fixed version or migration advice",
      "source": "GitHub Issue #123 or npm advisory",
      "reported": "YYYY-MM-DD"
    }
  ]
}
```
3. Submit a PR with your additions!

### Development
```bash
# Clone the repo
git clone https://github.com/AjayBThorat-20/devcompass.git
cd devcompass

# Install dependencies
npm install

# Test locally
node bin/devcompass.js analyze
node bin/devcompass.js fix

# Run on test projects
cd /tmp
mkdir test-project && cd test-project
npm init -y
npm install axios@1.6.0 lodash@4.17.19
node ~/devcompass/bin/devcompass.js analyze
node ~/devcompass/bin/devcompass.js fix
```

## 📝 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/devcompass)
- [GitHub Repository](https://github.com/AjayBThorat-20/devcompass)
- [Report Issues](https://github.com/AjayBThorat-20/devcompass/issues)
- [Changelog](https://github.com/AjayBThorat-20/devcompass/blob/main/CHANGELOG.md)

## 🙏 Acknowledgments

Built with:
- [depcheck](https://github.com/depcheck/depcheck) - Dependency checker
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates) - Package updater
- [chalk](https://github.com/chalk/chalk) - Terminal colors
- [ora](https://github.com/sindresorhus/ora) - Spinners
- [commander](https://github.com/tj/commander.js) - CLI framework
- [semver](https://github.com/npm/node-semver) - Semantic versioning

## 📈 Stats

Check out DevCompass stats:
- [npm trends](https://npmtrends.com/devcompass)
- [npm-stat](https://npm-stat.com/charts.html?package=devcompass)

## 🌟 What's Next?

### Roadmap
- [x] ~~Automatic fix command~~ ✅ **Added in v2.1!**
- [x] ~~CI/CD integration with JSON output~~ ✅ **Added in v2.2!**
- [x] ~~Smart caching system~~ ✅ **Added in v2.2!**
- [x] ~~Custom ignore rules via config file~~ ✅ **Added in v2.2!**
- [x] ~~npm audit integration~~ ✅ **Added in v2.3!**
- [x] ~~Bundle size analysis~~ ✅ **Added in v2.3!**
- [x] ~~License compliance checker~~ ✅ **Added in v2.3!**
- [x] ~~Fix all security vulnerabilities~~ ✅ **Fixed in v2.3.1!**
- [x] ~~GitHub Issues API for real-time issue tracking~~ ✅ **Added in v2.4.0!**
- [x] ~~Predictive warnings based on bug activity~~ ✅ **Added in v2.4.0!**
- [x] ~~Expand to top 500 npm packages~~ ✅ **Added in v2.5.0!**
- [ ] Performance optimizations with parallel processing (v2.6.0)
- [ ] Advanced security features with Snyk integration (v2.7.0)
- [ ] Enhanced fix command improvements (v2.8.0)
- [ ] Dependency graph visualization (v3.0.0)
- [ ] Web dashboard for team health monitoring (v3.0.0)
- [ ] Team collaboration features (v3.1.0)
- [ ] Slack/Discord notifications (v3.1.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡