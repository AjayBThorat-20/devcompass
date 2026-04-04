# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, parallel processing, supply chain security analysis, advanced license risk detection, and enhanced fix command with dry-run mode.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **check bundle sizes**, **verify licenses**, **detect supply chain attacks**, **analyze package quality**, and **automatically fix issues** with a single command. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **LATEST v2.8.0:** Enhanced fix command - Dry-run, progress tracking, backups & reports! 🔧  
> **PREVIOUS v2.7.1:** Bugfix - Fixed false positive typosquatting warnings! 🐛  
> **NEW in v2.7.0:** Advanced security features - Supply chain analysis, license risk detection, package quality metrics! 🔐  
> **NEW in v2.6.0:** 80% faster with parallel processing! ⚡  
> **NEW in v2.5.0:** Expanded to 502 packages across 33 categories! 🎯

## 🎉 Latest Update: v2.8.0 - Enhanced Fix Command

**Major improvements to the fix command!** DevCompass now includes dry-run mode, progress tracking, automatic backups, and detailed fix reports.

### What's New in v2.8.0:
- 🔍 **Dry-Run Mode** - Preview fixes without making changes (`--dry-run` or `--dry`)
- 📊 **Progress Tracking** - Real-time progress with ETA and percentage completion
- 💾 **Automatic Backups** - Creates backup before applying any fixes
- 📄 **Fix Reports** - Detailed JSON reports saved to `devcompass-fix-report.json`
- ⚡ **Enhanced Error Handling** - Graceful failure recovery with detailed error messages
- 🎯 **6-Step Workflow** - Clear step-by-step process from analysis to completion

**Example workflow:**
```bash
# Preview what will be fixed (no changes)
devcompass fix --dry-run

# Apply fixes with confirmation
devcompass fix

# Auto-apply without confirmation (CI/CD)
devcompass fix --yes
```

**Enhanced output:**
```
🔧 DevCompass Fix

Step 1: Analyzing issues...
✔ Analysis complete

Step 2: Planned fixes

🔴 CRITICAL SECURITY FIXES
  → Run npm audit fix to resolve 5 vulnerabilities

🟡 UNUSED DEPENDENCIES
  lodash
    → Will be removed

🔵 SAFE UPDATES (patch/minor)
  axios
    → 1.6.0 → 1.6.2

Total fixes to apply: 7

Step 3: Confirm
⚠️  Apply these fixes? (y/N): y

Step 4: Creating backup...
✓ Backup created: backup-2026-04-04T10-30-00-000Z

Step 5: Applying fixes...
⠹ Removing lodash... [3/7] 43% • 2.1s elapsed • ETA: 2.8s

Step 6: Clearing cache...
✓ Cache cleared

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FIX REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  ✓ Fixes Applied: 7
  ⏱  Duration: 5.32s

Fixes Applied:
  1. npm audit
     → Fixed security vulnerabilities
  2. axios
     → Updated to 1.6.2
     Version: 1.6.0 → 1.6.2
  3. lodash
     → Removed unused dependency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Successfully applied 7 fix(es)!

💡 TIP: Run devcompass analyze to verify improvements

📄 Full report saved to: devcompass-fix-report.json
```

**Upgrade now:**
```bash
npm install -g devcompass@2.8.0
```

---

## 🎉 v2.7.1 Update

**Quick bugfix release!** Fixed false positive typosquatting warnings in v2.7.0.

### What's Fixed in v2.7.1:
- ✅ **No more chalk vs chai warnings** - Enhanced whitelist prevents legitimate packages from being flagged
- ✅ **Improved typosquatting detection** - Skip comparison when both packages are legitimate
- ✅ **Better object iteration** - Fixed handling of typosquat_patterns structure

---

## 🎉 v2.7.0 Features

**Comprehensive security analysis without external dependencies!** DevCompass now includes advanced security features:

- 🛡️ **Supply Chain Security** - Detect malicious packages & typosquatting
- ⚖️ **License Risk Detection** - Enhanced license compliance checking
- 📊 **Package Quality Metrics** - Health scores for all dependencies
- 💡 **Security Recommendations** - Actionable, prioritized fix suggestions
- 🔍 **Install Script Analysis** - Detect suspicious postinstall hooks
- 📈 **Maintainer Activity** - Track package maintenance status

**Example output:**
```
🛡️ SUPPLY CHAIN SECURITY

✅ No supply chain risks detected!

⚖️ LICENSE RISK ANALYSIS

  Project License: MIT

✅ All licenses are compliant!

📊 PACKAGE QUALITY METRICS (20 analyzed)

✅ HEALTHY PACKAGES (18)
  react, axios, lodash, express, webpack...

💡 SECURITY RECOMMENDATIONS (Prioritized)

📈 Expected Impact:
  ✓ Current Health Score: 8.5/10
  ✓ Project is in excellent health!
```

## ✨ Features

- 🔧 **Enhanced Fix Command** (v2.8.0) - Dry-run, progress tracking, backups & reports
- 🛡️ **Supply Chain Security** (v2.7) - Malicious package & typosquatting detection
- ⚖️ **License Risk Analysis** (v2.7) - Enhanced license compliance checking
- 📊 **Package Quality Metrics** (v2.7) - Health scoring for dependencies
- 💡 **Security Recommendations** (v2.7) - Prioritized, actionable fixes
- ⚡ **Parallel Processing** (v2.6) - 80% faster GitHub issue tracking
- 🎯 **500+ Package Coverage** (v2.5) - Comprehensive ecosystem monitoring
- 🔮 **GitHub Issue Tracking** (v2.4) - Real-time monitoring of package health
- 📈 **Predictive Warnings** (v2.4) - Detect issues before they're announced
- 🔐 **Security Scanning** (v2.3) - npm audit integration with severity breakdown
- 📦 **Bundle Size Analysis** (v2.3) - Identify heavy packages (> 1MB)
- ⚖️ **License Checker** (v2.3) - Detect restrictive licenses (GPL, AGPL)
- 🚀 **CI/CD Integration** (v2.2) - JSON output, exit codes, and silent mode
- ⚡ **Smart Caching** (v2.2) - 93% faster on repeated runs
- 🎛️ **Advanced Filtering** (v2.2) - Control alerts by severity level
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

# Preview fixes without making changes (NEW in v2.8.0!)
devcompass fix --dry-run

# Auto-fix without confirmation (CI/CD)
devcompass fix --yes

# JSON output (for CI/CD)
devcompass analyze --json

# CI mode (exit code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent
```

## 🔧 Auto-Fix Command (Enhanced in v2.8.0!)

DevCompass can **automatically fix issues** in your project with advanced features!

### What it does:
- 🔴 **Fixes critical security issues** - Upgrades packages with known vulnerabilities
- 🧹 **Removes unused dependencies** - Cleans up packages you're not using
- ⬆️ **Safe updates** - Applies patch and minor updates automatically
- ⚠️ **Skips breaking changes** - Major updates require manual review
- 🔄 **Clears cache** - Ensures fresh analysis after fixes (v2.4+)
- 🔍 **Dry-run mode** - Preview changes without applying (v2.8.0)
- 📊 **Progress tracking** - Real-time updates with ETA (v2.8.0)
- 💾 **Automatic backups** - Creates backup before fixes (v2.8.0)
- 📄 **Fix reports** - Detailed JSON reports (v2.8.0)

### Usage
```bash
# Preview fixes without making changes (NEW in v2.8.0!)
devcompass fix --dry-run
devcompass fix --dry  # Shorthand

# Interactive mode (asks for confirmation)
devcompass fix

# Auto-apply without confirmation (for CI/CD)
devcompass fix --yes
devcompass fix -y

# Fix specific directory
devcompass fix --path /path/to/project

# Combine options
devcompass fix --path ./my-project --yes
```

### New Features (v2.8.0)

#### 1. Dry-Run Mode 🔍
Test fixes safely before applying:
```bash
devcompass fix --dry-run
```
- Shows complete fix plan
- Zero risk testing
- Perfect for validation in CI/CD
- No changes made to your project

#### 2. Progress Tracking 📊
Real-time feedback during fixes:
- Shows current step (X/Y) with percentage
- Displays elapsed time
- Shows estimated time remaining (ETA)
- Live package-by-package updates

**Example:**
```
⠹ Updating axios... [3/7] 43% • 2.1s elapsed • ETA: 2.8s
```

#### 3. Automatic Backups 💾
Safety net before any changes:
- Backs up `package.json` and `package-lock.json`
- Stored in `.devcompass-backups/`
- Keeps last 5 backups (auto-cleanup)
- Timestamped for easy identification

**Backup location:**
```
.devcompass-backups/
  ├── backup-2026-04-04T10-30-00-000Z/
  │   ├── package.json
  │   ├── package-lock.json
  │   └── metadata.json
  └── ...
```

#### 4. Fix Reports 📄
Comprehensive documentation of all changes:
- Saved to `devcompass-fix-report.json`
- Lists all fixes applied with timestamps
- Tracks errors and skipped items
- Duration tracking for performance analysis
- Terminal display with color-coded output

**Report structure:**
```json
{
  "summary": {
    "totalFixes": 7,
    "totalErrors": 0,
    "totalSkipped": 2,
    "duration": "5.32s",
    "timestamp": "2026-04-04T10:30:00.000Z"
  },
  "fixes": [...],
  "errors": [...],
  "skipped": [...]
}
```

#### 5. Enhanced Error Handling ⚡
Robust failure recovery:
- Continues on partial errors
- Detailed error reporting
- Clear error messages
- Non-blocking execution
- Backup reminder on failure

#### 6. 6-Step Workflow 🎯
Clear, organized process:
1. **Analyze issues** - Scan project for fixable problems
2. **Show plan** - Display categorized fix plan
3. **Confirm** - Get user confirmation (unless `--yes` or `--dry-run`)
4. **Backup** - Create automatic backup
5. **Apply fixes** - Execute fixes with progress tracking
6. **Report** - Generate and display comprehensive report

### Safety Features
- ✅ Shows what will be changed before applying
- ✅ Requires confirmation (unless `--yes` flag used)
- ✅ Skips major updates (may have breaking changes)
- ✅ Groups actions by priority (critical → cleanup → updates)
- ✅ Clears cache after fixes (v2.4+)
- ✅ Provides clear summary of changes
- ✅ Creates automatic backup before any changes (v2.8.0)
- ✅ Dry-run mode for safe testing (v2.8.0)
- ✅ Detailed error messages and recovery (v2.8.0)

### Workflow Examples

#### Local Development
```bash
# 1. Preview what will be fixed
devcompass fix --dry-run

# 2. Review the plan, then apply
devcompass fix

# 3. Verify improvements
devcompass analyze
```

#### CI/CD Pipeline
```bash
# Dry-run in PR checks (no changes)
devcompass fix --dry-run

# Auto-apply in deployment pipeline
devcompass fix --yes
```

#### Emergency Security Fix
```bash
# Quick fix for critical vulnerabilities
devcompass fix --yes

