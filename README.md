# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, parallel processing, advanced license risk detection, and enhanced fix command with dry-run mode, progress tracking, and automatic backups.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🎉 NEW v2.8.5:** Batch Fix Modes - Granular control over which categories to fix! 📦  
> **PREVIOUS v2.8.4:** Backup & Rollback Command - Complete backup management for safe dependency fixes! 💾  
> **LATEST v2.8.3:** Package quality auto-fix - Automatic replacement of abandoned/deprecated packages! 📦

## 🎉 Latest Update: v2.8.5 - Batch Fix Modes

**Granular control over which fix categories to apply!** DevCompass now includes comprehensive batch mode with interactive selection, preset modes, and category filtering.

### What's New in v2.8.5:
- 📦 **Interactive Batch Selection** - Choose which categories to fix via beautiful menu
- ⚡ **Preset Batch Modes** - Critical-only, high-priority, all-safe presets
- 🎯 **Category-Specific Fixes** - Fix only selected categories (--only)
- 🚫 **Skip Categories** - Exclude specific categories (--skip)
- 📊 **Batch Reports** - Separate reporting per batch execution
- 📈 **Batch Statistics** - See fix counts before execution
- 🛡️ **Safe Execution** - 60-second timeouts prevent hanging
- 💾 **Integrated Backups** - Works seamlessly with v2.8.4 backup system

### Batch Fix Categories (7 Total):
1. **🛡️ Supply Chain Security** - Malicious packages, typosquatting
2. **⚖️ License Conflicts** - GPL/AGPL/LGPL replacements
3. **📦 Package Quality** - Abandoned/deprecated packages
4. **🔐 Critical Security** - npm audit vulnerabilities
5. **🚨 Ecosystem Alerts** - Known package issues
6. **🧹 Unused Dependencies** - Remove unused packages
7. **⬆️ Safe Updates** - Patch and minor version updates

### Batch Commands:
```bash
# Interactive batch mode
devcompass fix --batch

# Preview with dry-run
devcompass fix --batch --dry-run

# Preset modes
devcompass fix --batch-mode critical      # Supply chain + License + Security
devcompass fix --batch-mode high          # Critical + Quality + Ecosystem
devcompass fix --batch-mode all           # All safe fixes

# Category-specific fixes
devcompass fix --only quality             # Fix only quality issues
devcompass fix --only supply-chain,license --yes
devcompass fix --skip updates             # Fix everything except updates

# Combined options
devcompass fix --batch-mode high --yes --verbose
```

### Interactive Batch Menu Example:

```
📦 BATCH FIX MODE
══════════════════════════════════════════════════════════════════════

Select which categories to fix:

1. 🛡️ Supply Chain Security
   Malicious packages, typosquatting, suspicious scripts
   Fixes available: none

2. ⚖️ License Conflicts
   GPL/AGPL/LGPL package replacements
   Fixes available: none

3. 📦 Package Quality
   Abandoned, deprecated, stale packages
   Fixes available: 2 fix(es)

4. 🔐 Critical Security
   npm audit vulnerabilities
   Fixes available: 5 fix(es)

5. 🚨 Ecosystem Alerts
   Known package issues
   Fixes available: 1 fix(es)

6. 🧹 Unused Dependencies
   Remove unused packages
   Fixes available: 4 fix(es)

7. ⬆️ Safe Updates
   Patch and minor version updates
   Fixes available: none

──────────────────────────────────────────────────────────────────────

Preset Modes:
c - Critical only (supply-chain + license + security)
h - High priority (critical + quality + ecosystem)
a - All safe fixes (everything except major updates)
n - None (cancel)

Enter your choice (1-7, c/h/a/n, or comma-separated): 3,6

📦 SELECTED BATCHES:

  📦 Package Quality: 2 fix(es)
  🧹 Unused Dependencies: 4 fix(es)

Step 1: Creating backup...
✓ Backup created: backup-2026-04-06T15-08-57-742Z

Step 2: Executing batches...

📦 PACKAGE QUALITY
──────────────────────────────────────────────────────────────────────
✔ Replaced moment with dayjs
✔ Replaced request with axios

🧹 UNUSED DEPENDENCIES
──────────────────────────────────────────────────────────────────────
✔ Removed 4 unused package(s)

📊 BATCH FIX SUMMARY
══════════════════════════════════════════════════════════════════════

📦 Package Quality
  ✓ 2 fix(es) applied
    • moment → dayjs (DEPRECATED)
    • request → axios (DEPRECATED)

🧹 Unused Dependencies
  ✓ 4 fix(es) applied
    • Removed: chalk, express, lodash, webpack

──────────────────────────────────────────────────────────────────────

📈 OVERALL RESULTS:

  Total Batches: 2
  Total Fixes: 6
  Successful: 6
  Failed: 0
  Duration: 0.52s

──────────────────────────────────────────────────────────────────────

✓ Batch report saved: devcompass-batch-report.json
```

