# 🧭 DevCompass

**Dependency health checker with unified interactive dashboard featuring 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, backup & rollback, historical tracking with SQLite database, snapshot comparison, timeline visualization, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **visualize dependency graphs with 5 dynamic layouts including Analytics dashboard**, **modular architecture with zero code duplication**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **track dependency changes over time with SQLite database**, **compare snapshots to see what changed**, **visualize evolution with interactive timelines**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **📊 LATEST v3.2.1:** Historical Tracking System - Track changes, compare snapshots, visualize trends! 📊  
> **🎨 v3.2.0:** Unified Dashboard Architecture - 50% less code, 5 layouts, dark/light themes! 🎨  
> **🔧 v3.1.7:** Dynamic Data Configuration - Scalable JSON-based configuration system! 🔧

## 🎉 Latest Release: v3.2.1 (2026-04-26)

**Historical Tracking System - Track Your Dependency Evolution!**

### 🌟 What's New in v3.2.1:

#### **📊 Historical Tracking with SQLite**

Complete dependency history tracking with SQLite database backend.

**Features:**
- ✅ **Auto-save snapshots** - Every analysis saved to database
- ✅ **SQLite storage** - Fast, reliable, local database (~/.devcompass/history.db)
- ✅ **Optimized performance** - 8-19ms save time (6-11× faster than target)
- ✅ **Flexible date formats** - 9 formats including DD-MM-YYYY, MM-YYYY, YYYY
- ✅ **Smart grouping** - Auto-groups >20 snapshots by month
- ✅ **Monthly summaries** - Aggregated statistics per month
- ✅ **Zero configuration** - Works automatically

**Database Structure:**

```
~/.devcompass/history.db
├── snapshots         # Project snapshots with metadata
├── packages          # Package details per snapshot
└── dependencies      # Dependency relationships
```

**Performance:**
- Snapshot save: 8-19ms (6-11× faster than target)
- Query speed: <10ms for all operations
- Database size: ~3KB per snapshot (40% better than target)

#### **🔍 Snapshot Comparison**

Compare any two snapshots to see exactly what changed:

```bash
# Compare two snapshots
devcompass compare 5 8

# Detailed comparison
devcompass compare 5 8 --verbose

# Save to file
devcompass compare 5 8 -o report.md
```

**What Gets Compared:**
- ✅ Added/removed packages
- ✅ Version changes
- ✅ Health score changes
- ✅ Vulnerability status changes
- ✅ Deprecated status changes

**Output Example:**

```
📊 Snapshot Comparison
Snapshots: #5 → #8
Health Score: 8.20 → 6.20 (-2.00) ❌
🔄 Updated Packages (9):
⟳ axios
Health: 8.2 → 6.2 (-2.0)
```

📊 Snapshot Comparison
Snapshots: #5 → #8
Health Score: 8.20 → 6.20 (-2.00) ❌
🔄 Updated Packages (9):
⟳ axios
Health: 8.2 → 6.2 (-2.0)

```
📊 Snapshot History (Grouped by Month)
📅 April 2026 (22 snapshots, Avg Health: 7.71)
────────────────────────────────────────────────────────────
#24   25, 07:17 PM     Deps:   9 Health: 6.2
#23   25, 07:17 PM     Deps:   9 Health: 6.2
...
#3    25, 06:15 PM     Deps:   7 Health: 7.7
Total: 22 snapshots
```

**Features:**
- ✅ Automatic grouping when >20 snapshots
- ✅ Monthly average health scores
- ✅ Snapshot count per month
- ✅ Clean, organized display

#### **🔧 Bug Fixes**

**Fixed Typosquatting False Positives:**
- ✅ Changed distance threshold from 2 to 1 character
- ✅ Only flags real typosquats (1-char difference)
- ✅ Added comprehensive whitelist for legitimate packages
- ✅ Fixed `knip` → `knex` false alarm

**Fixed Dynamic Security:**
- ✅ Corrected `similarTo` property name
- ✅ Added proper null checks
- ✅ Improved error handling