# Check the fix report
cat devcompass-fix-report.json
```

### What Gets Fixed

**Priority 1: Critical Security** 🔴
- Critical and high severity vulnerabilities
- Runs `npm audit fix`
- Upgrades to secure versions

**Priority 2: Ecosystem Alerts** 🟠
- Critical and high severity known issues
- Upgrades to recommended versions
- Fixes package-specific problems

**Priority 3: Unused Dependencies** 🟡
- Removes packages not used in code
- Cleans up `node_modules`
- Reduces security surface

**Priority 4: Safe Updates** 🔵
- Patch and minor version updates
- No breaking changes
- Gets bug fixes and improvements

**Skipped: Major Updates** ⚪
- Shown but not auto-applied
- May have breaking changes
- Requires manual review

### Use Cases

**Perfect for:**
- 🏢 **Development Teams** - Safe, automated dependency maintenance
- 🔄 **CI/CD Pipelines** - Automated fixes with `--yes` flag
- 🛡️ **Security Teams** - Quick vulnerability resolution
- 📦 **Package Maintainers** - Keeping dependencies up-to-date
- 📊 **Auditing** - Detailed fix reports for compliance
- 🧪 **Testing** - Dry-run mode for validation

### Performance

**v2.8.0 Improvements:**
- **Progress visibility** - Know exactly what's happening
- **Faster execution** - Parallel npm operations where possible
- **Better error recovery** - Continues despite partial failures
- **Comprehensive logging** - Full audit trail in fix reports

**Typical execution time:**
- Small project (5 fixes): ~5-10 seconds
- Medium project (15 fixes): ~15-25 seconds
- Large project (30 fixes): ~30-45 seconds

### Backup Management

**Automatic cleanup:**
- Keeps last 5 backups
- Automatically removes older backups
- Minimal disk space usage

**Manual backup restoration:**
```bash
# List available backups
ls .devcompass-backups/

# Restore from specific backup
cp .devcompass-backups/backup-TIMESTAMP/package.json package.json
cp .devcompass-backups/backup-TIMESTAMP/package-lock.json package-lock.json

# Then reinstall
npm install
```

### Troubleshooting

**If fix fails:**
1. Check the error message in terminal
2. Review `devcompass-fix-report.json` for details
3. Your backup is available in `.devcompass-backups/`
4. Restore from backup if needed
5. Report issue on GitHub

**Common issues:**
- **Network errors:** Check internet connection, retry
- **Permission errors:** Use `sudo` (not recommended) or fix npm permissions
- **Lock file conflicts:** Commit or stash changes first
- **Disk space:** Ensure sufficient space for backups

### Workflow Example (Complete)
```bash
# 1. Check current health
devcompass analyze
# Output: Health Score: 6.2/10

# 2. Preview fixes (no changes)
devcompass fix --dry-run
# Shows: 7 fixes will be applied

# 3. Apply fixes
devcompass fix
# Creates backup, applies fixes, generates report

# 4. Verify improvements
devcompass analyze
# Output: Health Score: 8.7/10

# 5. Check the report
cat devcompass-fix-report.json
```

## 🛡️ Supply Chain Security (v2.7.0)

DevCompass now detects **supply chain attacks** including malicious packages, typosquatting, and suspicious install scripts!

### What it detects:
- 🔴 **Malicious packages** - Known bad actors from curated database
- 🎯 **Typosquatting** - Packages with names similar to popular packages (e.g., "epress" vs "express")
- 📦 **Install script warnings** - Suspicious postinstall/preinstall hooks
- 🔗 **Dangerous patterns** - curl, wget, eval, exec in install scripts

### Detection Methods:
- **Exact pattern matching** - Database of 15+ known malicious packages
- **Levenshtein distance** - Detects 1-2 character differences from popular packages
- **Pattern analysis** - Scans install scripts for suspicious commands
- **Smart whitelist** (v2.7.1) - Prevents false positives for legitimate packages

### Example Output:
```
🛡️ SUPPLY CHAIN SECURITY (3 warnings)

🔴 MALICIOUS PACKAGES DETECTED
  epress
    Known malicious package detected
    → Remove immediately - this package is known to be malicious

🟠 TYPOSQUATTING RISK
  expresss
    Similar to: express (official package)
    Risk: HIGH - Potential malicious package
    → Remove expresss and install express

🟡 INSTALL SCRIPT WARNING
  suspicious-package@1.0.0
    Script: postinstall
    Patterns: curl, eval
    Risk: MEDIUM - Review install script before use
    → Review the install script before deployment
```

### Monitored Patterns:
**Popular packages protected (15+):**
- express, request, lodash, axios, webpack
- react, vue, angular, next, typescript
- eslint, prettier, jest, mocha, chai

**Whitelisted legitimate packages (40+):**
- chalk, ora, yargs, commander, semver
- And more to prevent false positives!

**Suspicious install script patterns:**
- Network operations: curl, wget, http://, https://
- Code execution: eval, exec, child_process
- Shell access: /bin/sh, /bin/bash, powershell
- Dangerous keywords: bitcoin, mining, keylogger, backdoor

## ⚖️ License Risk Analysis (v2.7.0)

Enhanced license compliance checking with **business risk scoring** and **compatibility analysis**!

### License Risk Levels:

**CRITICAL RISK (Immediate action required):**
- AGPL-1.0, AGPL-3.0 (Network copyleft - very restrictive)
- UNLICENSED (No license - all rights reserved)

**HIGH RISK (Review with legal team):**
- GPL-1.0, GPL-2.0, GPL-3.0 (Copyleft - requires source disclosure)
- SEE LICENSE IN, CUSTOM (Custom licenses requiring review)

**MEDIUM RISK (Limited obligations):**
- LGPL-2.0, LGPL-2.1, LGPL-3.0 (Weak copyleft)
- MPL-1.0, MPL-2.0 (File-level copyleft)
- EPL-1.0, EPL-2.0 (Module-level copyleft)

**LOW RISK (Safe for commercial use):**
- MIT, Apache-2.0, BSD, ISC (Permissive)
- CC0-1.0, Unlicense (Public domain)

### License Compatibility Checking:
Detects conflicts between your project license and dependency licenses!

**Example Output:**
```
⚖️ LICENSE RISK ANALYSIS (3 warnings)

  Project License: MIT

🔴 CRITICAL LICENSE RISKS
  gpl-library@1.0.0
    License: AGPL-3.0
    Network copyleft - very restrictive
    → Replace with permissive alternative immediately

🟠 HIGH RISK LICENSES
  old-package@2.0.0
    License: GPL-2.0
    Requires source code disclosure
    → Consider replacing with MIT/Apache alternative

🟡 LICENSE CONFLICT DETECTED
  Your project: MIT
  Dependencies with GPL: 2 packages
  Risk: License compatibility issue
  → Review legal compliance
```

## 📊 Package Quality Metrics (v2.7.0)

Comprehensive **health scoring** for all your dependencies based on maintenance, activity, and community engagement!

### Health Score Factors (0-10 scale):
- **Age** - Newer packages score higher (max -2 points for 3+ years)
- **Maintenance frequency** - Recent updates score higher (max -2 points)
- **GitHub activity** - Issue resolution tracked (max -2 points)
- **Dependencies** - Fewer dependencies score higher (max -1 point)
- **Documentation** - Description and repository presence (max -1 point)
- **Deprecation** - Deprecated packages get automatic 0

### Package Status Categories:
- **HEALTHY (7-10):** Well-maintained, recent updates
- **NEEDS ATTENTION (5-7):** Some concerns, monitor closely
- **STALE (3-5):** Not updated in 1-2 years
- **ABANDONED (0-3):** 2+ years without updates, inactive maintainers
- **DEPRECATED (0):** Officially marked as deprecated

### Example Output:
```
📊 PACKAGE QUALITY METRICS (20 analyzed)

✅ HEALTHY PACKAGES (15)
  react, axios, lodash, express, webpack...

🟡 NEEDS ATTENTION (3)
  old-package@1.0.0
    Health Score: 6.5/10
    Last Update: 8 months ago
    Open Issues: 45 (12% resolved)
    → Monitor for updates

🟠 STALE PACKAGES (1)
  aging-lib@2.0.0
    Health Score: 4.2/10
    Last Update: 18 months ago
    → Consider finding actively maintained alternative

🔴 ABANDONED PACKAGES (1)
  deprecated-lib@0.5.0
    Health Score: 1.2/10
    Last Update: 3 years ago
    Maintainer: Inactive
    → Migrate to actively maintained alternative

🔴 DEPRECATED PACKAGES (1)
  old-framework@2.0.0
    Package is officially deprecated
    → Find alternative immediately