**Upgrade now:**
```bash
npm install -g devcompass@2.8.5
```

---

## 🎉 v2.8.4 Features

**Complete backup management system for safe dependency fixes!** DevCompass includes comprehensive backup and restore functionality.

### What's New in v2.8.4:
- 💾 **Backup List Command** - View all available backups with metadata
- 🔄 **Backup Restore Command** - Rollback to any previous state
- 🧹 **Backup Clean Command** - Remove old backups (keeps latest 5)
- 📋 **Backup Info Command** - View detailed backup information
- 📊 **Enhanced Metadata** - Tracks fixes pending, health score, warnings
- 🔒 **Safety-First Restore** - Creates backup before restoring
- ⚡ **Force Mode** - Skip confirmations for CI/CD
- 📈 **Auto-Clean** - Keeps latest 5 backups automatically

---

## 🎉 v2.8.3 Features

**Automatic replacement of abandoned, deprecated, and stale packages!** DevCompass automatically replaces unmaintained packages with modern alternatives.

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

- 📦 **Batch Fix Modes** (v2.8.5) - Granular control over which categories to fix
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

# Batch fix modes (NEW in v2.8.5!)
devcompass fix --batch                          # Interactive selection
devcompass fix --batch-mode critical            # Preset: critical only
devcompass fix --batch-mode high                # Preset: high priority
devcompass fix --batch-mode all                 # Preset: all safe fixes
devcompass fix --only quality                   # Fix only quality issues
devcompass fix --skip updates                   # Skip updates category

# Preview fixes without making changes
devcompass fix --dry-run
devcompass fix --batch --dry-run

# Auto-fix without confirmation (CI/CD)
devcompass fix --yes
devcompass fix --batch-mode high --yes

# Manage backups
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

## 📦 Batch Fix Modes (NEW in v2.8.5!)

DevCompass now includes **comprehensive batch mode** for granular control over which fix categories to apply!

### Batch Fix Categories:

DevCompass organizes fixes into **7 priority-ordered categories**:

1. **🛡️ Supply Chain Security** (Priority 1)
   - Malicious package removal
   - Typosquatting fixes
   - Suspicious script removal
   
2. **⚖️ License Conflicts** (Priority 2)
   - GPL package replacement
   - AGPL package replacement
   - LGPL package replacement
   
3. **📦 Package Quality** (Priority 3)
   - Abandoned package replacement
   - Deprecated package replacement
   - Stale package replacement
   
4. **🔐 Critical Security** (Priority 4)
   - npm audit vulnerabilities
   
5. **🚨 Ecosystem Alerts** (Priority 5)
   - Known package issues
   
6. **🧹 Unused Dependencies** (Priority 6)
   - Remove unused packages
   
7. **⬆️ Safe Updates** (Priority 7)
   - Patch and minor version updates

### Batch Mode Commands:

#### 1. Interactive Batch Mode
Select categories interactively via beautiful menu:
```bash
# Interactive selection
devcompass fix --batch

# Preview with dry-run
devcompass fix --batch --dry-run
```

**Example interaction:**
```
Enter your choice (1-7, c/h/a/n, or comma-separated): 3,4,6

📦 SELECTED BATCHES:
  📦 Package Quality: 2 fix(es)
  🔐 Critical Security: 5 fix(es)
  🧹 Unused Dependencies: 4 fix(es)
```

#### 2. Preset Batch Modes
Use predefined modes for common scenarios:

**Critical Only** - Fix critical issues only:
```bash
devcompass fix --batch-mode critical

# Includes: Supply Chain + License + Security
```

**High Priority** - Fix high-priority issues:
```bash
devcompass fix --batch-mode high

# Includes: Critical + Quality + Ecosystem
```

**All Safe Fixes** - Fix everything except major updates:
```bash
devcompass fix --batch-mode all

# Includes: All categories except major updates
```

