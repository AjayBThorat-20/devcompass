# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence for JavaScript/TypeScript projects**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect known security issues**, and **automatically fix them** with a single command. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **NEW in v2.2:** CI/CD integration with JSON output & smart caching! 🚀  
> **NEW in v2.1:** Auto-fix command! 🔧 Fix critical issues automatically!  
> **NEW in v2.0:** Real-time ecosystem alerts for known issues! 🚨

## ✨ Features

- 🚀 **CI/CD Integration** (NEW in v2.2!) - JSON output, exit codes, and silent mode
- ⚡ **Smart Caching** (NEW in v2.2!) - 70% faster on repeated runs
- 🎛️ **Advanced Filtering** (NEW in v2.2!) - Control alerts by severity level
- 🔧 **Auto-Fix Command** (v2.1) - Fix issues automatically with one command
- 🚨 **Ecosystem Intelligence** (v2.0) - Detect known issues before they break production
- 🔍 **Detect unused dependencies** - Find packages you're not actually using
- 📦 **Check for outdated packages** - See what needs updating
- 🔐 **Security alerts** - Critical vulnerabilities and deprecated packages
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

## 🚀 NEW in v2.2: CI/CD Integration

### JSON Output
Perfect for parsing in CI/CD pipelines:
```bash
devcompass analyze --json
```

**Output:**
```json
{
  "version": "2.2.0",
  "timestamp": "2026-04-01T15:51:10.395Z",
  "summary": {
    "healthScore": 7.5,
    "totalDependencies": 15,
    "ecosystemAlerts": 2,
    "unusedDependencies": 3,
    "outdatedPackages": 5
  },
  "ecosystemAlerts": [...],
  "unusedDependencies": [...],
  "outdatedPackages": [...],
  "scoreBreakdown": {
    "unusedPenalty": 0.8,
    "outdatedPenalty": 1.7,
    "alertsPenalty": 3.5
  }
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
      - run: npm install -g devcompass
      - run: devcompass analyze --ci
```

### Silent Mode
For background checks or scripts:
```bash
devcompass analyze --silent
echo $?  # Check exit code
```

## ⚡ NEW in v2.2: Smart Caching

DevCompass now caches results to improve performance:

- **First run:** Normal speed (fetches all data)
- **Cached runs:** ~70% faster
- **Cache duration:** 1 hour
- **Cache file:** `.devcompass-cache.json` (auto-gitignored)

**Disable caching:**
```json
// devcompass.config.json
{
  "cache": false
}
```

## 🎛️ NEW in v2.2: Advanced Configuration

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

**Only show critical security issues:**
```json
{
  "minSeverity": "critical",
  "minScore": 8
}
```

**Ignore low-priority alerts:**
```json
{
  "ignoreSeverity": ["low"]
}
```

**Strict CI mode:**
```json
{
  "minScore": 9,
  "minSeverity": "high"
}
```

## 🔧 Auto-Fix Command

DevCompass can now **automatically fix issues** in your project!

### What it does:
- 🔴 **Fixes critical security issues** - Upgrades packages with known vulnerabilities
- 🧹 **Removes unused dependencies** - Cleans up packages you're not using
- ⬆️ **Safe updates** - Applies patch and minor updates automatically
- ⚠️ **Skips breaking changes** - Major updates require manual review

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

### Example Output
```
🔧 DevCompass Fix - Analyzing and fixing your project...

🔴 CRITICAL ISSUES TO FIX:

🔴 lodash@4.17.19
   Issue: Prototype pollution vulnerability
   Fix: Upgrade to 4.17.21

🟠 axios@1.6.0
   Issue: Memory leak in request interceptors
   Fix: Upgrade to 1.6.2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧹 UNUSED DEPENDENCIES TO REMOVE:

  ● moment
  ● express

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⬆️  SAFE UPDATES (patch/minor):

  react-dom: 18.2.0 → 18.2.1 (patch update)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  MAJOR UPDATES (skipped - may have breaking changes):

  express: 4.18.0 → 5.2.1

  Run these manually after reviewing changelog:
  npm install express@5.2.1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FIX SUMMARY:

  Critical fixes:  2
  Remove unused:   2
  Safe updates:    1
  Skipped major:   1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ Apply these fixes? (y/N): y

🔧 Applying fixes...

✔ ✅ Removed 2 unused packages
✔ ✅ Fixed lodash@4.17.21
✔ ✅ Fixed axios@1.6.2
✔ ✅ Updated 1 packages

✨ All fixes applied successfully!

💡 Run devcompass analyze to see the new health score.
```