### 📊 Performance Metrics

| Operation | Target | Actual | Improvement |
|-----------|--------|--------|-------------|
| Snapshot Save | <100ms | 8-19ms | **6-11× faster** |
| Snapshot Load | <50ms | ~4ms | **12× faster** |
| Comparison | <200ms | 4-5ms | **50× faster** |
| Timeline Gen | <500ms | 6ms | **83× faster** |
| Database Size | ~5KB | ~3KB | **40% smaller** |

**Average Improvement: 40× faster than targets!**

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.2.1
```

### 💡 What Changed for Users:

**New Commands:**
```bash
# History management
devcompass history list
devcompass history show <id>
devcompass history summary
devcompass history cleanup
devcompass history stats

# Comparison
devcompass compare <id1> <id2>

# Timeline
devcompass timeline
devcompass timeline --open
```

**Auto-save Feature:**
```bash
# Snapshots auto-saved on analyze
devcompass analyze   # Saves to database

# Disable if needed
devcompass analyze --no-history
```

**New Files Created:**
- `~/.devcompass/history.db` - SQLite database
- Timeline HTML files when exported

---

## ✨ All Features

- 📊 **Historical Tracking** (v3.2.1) - SQLite database, auto-save snapshots
- 🔍 **Snapshot Comparison** (v3.2.1) - Side-by-side diff analysis
- 📈 **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- 🗂️ **Flexible Dates** (v3.2.1) - 9 date formats supported
- 🎨 **Unified Dashboard** (v3.2.0) - 5 layouts, modular architecture
- 📊 **Analytics Layout** (v3.2.0) - Statistics dashboard
- 🌙 **Theme Support** (v3.2.0) - Dark/light mode toggle
- ⚡ **Performance** (v3.2.0) - 4-6× faster rendering
- 🔧 **Dynamic Data Configuration** (v3.1.7) - JSON-based scalable config
- 🔲 **Intelligent Clustering** (v3.1.6) - Ecosystem/Health/Depth grouping
- 🔑 **GitHub Token Config** (v3.1.5) - User tokens, no rate limits
- 📦 **502 Tracked Packages** (v3.1.5) - Comprehensive monitoring
- 🔄 **Dynamic Issues** (v3.1.2) - Real-time npm audit
- 🛡️ **Production Safety** (v3.1.1) - Bug fixes and hardening
- 📊 **Multiple Layouts** (v3.1.0) - Tree/Force/Radial/Conflict
- 📦 **Batch Fix Modes** (v2.8.5) - Granular control
- 💾 **Backup & Rollback** (v2.8.4) - Safe management
- 📦 **Quality Auto-Fix** (v2.8.3) - Replace abandoned packages
- ⚖️ **License Auto-Fix** (v2.8.2) - GPL/AGPL replacement
- 🛡️ **Supply Chain Auto-Fix** (v2.8.1) - Remove malicious packages

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.1

# Local
npm install --save-dev devcompass@3.2.1

# One-time use
npx devcompass@3.2.1 analyze

# Upgrade from any version
npm install -g devcompass@3.2.1
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (recommended)
devcompass config --github-token <your-token>
devcompass config --show

# Analyze project (auto-saves snapshot!)
devcompass analyze
devcompass analyze --no-history  # Skip snapshot

# Generate graph (with 5 layouts + themes!)
devcompass graph --open

# Auto-fix issues
devcompass fix
devcompass fix --batch
devcompass fix --dry-run

# Batch modes
devcompass fix --batch-mode critical
devcompass fix --batch-mode high
devcompass fix --batch-mode all

# Category-specific
devcompass fix --only quality
devcompass fix --skip updates

# Manage backups
devcompass backup list
devcompass backup restore --name <backup>

# CI/CD
devcompass analyze --json
devcompass analyze --ci
```

### History Commands (NEW in v3.2.1)