#### 3. Category-Specific Fixes
Fix only specific categories:
```bash
# Fix only quality issues
devcompass fix --only quality

# Fix supply chain and license only
devcompass fix --only supply-chain,license --yes

# Fix security and quality
devcompass fix --only security,quality
```

#### 4. Skip Categories
Fix everything except specific categories:
```bash
# Fix everything except updates
devcompass fix --skip updates

# Skip ecosystem and updates
devcompass fix --skip ecosystem,updates
```

#### 5. Combined Options
Combine batch modes with other options:
```bash
# Batch mode with dry-run
devcompass fix --batch --dry-run

# Preset with auto-apply
devcompass fix --batch-mode high --yes

# Category filter with verbose output
devcompass fix --only quality --verbose

# Multiple categories with force apply
devcompass fix --only supply-chain,license,security --yes
```

### Batch Execution Output:

**Step 1: Creating Backup**
```
Step 1: Creating backup...
✓ Backup created: backup-2026-04-06T15-08-57-742Z
```

**Step 2: Executing Batches**
```
Step 2: Executing batches...

📦 PACKAGE QUALITY
──────────────────────────────────────────────────────────────────────
✔ Replaced moment with dayjs
✔ Replaced request with axios

🧹 UNUSED DEPENDENCIES
──────────────────────────────────────────────────────────────────────
✔ Removed 4 unused package(s)
```

**Step 3: Batch Summary**
```
📊 BATCH FIX SUMMARY
══════════════════════════════════════════════════════════════════════

📦 Package Quality
  ✓ 2 fix(es) applied
    • moment → dayjs (DEPRECATED)
    • request → axios (DEPRECATED)

🧹 Unused Dependencies
  ✓ 4 fix(es) applied
    • Removed: chalk, express, lodash, webpack

──────────────────────────────────────────────────────────────────────

📈 OVERALL RESULTS:

  Total Batches: 2
  Total Fixes: 6
  Successful: 6
  Failed: 0
  Duration: 0.52s

──────────────────────────────────────────────────────────────────────

✓ Batch report saved: devcompass-batch-report.json
```

### Batch Features:

#### Interactive Selection
- ✅ Beautiful terminal menu with fix counts
- ✅ Shows available fixes per category
- ✅ Preset shortcuts (c/h/a/n)
- ✅ Comma-separated multi-select (1,3,6)
- ✅ Input validation with retry

#### Safety Features
- ✅ **Automatic backups** - Created before batch execution
- ✅ **Dry-run support** - Preview without changes
- ✅ **Confirmation prompts** - Can be skipped with --yes
- ✅ **Category validation** - Invalid categories ignored
- ✅ **Error isolation** - Failed batches don't stop execution
- ✅ **Timeout protection** - 60-second timeouts prevent hanging
- ✅ **Detailed reports** - Every fix documented in JSON

#### Batch Reports
Each batch execution generates a detailed report:
```json
{
  "timestamp": "2026-04-06T15:08:58.266Z",
  "mode": "batch",
  "summary": {
    "totalBatches": 2,
    "totalFixes": 6,
    "successful": 6,
    "failed": 0,
    "duration": "0.52s"
  },
  "batches": [
    {
      "batch": "quality",
      "batchName": "Package Quality",
      "fixes": [
        {
          "type": "quality",
          "package": "moment",
          "action": "Replaced with dayjs"
        }
      ],
      "successful": 2,
      "failed": 0,
      "errors": []
    }
  ]
}
```

### Use Cases:

**Security Teams** - Fix only critical security:
```bash
devcompass fix --batch-mode critical --yes
```

**Development Teams** - Interactive selection for discussion:
```bash
devcompass fix --batch
```

**CI/CD Pipelines** - Automated category-specific fixes:
```bash
devcompass fix --only security --yes
```

**Maintenance** - Fix quality issues separately:
```bash
devcompass fix --only quality
```

**Compliance** - Fix license conflicts first:
```bash
devcompass fix --only license
```

**Performance** - Remove unused dependencies:
```bash
devcompass fix --only unused
```

**Incremental Updates** - Fix categories one at a time:
```bash
# Step 1: Critical security
devcompass fix --batch-mode critical --yes

# Step 2: Quality issues
devcompass fix --only quality --yes

# Step 3: Cleanup
devcompass fix --only unused --yes
```

