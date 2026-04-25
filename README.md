# 🧭 DevCompass

**Dependency health checker with dynamic data configuration, ecosystem intelligence, user-configurable GitHub Personal Access Token support, real-time GitHub issue tracking for 502 popular npm packages, unified interactive dependency graph with intelligent clustering (Ecosystem/Health/Depth grouping), dynamic layout switching, real-time filtering, advanced zoom controls, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, and professional dependency exploration - all in a single interactive HTML file.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **visualize dependency graphs with intelligent clustering**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **real-time filtering**, **advanced zoom controls**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🔧 LATEST v3.1.7:** Dynamic Data Configuration - Scalable JSON-based configuration system! 🔧  
> **🔲 v3.1.6:** Intelligent Clustering - Organize packages by Ecosystem, Health, or Depth! 🔲  
> **🔑 v3.1.5:** GitHub Personal Access Token Support - Configure your own token to bypass rate limits! 🔑  
> **🎨 v3.1.4:** Unified Interactive Graph System - 40+ files → 1 file with dynamic controls! 🎨

## 🎉 Latest Release: v3.1.7 (2026-04-22)

**Dynamic Data Configuration System - Scalable & Customizable!**

### 🌟 What's New in v3.1.7:

#### **🔧 Dynamic Configuration System**

All hardcoded data moved to external JSON files for easy customization and maintenance.

**8 New Data Files:**

1. **📄 licenses.json** (272B)
   - 8 restrictive licenses (GPL, AGPL, SSPL, etc.)
   - 7 permissive licenses (MIT, Apache-2.0, BSD, etc.)

2. **📄 priorities.json** (394B)
   - 4 severity levels: CRITICAL, HIGH, MEDIUM, LOW
   - Colors, emojis, and labels for each

3. **📄 knip-config.json** (1.0kB)
   - Entry points for unused dependency detection
   - Project patterns and ignore paths

4. **📄 license-risks.json** (2.7kB)
   - 28 license types with risk levels
   - Detailed descriptions and compatibility info

5. **📄 gpl-alternatives.json** (382B)
   - GPL package replacement suggestions (4 packages)

6. **📄 quality-alternatives.json** (888B)
   - Deprecated package alternatives (9 packages)
   - request → axios, moment → dayjs, etc.

7. **📄 popular-packages.json** (1.7kB)
   - 73 popular packages for typosquatting detection
   - 38 whitelist packages (known safe)

8. **📄 batch-categories.json** (1.1kB)
   - 7 fix categories with icons and priorities
   - supply-chain, license, quality, security, etc.

**Benefits:**
- ✅ **Scalable** - Add/remove items by editing JSON (no code changes!)
- ✅ **Maintainable** - Update configuration without code review
- ✅ **Customizable** - Teams can customize thresholds and lists
- ✅ **Version Controlled** - Track data changes separately from code

**Code Quality:**
- **-325 net lines** (more maintainable!)
- 7 source files refactored for dynamic loading
- Zero hardcoded data in code
- 100% backward compatible

### 🐛 Bug Fixes in v3.1.7:

- ✅ Fixed unused dependencies showing as `undefined`
- ✅ Fixed supply chain analysis array iteration
- ✅ Fixed license risk analysis input handling
- ✅ Fixed `findProblematicLicenses` export

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.1.7
```

### 💡 Customization Examples:

**Add custom restrictive license:**
```json
// data/licenses.json
{
  "restrictive": ["GPL", "AGPL", "YOUR-LICENSE"],
  "permissive": ["MIT", "Apache-2.0"]
}
```

**Whitelist internal packages:**
```json
// data/popular-packages.json
{
  "packages": ["express", "react", ...],
  "whitelist": ["your-internal-package"]
}
```

**Customize fix priorities:**
```json
// data/batch-categories.json
[
  {
    "id": "supply-chain",
    "priority": 1,
    "icon": "🛡️"
  }
]
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

## 🎨 Unified Graph Visualization (v3.1.4)