### Safety Features
- ✅ Shows what will be changed before applying
- ✅ Requires confirmation (unless `--yes` flag used)
- ✅ Skips major updates (may have breaking changes)
- ✅ Groups actions by priority (critical → cleanup → updates)
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

## 📊 Analyze Command

### Example Output (v2.2)
```
🔍 DevCompass v2.2.0 - Analyzing your project...
✔ Scanned 15 dependencies in project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ECOSYSTEM ALERTS (2)

🔴 CRITICAL
  lodash@4.17.19
    Issue: Prototype pollution vulnerability
    Affected: <4.17.21
    Fix: 4.17.21
    Source: npm advisory 1523

🟠 HIGH
  axios@1.6.0
    Issue: Memory leak in request interceptors
    Affected: >=1.5.0 <1.6.2
    Fix: 1.6.2
    Source: GitHub Issue #5456

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 UNUSED DEPENDENCIES (2)
  ● moment
  ● request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 OUTDATED PACKAGES (3)
  react          18.2.0 → ^19.0.0  (major update)
  express        4.18.0 → ^4.19.0  (patch update)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH
  Overall Score:       5.5/10
  Total Dependencies:  15
  Ecosystem Alerts:    2
  Unused:              2
  Outdated:            3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK WINS
  🔴 Fix critical issues:

  npm install lodash@4.17.21
  npm install axios@1.6.2

  🧹 Clean up unused dependencies:

  npm uninstall moment request

  Expected impact:
  ✓ Resolve critical security/stability issues
  ✓ Remove 2 unused packages
  ✓ Reduce node_modules size
  ✓ Improve health score → 8.5/10

💡 TIP: Run 'devcompass fix' to apply these fixes automatically!
```

## 🚨 Ecosystem Intelligence

DevCompass tracks **real-world issues** in popular packages and warns you before they break production!

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

### Currently Tracked Packages:
- **axios** - Memory leaks, breaking changes
- **lodash** - Security vulnerabilities (prototype pollution)
- **moment** - Deprecation notice
- **express** - Security issues in dependencies
- **request** - Package deprecated

> More packages being added regularly! [Suggest a package](https://github.com/AjayBThorat-20/devcompass/issues)

### How It Works:
1. Reads your actual installed versions from `node_modules`
2. Matches against curated issues database
3. Uses semantic versioning for precise detection
4. Shows actionable fix commands

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

### Health Score (Enhanced in v2.0)
Calculated from 0-10 based on:
- Percentage of unused dependencies (−4 points per 100%)
- Percentage of outdated packages (−3 points per 100%)
- Ecosystem alerts by severity (−0.2 to −2.0 per issue)
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
3. **Configure severity levels** - Filter out noise with `minSeverity`
4. **Enable CI mode** - Catch issues before they reach production
5. **Use JSON output** - Integrate with your monitoring tools
6. **Fix critical alerts first** - Prioritize security and stability
7. **Review major updates** - Always check changelogs before major version bumps
8. **Verify before uninstalling** - DevCompass helps identify candidates, but always verify

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

### Roadmap (v2.3+)
- [x] ~~Automatic fix command~~ ✅ **Added in v2.1!**
- [x] ~~CI/CD integration with JSON output~~ ✅ **Added in v2.2!**
- [x] ~~Smart caching system~~ ✅ **Added in v2.2!**
- [x] ~~Custom ignore rules via config file~~ ✅ **Added in v2.2!**
- [ ] Integration with `npm audit` for automated security scanning
- [ ] GitHub Issues API for real-time issue tracking
- [ ] Web dashboard for team health monitoring
- [ ] More tracked packages (React, Next.js, Vue, Angular)
- [ ] Bundle size analysis
- [ ] Automated security patch suggestions
- [ ] Team collaboration features

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