### Batch Workflow Example:
```bash
# 1. Analyze project
devcompass analyze

# 2. Preview batch fixes
devcompass fix --batch --dry-run

# 3. Select categories interactively
devcompass fix --batch

# 4. Review batch report
cat devcompass-batch-report.json

# 5. Verify improvements
devcompass analyze

# 6. View backups (if rollback needed)
devcompass backup list
```

---

## 💾 Backup & Rollback (v2.8.4)

DevCompass includes **comprehensive backup management** for safe dependency fixes!

### Backup Commands:

#### 1. List Backups
View all available backups with metadata:
```bash
devcompass backup list
```

**Output:**
```
💾 DevCompass Backups

Found 3 backup(s):

1. backup-2026-04-06T08-43-53-468Z
   Created: Apr 6, 2026 14:13:53 (just now)
   Files: package.json, package-lock.json
   Reason: Before batch fixes
   Fixes pending: 7
   Health score: 0/10

2. backup-2026-04-06T08-43-36-998Z
   Created: Apr 6, 2026 14:13:37 (5 minutes ago)
   Files: package.json, package-lock.json
   Reason: Before restore

3. backup-2026-04-06T08-43-33-521Z
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
```

#### 2. Restore Backup
Rollback to a previous state:
```bash
# With confirmation
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z

# Without confirmation (CI/CD)
devcompass backup restore --name backup-2026-04-06T08-43-33-521Z --force
```

**Output:**
```
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
```

#### 3. Show Backup Info
View detailed information about a specific backup:
```bash
devcompass backup info --name backup-2026-04-06T08-43-33-521Z
```

**Output:**
```
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

Reason:        Before batch fixes
Fixes pending: 7
Health score:  0/10
Project ver:   1.0.0
DevCompass:    v2.8.5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File Details:
  package-lock.json    10.69 KB
  package.json         0.33 KB

💡 RESTORE THIS BACKUP:
   devcompass backup restore --name backup-2026-04-06T08-43-33-521Z
```

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
```
🧹 DevCompass Backup Cleanup

Found 5 backup(s)
Will delete 2 oldest backup(s), keeping latest 3

Backups to delete:
  1. backup-2026-04-06T08-43-43-554Z (Apr 6, 2026 14:13:43)
  2. backup-2026-04-06T08-43-40-208Z (Apr 6, 2026 14:13:40)

Delete these backups? (y/N): y

✓ Deleted: backup-2026-04-06T08-43-43-554Z
✓ Deleted: backup-2026-04-06T08-43-40-208Z

✓ Successfully deleted 2 backup(s)!
```

### Backup Features:

#### Automatic Creation
Backups are automatically created:
- ✅ During `devcompass fix` (before applying changes)
- ✅ During `devcompass fix --batch` (before batch execution)
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

# 2. Run batch fix (automatic backup created)
devcompass fix --batch

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

---

## 📦 Package Quality Auto-Fix (v2.8.3)

DevCompass can **automatically replace abandoned, deprecated, and stale packages** with modern alternatives!

### What it fixes:
- 🔴 **Abandoned packages** - Replaces packages 2+ years without updates
- 🔴 **Deprecated packages** - Replaces officially deprecated packages
- 🟡 **Stale packages** - Replaces packages 1-2 years without updates

### Alternative Database (50+ packages):
```
request → axios, got, ky
moment → dayjs, date-fns, luxon
tslint → eslint
node-sass → sass (Dart Sass)
colors → chalk
enzyme → @testing-library/react
faker → @faker-js/faker
...and 40+ more!
```

---

## ⚖️ License Conflict Auto-Fix (v2.8.2)

DevCompass **automatically replaces GPL/AGPL packages** with MIT/Apache alternatives!

### What it fixes:
- 🔴 **GPL conflicts** - Replaces GPL packages
- 🔴 **AGPL conflicts** - Replaces AGPL packages
- 🟡 **LGPL conflicts** - Replaces LGPL packages

---

## 🛡️ Supply Chain Auto-Fix (v2.8.1)

DevCompass **automatically fixes supply chain security issues**!

### What it fixes:
- 🔴 **Malicious packages** - Removed immediately
- 🟠 **Typosquatting** - Removes typosquats, installs correct packages
- 🟡 **Suspicious scripts** - Offers removal with confirmation

---

## ⚙️ Commands & Options

