# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, advanced interactive dependency graph visualization with multiple layouts, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, parallel processing, search & filter capabilities, and enhanced fix command with dry-run mode, progress tracking, and automatic backups.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **visualize dependency graphs with multiple interactive layouts**, **search and filter packages**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **✨ LATEST v3.1.1:** Production Safety & Stability - Comprehensive bug fixes and hardening! 🛡️  
> **🎨 PREVIOUS v3.1.0:** Advanced Graph Visualization - Force-directed layouts, radial views, search & filter! 🎨  
> **🚀 v3.0.2:** Modern dependency analysis with knip - faster, more accurate! 🚀  

## 🎉 Latest Release: v3.1.1 (2026-04-14)

**Production safety and stability improvements!**

### What's New in v3.1.1:
- 🛡️ **Critical Bug Fixes** - Fixed JSON mode crash and division by zero errors
- ✅ **Comprehensive Validation** - 100+ new validation checks across all modules
- 🔒 **Array Safety Guards** - Safe array operations throughout codebase
- 🌐 **Cross-Browser Support** - Enhanced fullscreen compatibility (Firefox, Safari, Chrome)
- ⚡ **Enhanced Stability** - Null-safe operations and graceful fallbacks
- 🚀 **Zero Performance Impact** - All safety improvements with <100ms overhead
- 📊 **Better Error Handling** - Try-catch wrappers for all external calls
- 🎯 **Production Ready** - Thoroughly tested and hardened

### Critical Fixes:
```bash
# v3.1.0 (OLD - Had Issues)
❌ JSON mode crashes on undefined warnings
❌ Division by zero in trend calculations
❌ Unsafe array operations in analyzers
❌ Missing input validation
❌ Cross-browser fullscreen issues

# v3.1.1 (NEW - All Fixed) ⭐
✅ JSON mode works perfectly
✅ Safe division with zero checks
✅ Array.isArray() checks everywhere
✅ Input validation on all functions
✅ Cross-browser fullscreen support
✅ Graceful fallbacks throughout
✅ Enhanced error handling
✅ Production-ready stability
```

### Upgrade Now:
```bash
npm install -g devcompass@3.1.1
```

### Migration from v3.1.0:
**No changes required - drop-in replacement!** All existing functionality works exactly the same, just more stable and safer.

---

## 🎨 Graph Visualization Features

DevCompass v3.1.0+ includes **powerful, interactive dependency graph visualization** with multiple layouts!

### 🎯 Available Layouts

#### 1. **Tree Layout** (Default)
Classic hierarchical view with clear parent-child relationships.
```bash
devcompass graph --layout tree
```
- ✅ Best for: Understanding dependency hierarchy
- ✅ Clear top-down structure
- ✅ Easy to trace dependency chains

#### 2. **Force-Directed Layout** 🆕
Interactive physics-based network visualization with ultimate UI!
```bash
devcompass graph --layout force --open
```
- ✅ Best for: Exploring complex relationships
- ✅ Drag individual nodes to reposition
- ✅ Natural clustering of related packages
- ✅ Real-time physics simulation
- ✅ Zoom controls (buttons + keyboard + mouse)
- ✅ Click to highlight connections
- ✅ Search and filter functionality
- ✅ Fullscreen mode
- ✅ Modern dark theme
- ✅ Interactive and engaging

#### 3. **Radial/Circular Layout** 🆕
Concentric circles based on dependency depth.
```bash
devcompass graph --layout radial
```
- ✅ Best for: Understanding dependency levels
- ✅ Root package at center
- ✅ Dependencies radiating outward
- ✅ Clear depth visualization
- ✅ Beautiful circular design

#### 4. **Conflict-Only View** 🆕
Shows only packages with issues - instantly identify problems!
```bash
devcompass graph --layout conflict --open
```
- ✅ Best for: Quick issue identification
- ✅ Filters out healthy dependencies automatically
- ✅ Organized by severity (Critical, High, Medium, Low)
- ✅ Shows "No conflicts" when all packages are healthy
- ✅ Color-coded by severity level

### 📤 Export Formats

#### HTML Export (Default)
Interactive D3.js visualization with all features.
```bash
devcompass graph --output my-graph.html --open
```
- ✅ Full interactivity
- ✅ Zoom, pan, and explore
- ✅ Hover tooltips
- ✅ Search and filter
- ✅ Keyboard shortcuts
- ✅ All layout options

#### JSON Export
Complete graph data structure for programmatic access.
```bash
devcompass graph --format json --output graph.json
```
- ✅ Full graph data (nodes + links)
- ✅ Programmatic access
- ✅ Integration with custom tools
- ✅ Lightweight and fast

### 🔍 Search & Filter 🆕

**Real-time Search:**
- 🔍 Instant package name search (Press F to focus)
- 📦 Search by version
- ⚡ Live results as you type
- 🎯 Highlight matching nodes
- 📋 Quick navigation to packages

**Advanced Filters:**
- ⚠️ Show only vulnerable packages
- 📅 Show only outdated packages
- 🚫 Show only deprecated packages
- 💚 Filter by health score (Critical/Warning/Caution/Healthy)
- 📊 Filter by dependency depth level
- 📦 Filter by package type
- 🔄 Combine multiple filters
- ⚡ Real-time graph updates with live stats

**Filter UI Features:**
- 📊 Live statistics (visible/hidden nodes and links)
- 🔄 Filter reset button
- 🎨 Highlighted filtered nodes
- 🔗 Updated link connections
- 💡 Interactive dropdowns

### 🎨 Interactive Features

**All Layouts Include:**
- 🔍 Zoom controls (in/out/reset/fit-to-screen)
- 👆 Pan and drag support
- 💡 Hover tooltips with package details
- 🎯 Node highlighting on search
- ⚡ Smooth transitions and animations
- 📱 Responsive design
- ⌨️ Keyboard shortcuts

**Force Layout Specific:**
- 🎮 Drag individual nodes
- 🌀 Real-time physics simulation
- 🔄 Reset layout button
- ⚙️ Toggle labels/links
- 🎯 Click to highlight connections
- 📊 Stats panel with selection count
- 🖥️ Fullscreen mode (cross-browser compatible)

**Keyboard Shortcuts:**
- **F** - Focus search box
- **R** - Reset simulation (force layout)
- **C** - Center view
- **+** or **=** - Zoom in
- **-** or **_** - Zoom out
- **ESC** - Clear selection

---

## 🎉 Recent Updates

### v3.1.1 (2026-04-14) - Production Safety & Stability

**Comprehensive bug fixes and production hardening!** This patch release fixes critical bugs and adds 100+ validation checks for production stability.

**Critical Fixes:**
- ✅ **Fixed JSON mode crash** - `supplyChainData.warnings` undefined error resolved
- ✅ **Fixed division by zero** - Safe calculations in trend analysis
- ✅ **Fixed unsafe array operations** - Array.isArray() checks everywhere
- ✅ **Fixed cross-browser fullscreen** - Firefox/Safari/Chrome support
- ✅ **Added input validation** - All public functions validate inputs
- ✅ **Added null-safe operations** - Optional chaining throughout
- ✅ **Enhanced error handling** - Try-catch wrappers for external calls
- ✅ **Added graceful fallbacks** - Safe degradation for all operations

**Files Hardened (9):**
- `src/alerts/github-tracker.js`
- `src/analyzers/package-quality.js`
- `src/analyzers/unused-deps.js`
- `src/commands/analyze.js`
- `src/commands/fix.js`
- `src/graph/layouts/force.js`
- `src/utils/batch-executor.js` (verified safe)
- `src/utils/quality-fixer.js` (verified safe)
- `src/commands/backup.js` (verified safe)

### v3.1.0 (2026-04-08) - Advanced Graph Visualization

**Multiple layouts, search/filter, and enhanced UI!** This release dramatically enhances graph visualization capabilities.

**What's New:**
- ✅ Force-directed network layout (interactive physics)
- ✅ Radial/circular layout (dependency levels)
- ✅ Conflict-only view (issues at a glance)
- ✅ Real-time search functionality
- ✅ Advanced filtering options
- ✅ Zoom controls (buttons + keyboard + mouse)
- ✅ Fullscreen mode
- ✅ Click to highlight connections
- ✅ Modern dark theme UI
- ✅ Improved performance

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

- 🛡️ **Production Safety & Stability** (v3.1.1) - Comprehensive bug fixes and hardening
- 🎨 **Advanced Graph Visualization** (v3.1.0) - Multiple layouts, search & filter, interactive UI
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
npm install -g devcompass@3.1.1
```

**Local installation:**
```bash
npm install --save-dev devcompass@3.1.1
```

**One-time use (no installation):**
```bash
npx devcompass@3.1.1 analyze
```

**Upgrade from previous versions:**
```bash
npm install -g devcompass@3.1.1
```

**No additional dependencies needed!** All features work out of the box. 🎉

## 📖 Usage

### Basic Commands
```bash
# Analyze your project
devcompass analyze

# Generate dependency graph with different layouts (v3.1.0+)
devcompass graph                                # Tree layout (default)
devcompass graph --layout force --open          # Interactive force-directed
devcompass graph --layout radial                # Circular/radial view
devcompass graph --layout conflict              # Show only issues

# Export to different formats (v3.1.0+)
devcompass graph --format json                  # JSON data
devcompass graph --format html --open           # Interactive HTML

# Search and filter (v3.1.0+)
devcompass graph --filter vulnerable            # Vulnerable packages only
devcompass graph --filter outdated              # Outdated packages only
devcompass graph --filter conflict              # Packages with issues

# Combined options (v3.1.0+)
devcompass graph --layout force --filter conflict --open
devcompass graph --layout radial --depth 2 --output radial-depth2.html

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

# JSON output (for CI/CD) - Fixed in v3.0.1, Hardened in v3.1.1!
devcompass analyze --json

# CI mode (exit code 1 if score < threshold)
devcompass analyze --ci

# Silent mode (no output)
devcompass analyze --silent
```

## 📊 Graph Visualization Commands (v3.1.0)

### Layout Options

#### Tree Layout (Default)
```bash
# Basic tree layout
devcompass graph

# With depth limit
devcompass graph --depth 2

# Open in browser
devcompass graph --open
```

#### Force-Directed Layout 🆕
```bash
# Interactive physics simulation with ultimate UI
devcompass graph --layout force --open

# With custom dimensions
devcompass graph --layout force --width 1920 --height 1080

# With filters
devcompass graph --layout force --filter conflict --open
```

#### Radial Layout 🆕
```bash
# Circular visualization
devcompass graph --layout radial --open

# With depth limit
devcompass graph --layout radial --depth 3
```

#### Conflict View 🆕
```bash
# Show only problematic packages
devcompass graph --layout conflict --open

# Combined with filter
devcompass graph --layout conflict --filter vulnerable
```

### Export Options

#### HTML Export (Interactive)
```bash
# Default - interactive HTML
devcompass graph --output my-graph.html

# Force layout
devcompass graph --layout force --output force.html --open

# With filters
devcompass graph --filter conflict --output conflicts.html
```

#### JSON Export
```bash
# Complete graph data
devcompass graph --format json --output graph.json

# With filters
devcompass graph --filter vulnerable --format json --output vulnerable.json
```

### Filter Options 🆕
```bash
# Show only vulnerable packages
devcompass graph --filter vulnerable

# Show only outdated packages
devcompass graph --filter outdated

# Show only unused packages
devcompass graph --filter unused

# Show only packages with conflicts
devcompass graph --filter conflict

# All packages (default)
devcompass graph --filter all
```

### Advanced Examples
```bash
# Force layout with vulnerable packages only
devcompass graph --layout force --filter vulnerable --open

# Radial layout, depth 2
devcompass graph --layout radial --depth 2 --open

# Quick conflict check
devcompass graph --layout conflict --open

# Complete workflow
devcompass analyze                              # Analyze health
devcompass graph --layout conflict --open       # Visualize issues
devcompass fix --batch-mode high                # Fix critical issues
devcompass graph --layout force --open          # Verify improvements

# Search and filter interactively
devcompass graph --layout force --open
# Then: Press F to search, use filter dropdowns, click nodes

# Fullscreen immersive experience
devcompass graph --layout force --open
# Then: Click Fullscreen button or press F11
```

### Command Options (v3.1.0)
```bash
-p, --path <path>       # Project path (default: current directory)
-o, --output <file>     # Output file (default: dependency-graph.html)
-f, --format <format>   # Output format: html, json
-l, --layout <type>     # Layout: tree, force, radial, conflict (default: tree)
-d, --depth <number>    # Maximum depth to traverse (default: unlimited)
--filter <filter>       # Filter: all, vulnerable, outdated, unused, conflict
-w, --width <number>    # Graph width in pixels (default: 1200)
-h, --height <number>   # Graph height in pixels (default: 800)
--open                  # Open in browser (HTML only)
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

### JSON Mode (Fixed in v3.1.1!)
All JSON mode issues have been resolved:
```bash
# Verify you're on v3.1.1+
devcompass --version
# Should show: 3.1.1 or higher

# Test JSON mode
devcompass analyze --json
# Should work perfectly with no errors!
```

### Unused Dependency Detection
DevCompass v3.0.2+ uses **knip** for modern, accurate unused dependency detection:
```bash
# Verify you're on v3.0.2+
devcompass --version
# Should show: 3.1.1 or higher

# Run analysis
devcompass analyze
# knip provides better accuracy than the old depcheck
```

### Common Issues:

**Issue:** "Command not found: devcompass"
```bash
# Solution: Install globally
npm install -g devcompass@3.1.1
```

**Issue:** Old version installed
```bash
# Solution: Update to latest
npm update -g devcompass
```

**Issue:** Graphs not showing properly
```bash
# Solution: Open HTML files in modern browser
firefox graph.html
# or
google-chrome graph.html
```

**Issue:** Force layout nodes clustered
```bash
# Solution: Use fit-to-screen button or wait for simulation to settle
# The layout spreads nodes automatically after a few seconds
```

**Issue:** Unused dependencies showing up incorrectly
```bash
# Solution: Add them to devcompass.config.json
{
  "ignore": ["package-name"]
}
```

**Issue:** Fullscreen not working in Firefox/Safari
```bash
# Solution: Upgrade to v3.1.1 for cross-browser fullscreen support
npm install -g devcompass@3.1.1
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
- [x] ~~Force-directed network layout~~ ✅ **Added in v3.1.0!**
- [x] ~~Radial/circular graph layouts~~ ✅ **Added in v3.1.0!**
- [x] ~~Conflict-only graph view~~ ✅ **Added in v3.1.0!**
- [x] ~~Search and filter in graphs~~ ✅ **Added in v3.1.0!**
- [x] ~~Interactive UI enhancements~~ ✅ **Added in v3.1.0!**
- [x] ~~Production safety & stability~~ ✅ **Added in v3.1.1!**
- [ ] Web dashboard for team health monitoring (v3.2.0)
- [ ] Monorepo support with knip (v3.2.0)
- [ ] Historical tracking (v3.2.0)
- [ ] Compare graphs before/after fixes (v3.2.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