```bash
# List snapshots
devcompass history list
devcompass history list --limit 50
devcompass history list --date 25-04-2026
devcompass history list --month 04-2026
devcompass history list --year 2026
devcompass history list --from 01-04-2026 --to 30-04-2026

# View snapshot details
devcompass history show 5

# Monthly summary
devcompass history summary
devcompass history summary --year 2026

# Cleanup old snapshots
devcompass history cleanup --keep 30

# Statistics
devcompass history stats
```

### Comparison Commands (NEW in v3.2.1)

```bash
# Compare snapshots
devcompass compare 5 8
devcompass compare 5 8 --verbose
devcompass compare 5 8 -o report.md
```

### Timeline Commands (NEW in v3.2.1)

```bash
# Generate timeline
devcompass timeline
devcompass timeline --days 60
devcompass timeline --open
devcompass timeline --output my-timeline.html --open
```

### Graph Commands

```bash
# Generate unified dashboard
devcompass graph

# Open in browser
devcompass graph --open

# Custom output
devcompass graph --output my-deps.html --open

# JSON export
devcompass graph --format json --output data.json
```

---

## 📊 Historical Tracking System (v3.2.1)

Track your dependency evolution over time with automatic snapshots, comparison tools, and timeline visualization.

### How It Works

**1. Auto-Save on Analyze**

Every time you run `devcompass analyze`, a snapshot is automatically saved:

```bash
devcompass analyze

# Output:
# ✔ Scanned 6 dependencies in project
# 📸 Snapshot saved (ID: 40, 19ms)
#    Use "devcompass history list" to view all snapshots
```

**2. View Your History**

```bash
devcompass history list
```

**Output:**

```
📊 Snapshot History
ID    Date & Time           Project          Deps    Health
────────────────────────────────────────────────────────────
40    Apr 26, 2026, 02:30 PMdevcompass       6       7.0
39    Apr 25, 2026, 08:20 PMdevcompass       6       7.0
38    Apr 25, 2026, 08:19 PMdevcompass       6       7.0
```

**3. Compare Changes**

```bash
devcompass compare 38 40
```

**Output:**

```
📊 Snapshot Comparison
Snapshots: #38 → #40
Health Score: 7.00 → 7.00 (0.00)
Changes:
Added: 0
Removed: 0
Updated: 2
Unchanged: 4
```

**4. Visualize Trends**

```bash
devcompass timeline --open
```

Opens interactive HTML chart showing:
- Health score over time
- Dependency count changes
- Trend analysis (improving/declining/stable)

### Date Filtering

Query snapshots using flexible date formats:

```bash
# European formats
devcompass history list --date 25-04-2026    # Specific day
devcompass history list --month 04-2026      # Specific month

# ISO formats
devcompass history list --date 2026-04-25    # ISO day
devcompass history list --month 2026-04      # ISO month

# Year only
devcompass history list --year 2026

# Date ranges
devcompass history list --from 01-04-2026 --to 30-04-2026
devcompass history list --after 15-04-2026
```

### Grouped Display

When you have >20 snapshots, they're automatically grouped by month:

```bash
devcompass history list --year 2026
```

**Output:**

```
📊 Snapshot History (Grouped by Month)
📅 April 2026 (22 snapshots, Avg Health: 7.71)
────────────────────────────────────────────────────────────
#24   25, 07:17 PM     Deps:   9 Health: 6.2
#23   25, 07:17 PM     Deps:   9 Health: 6.2
...
Total: 22 snapshots
```

### Monthly Summary

```bash
devcompass history summary
```

**Output:**

```
📊 Monthly Snapshot Summary
April 2026            22 snapshots  Avg Health: 7.71/10  Avg Deps: 9
March 2026            15 snapshots  Avg Health: 8.20/10  Avg Deps: 8
```

### Database Location

All snapshots are stored in:

```
~/.devcompass/history.db
```

**Storage Efficiency:**
- ~3KB per snapshot
- SQLite database with WAL mode
- 4 optimized indexes
- Fast queries (<10ms)

### Disable Auto-Save