DevCompass features a **revolutionary unified interactive graph** - all layouts, filters, clustering, and controls in one beautiful interface!

### 🎯 One Command, Everything Included

```bash
# Generate unified interactive graph
devcompass graph --open
```

**What you get in ONE file:**
- ✅ 4 layouts (Tree/Force/Radial/Conflict) - switchable via buttons
- ✅ 5 filters (All/Vulnerable/Outdated/Deprecated/Unused) - instant filtering
- ✅ 3 clustering modes (Ecosystem/Health/Depth) - organize packages
- ✅ Depth slider (1-10, ∞)
- ✅ Live search
- ✅ Advanced zoom controls
- ✅ Export (PNG/JSON)
- ✅ Fullscreen mode
- ✅ Live statistics
- ✅ Professional UI
- ✅ **No page reload!**

### 🎮 Interactive Controls

#### **Layout Switcher**

Click to switch between:

1. **🌳 Tree** - Hierarchical view (root → children)
2. **🌀 Force** - Physics-based network (drag nodes!)
3. **⭕ Radial** - Circular view (root at center)
4. **⚠️ Conflict** - Issues-only view

#### **Filter Controls**

Click to filter packages:

- **All** - Show everything
- **Vulnerable** - Security issues only
- **Outdated** - Update available
- **Deprecated** - Officially deprecated
- **Unused** - Unused dependencies

#### **Clustering (v3.1.6)**

Click to organize packages:

- **⚛️ Ecosystem** - Group by technology
- **🏥 Health** - Group by status
- **📊 Depth** - Group by level

#### **Other Controls**

- **Depth Slider** - Control dependency depth (1-∞)
- **Search** - Find packages instantly
- **Zoom** - In/Out/Reset/Fit/Center
- **Export** - PNG image or JSON data
- **Fullscreen** - Immersive view

---

## ✨ All Features

- 🔧 **Dynamic Data Configuration** (v3.1.7) - JSON-based scalable config
- 🔲 **Intelligent Clustering** (v3.1.6) - Ecosystem/Health/Depth grouping
- 🔑 **GitHub Token Config** (v3.1.5) - User tokens, no rate limits
- 📦 **502 Tracked Packages** (v3.1.5) - Comprehensive monitoring
- 🎨 **Unified Interactive Graph** (v3.1.4) - One file, all features
- 🎯 **Graph Layout Fixes** (v3.1.2) - Tree/Radial properly fixed
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
npm install -g devcompass@3.1.7

# Local
npm install --save-dev devcompass@3.1.7

# One-time use
npx devcompass@3.1.7 analyze

# Upgrade from any version
npm install -g devcompass@3.1.7
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (recommended)
devcompass config --github-token <your-token>
devcompass config --show

# Analyze project
devcompass analyze

# Generate graph (with clustering!)
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
# Generate unified graph
devcompass graph

# Open in browser
devcompass graph --open

# Custom output
devcompass graph --output my-deps.html --open

# JSON export
devcompass graph --format json --output data.json
```

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
npm install -g devcompass@3.1.7
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.1.7
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

**Clustering not showing**
```bash
# Ensure v3.1.7
devcompass --version

# Clear cache
# Hard refresh browser
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

### Planned Features (v3.2.0+):

- [ ] **Comprehensive Package Recommendations** - 200+ package alternatives
- [ ] **Custom Rule Engine** - Define your own detection rules
- [ ] **Configuration Presets** - Team/company-wide settings
- [ ] **Visual Configuration Editor** - Edit JSON files via web UI
- [ ] **Web Dashboard** - Team health monitoring
- [ ] **Monorepo Support** - Multi-project analysis
- [ ] **Historical Tracking** - Track changes over time
- [ ] **Compare Mode** - Before/after fix comparison
- [ ] **Timeline View** - Dependency evolution
- [ ] **Migration Wizard** - Automated upgrade assistant

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

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

*DevCompass v3.1.7 - Scalable, Maintainable, Customizable!* 🧭

**Like Lighthouse for your dependencies** ⚡