# 🧭 DevCompass

**Dependency health checker with unified interactive dashboard featuring 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, backup & rollback, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **visualize dependency graphs with 5 dynamic layouts including Analytics dashboard**, **modular architecture with zero code duplication**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🎨 LATEST v3.2.0:** Unified Dashboard Architecture - 50% less code, 5 layouts, dark/light themes! 🎨  
> **🔧 v3.1.7:** Dynamic Data Configuration - Scalable JSON-based configuration system! 🔧  
> **🔲 v3.1.6:** Intelligent Clustering - Organize packages by Ecosystem, Health, or Depth! 🔲  
> **🔑 v3.1.5:** GitHub Personal Access Token Support - Configure your own token to bypass rate limits! 🔑

## 🎉 Latest Release: v3.2.0 (2026-04-25)

**Unified Dashboard Architecture - Modular, Scalable, Beautiful!**

### 🌟 What's New in v3.2.0:

#### **🎨 Unified Dashboard Architecture**

Complete refactor from 4 duplicated layout files (3,600 lines) to unified modular dashboard (1,800 lines).

**Benefits:**
- ✅ **50% code reduction** - Easier to maintain
- ✅ **Single source of truth** - Update once, applies everywhere
- ✅ **4× faster updates** - No more copy-paste across files
- ✅ **Zero duplication** - CSS/JS shared across all layouts
- ✅ **Fully backward compatible** - No breaking changes

**New Structure:**

```
src/dashboard/
├── index.html          # Main template (11KB)
├── scripts/            # 6 modular JS files
│   ├── core.js        # Initialization
│   ├── layouts.js     # ALL 5 layouts in one file
│   ├── controls.js    # Zoom, filters, exports
│   ├── tooltip.js     # Tooltip management
│   ├── stats.js       # Statistics calculations
│   └── utils.js       # Shared utilities
└── styles/            # 5 modular CSS files
├── base.css       # Variables, reset
├── layout.css     # Header, sidebars, grid
├── controls.css   # Buttons, filters, inputs
├── graph.css      # Nodes, links, tooltips
└── themes.css     # Dark/light theme support
```

**Removed (Consolidated):**
- ❌ `src/graph/layouts/tree.js` (800 lines)
- ❌ `src/graph/layouts/force.js` (700 lines)
- ❌ `src/graph/layouts/radial.js` (650 lines)
- ❌ `src/graph/layouts/conflict.js` (600 lines)
- ❌ `src/graph/template.html` (900 lines)

#### **📊 NEW: Analytics Layout**

Fifth layout added - comprehensive statistics dashboard with 5 cards:

1. **📊 Overview** - Total/Healthy/Vulnerable/Outdated at a glance
2. **💊 Health Distribution** - Bar chart showing package health breakdown
3. **📏 Depth Distribution** - Dependency depth visualization
4. **🚨 Issues by Type** - Categorized issue summary
5. **⚠️ Needs Attention** - Top 10 packages requiring fixes

**Access:** Click **📊 Analytics** tab in header

#### **🎨 Dark/Light Theme Support**

Toggle between dark and light themes with one click:

- **Dark Theme** (default) - Professional dark UI
- **Light Theme** - Clean, bright interface
- **Persisted** - Saves preference in localStorage
- **Smooth Transitions** - Beautiful theme switching
- **Toggle Button** - 🌙 / ☀️ in header

#### **⚡ Performance Optimizations**

Massive speed improvements across all layouts:

- **Tree Layout** - 5× faster rendering
- **Force Layout** - 4× faster simulation
- **Radial Layout** - 4× faster positioning
- **Analytics Layout** - 6× faster card generation

**Optimizations:**
- Pre-calculated node positions
- Batch DOM operations
- Optimized D3 selections
- Reduced transition durations
- Deferred expensive operations

### 📊 Code Metrics