If you don't want automatic snapshots:

```bash
devcompass analyze --no-history
```

---

## 🔲 Clustering System (v3.1.6)

The clustering system helps you understand and organize your dependencies by grouping them into meaningful categories.

### How It Works

**1. Choose a Clustering Mode**

Click one of three buttons in the sidebar:
- **⚛️ Ecosystem** - Group by technology
- **🏥 Health** - Group by status
- **📊 Depth** - Group by level

**2. View Organized Clusters**

See your packages organized in the sidebar with:
- Cluster name and icon
- Package count
- Health badges (🔴 vulnerable, 🟡 outdated, 🟢 healthy)

**3. Click to Highlight**

Click any cluster to temporarily highlight those packages on the graph (highlights for 3 seconds, then fades back)

### Ecosystem Clustering

**Automatically detects and groups:**

- **⚛️ React Ecosystem** - React, Redux, Next.js, React Router
- **💚 Vue Ecosystem** - Vue, Vuex, Nuxt, Vite
- **🅰️ Angular Ecosystem** - @angular/*, RxJS
- **🧪 Testing Tools** - Jest, Cypress, Playwright, Testing Library
- **🔧 Build & Bundle** - Webpack, Rollup, Vite, Babel
- **✨ Code Quality** - ESLint, Prettier, Stylelint
- **📘 TypeScript** - TypeScript, @types/*, ts-node
- **🛠️ Utilities** - Lodash, date-fns, UUID
- **🌐 HTTP & API** - Axios, Fetch, Got
- **🖥️ Server & Backend** - Express, Fastify, NestJS
- **💾 Database** - Prisma, TypeORM, Mongoose
- **🎨 Styling** - Styled-components, Tailwind, Emotion

**Plus "Other Dependencies" for uncategorized packages**

### Health Clustering

**Groups by status:**

- **🔴 Critical Issues** - Vulnerable or deprecated packages (fix immediately)
- **🟡 Needs Attention** - Outdated packages (update soon)
- **🟢 Healthy** - Up-to-date, secure packages

### Depth Clustering

**Groups by dependency level:**

- **📌 Direct Dependencies** - Packages in your package.json
- **🔗 Level 1 Dependencies** - Dependencies of your direct dependencies
- **🔗 Level 2 Dependencies** - Dependencies of level 1
- **🔗 Level N Dependencies** - And so on...

---

## 🔑 GitHub Token Configuration (v3.1.5)

DevCompass supports user-configurable GitHub Personal Access Tokens to avoid API rate limiting.

### Why Configure a Token?

**Without Token:**
- 60 requests/hour (GitHub API limit)
- May hit rate limits during analysis
- Cannot track all 502 packages

**With Token:**
- 5,000 requests/hour 🚀
- No rate limit warnings
- Full package health monitoring
- Faster analysis

### Quick Setup

**1. Create GitHub Token**

Visit: https://github.com/settings/tokens/new

- Token name: `DevCompass CLI`
- Expiration: `90 days` (or your preference)
- Scope: ☑️ `public_repo` only

**2. Configure Token**

```bash
devcompass config --github-token ghp_YOUR_TOKEN_HERE
```

**3. Verify**

```bash
devcompass config --show
# Output: ✓ GitHub token configured: ghp_xxx***xxx
```

**4. Done!**

```bash
devcompass analyze
# No rate limit warnings!
```

---

## 🐛 Troubleshooting

### Common Issues:

**"Command not found"**
```bash
npm install -g devcompass@3.2.1
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.1
```

**History database not saving**
```bash
# Check database exists
ls -la ~/.devcompass/history.db

# If missing, re-run analyze
devcompass analyze

# Check for errors
DEBUG=1 devcompass analyze
```

**Date format not recognized**
```bash
# Supported formats:
# DD-MM-YYYY: 25-04-2026
# MM-YYYY: 04-2026
# YYYY: 2026
# YYYY-MM-DD: 2026-04-25
# YYYY-MM: 2026-04

# Example:
devcompass history list --date 25-04-2026
```

**Timeline not generating**
```bash
# Ensure you have snapshots
devcompass history list

# Generate timeline
devcompass timeline --open

# Check output file
ls -la devcompass-timeline.html
```

**Comparison showing no changes**
```bash
# Verify snapshot IDs exist
devcompass history list

# Compare different snapshots
devcompass compare <older-id> <newer-id>
```

---

## 🤝 Contributing

Contributions welcome! 

### Ways to Contribute:

1. **Add Package Alternatives**
   - Edit `data/quality-alternatives.json`
   - Submit PR with new deprecated package alternatives

2. **Expand License Database**
   - Edit `data/license-risks.json`
   - Add new license types and risk levels

3. **Improve Typosquatting Detection**
   - Edit `data/popular-packages.json`
   - Add more popular packages to track

4. **Code Contributions**
   - Fork the repository
   - Create feature branch (`git checkout -b feature/amazing`)
   - Commit changes (`git commit -m 'Add feature'`)
   - Push branch (`git push origin feature/amazing`)
   - Open Pull Request

---

## 📄 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

---

## 🌟 What's Next?

### Completed Features:

- [x] Historical tracking (v3.2.1) ✅
- [x] Snapshot comparison (v3.2.1) ✅
- [x] Timeline visualization (v3.2.1) ✅
- [x] Flexible date formats (v3.2.1) ✅
- [x] Unified dashboard architecture (v3.2.0) ✅
- [x] Analytics layout (v3.2.0) ✅
- [x] Theme support (v3.2.0) ✅
- [x] Performance optimizations (v3.2.0) ✅
- [x] Dynamic data configuration (v3.1.7) ✅
- [x] GitHub token configuration (v3.1.5) ✅
- [x] 502 tracked packages (v3.1.5) ✅
- [x] Unified graph system (v3.1.4) ✅
- [x] Intelligent clustering (v3.1.6) ✅

### Planned Features:
- [ ] **Web Dashboard** - Team health monitoring
- [ ] **Monorepo Support** - Multi-project analysis

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

### v3.2.1 (2026-04-26) - Historical Tracking System
- 📊 SQLite database for snapshot storage
- 🔍 Snapshot comparison with side-by-side diff
- 📈 Timeline visualization with D3 charts
- 🗂️ 9 flexible date formats (DD-MM-YYYY, MM-YYYY, YYYY, etc.)
- 🎨 Auto-grouped display for >20 snapshots
- 📊 Monthly summary with aggregated stats
- ⚡ Performance: 6-83× faster than targets
- 🐛 Fixed typosquatting false positives
- 🐛 Fixed dynamic security property names

### v3.2.0 (2026-04-25) - Unified Dashboard Architecture
- 🎨 Unified modular dashboard (50% code reduction)
- 📊 NEW Analytics layout - Statistics dashboard
- 🌙 Dark/light theme support
- ⚡ 4-6× performance improvements
- 🗂️ 12 modular files (6 JS, 5 CSS, 1 HTML)
- ❌ Removed 5 duplicated files (3,600 lines → 1,800 lines)
- ✅ 100% backward compatible

### v3.1.7 (2026-04-22) - Dynamic Data Configuration
- 🔧 8 new JSON configuration files
- ✅ 7 source files refactored for dynamic loading
- ✅ Zero hardcoded data in code
- ✅ Scalable and customizable architecture

### v3.1.6 (2026-04-22) - Intelligent Clustering
- 🔲 Ecosystem clustering (12 categories)
- 🔲 Health clustering (Critical/Warning/Healthy)
- 🔲 Depth clustering (Direct → Level N)

### v3.1.5 (2026-04-21) - GitHub Token Support
- 🔑 User-configurable GitHub tokens
- 📦 502 tracked packages database
- ⚡ 5,000 requests/hour (vs 60)

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass v3.2.1 - Track, Compare, Evolve!* 🧭

**Like Lighthouse for your dependencies** ⚡