# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, interactive dependency graph visualization, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, parallel processing, advanced license risk detection, and enhanced fix command with dry-run mode, progress tracking, and automatic backups.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **visualize dependency graphs interactively**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **✨ LATEST v3.0.2:** Modern dependency analysis with knip - faster, more accurate! 🚀  
> **🐛 PREVIOUS v3.0.1:** Fixed broken JSON output mode + removed unused dependencies + security fixes!  
> **🎉 NEW v3.0.0:** Dependency Graph Visualization - Interactive D3.js graphs with health-based color coding! 📊  

## 🎉 Latest Release: v3.0.2 (2026-04-08)

**Improved dependency analysis with modern tooling!**

### What's New in v3.0.2:
- ✨ **Replaced depcheck with knip** - Modern, actively maintained alternative
- ⚡ **Better Performance** - Faster unused dependency detection
- 🎯 **Higher Accuracy** - More precise results with modern algorithms
- 🔧 **TypeScript Native** - Full TypeScript support out of the box
- 🛡️ **Security Fixed** - 0 vulnerabilities (resolved all 3 from v3.0.1)
- 📊 **Health Improved** - 7.4/10 (up from 3.4/10 in v3.0.1)

### Why Upgrade to v3.0.2:
```bash
# v3.0.1 (OLD)
- depcheck (stale, 30+ months without updates)
- 3 security vulnerabilities
- Health: 3.4/10

# v3.0.2 (NEW) ⭐
- knip (actively maintained, modern)
- 0 security vulnerabilities
- Health: 7.4/10
```

### Upgrade Now:
```bash
npm install -g devcompass@3.0.2
```

---

## 🎉 Recent Updates

### v3.0.2 (2026-04-08) - Modern Dependency Analysis

**Modern tooling for better accuracy!** This release replaces the stale `depcheck` package with `knip`, providing faster and more accurate unused dependency detection.

**What's New:**
- ✅ Replaced depcheck with knip (actively maintained)
- ✅ Faster unused dependency detection
- ✅ More accurate results with modern algorithms
- ✅ Full TypeScript support
- ✅ 0 security vulnerabilities (fixed all 3)
- ✅ Health score: 7.4/10 (excellent)

### v3.0.1 (2026-04-07) - Critical Bug Fix

**Bug fixes and improvements!** This patch release fixes the broken JSON output mode from v3.0.0 and removes unused dependencies.

**What's Fixed:**
- ✅ JSON output mode now works correctly
- ✅ Removed 3 unused dependencies (canvas, d3, jsdom)
- ✅ Fixed 4 security vulnerabilities
- ✅ Package size reduced by 32%

### v3.0.0 (2026-04-07) - Dependency Graph Visualization

**Interactive dependency graph visualization with D3.js!** DevCompass now generates beautiful, interactive dependency graphs with health-based color coding, zoom/pan controls, and multiple export formats.

**What's New in v3.0.0:**
- 📊 **Interactive Dependency Graphs** - Beautiful D3.js tree visualizations
- 🎨 **Health-Based Color Coding** - Visual indicators from excellent to critical
- 🔍 **Interactive Controls** - Zoom, pan, reset, and tooltips
- 📤 **Multiple Export Formats** - HTML (interactive), JSON (data)
- 📏 **Depth Limiting** - Focus on specific dependency levels
- 📥 **SVG Export** - Download graphs as SVG files
- ⚡ **Fast Generation** - <1 second for 300+ nodes
- 🎯 **Smart Layout** - Hierarchical tree layout with D3.js
- 💡 **Hover Tooltips** - Package details on hover
- 🌐 **Browser Integration** - Auto-open in browser

---

## 🎉 Previous Updates

### v2.8.5 - Batch Fix Modes

**Granular control over which fix categories to apply!** DevCompass now includes comprehensive batch mode with interactive selection, preset modes, and category filtering.

### v2.8.4 - Backup & Rollback

**Complete backup management system for safe dependency fixes!** DevCompass includes comprehensive backup and restore functionality.

### v2.8.3 - Package Quality Auto-Fix

**Automatic replacement of abandoned, deprecated, and stale packages!** DevCompass automatically replaces unmaintained packages with modern alternatives.

### v2.8.2 - License Conflict Auto-Fix

**Automatic replacement of GPL/AGPL packages with MIT/Apache alternatives!** DevCompass automatically resolves license conflicts.

### v2.8.1 - Supply Chain Auto-Fix

**Automatic removal of malicious packages and typosquatting fixes!** DevCompass automatically fixes supply chain security issues.

### v2.8.0 - Enhanced Fix Command

**Major improvements to the fix command!** DevCompass includes dry-run mode, progress tracking, automatic backups, and detailed fix reports.

---

## ✨ Features

- ✨ **Modern Dependency Analysis** (v3.0.2) - Replaced depcheck with knip for better accuracy
- 🐛 **Critical Bug Fixes** (v3.0.1) - Fixed broken JSON mode + removed unused deps
- 📊 **Dependency Graph Visualization** (v3.0.0) - Interactive D3.js graphs with health-based color coding
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
- ⚡ **Smart Caching** (v2.2) - 70% faster on repeated runs
- 🎛️ **Advanced Filtering** (v2.2) - Control alerts by severity level
- 🚨 **Ecosystem Intelligence** (v2.0) - Detect known issues before they break production

## 🚀 Installation

**Global installation (recommended):**
```bash
npm install -g devcompass@3.0.2
```

**Local installation:**
```bash
npm install --save-dev devcompass@3.0.2
```

**One-time use (no installation):**
```bash
npx devcompass@3.0.2 analyze
```

**Upgrade from previous versions:**
```bash
npm install -g devcompass@3.0.2
```

## 📖 Usage

### Basic Commands
```bash
# Analyze your project
devcompass analyze

# Generate dependency graph (v3.0.0+)
devcompass graph
devcompass graph --open                         # Open in browser
devcompass graph --depth 1                      # Direct dependencies only
devcompass graph --format json                  # Export as JSON

# Auto-fix issues (includes supply chain + license + quality fixes!)
devcompass fix

# Batch fix modes
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

# JSON output (for CI/CD) - Fixed in v3.0.1!
devcompass analyze --json

# CI mode (exit code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent
```

## 📊 Dependency Graph Visualization (v3.0.0)

DevCompass includes **powerful dependency graph visualization** with D3.js!

### Graph Features:

#### Interactive Visualization
- 🎨 **D3.js Tree Layout** - Hierarchical dependency structure
- 🔍 **Zoom & Pan Controls** - Navigate large dependency trees
- 💡 **Hover Tooltips** - Package name, version, and health score
- 📊 **Health-Based Colors** - Visual indicators from green to red
- ⚡ **Smooth Animations** - Professional transitions and interactions
- 📥 **Export to SVG** - Download graphs as SVG files
- 🎯 **Responsive Design** - Works on all screen sizes

#### Health Score Color Coding:
- **🟢 Excellent (9-10)** - Green (#10b981) - Well-maintained packages
- **🟡 Good (7-8)** - Light green (#84cc16) - Generally healthy
- **🟠 Fair (5-6)** - Yellow (#eab308) - Some concerns
- **🔴 Poor (3-4)** - Orange (#f97316) - Needs attention
- **⛔ Critical (0-2)** - Red (#ef4444) - Immediate action required

### Graph Commands:

#### Basic Usage:
```bash
# Generate interactive HTML graph
devcompass graph

# Specify output file
devcompass graph --output my-graph.html

# Export as JSON (full graph data)
devcompass graph --format json --output graph.json

# Limit depth to direct dependencies
devcompass graph --depth 1

# Show only dependencies up to depth 2
devcompass graph --depth 2 --output shallow-graph.html

# Open in browser automatically
devcompass graph --open
```

#### Advanced Options:
```bash
# Custom dimensions
devcompass graph --width 1600 --height 1000

# Specific project path
devcompass graph --path /path/to/project

# Combined options
devcompass graph --depth 2 --width 1600 --open
```

#### Command Options:
- `-p, --path <path>` - Project path (default: current directory)
- `-o, --output <file>` - Output file (default: dependency-graph.html)
- `-f, --format <format>` - Output format: html, json
- `-l, --layout <type>` - Layout type: tree (more layouts in v3.1)
- `-d, --depth <number>` - Maximum depth to traverse
- `--filter <filter>` - Filter: all, vulnerable, outdated, unused
- `-w, --width <number>` - Graph width in pixels (default: 1200)
- `-h, --height <number>` - Graph height in pixels (default: 800)
- `--open` - Open in browser (HTML only)

### Graph Output:

**Terminal Output:**
```
📊 DevCompass - Dependency Graph

✔ Generated graph with 341 nodes
✔ Graph exported: dependency-graph.html

──────────────────────────────────────────────────────────────────────

📈 GRAPH SUMMARY

  Format:        HTML
  Layout:        tree
  Total Nodes:   341
  Total Links:   465
  Max Depth:     7
  File Size:     67.59 KB

──────────────────────────────────────────────────────────────────────

✓ Graph generation complete!
```

**HTML Features:**
- Clean, modern design
- Interactive D3.js visualization
- Zoom in/out buttons
- Reset view button
- Export SVG button
- Health score legend
- Project metadata display
- Responsive layout

### Graph Use Cases:

**Perfect for:**
- 📊 **Dependency Auditing** - Visualize entire dependency tree
- 🔐 **Security Analysis** - Identify problematic dependencies visually
- 📚 **Documentation** - Generate graphs for project documentation
- 👥 **Team Collaboration** - Share interactive graphs with team members
- 🏗️ **Architecture Review** - Understand dependency relationships
- 🎓 **Onboarding** - Help new developers understand project structure
- 📈 **Presentations** - Visual aid for technical presentations
- 🔍 **Debugging** - Trace dependency chains and conflicts

### Graph Performance:

**Generation Speed:**
- Small projects (<50 nodes): ~200ms
- Medium projects (50-200 nodes): ~500ms
- Large projects (200-500 nodes): ~1 second
- Very large projects (500+ nodes): ~2 seconds

**File Sizes:**
- HTML (interactive): ~200 bytes per node
- JSON (data): ~400 bytes per node
- Depth limiting dramatically reduces size

**Example Performance:**
- 11 nodes (depth 1): 9.29 KB HTML, <100ms
- 93 nodes (express): 23.72 KB HTML, ~500ms
- 341 nodes (devcompass): 67.59 KB HTML, ~1 second

### Graph Workflow Example:
```bash
# 1. Analyze project health
devcompass analyze

# 2. Visualize dependencies
devcompass graph --open

# 3. Identify issues visually
# (Look for red/orange nodes in the graph)

# 4. Fix issues with batch mode
devcompass fix --batch-mode high

# 5. Re-visualize to see improvements
devcompass graph --output fixed-graph.html --open

# 6. Compare before/after
# (Notice fewer red nodes, better health colors)
```

---

## 📦 Batch Fix Modes (v2.8.5)

DevCompass includes **comprehensive batch mode** for granular control over which fix categories to apply!

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
```bash
devcompass fix --batch
devcompass fix --batch --dry-run
```

#### 2. Preset Batch Modes
```bash
# Critical only
devcompass fix --batch-mode critical

# High priority
devcompass fix --batch-mode high

# All safe fixes
devcompass fix --batch-mode all
```

#### 3. Category-Specific Fixes
```bash
# Fix only quality issues
devcompass fix --only quality

# Fix supply chain and license only
devcompass fix --only supply-chain,license --yes

# Fix security and quality
devcompass fix --only security,quality
```

#### 4. Skip Categories
```bash
# Fix everything except updates
devcompass fix --skip updates

# Skip ecosystem and updates
devcompass fix --skip ecosystem,updates
```

---

## 💾 Backup & Rollback (v2.8.4)

DevCompass includes **comprehensive backup management** for safe dependency fixes!

### Backup Commands:
```bash
# List all backups
devcompass backup list

# Restore from specific backup
devcompass backup restore --name <backup-name>

# Show backup details
devcompass backup info --name <backup-name>

# Clean old backups (keeps latest 5)
devcompass backup clean

# Clean keeping specific number
devcompass backup clean --keep 3
```

---

## 📦 Package Quality Auto-Fix (v2.8.3)

DevCompass can **automatically replace abandoned, deprecated, and stale packages** with modern alternatives!

### Alternative Database (50+ packages):
```
request → axios, got, ky
moment → dayjs, date-fns, luxon
tslint → eslint
node-sass → sass (Dart Sass)
colors → chalk
enzyme → @testing-library/react
faker → @faker-js/faker
depcheck → knip  (NEW in v3.0.2!)
...and 40+ more!
```

---

## ⚖️ License Conflict Auto-Fix (v2.8.2)

DevCompass **automatically replaces GPL/AGPL packages** with MIT/Apache alternatives!

---

## 🛡️ Supply Chain Auto-Fix (v2.8.1)

DevCompass **automatically fixes supply chain security issues**!

---

## ⚙️ Commands & Options

### Commands
```bash
# Analyze project dependencies
devcompass analyze

# Generate dependency graph (v3.0.0+)
devcompass graph

# Auto-fix issues
devcompass fix

# Batch fix modes
devcompass fix --batch
devcompass fix --batch-mode <mode>
devcompass fix --only <categories>
devcompass fix --skip <categories>

# Preview fixes
devcompass fix --dry-run

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

### Graph Options (v3.0.0+)
```bash
# Basic graph generation
devcompass graph
devcompass graph --output my-graph.html

# Export formats
devcompass graph --format html          # Interactive HTML (default)
devcompass graph --format json          # Raw graph data

# Depth control
devcompass graph --depth 1              # Direct dependencies only
devcompass graph --depth 2              # Up to 2 levels deep

# Custom dimensions
devcompass graph --width 1600 --height 1000

# Browser integration
devcompass graph --open                 # Auto-open in browser

# Filter options
devcompass graph --filter all           # All dependencies (default)
devcompass graph --filter vulnerable    # Vulnerable packages only
devcompass graph --filter outdated      # Outdated packages only
devcompass graph --filter unused        # Unused packages only

# Combined options
devcompass graph --depth 2 --width 1600 --open
devcompass graph --format json --output data.json
```

### Fix Options
```bash
# Normal fix mode
devcompass fix
devcompass fix --yes
devcompass fix --dry-run

# Batch mode options
devcompass fix --batch
devcompass fix --batch --dry-run

# Preset batch modes
devcompass fix --batch-mode critical
devcompass fix --batch-mode high
devcompass fix --batch-mode all

# Category filtering
devcompass fix --only quality
devcompass fix --only supply-chain,license,security
devcompass fix --skip updates

# Combined options
devcompass fix --batch-mode high --yes --verbose
```

### Backup Options
```bash
# List backups
devcompass backup list

# Restore
devcompass backup restore --name <backup-name>
devcompass backup restore --name <backup-name> --force

# Show info
devcompass backup info --name <backup-name>

# Clean
devcompass backup clean
devcompass backup clean --keep 3 --force
```

### Analyze Options
```bash
# JSON output (Fixed in v3.0.1!)
devcompass analyze --json

# CI mode
devcompass analyze --ci

# Silent mode
devcompass analyze --silent

# Combined
devcompass analyze --json --ci
```

---

## 📊 Example Output

### Graph Command:
```
📊 DevCompass - Dependency Graph

✔ Generated graph with 341 nodes
✔ Graph exported: dependency-graph.html

──────────────────────────────────────────────────────────────────────

📈 GRAPH SUMMARY

  Format:        HTML
  Layout:        tree
  Total Nodes:   341
  Total Links:   465
  Max Depth:     7
  File Size:     67.59 KB

──────────────────────────────────────────────────────────────────────

✓ Graph generation complete!
```

### Analyze Command:
```
🔍 DevCompass v3.0.2 - Analyzing your project...

✔ Scanned 7 dependencies in project
⚡ GitHub check completed in 0.50s (parallel processing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SECURITY VULNERABILITIES

  No vulnerabilities detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SUPPLY CHAIN SECURITY

  No supply chain risks detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ UNUSED DEPENDENCIES

  No unused dependencies detected!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 OUTDATED PACKAGES (6)

  chalk                4.1.2 → 5.6.2  (major update)
  commander            11.1.0 → 14.0.3  (major update)
  knip                 5.88.1 → ^6.3.0  (major update)
  open                 10.2.0 → ^11.0.0  (major update)
  ora                  5.4.1 → 9.3.0  (major update)
  semver               7.6.0 → ^7.7.4  (major update)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 HEAVY PACKAGES (2)

  Packages larger than 1MB:

  npm-check-updates         6.2 MB
  knip                      2.2 MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH

  Overall Score:              7.4/10
  Total Dependencies:         7
  Unused:                     0
  Outdated:                   6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIP: Run 'devcompass fix' to apply automated fixes!
     Or use 'devcompass graph' to visualize your dependencies!
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

## 🐛 Troubleshooting

### Unused Dependency Detection
DevCompass v3.0.2+ uses **knip** for modern, accurate unused dependency detection:

```bash
# Verify you're on v3.0.2+
devcompass --version
# Should show: 3.0.2 or higher

# Run analysis
devcompass analyze
# knip provides better accuracy than the old depcheck
```

### JSON Mode (Fixed in v3.0.1)
If you're experiencing `supplyChainWarnings.filter is not a function` error:
```bash
# Upgrade to latest version
npm install -g devcompass@3.0.2

# Verify version
devcompass --version
# Should show: 3.0.2

# Test JSON mode
devcompass analyze --json
# Should work without errors!
```

### Common Issues:

**Issue:** "Command not found: devcompass"
```bash
# Solution: Install globally
npm install -g devcompass@3.0.2
```

**Issue:** Old version installed
```bash
# Solution: Update to latest
npm update -g devcompass
```

**Issue:** Unused dependencies showing up incorrectly
```bash
# Solution: Add them to devcompass.config.json
{
  "ignore": ["package-name"]
}
```

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
- [x] ~~Dependency graph visualization~~ ✅ **Added in v3.0.0!**
- [x] ~~Fix broken JSON mode~~ ✅ **Fixed in v3.0.1!**
- [x] ~~Modern dependency analysis with knip~~ ✅ **Added in v3.0.2!**
- [ ] Force-directed network layout (v3.1.0)
- [ ] Radial/circular graph layouts (v3.1.0)
- [ ] Conflict-only graph view (v3.1.0)
- [ ] PNG/SVG static export (v3.1.0)
- [ ] Search and filter in graphs (v3.1.0)
- [ ] Web dashboard for team health monitoring (v3.1.0)
- [ ] Monorepo support with knip (v3.1.0)
- [ ] Team collaboration features (v3.2.0)
- [ ] Slack/Discord notifications (v3.2.0)
- [ ] Historical tracking (v3.2.0)
- [ ] Compare graphs before/after fixes (v3.2.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡
