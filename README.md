# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, backup & rollback, parallel processing, advanced license risk detection, and enhanced fix command with dry-run mode, progress tracking, and automatic backups.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🎉 NEW v2.8.4:** Backup & Rollback Command - Complete backup management for safe dependency fixes! 💾  
> **LATEST v2.8.3:** Package quality auto-fix - Automatic replacement of abandoned/deprecated packages! 📦  
> **PREVIOUS v2.8.2:** License conflict auto-fix - Automatic GPL/AGPL replacement with MIT alternatives! ⚖️  
> **NEW in v2.8.1:** Supply chain auto-fix - Automatic malicious package removal & typosquatting fixes! 🛡️

## 🎉 Latest Update: v2.8.4 - Backup & Rollback Command

**Complete backup management system for safe dependency fixes!** DevCompass now includes comprehensive backup and restore functionality.

### What's New in v2.8.4:
- 💾 **Backup List Command** - View all available backups with metadata
- 🔄 **Backup Restore Command** - Rollback to any previous state
- 🧹 **Backup Clean Command** - Remove old backups (keeps latest 5)
- 📋 **Backup Info Command** - View detailed backup information
- 📊 **Enhanced Metadata** - Tracks fixes pending, health score, warnings
- 🔒 **Safety-First Restore** - Creates backup before restoring
- ⚡ **Force Mode** - Skip confirmations for CI/CD
- 📈 **Auto-Clean** - Keeps latest 5 backups automatically

### Backup Commands:
```bash
# List all backups
devcompass backup list

# Restore from backup
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z

# Show backup details
devcompass backup info --name backup-2026-04-06T08-43-33-521Z

# Clean old backups (keeps latest 5)
devcompass backup clean

# Clean keeping only 3 backups
devcompass backup clean --keep 3

# Force operations without confirmation
devcompass backup restore --name <backup-name> --force
devcompass backup clean --force
```

### How Backups Work:
1. **Automatic Creation** - Backups created during `devcompass fix` (both dry-run and actual)
2. **Safe Restore** - Current state backed up before restoring
3. **Enhanced Metadata** - Tracks health score, fixes pending, warnings breakdown
4. **Auto-Clean** - Keeps latest 5 backups, removes older ones
5. **Beautiful Output** - Time-ago formatting, file sizes, restore commands

**Example Output:**

💾 DevCompass Backups

Found 3 backup(s):

backup-2026-04-06T08-43-53-468Z
Created: Apr 6, 2026 14:13:53 (just now)
Files: package.json, package-lock.json
Reason: Before dry-run analysis
Fixes pending: 7
Health score: 0/10
backup-2026-04-06T08-43-36-998Z
Created: Apr 6, 2026 14:13:37 (5 minutes ago)
Files: package.json, package-lock.json
Reason: Before restore
backup-2026-04-06T08-43-33-521Z
Created: Apr 6, 2026 14:13:33 (10 minutes ago)
Files: package.json, package-lock.json
Reason: Before automated fixes
Fixes pending: 7
Health score: 0/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 COMMANDS:
Restore: devcompass backup restore --name backup-2026-04-06T08-43-53-468Z
Info: devcompass backup info --name backup-2026-04-06T08-43-53-468Z
Clean: devcompass backup clean

**Upgrade now:**
```bash
npm install -g devcompass@2.8.4
```

---

## 🎉 v2.8.3 Features

**Automatic replacement of abandoned, deprecated, and stale packages!** DevCompass automatically replaces unmaintained packages with modern alternatives.

### What's New in v2.8.3:
- 📦 **Abandoned Package Replacement** - Automatically replaces packages 2+ years old
- 🔴 **Deprecated Package Replacement** - Replaces officially deprecated packages
- 🟡 **Stale Package Replacement** - Replaces packages 1-2 years without updates
- 📚 **Alternative Database** - Curated database of 50+ modern alternatives
- 🔧 **Integrated Fix Workflow** - Works seamlessly with supply chain and license fixes
- 📊 **Fix Summary Display** - Shows breakdown of quality fixes applied
- 🛡️ **Priority Execution** - Quality fixes run THIRD (after supply chain and license)

---

## 🎉 v2.8.2 Features

**Automatic replacement of GPL/AGPL packages with MIT/Apache alternatives!** DevCompass automatically resolves license conflicts.

---

## 🎉 v2.8.1 Features

**Automatic removal of malicious packages and typosquatting fixes!** DevCompass automatically fixes supply chain security issues.

---

## 🎉 v2.8.0 Features

**Major improvements to the fix command!** DevCompass includes dry-run mode, progress tracking, automatic backups, and detailed fix reports.

---

## ✨ Features

