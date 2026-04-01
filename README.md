# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence for JavaScript/TypeScript projects**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect known security issues**, and get a comprehensive health score.

> **NEW in v2.0:** Real-time ecosystem alerts for known issues in your dependencies! 🚨

## ✨ Features

- 🚨 **Ecosystem Intelligence** (NEW!) - Detect known issues before they break production
- 🔍 **Detect unused dependencies** - Find packages you're not actually using
- 📦 **Check for outdated packages** - See what needs updating
- 🔐 **Security alerts** - Critical vulnerabilities and deprecated packages
- 📊 **Project health score** - Get a 0-10 rating for your dependencies
- 🎨 **Beautiful terminal UI** - Colored output with severity indicators
- ⚡ **Fast analysis** - Scans projects in seconds
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

Navigate to your project directory and run:
```bash
devcompass analyze
```

### Example Output (v2.0)
```
🔍 DevCompass v2.0.0 - Analyzing your project...
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
```

## 🚨 Ecosystem Intelligence (NEW in v2.0!)

DevCompass now tracks **real-world issues** in popular packages and warns you before they break production!

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
- **NEW:** Ecosystem alerts by severity (−0.2 to −2.0 per issue)
- Higher score = healthier project

## ⚙️ Options
```bash
# Analyze current directory
devcompass analyze

# Analyze specific directory
devcompass analyze --path /path/to/project

# Show version
devcompass --version

# Show help
devcompass --help
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

## 🛠️ Requirements

- Node.js >= 14.0.0
- npm or yarn

## 💡 Tips

1. **Run regularly** - Add to your CI/CD pipeline or git hooks
2. **Check before updates** - See what's outdated before updating
3. **Fix critical alerts first** - Prioritize security and stability
4. **Clean up unused deps** - Keep your project lean
5. **Verify before uninstalling** - DevCompass helps identify candidates, but always verify

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

# Run on test projects
cd /tmp
mkdir test-project && cd test-project
npm init -y
npm install axios@1.6.0 lodash@4.17.19
node ~/devcompass/bin/devcompass.js analyze
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

### Roadmap (v2.1+)
- [ ] Integration with `npm audit` for automated security scanning
- [ ] GitHub Issues API for real-time issue tracking
- [ ] Web dashboard for team health monitoring
- [ ] CI/CD integration with `--json` output
- [ ] More tracked packages (React, Next.js, Vue, Angular)
- [ ] Custom ignore rules via config file
- [ ] Automatic fix suggestions with `devcompass fix` command

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡
