# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, real-time GitHub issue tracking for 500+ popular npm packages, unified interactive dependency graph with dynamic layout switching, real-time filtering, advanced zoom controls, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, and professional dependency exploration - all in a single interactive HTML file.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 500+ packages**, **visualize dependency graphs with unified interactive interface**, **instant layout switching**, **real-time filtering**, **advanced zoom controls**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🎨 LATEST v3.1.4:** Unified Interactive Graph System - 40+ files → 1 file with dynamic controls! 🎨  
> **✨ PREVIOUS v3.1.3:** Cleanup & Code Improvements - Removed unused dependencies! 🧹  
> **🎯 v3.1.2:** Graph Layout Fixes & Dynamic Issues - Tree/Radial layouts fixed! 🎯

## 🎉 Latest Release: v3.1.4 (2026-04-20)

**Unified Interactive Graph System - Complete Redesign!**

### 🌟 What's New in v3.1.4:

#### **97% File Reduction - Revolutionary Simplification!**

**Before v3.1.4:**

40+ separate HTML files:

graph-tree.html
graph-force.html
graph-radial.html
graph-filter-vulnerable.html
combo-tree-vulnerable.html
combo-force-outdated.html
... (34+ more files)
Total: ~4-5 MB

**After v3.1.4:**

1 unified HTML file:

dependency-graph.html (107 KB)
✨ Contains ALL:

4 layouts (switchable)
5 filters (switchable)
Depth control
Search
Export options
Total: 107 KB (97% reduction!)






#### **🎨 Unified Interactive Features**

- **Dynamic Layout Switcher** - Tree/Force/Radial/Conflict buttons (no page reload!)
- **Real-time Filters** - All/Vulnerable/Outdated/Deprecated/Unused (instant updates)
- **Depth Slider** - 1-10 with ∞ option (live filtering)
- **Live Search** - Instant package name filtering
- **Advanced Zoom Controls:**
  - 🔍+ Zoom In (1.3x magnification)
  - 🔍− Zoom Out (0.7x reduction)
  - ⟲ Reset Zoom (return to 1:1)
  - ⛶ Fit to Screen (auto-scale entire graph)
  - ⊙ Center View (smart bounding box centering)
- **Export Capabilities:**
  - 📸 Save as PNG (download current view)
  - 💾 Save as JSON (export filtered data)
- **🖵 Fullscreen Mode** - Immersive graph exploration
- **📊 Live Statistics** - Real-time node/link counts

#### **🔧 Enhanced Tree Layout**

- **Fixed label overlap** - Intelligent positioning (above parents, below leaves)
- **Increased spacing** - 1.5x-2x separation for clarity
- **Auto-fit on render** - Graph scales automatically
- **Text truncation** - 15 character limit with ellipsis
- **Better readability** - Improved font sizing

#### **⚡ Performance Improvements**

| Operation | Time | Speed |
|-----------|------|-------|
| Layout switch | <100ms | No page reload! |
| Filter update | <50ms | Real-time |
| Search | <20ms | Instant |
| Initial render | <100ms | Lightning fast |
| Export PNG | ~1-2s | Professional quality |

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.1.4
```

### 📈 Migration from v3.1.3:

**No changes required - drop-in replacement!** All existing commands work identically. The unified graph is now the default behavior.

**Workflow Comparison:**

**Before v3.1.4:**
```bash
# Generate multiple files
devcompass graph --layout tree --output graph-tree.html
devcompass graph --layout force --output graph-force.html
devcompass graph --filter vulnerable --output graph-vulnerable.html
# Result: 3 commands, 3 files, 3 browser tabs
```

**After v3.1.4:**
```bash
# Generate one unified file
devcompass graph
# Result: 1 command, 1 file, instant switching via buttons!
```

---

## 🎨 Unified Graph Visualization (v3.1.4)

DevCompass now features a **revolutionary unified interactive graph** - all layouts, filters, and controls in one beautiful interface!

### 🎯 Single Command, Infinite Possibilities

```bash
# Generate unified interactive graph
devcompass graph

# Open in browser
devcompass graph --open
```

**What you get in ONE file:**
- ✅ All 4 layouts (Tree, Force, Radial, Conflict) - switchable via buttons
- ✅ All 5 filters (All, Vulnerable, Outdated, Deprecated, Unused) - instant filtering
- ✅ Depth control slider (1-10, ∞)
- ✅ Live search functionality
- ✅ Advanced zoom controls (In/Out/Reset/Fit/Center)
- ✅ Export options (PNG/JSON)
- ✅ Fullscreen mode
- ✅ Real-time statistics
- ✅ Professional UI/UX
- ✅ **No page reload needed!**

### 🎮 Interactive Controls

#### **Layout Switcher**
Click buttons to instantly switch between layouts:

1. **🌳 Tree Layout** - Hierarchical view (root left, children right)
   - Best for: Understanding dependency hierarchy
   - Fixed: Proper horizontal spreading
   - Fixed: Curved links with smooth connections
   - Fixed: Intelligent label positioning

2. **🌀 Force Layout** - Physics-based network
   - Best for: Exploring complex relationships
   - Drag nodes to reposition
   - Natural clustering
   - Real-time simulation

3. **⭕ Radial Layout** - Circular/concentric view
   - Best for: Understanding dependency levels
   - Root at center
   - Dependencies radiating outward
   - Fixed: Labels outside nodes

4. **⚠️ Conflict Layout** - Issues-only view
   - Best for: Quick issue identification
   - Card-based UI by severity
   - Collapsible sections
   - Beautiful "No Conflicts" state

#### **Filter Controls**
Click buttons to filter packages in real-time:

- **All** - Show everything
- **Vulnerable** - Security issues only
- **Outdated** - Packages with updates available
- **Deprecated** - Officially deprecated packages
- **Unused** - Unused dependencies

#### **Depth Slider**
Drag slider to control dependency depth:
- **1-9** - Show specific depth level
- **∞** (at position 10) - Show unlimited depth

#### **Search Box**
Type package name for instant filtering:
- Real-time updates as you type
- Highlights matching nodes
- Shows filtered count

#### **Zoom Controls**
Professional zoom management:
- **🔍+ Zoom In** - Magnify by 1.3x
- **🔍− Zoom Out** - Reduce by 0.7x
- **⟲ Reset** - Return to 1:1 scale
- **⛶ Fit** - Auto-scale to show entire graph
- **⊙ Center** - Smart centering within container

#### **Export Controls**
Save your current view:
- **📸 PNG** - Download as image (current zoom/filter)
- **💾 JSON** - Export filtered data structure

#### **Fullscreen Mode**
- **🖵 Fullscreen** - Toggle immersive view
- Press ESC to exit

### 📊 Live Statistics Panel

Real-time metrics updated on every action:

Statistics
───────────────
Total:       142
Vulnerable:   14
Deprecated:    0
Outdated:      4
Unused:        5
Healthy:     119

### 🎨 Color-Coded Health

Visual health indicators:
- 🟢 **Excellent (9-10)** - Green - Well-maintained
- 🟡 **Good (7-8)** - Light green - Healthy
- 🟠 **Fair (5-6)** - Yellow - Monitor
- 🔴 **Poor (3-4)** - Orange - Needs attention
- ⛔ **Critical (0-2)** - Red - Immediate action

### 🚀 Example Workflow

```bash
# 1. Analyze project
devcompass analyze

# 2. Generate unified graph
devcompass graph --open

# 3. Explore interactively:
#    - Click "Vulnerable" filter → See security issues
#    - Click "Force" layout → Explore relationships
#    - Click "Fit to Screen" → See entire graph
#    - Search "axios" → Find specific package
#    - Click "Export PNG" → Save screenshot

# 4. Fix issues
devcompass fix --batch-mode high

# 5. Re-visualize
devcompass graph --open
#    - Click "Conflict" layout → Verify fixes
```

### 📈 Usage Examples

#### **Quick Security Audit**
```bash
devcompass graph --open
# In browser: Click "Vulnerable" filter → See all security issues
```

#### **Dependency Exploration**
```bash
devcompass graph --open
# In browser: 
# 1. Click "Force" layout
# 2. Drag nodes around
# 3. Click nodes to highlight connections
# 4. Use search to find packages
```

#### **Professional Documentation**
```bash
devcompass graph --open
# In browser:
# 1. Click "Tree" layout
# 2. Click "Fit to Screen"
# 3. Click "Export PNG"
# → Add screenshot to docs
```

#### **Deep Dependency Analysis**
```bash
devcompass graph --open
# In browser:
# 1. Drag depth slider to "2"
# 2. Click "Radial" layout
# 3. See direct + transitive dependencies
```

---

## 🔄 Dynamic Issue Detection (v3.1.2+)

DevCompass detects issues in **real-time** for ANY package!

```bash
devcompass analyze
devcompass graph --open
# Click "Vulnerable" filter to see live security issues
```

**Sources:**
- 🔐 **npm audit** - Real security vulnerabilities
- 📦 **npm registry** - Deprecation status
- 📅 **npm registry** - Maintenance status (2+ years = unmaintained)

**Coverage:** Works for ALL packages, not just a hardcoded list!

---

## ✨ All Features at a Glance

- 🎨 **Unified Interactive Graph** (v3.1.4) - 40+ files → 1 file with dynamic controls
- 🧹 **Cleanup & Code Improvements** (v3.1.3) - Removed unused dependencies
- 🎯 **Graph Layout Fixes** (v3.1.2) - Tree/Radial layouts properly fixed
- 🔄 **Dynamic Issue Detection** (v3.1.2) - Real-time npm audit integration
- 🛡️ **Production Safety** (v3.1.1) - Comprehensive bug fixes and hardening
- 🎨 **Advanced Graph Visualization** (v3.1.0) - Multiple layouts, search & filter
- ✨ **Modern Dependency Analysis** (v3.0.2) - Replaced depcheck with knip
- 📊 **Interactive Graphs** (v3.0.0) - D3.js visualizations
- 📦 **Batch Fix Modes** (v2.8.5) - Granular control
- 💾 **Backup & Rollback** (v2.8.4) - Safe dependency management
- 📦 **Package Quality Auto-Fix** (v2.8.3) - Replace abandoned packages
- ⚖️ **License Conflict Auto-Fix** (v2.8.2) - GPL/AGPL replacement
- 🛡️ **Supply Chain Auto-Fix** (v2.8.1) - Malicious package removal
- 🔧 **Enhanced Fix Command** (v2.8.0) - Dry-run, progress tracking, backups
- 🛡️ **Supply Chain Security** (v2.7) - Malicious package detection
- ⚖️ **License Risk Analysis** (v2.7) - License compliance
- 📊 **Package Quality Metrics** (v2.7) - Health scoring
- 💡 **Security Recommendations** (v2.7) - Prioritized fixes
- ⚡ **Parallel Processing** (v2.6) - 80% faster GitHub tracking
- 🎯 **500+ Package Coverage** (v2.5) - Comprehensive monitoring
- 🔮 **GitHub Issue Tracking** (v2.4) - Real-time package health
- 🔐 **Security Scanning** (v2.3) - npm audit integration
- 📦 **Bundle Size Analysis** (v2.3) - Identify heavy packages
- ⚖️ **License Checker** (v2.3) - Detect restrictive licenses
- 🚀 **CI/CD Integration** (v2.2) - JSON output, exit codes
- ⚡ **Smart Caching** (v2.2) - 70% faster repeated runs

## 🚀 Installation

**Global installation (recommended):**

```bash
npm install -g devcompass@3.1.4
```

**Local installation:**

```bash
npm install --save-dev devcompass@3.1.4
```

**One-time use (no installation):**

```bash
npx devcompass@3.1.4 analyze
```

**Upgrade from previous versions:**

```bash
npm install -g devcompass@3.1.4
```

**No additional dependencies needed!** All features work out of the box. 🎉

## 📖 Usage

### Basic Commands

```bash
# Analyze your project
devcompass analyze

# Generate unified interactive graph (v3.1.4 - NEW!)
devcompass graph                    # Single file with ALL features
devcompass graph --open             # Open in browser

# Export formats
devcompass graph --format json      # JSON data export

# Auto-fix issues
devcompass fix                      # All fixes
devcompass fix --batch              # Interactive selection
devcompass fix --dry-run            # Preview only

# Batch fix modes
devcompass fix --batch-mode critical    # Critical only
devcompass fix --batch-mode high        # High priority
devcompass fix --batch-mode all         # All safe fixes

# Category-specific fixes
devcompass fix --only quality           # Quality only
devcompass fix --skip updates           # Skip updates

# Manage backups
devcompass backup list
devcompass backup restore --name <backup-name>
devcompass backup info --name <backup-name>
devcompass backup clean

# CI/CD integration
devcompass analyze --json           # JSON output
devcompass analyze --ci             # Exit code based on score
devcompass analyze --silent         # No output
```

## 🎨 Unified Graph Commands (v3.1.4)

### Generate Unified Interactive Graph

```bash
# Basic usage - generates single interactive HTML
devcompass graph

# Open in browser automatically
devcompass graph --open

# Custom output filename
devcompass graph --output my-dependencies.html --open

# With custom dimensions
devcompass graph --width 1920 --height 1080 --open
```

### What You Get (All in ONE File!)

**Single Command:**
```bash
devcompass graph --open
```

**Includes ALL of these features:**

#### **4 Layout Types** (Switchable via Buttons)
- 🌳 Tree - Hierarchical view
- 🌀 Force - Physics simulation
- ⭕ Radial - Circular view
- ⚠️ Conflict - Issues only

#### **5 Filter Options** (Instant Filtering)
- All packages
- Vulnerable packages
- Outdated packages
- Deprecated packages
- Unused packages

#### **Interactive Controls**
- Depth slider (1-10, ∞)
- Live search box
- Zoom controls (In/Out/Reset/Fit/Center)
- Export (PNG/JSON)
- Fullscreen mode
- Live statistics

### Export Options

#### HTML Export (Default - Interactive)

```bash
# Default format - single interactive HTML
devcompass graph --output my-graph.html

# Open immediately
devcompass graph --open
```

**File contains:**
- All 4 layouts (switchable)
- All 5 filters (instant)
- All interactive controls
- Export capabilities
- **Size: ~107 KB** (97% smaller than v3.1.3!)

#### JSON Export (Data Only)

```bash
# Export as JSON data
devcompass graph --format json --output graph.json

# JSON includes complete graph structure
# nodes, links, metadata, analysis results
```

### Advanced Usage Examples

#### **Quick Security Check**
```bash
# 1. Generate graph
devcompass graph --open

# 2. In browser:
#    - Click "Vulnerable" filter
#    - See all security issues
#    - Click "Export PNG" to save screenshot
```

#### **Dependency Exploration**
```bash
# 1. Generate graph
devcompass graph --open

# 2. In browser:
#    - Click "Force" layout
#    - Drag nodes to explore relationships
#    - Use search to find specific packages
#    - Click nodes to highlight connections
#    - Click "Fit to Screen" to see overview
```

#### **Professional Documentation**
```bash
# 1. Generate graph
devcompass graph --open

# 2. In browser:
#    - Click "Tree" layout
#    - Set depth to 2 (slider)
#    - Click "Fit to Screen"
#    - Click "Export PNG"
#    → Add to project documentation
```

#### **Complete Workflow**
```bash
# 1. Analyze project health
devcompass analyze

# 2. Visualize dependencies
devcompass graph --open
#    - Explore with Force layout
#    - Filter to Vulnerable packages
#    - Export PNG for review

# 3. Fix critical issues
devcompass fix --batch-mode high

# 4. Verify improvements
devcompass graph --open
#    - Click "Conflict" layout
#    - Should see fewer issues!
```

### Command Options (v3.1.4)

```bash
-p, --path <path>       # Project path (default: current directory)
-o, --output <file>     # Output file (default: dependency-graph.html)
-f, --format <format>   # Output format: html, json (default: html)
-w, --width <number>    # Graph width in pixels (default: 1200)
-h, --height <number>   # Graph height in pixels (default: 800)
--open                  # Open in browser after generation
```

**Note:** Layout and filter options are now **interactive buttons** in the HTML file, not CLI flags!

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

### Common Issues:

**Issue:** "Command not found: devcompass"
```bash
# Solution: Install globally
npm install -g devcompass@3.1.4
```

**Issue:** Old version installed
```bash
# Solution: Update to latest
npm update -g devcompass
```

**Issue:** Graph controls not working
```bash
# Solution: Ensure you're on v3.1.4
devcompass --version  # Should show 3.1.4

# Clear browser cache
# Hard refresh (Ctrl+F5 or Cmd+Shift+R)
```

**Issue:** Center view centers entire page (OLD BUG - FIXED in v3.1.4!)
```bash
# Solution: Upgrade to v3.1.4
npm install -g devcompass@3.1.4
# Center now uses smart bounding box calculation
```

**Issue:** Labels overlapping in tree layout (OLD BUG - FIXED in v3.1.4!)
```bash
# Solution: Upgrade to v3.1.4
npm install -g devcompass@3.1.4
# Labels now positioned intelligently
```

**Issue:** Unused dependencies showing up incorrectly
```bash
# Solution: Add them to devcompass.config.json
{
  "ignore": ["package-name"]
}
```

**Issue:** Graph not loading in browser
```bash
# Check browser console for errors
# Ensure D3.js CDN is accessible
# Try hard refresh (Ctrl+F5)
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
- [x] ~~Tree layout horizontal spreading fix~~ ✅ **Fixed in v3.1.2!**
- [x] ~~Radial layout label positioning fix~~ ✅ **Fixed in v3.1.2!**
- [x] ~~Dynamic issue detection~~ ✅ **Added in v3.1.2!**
- [x] ~~Panel layout separation~~ ✅ **Fixed in v3.1.2!**
- [x] ~~Code cleanup and dependency optimization~~ ✅ **Added in v3.1.3!**
- [x] ~~Unified interactive graph system~~ ✅ **Added in v3.1.4!**
- [x] ~~Dynamic layout switching~~ ✅ **Added in v3.1.4!**
- [x] ~~Real-time filtering~~ ✅ **Added in v3.1.4!**
- [x] ~~Advanced zoom controls~~ ✅ **Added in v3.1.4!**
- [x] ~~Single file graph~~ ✅ **Added in v3.1.4!**
- [ ] Minimap for large graphs (v3.2.0)
- [ ] Node grouping/clustering (v3.2.0)
- [ ] Web dashboard for team health monitoring (v3.2.0)
- [ ] Monorepo support with knip (v3.2.0)
- [ ] Historical tracking (v3.2.0)
- [ ] Compare graphs before/after fixes (v3.2.0)
- [ ] Timeline view (dependency changes over time) (v3.3.0)

Want to contribute? Pick an item and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