| Metric | v3.1.7 | v3.2.0 | Improvement |
|--------|--------|--------|-------------|
| Total Lines | 3,600 | 1,800 | **-50%** |
| Layout Files | 4 files | 1 file | **-75%** |
| CSS Duplication | 4× | 1× shared | **-75%** |
| JS Duplication | 4× | 1× engine | **-75%** |
| Files | 5 files | 12 files | Better organized |
| Layouts | 4 layouts | **5 layouts** | +25% |
| Themes | None | **2 themes** | New feature |
| Maintainability | Update 4 places | Update 1 place | **4× easier** |

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.2.0
```

### 💡 What Changed for Users:

**Nothing! (100% Backward Compatible)**

All commands work exactly the same:
```bash
devcompass graph --open  # Same command, better UI!
```

**New Features:**
- ✅ **Analytics tab** - Click to see dashboard
- ✅ **Theme toggle** - Click 🌙/☀️ button
- ✅ **Faster rendering** - 4-6× performance boost

---

## 🎨 Unified Graph Visualization (v3.2.0)

DevCompass features a **revolutionary unified interactive dashboard** - 5 layouts, intelligent clustering, theme support, and all controls in one beautiful interface!

### 🎯 One Command, Everything Included

```bash
# Generate unified interactive dashboard
devcompass graph --open
```

**What you get in ONE file:**
- ✅ **5 layouts** (Tree/Force/Radial/Conflict/Analytics) - switchable via tabs
- ✅ **5 filters** (All/Vulnerable/Outdated/Deprecated/Unused) - instant filtering
- ✅ **3 clustering modes** (Ecosystem/Health/Depth) - organize packages
- ✅ **2 themes** (Dark/Light) - toggle with one click
- ✅ Depth slider (1-10, ∞)
- ✅ Live search
- ✅ Advanced zoom controls
- ✅ Export (PNG/JSON/Report)
- ✅ Live statistics
- ✅ Professional UI
- ✅ **No page reload!**
- ✅ **50% less code** - Better performance

### 🎮 Interactive Controls

#### **Layout Switcher**

Click tabs to switch between:

1. **🌳 Tree** - Hierarchical view (root → children)
2. **⚡ Force** - Physics-based network (drag nodes!)
3. **🌐 Radial** - Circular view (root at center)
4. **⚠️ Conflict** - Issues-only view
5. **📊 Analytics** - Statistics dashboard (NEW!)

#### **Theme Toggle (NEW!)**

Click **🌙 / ☀️** button to switch themes:

- **🌙 Dark Theme** - Professional dark interface (default)
- **☀️ Light Theme** - Clean, bright interface
- Preference saved automatically
- Smooth transitions

#### **Filter Controls**

Click to filter packages:

- **All** - Show everything
- **Vulnerable** - Security issues only
- **Outdated** - Update available
- **Deprecated** - Officially deprecated
- **Unused** - Unused dependencies

#### **Clustering**

Click to organize packages:

- **⚛️ Ecosystem** - Group by technology
- **🏥 Health** - Group by status
- **📊 Depth** - Group by level

#### **Other Controls**

- **Depth Slider** - Control dependency depth (1-∞)
- **Search** - Find packages instantly
- **Zoom** - In/Out/Reset/Fit/Center
- **Export** - PNG image, JSON data, or full report
- **Keyboard Shortcuts** - +/- zoom, R reset, F fit, L labels, T theme

---

## ✨ All Features

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
- 🛡️ **Security Analysis** (v2.7) - Comprehensive security
- ⚡ **Parallel Processing** (v2.6) - 80% faster
- 🔮 **GitHub Tracking** (v2.4) - Real-time package health
- 🚀 **CI/CD Integration** (v2.2) - JSON output, exit codes

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.0

# Local
npm install --save-dev devcompass@3.2.0

# One-time use
npx devcompass@3.2.0 analyze

# Upgrade from any version
npm install -g devcompass@3.2.0
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (recommended)
devcompass config --github-token <your-token>
devcompass config --show

# Analyze project
devcompass analyze

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

### Benefits

**Better Understanding:**
- See your tech stack at a glance
- Identify dominant ecosystems
- Understand dependency chains

**Faster Problem Identification:**
- Critical issues grouped together
- Easy to spot problem areas
- Quick access to related packages

**Informed Decision Making:**
- See which ecosystems are heavily used
- Identify opportunities for consolidation
- Plan migrations with depth visibility

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

### Token Management

```bash
# Show current token (masked)
devcompass config --show

# Remove token
devcompass config --remove-github-token

# Get help
devcompass config --help
```

### Security

- Token stored locally: `~/.devcompass/github-token`
- File permissions: `600` (owner only)
- Only needs `public_repo` scope (read-only)
- Never committed to git
- Can be revoked anytime

---

## 🔧 Configuration Files (v3.1.7)

All configuration is now in external JSON files for easy customization!

### Data Files Location

```
devcompass/
├── data/
│   ├── licenses.json           # License categorization
│   ├── priorities.json         # Severity levels
│   ├── knip-config.json       # Unused deps config
│   ├── license-risks.json     # License risk matrix
│   ├── gpl-alternatives.json  # GPL replacements
│   ├── quality-alternatives.json # Deprecated alternatives
│   ├── popular-packages.json  # Typosquatting detection
│   ├── batch-categories.json  # Fix categories
│   └── tracked-repos.json     # GitHub tracked packages (502)
```

### Customization Examples

**1. Add Custom License to Detection:**

Edit `data/licenses.json`:
```json
{
  "restrictive": [
    "GPL", "GPL-2.0", "GPL-3.0",
    "AGPL", "AGPL-3.0",
    "SSPL",
    "YOUR-CUSTOM-LICENSE"
  ],
  "permissive": [
    "MIT", "Apache-2.0", "BSD-2-Clause",
    "BSD-3-Clause", "ISC", "0BSD", "Unlicense"
  ]
}
```

**2. Whitelist Internal Packages:**

Edit `data/popular-packages.json`:
```json
{
  "packages": ["express", "react", "lodash", ...],
  "whitelist": [
    "chalk", "ora", "inquirer",
    "your-internal-package",
    "your-company-library"
  ]
}
```

**3. Adjust Severity Colors:**

Edit `data/priorities.json`:
```json
{
  "CRITICAL": {
    "level": 1,
    "label": "CRITICAL",
    "color": "red",
    "emoji": "🔴"
  },
  "HIGH": {
    "level": 2,
    "label": "HIGH",
    "color": "orange",
    "emoji": "🟠"
  }
}
```

**4. Add Deprecated Package Alternative:**

Edit `data/quality-alternatives.json`:
```json
{
  "request": {
    "replacement": "axios",
    "reason": "request is deprecated"
  },
  "your-old-package": {
    "replacement": "your-new-package",
    "reason": "your-old-package is abandoned"
  }
}
```

### Project-Specific Configuration

Create `devcompass.config.json` in your project:

```json
{
  "ignore": ["package-name"],
  "ignoreSeverity": ["low"],
  "minSeverity": "medium",
  "minScore": 7,
  "cache": true
}
```

**Options:**
- **ignore** - Packages to skip
- **ignoreSeverity** - Severities to ignore (low/medium/high/critical)
- **minSeverity** - Minimum to display
- **minScore** - Minimum health score for CI (default: 7)
- **cache** - Enable caching (default: true)

---

## 📦 Tracked Repositories (v3.1.5)

DevCompass tracks **502 popular npm packages** across 33 categories!

**Major Categories:**
- Web Frameworks (25) - React, Vue, Angular, Svelte, Solid
- Meta Frameworks (15) - Next.js, Nuxt, Remix, Astro
- Build Tools (25) - Webpack, Vite, Rollup, esbuild
- Testing (25) - Jest, Vitest, Cypress, Playwright
- State Management (20) - Redux, Zustand, Jotai, MobX
- Utilities (50) - Lodash, date-fns, Zod, Yup
- And 27 more categories!

**Data Source:** `data/tracked-repos.json` (customizable!)

---

## 💾 Backup & Rollback (v2.8.4)

```bash
# List backups
devcompass backup list

# Restore backup
devcompass backup restore --name <backup>

# Show details
devcompass backup info --name <backup>

# Clean old backups
devcompass backup clean
devcompass backup clean --keep 3
```

---

## 📦 Batch Fix Modes (v2.8.5)

### Categories (Priority Order):

1. 🛡️ **Supply Chain** - Malicious packages
2. ⚖️ **License Conflicts** - GPL/AGPL
3. 📦 **Quality** - Abandoned/deprecated
4. 🔐 **Security** - Vulnerabilities
5. 🚨 **Ecosystem** - Known issues
6. 🧹 **Unused** - Remove unused
7. ⬆️ **Updates** - Safe updates

### Commands:

```bash
# Interactive mode
devcompass fix --batch