### Commands
```bash
# Analyze project dependencies
devcompass analyze

# Auto-fix issues
devcompass fix

# Batch fix modes (NEW in v2.8.5!)
devcompass fix --batch                    # Interactive selection
devcompass fix --batch-mode <mode>        # Preset modes
devcompass fix --only <categories>        # Fix specific categories
devcompass fix --skip <categories>        # Skip categories

# Preview fixes without changes
devcompass fix --dry-run
devcompass fix --batch --dry-run

# Manage backups
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

### Fix Options (Enhanced in v2.8.5!)
```bash
# Normal fix mode (all fixes)
devcompass fix
devcompass fix --yes                      # Auto-apply
devcompass fix --dry-run                  # Preview only

# Batch mode options (NEW!)
devcompass fix --batch                    # Interactive selection
devcompass fix --batch --dry-run          # Preview batch mode

# Preset batch modes
devcompass fix --batch-mode critical      # Supply chain + License + Security
devcompass fix --batch-mode high          # Critical + Quality + Ecosystem
devcompass fix --batch-mode all           # All safe fixes

# Category filtering
devcompass fix --only quality             # Fix only quality
devcompass fix --only supply-chain,license,security
devcompass fix --skip updates             # Skip updates

# Combined options
devcompass fix --batch-mode high --yes --verbose
devcompass fix --only quality --dry-run
devcompass fix --skip ecosystem,updates --yes
```

### Batch Options (NEW in v2.8.5!)
```bash
# Interactive batch mode
--batch                     # Show interactive batch selection menu
--batch --dry-run          # Preview batch fixes without changes

# Preset batch modes
--batch-mode critical      # Fix: supply-chain + license + security
--batch-mode high          # Fix: critical + quality + ecosystem
--batch-mode all           # Fix: all safe fixes

# Category-specific fixes
--only <categories>        # Fix only specific categories
                          # Example: --only quality
                          # Example: --only supply-chain,license

# Skip categories
--skip <categories>        # Skip specific categories
                          # Example: --skip updates
                          # Example: --skip ecosystem,updates

# Available categories:
  supply-chain            # Supply chain security
  license                 # License conflicts
  quality                 # Package quality
  security                # Critical security
  ecosystem               # Ecosystem alerts
  unused                  # Unused dependencies
  updates                 # Safe updates

# Additional options
--verbose                  # Show detailed output during batch execution
--yes                      # Auto-apply without confirmation
```

### Backup Options
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

### Analyze Options
```bash
# JSON output (for CI/CD)
devcompass analyze --json

# CI mode (exits with code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no terminal output)
devcompass analyze --silent

# Combined options
devcompass analyze --json --ci
```

---

## 📊 Example Output

### Analyze Command:
```
🔍 DevCompass v2.8.5 - Analyzing your project...

✔ Scanned 25 dependencies in project
⚡ GitHub check completed in 1.23s (parallel processing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 SECURITY VULNERABILITIES (5)

  🔴 CRITICAL: 1
  🟠 HIGH: 2
  🟡 MODERATE: 2

  Run npm audit fix to fix vulnerabilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SUPPLY CHAIN SECURITY

  No supply chain risks detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ECOSYSTEM ALERTS (1)

🟠 HIGH
  axios@1.6.0
    Issue: Memory leak in request interceptors
    Fix: 1.6.2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 HEAVY PACKAGES (2)

  Packages larger than 1MB:

  typescript                8.1 MB
  webpack                   2.3 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH

  Overall Score:              6.2/10
  Total Dependencies:         25
  Security Vulnerabilities:   5
  Ecosystem Alerts:           1
  Unused:                     0
  Outdated:                   3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
     Or use 'devcompass fix --batch' for granular control!
```

---

## 🎯 Configuration

Create `devcompass.config.json` in your project root:

```json
{
  "ignore": ["package-name"],
  "ignoreSeverity": ["low"],
  "minSeverity": "medium",
  "minScore": 7,
  "cache": true
}
```

### Configuration Options:
- **ignore** - Array of package names to ignore
- **ignoreSeverity** - Array of severity levels to ignore (low/medium/high/critical)
- **minSeverity** - Minimum severity to display (low/medium/high/critical)
- **minScore** - Minimum health score for CI mode (default: 7)
- **cache** - Enable/disable caching (default: true)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

---

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
- [x] ~~Batch fix modes~~ ✅ **Added in v2.8.5!**
- [ ] Dependency graph visualization (v3.0.0)
- [ ] Web dashboard for team health monitoring (v3.0.0)
- [ ] Team collaboration features (v3.1.0)
- [ ] Slack/Discord notifications (v3.1.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡
```