- 💾 **Backup & Rollback** (v2.8.4) - Complete backup management for safe dependency fixes
- 📦 **Package Quality Auto-Fix** (v2.8.3) - Automatic replacement of abandoned/deprecated packages
- ⚖️ **License Conflict Auto-Fix** (v2.8.2) - Automatic GPL/AGPL replacement with MIT alternatives
- 🛡️ **Supply Chain Auto-Fix** (v2.8.1) - Automatic malicious package removal & typosquatting fixes
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

# Auto-fix issues (includes supply chain + license + quality fixes!)
devcompass fix

# Preview fixes without making changes
devcompass fix --dry-run

# Auto-fix without confirmation (CI/CD)
devcompass fix --yes

# Manage backups (NEW in v2.8.4!)
devcompass backup list
devcompass backup restore --name <backup-name>
devcompass backup info --name <backup-name>
devcompass backup clean

# JSON output (for CI/CD)
devcompass analyze --json

# CI mode (exit code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent
```

## 💾 Backup & Rollback (NEW in v2.8.4!)

DevCompass now includes **comprehensive backup management** for safe dependency fixes!

### Backup Commands:

#### 1. List Backups
View all available backups with metadata:
```bash
devcompass backup list
```

**Output:**

💾 DevCompass Backups

Found 3 backup(s):

backup-2026-04-06T08-43-53-468Z
Created: Apr 6, 2026 14:13:53 (just now)
Files: package.json, package-lock.json
Reason: Before dry-run analysis
Fixes pending: 7
Health score: 0/10
backup-2026-04-06T08-43-36-998Z
Created: Apr 6, 2026 14:13:37 (5 minutes ago)
Files: package.json, package-lock.json
Reason: Before restore

#### 2. Restore Backup
Rollback to a previous state:
```bash
# With confirmation
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z

# Without confirmation (CI/CD)
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z --force
```

**Output:**

🔄 DevCompass Backup Restore
Backup details:
Name: backup-2026-04-06T08-43-33-521Z
Created: Apr 6, 2026 14:13:33
Files: package.json, package-lock.json
⚠️  WARNING: This will overwrite your current package.json and package-lock.json
Continue with restore? (y/N): y
Step 1: Creating backup of current state...
✓ Current state backed up: backup-2026-04-06T08-43-36-998Z
Step 2: Restoring from backup...
✓ Backup restored successfully!
Files restored:
✓ package.json
✓ package-lock.json
⚠️  IMPORTANT: Run npm install to sync node_modules

#### 3. Show Backup Info
View detailed information about a specific backup:
```bash
devcompass backup info --name backup-2026-04-06T08-43-33-521Z
```

**Output:**

📋 DevCompass Backup Info
Backup Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:          backup-2026-04-06T08-43-33-521Z
Created:       Apr 6, 2026 14:13:33
Age:           just now
Location:      /project/.devcompass-backups/backup-2026-04-06T08-43-33-521Z
Files backed up:
• package.json
• package-lock.json
Reason:        Before dry-run analysis
Fixes pending: 7
Health score:  0/10
Project ver:   1.0.0
DevCompass:    v2.8.4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File Details:
package-lock.json    10.69 KB
package.json         0.33 KB
💡 RESTORE THIS BACKUP:
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z

#### 4. Clean Old Backups
Remove old backups to save disk space:
```bash
# Clean with default settings (keeps latest 5)
devcompass backup clean

# Clean keeping only 3 backups
devcompass backup clean --keep 3

# Force clean without confirmation
devcompass backup clean --keep 3 --force
```

**Output:**

🧹 DevCompass Backup Cleanup
Found 5 backup(s)
Will delete 2 oldest backup(s), keeping latest 3
Backups to delete:

backup-2026-04-06T08-43-43-554Z (Apr 6, 2026 14:13:43)
backup-2026-04-06T08-43-40-208Z (Apr 6, 2026 14:13:40)

Delete these backups? (y/N): y
✓ Deleted: backup-2026-04-06T08-43-43-554Z
✓ Deleted: backup-2026-04-06T08-43-40-208Z
✓ Successfully deleted 2 backup(s)!

### Backup Features:

#### Automatic Creation
Backups are automatically created:
- ✅ During `devcompass fix` (before applying changes)
- ✅ During `devcompass fix --dry-run` (before dry-run analysis)
- ✅ Before restoring (current state backed up first)

#### Enhanced Metadata
Each backup tracks:
- **Timestamp** - When backup was created
- **Reason** - Why backup was created
- **Files** - Which files were backed up
- **Project Version** - Your project's version
- **DevCompass Version** - DevCompass version used
- **Fixes Pending** - Number of fixes that will be applied
- **Health Score** - Project health at backup time
- **Warning Breakdown** - Supply chain, license, quality, security counts

#### Safety Features
- ✅ **Backup Before Restore** - Creates backup of current state before restoring
- ✅ **Confirmation Prompts** - Asks for confirmation (unless --force)
- ✅ **Auto-Clean** - Keeps latest 5 backups automatically
- ✅ **Detailed Info** - View complete backup metadata
- ✅ **Time-Ago Display** - Human-readable ages ("5 minutes ago")
- ✅ **File Sizes** - Shows size of each backed up file
- ✅ **Error Handling** - Clear error messages with recovery suggestions

### Backup Workflow Example:
```bash
# 1. Check current backups
devcompass backup list

# 2. Run fix (automatic backup created)
devcompass fix

# 3. If something goes wrong, list backups
devcompass backup list

# 4. Check backup details
devcompass backup info --name backup-2026-04-06T08-43-33-521Z

# 5. Restore to previous state
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z --force

# 6. Reinstall dependencies
npm install

# 7. Clean up old backups
devcompass backup clean --keep 3
```

### Backup Storage:
- **Location:** `.devcompass-backups/` directory
- **Auto-Gitignored:** Added to `.gitignore` automatically
- **Auto-Clean:** Keeps latest 5 backups by default
- **Manual Access:** Can copy files manually from backup directory

### Use Cases:

**Perfect for:**
- 🔄 **Rollback Failed Fixes** - Restore if automated fix causes issues
- 🧪 **Testing Changes** - Try fixes with `--dry-run` and rollback if needed
- 📊 **Auditing** - Track what changed over time with metadata
- 🛡️ **Safety Net** - Always have a way back to previous state
- 🔍 **Debugging** - Compare before/after states
- 🚀 **CI/CD Integration** - Use `--force` to skip prompts in automated workflows

---

## 📦 Package Quality Auto-Fix (v2.8.3)

DevCompass can **automatically replace abandoned, deprecated, and stale packages** with modern alternatives!

### What it fixes:
- 🔴 **Abandoned packages** - Replaces packages 2+ years without updates
- 🔴 **Deprecated packages** - Replaces officially deprecated packages
- 🟡 **Stale packages** - Replaces packages 1-2 years without updates

### Fix Priority Order (v2.8.4):
1. **🔴 Supply Chain Security** (FIRST - Critical!)
   - Malicious package removal
   - Typosquatting fixes
   - Suspicious script removal
2. **🟠 License Conflicts** (SECOND - Legal Compliance!)
   - GPL package replacement
   - AGPL package replacement
   - LGPL package replacement
3. **🔵 Package Quality** (THIRD - Maintainability!)
   - Abandoned package replacement
   - Deprecated package replacement
   - Stale package replacement
4. **🔴 Critical Security** - npm audit vulnerabilities
5. **🟠 Ecosystem Alerts** - Known package issues
6. **🟡 Unused Dependencies** - Cleanup
7. **🔵 Safe Updates** - Patch/minor updates

---

*(Continue with rest of README.md content...)*

## ⚙️ Commands & Options

### Commands
```bash
# Analyze project dependencies
devcompass analyze

# Auto-fix issues (includes supply chain + license + quality fixes!)
devcompass fix

# Preview fixes without changes
devcompass fix --dry-run

# Manage backups (NEW in v2.8.4!)
devcompass backup list
devcompass backup restore --name <backup-name>
devcompass backup info --name <backup-name>
devcompass backup clean

# Show version
devcompass --version
devcompass -v

# Show help
devcompass --help
devcompass -h
```

### Backup Options (NEW in v2.8.4!)
```bash
# List all backups
devcompass backup list

# Restore from specific backup
devcompass backup restore --name <backup-name>

# Restore without confirmation
devcompass backup restore --name <backup-name> --force

# Show backup details
devcompass backup info --name <backup-name>

# Clean old backups (keeps latest 5)
devcompass backup clean

# Clean keeping specific number
devcompass backup clean --keep 3

# Force clean without confirmation
devcompass backup clean --force

# Use custom project path
devcompass backup list --path /path/to/project
```

---

*(Continue with all other sections...)*

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
- [x] ~~Fix false positive typosquatting warnings~~ ✅ **Fixed in v2.7.1!**
- [x] ~~Enhanced fix command improvements~~ ✅ **Added in v2.8.0!**
- [x] ~~Supply chain auto-fix~~ ✅ **Added in v2.8.1!**
- [x] ~~License conflict resolution~~ ✅ **Added in v2.8.2!**
- [x] ~~Package quality auto-fix~~ ✅ **Added in v2.8.3!**
- [x] ~~Backup & rollback command~~ ✅ **Added in v2.8.4!**
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