# Preset modes
devcompass fix --batch-mode critical  # Categories 1-2
devcompass fix --batch-mode high      # Categories 1-4
devcompass fix --batch-mode all       # All 7

# Specific categories
devcompass fix --only quality
devcompass fix --only supply-chain,license

# Skip categories
devcompass fix --skip updates
devcompass fix --skip ecosystem,updates
```

**Category Configuration:** Edit `data/batch-categories.json` to customize!

---

## 🐛 Troubleshooting

### Common Issues:

**"Command not found"**
```bash
npm install -g devcompass@3.2.0
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.0
```

**GitHub rate limits**
```bash
# Configure your token
devcompass config --github-token <token>

# Get token: https://github.com/settings/tokens/new
# Scope: public_repo only
```

**Token not working**
```bash
# Verify
devcompass config --show

# Check permissions
ls -la ~/.devcompass/github-token
# Should show: -rw------- (600)
```

**Graph not loading**
```bash
# Hard refresh browser
# Ctrl+F5 (Windows/Linux)
# Cmd+Shift+R (Mac)
```

**Theme not switching**
```bash
# Clear browser cache
# Hard refresh (Ctrl+F5)

# Check console for errors (F12)
```

**Analytics tab empty**
```bash
# Ensure v3.2.0
devcompass --version

# Regenerate graph
devcompass graph --output new.html --open
```

**Customize configuration not working**
```bash
# Check file exists
ls -la ~/devCompass/data/

# Validate JSON
cat ~/devCompass/data/licenses.json | jq .

# Restart after editing
devcompass analyze
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

- [x] Unified dashboard architecture (v3.2.0) ✅
- [x] Analytics layout (v3.2.0) ✅
- [x] Theme support (v3.2.0) ✅
- [x] Performance optimizations (v3.2.0) ✅
- [x] Dynamic data configuration (v3.1.7) ✅
- [x] GitHub token configuration (v3.1.5) ✅
- [x] 502 tracked packages (v3.1.5) ✅
- [x] Unified graph system (v3.1.4) ✅
- [x] Dynamic layout switching (v3.1.4) ✅
- [x] Real-time filtering (v3.1.4) ✅
- [x] Advanced zoom controls (v3.1.4) ✅
- [x] Intelligent clustering (v3.1.6) ✅
- [x] Ecosystem grouping (v3.1.6) ✅
- [x] Health clustering (v3.1.6) ✅
- [x] Depth analysis (v3.1.6) ✅

### Planned Features:
- [ ] **Web Dashboard** - Team health monitoring
- [ ] **Monorepo Support** - Multi-project analysis
- [ ] **Historical Tracking** - Track changes over time
- [ ] **Compare Mode** - Before/after fix comparison
- [ ] **Timeline View** - Dependency evolution

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

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
- 🐛 Fixed unused deps showing as `undefined`
- 🐛 Fixed supply chain analysis bugs
- 🐛 Fixed license risk analysis bugs

### v3.1.6 (2026-04-22) - Intelligent Clustering
- 🔲 Ecosystem clustering (12 categories)
- 🔲 Health clustering (Critical/Warning/Healthy)
- 🔲 Depth clustering (Direct → Level N)
- ✨ Click-to-highlight packages
- 📊 Per-cluster statistics

### v3.1.5 (2026-04-21) - GitHub Token Support
- 🔑 User-configurable GitHub tokens
- 📦 502 tracked packages database
- ⚡ 5,000 requests/hour (vs 60)
- 🔒 Secure local storage

### v3.1.4 (2026-04-20) - Unified Graph
- 🎨 All layouts in one file
- 🔄 Dynamic layout switching
- 🎯 Real-time filtering
- 🔍 Advanced zoom controls

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass v3.2.0 - Unified, Modular, Beautiful!* 🧭

**Like Lighthouse for your dependencies** ⚡