```

### Performance:
- Analyzes up to 20 packages per run (prevents rate limiting)
- ~100ms per package (npm registry API)
- 1-hour cache duration
- GitHub data integration for enhanced metrics

## 💡 Security Recommendations (v2.7.0)

Intelligent, **prioritized recommendations** with actionable commands and impact analysis!

### Priority Levels:
1. **CRITICAL** - Immediate security risks (malicious packages, critical vulnerabilities)
2. **HIGH** - Production stability issues (typosquatting, GPL conflicts, abandoned packages)
3. **MEDIUM** - Maintenance concerns (stale packages, install scripts, unused deps)
4. **LOW** - Minor improvements (outdated packages, documentation)

### What You Get:
- ✅ **Priority-based ordering** - Fix critical issues first
- ✅ **Copy-paste commands** - Ready-to-run npm commands
- ✅ **Impact analysis** - See expected health score improvement
- ✅ **Category grouping** - Supply chain, license, security, quality
- ✅ **Alternative suggestions** - Recommended replacements

### Example Output:
```
💡 SECURITY RECOMMENDATIONS (Prioritized)

🔴 CRITICAL (Fix Immediately)

  1. Remove typosquatting package
     Package: expresss
     Action: Remove expresss and install express
     $ npm uninstall expresss && npm install express
     Impact: Prevents potential supply chain attack

  2. High-risk license detected
     Package: gpl-package@1.0.0
     Action: Replace with permissive alternative
     $ npm uninstall gpl-package
     Impact: Ensures license compliance

🟠 HIGH (Fix Soon)

  3. Abandoned package detected
     Package: old-lib@1.0.0
     Action: Migrate to actively maintained alternative
     $ npm uninstall old-lib
     Impact: Improves long-term stability
     Health Score: 1.2/10

  4. Security vulnerabilities detected
     Action: Run npm audit fix to resolve vulnerabilities
     $ npm audit fix
     Impact: Resolves 12 known vulnerabilities

🟡 MEDIUM (Plan to Fix)

  5. Clean up unused dependencies
     Action: Remove unused packages
     $ npm uninstall axios express lodash
     Impact: Reduces node_modules size, improves security surface

📈 Expected Impact:

  ✓ Current Health Score: 4.2/10
  ✓ Expected Score: 8.7/10
  ✓ Improvement: +4.5 points (45% increase)
  ✓ Issues Resolved: 5 critical/high/medium
  ✓ Eliminate 2 critical security risks
  ✓ Resolve 3 high-priority issues

💡 TIP: Run devcompass fix to apply automated fixes!
```

## 🔮 Predictive Warnings (v2.7.1)

DevCompass monitors **real-time GitHub activity for 500+ packages** to detect potential issues before they're officially reported!

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
7. **Parallel processing:** Checks multiple packages simultaneously (v2.6.0)

### Performance (v2.6.0+):
- **Parallel processing:** Checks 5 packages simultaneously (80% faster!)
- **Smart filtering:** Only checks installed packages from your project
- **First run:** ~1 second for 5 packages (was ~5s in v2.5.0)
- **Cached runs:** ~0.5 seconds (93% faster!)
- **Cache duration:** 1 hour
- **Zero overhead:** Uninstalled packages aren't checked

**Performance Benchmarks:**
| Packages | v2.5.0 | v2.6.0+ | Improvement |
|----------|--------|---------|-------------|
| 5        | ~5s    | ~1s     | 80% faster  |
| 10       | ~10s   | ~2s     | 80% faster  |
| 20       | ~20s   | ~4s     | 80% faster  |
| 50       | ~50s   | ~10s    | 80% faster  |

> **Performance Example:** If you have 5 tracked packages installed (e.g., react, axios, lodash, express, webpack), DevCompass checks all 5 in parallel, completing in ~1 second instead of ~5 seconds!

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

**Full Output (v2.8.0):**
```
🔍 DevCompass v2.8.0 - Analyzing your project...
✔ Scanned 25 dependencies in project
⚡ GitHub check completed in 1.23s (parallel processing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SECURITY VULNERABILITIES

  No vulnerabilities detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SUPPLY CHAIN SECURITY

  No supply chain risks detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ECOSYSTEM ALERTS (1)

🟠 HIGH
  axios@1.6.0
    Issue: Memory leak in request interceptors
    Fix: 1.6.2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PREDICTIVE ANALYSIS

  No unusual activity detected (502+ packages monitored)!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ LICENSE COMPLIANCE

  All licenses are compliant!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PACKAGE QUALITY METRICS (20 analyzed)

✅ HEALTHY PACKAGES (18)
  react, axios, lodash, express, webpack...

🟡 NEEDS ATTENTION (2)
  old-package@1.0.0
    Health Score: 6.5/10
    Last Update: 8 months ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 HEAVY PACKAGES (2)

  Packages larger than 1MB:

  typescript                8.1 MB
  webpack                   2.3 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH

  Overall Score:              8.5/10
  Total Dependencies:         25
  Supply Chain Warnings:      0
  Ecosystem Alerts:           1
  Predictive Warnings:        0
  License Risks:              0
  Quality Issues:             0
  Unused:                     0
  Outdated:                   2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 SECURITY RECOMMENDATIONS (Prioritized)

🟠 HIGH (Fix Soon)

  1. Upgrade vulnerable package
     Package: axios@1.6.0
     $ npm install axios@1.6.2

📈 Expected Impact:

  ✓ Current Health Score: 8.5/10
  ✓ Expected Score: 9.8/10
  ✓ Improvement: +1.3 points (13% increase)

💡 TIP: Run 'devcompass fix' to apply these fixes automatically!
```

## 🚀 CI/CD Integration

### JSON Output
Perfect for parsing in CI/CD pipelines:
```bash
devcompass analyze --json
```

**Output (v2.8.0):**
```json
{
  "version": "2.8.0",
  "timestamp": "2026-04-04T10:30:00.000Z",
  "summary": {
    "healthScore": 8.5,
    "totalDependencies": 25,
    "securityVulnerabilities": 0,
    "supplyChainWarnings": 0,
    "ecosystemAlerts": 1,
    "predictiveWarnings": 0,
    "licenseRisks": 0,
    "qualityIssues": 0,
    "unusedDependencies": 0,
    "outdatedPackages": 2
  },
  "supplyChain": {
    "total": 0,
    "warnings": []
  },
  "licenseRisk": {
    "total": 0,
    "projectLicense": "MIT",
    "warnings": []
  },
  "packageQuality": {
    "total": 20,
    "healthy": 18,
    "needsAttention": 2,
    "packages": [...]
  },
  "recommendations": {
    "total": 1,
    "critical": 0,
    "high": 1,
    "items": [...]
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

- **First run:** ~2 seconds with parallel processing (fetches GitHub + npm data)
- **Cached runs:** ~0.5 seconds (93% faster!)
- **Cache duration:** 1 hour
- **Cache file:** `.devcompass-cache.json` (auto-gitignored)

**What gets cached (v2.8.0):**
- Supply chain analysis
- License risk data
- Package quality metrics
- Security recommendations
- GitHub issue data
- Predictive warnings
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
5. Uses parallel processing for 80% faster checks (v2.6.0)
6. Analyzes supply chain security (v2.7.0)
7. Shows actionable fix commands

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

# Preview fixes without changes (NEW in v2.8.0!)
devcompass fix --dry-run

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
# Preview fixes without making changes (NEW!)
devcompass fix --dry-run
devcompass fix --dry  # Shorthand

# Fix specific directory
devcompass fix --path /path/to/project

# Auto-apply without confirmation
devcompass fix --yes
devcompass fix -y

# Combine options
devcompass fix --path ./my-project --yes
```

## 🔄 Complete Workflows

### Local Development Workflow
```bash
# Check project health
devcompass analyze

# Preview fixes first (NEW in v2.8.0!)
devcompass fix --dry-run

# Apply fixes
devcompass fix

# Verify improvements
devcompass analyze
```

### CI/CD Pipeline Workflow
```bash
# Analyze and export JSON
devcompass analyze --json > health-report.json

# Dry-run in PR checks (no changes)
devcompass fix --dry-run

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
# 1. Run comprehensive security scan
devcompass analyze

# 2. Check for critical vulnerabilities
devcompass analyze --json | jq '.security.critical'

# 3. Check supply chain risks
devcompass analyze --json | jq '.supplyChain.warnings'

# 4. Preview fixes (NEW!)
devcompass fix --dry-run

# 5. Auto-fix if safe
devcompass fix --yes

# 6. Verify fixes
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

### Backup Management (v2.8.0)
- Backup files (`.devcompass-backups/`) are automatically gitignored
- Last 5 backups kept automatically
- Restore manually if needed from `.devcompass-backups/`

## 🛠️ Requirements

- Node.js >= 14.0.0
- npm or yarn

## 💡 Tips

1. **Run regularly** - Add to your CI/CD pipeline or git hooks
2. **Use fix command** - Let DevCompass handle routine maintenance
3. **Use dry-run first** - Test fixes safely with `--dry-run` before applying (v2.8.0)
4. **Check security first** - Prioritize fixing critical vulnerabilities
5. **Monitor bundle size** - Keep an eye on heavy packages
6. **Review licenses** - Ensure compliance with your legal requirements
7. **Configure severity levels** - Filter out noise with `minSeverity`
8. **Enable CI mode** - Catch issues before they reach production
9. **Use JSON output** - Integrate with your monitoring tools
10. **Review major updates** - Always check changelogs before major version bumps
11. **Keep backups** - DevCompass auto-creates them, but you can keep your own too (v2.8.0)
12. **Review fix reports** - Check `devcompass-fix-report.json` for audit trail (v2.8.0)
13. **Watch predictive warnings** - Monitor packages with increasing issue activity
14. **Leverage parallel processing** - First run takes ~2s with v2.6.0 (was ~8s)
15. **Monitor supply chain** - Check for typosquatting regularly (v2.7.0)
16. **Review license risks** - Ensure GPL/AGPL compliance (v2.7.0)
17. **Track package quality** - Replace abandoned packages proactively (v2.7.0)
18. **Update regularly** - Stay on latest version for bug fixes and new features!

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

### Adding Malicious Packages
Help protect the community! Add known malicious packages:

1. Edit `data/known-malicious.json`
2. Add to `malicious_packages` array or `typosquat_patterns`
3. Submit a PR with evidence/source

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
node bin/devcompass.js fix --dry-run  # NEW in v2.8.0!

# Run on test projects
cd /tmp
mkdir test-project && cd test-project
npm init -y
npm install axios@1.6.0 lodash@4.17.19
node ~/devcompass/bin/devcompass.js analyze
node ~/devcompass/bin/devcompass.js fix --dry-run
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
- [x] ~~Performance optimizations with parallel processing~~ ✅ **Added in v2.6.0!**
- [x] ~~Advanced security features~~ ✅ **Added in v2.7.0!**
  - [x] Supply chain security analysis
  - [x] Enhanced license risk detection
  - [x] Package quality metrics
  - [x] Security recommendations engine
- [x] ~~Fix false positive typosquatting warnings~~ ✅ **Fixed in v2.7.1!**
- [x] ~~Enhanced fix command improvements~~ ✅ **Added in v2.8.0!**
  - [x] Dry-run mode
  - [x] Progress tracking with ETA
  - [x] Automatic backups
  - [x] Fix reports
  - [x] Enhanced error handling
- [ ] Supply chain auto-fix (v2.8.1)
- [ ] License conflict resolution (v2.8.2)
- [ ] Package quality auto-fix (v2.8.3)
- [ ] Backup & rollback command (v2.8.4)
- [ ] Batch fix modes (v2.8.5)
- [ ] Dependency graph visualization (v3.0.0)
- [ ] Web dashboard for team health monitoring (v3.0.0)
- [ ] Team collaboration features (v3.1.0)
- [ ] Slack/Discord notifications (v3.1.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