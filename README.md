# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, user-configurable GitHub Personal Access Token support, real-time GitHub issue tracking for 502 popular npm packages, unified interactive dependency graph with intelligent clustering (Ecosystem/Health/Depth grouping), dynamic layout switching, real-time filtering, advanced zoom controls, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, and professional dependency exploration - all in a single interactive HTML file.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **visualize dependency graphs with intelligent clustering**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **real-time filtering**, **advanced zoom controls**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🔲 LATEST v3.1.6:** Intelligent Clustering - Organize packages by Ecosystem, Health, or Depth! 🔲  
> **🔑 v3.1.5:** GitHub Personal Access Token Support - Configure your own token to bypass rate limits! 🔑  
> **🎨 v3.1.4:** Unified Interactive Graph System - 40+ files → 1 file with dynamic controls! 🎨

## 🎉 Latest Release: v3.1.6 (2026-04-22)

**Intelligent Dependency Clustering - Organize & Understand Your Dependencies!**

### 🌟 What's New in v3.1.6:

#### **🔲 Smart Clustering System**

Organize your dependencies into meaningful groups for better understanding and management.

**Three Clustering Modes:**

1. **⚛️ Ecosystem Clustering**
   - Groups packages by technology (React, Vue, Angular, Testing, Build Tools, etc.)
   - Automatically detects 12 ecosystems
   - Perfect for understanding your tech stack

2. **🏥 Health Clustering**
   - Groups by health status (Critical Issues, Needs Attention, Healthy)
   - Color-coded health indicators
   - Quick identification of problem areas

3. **📊 Depth Clustering**
   - Groups by dependency levels (Direct → Level 1 → Level 2, etc.)
   - Understand dependency chains
   - Visualize transitive dependencies

**Features:**
- ✅ **Sidebar Organization** - Clean categorized list of all packages
- ✅ **Health Statistics** - See vulnerable/deprecated/outdated/healthy counts per cluster
- ✅ **Click to Highlight** - Click any cluster to highlight related packages (3 seconds)
- ✅ **Switch Modes Instantly** - Three buttons to change grouping
- ✅ **Graph Unchanged** - All nodes always visible, layouts work normally
- ✅ **No Page Reload** - Everything happens in real-time

#### **📊 Cluster Statistics**

Each cluster shows:
- 📦 Package count
- 🔴 Vulnerable count
- 🟣 Deprecated count
- 🟡 Outdated count
- 🟢 Healthy count

#### **🎯 Example Use Cases**

**"Which testing tools do I have?"**
```bash
devcompass graph --open
# Click "Ecosystem" → See "Testing Tools (15 packages)"
```

**"Show me all critical issues"**
```bash
devcompass graph --open
# Click "Health" → See "Critical Issues (8 packages)"
```

**"What are my direct dependencies?"**
```bash
devcompass graph --open
# Click "Depth" → See "Direct Dependencies (42 packages)"
```

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.1.6
```

### 📈 What's Included:

All features from previous versions PLUS clustering:
- ✅ Unified interactive graph (v3.1.4)
- ✅ GitHub token configuration (v3.1.5)
- ✅ 502 tracked packages (v3.1.5)
- ✅ **NEW: Intelligent clustering (v3.1.6)**
- ✅ 4 layouts (Tree/Force/Radial/Conflict)
- ✅ 5 filters (All/Vulnerable/Outdated/Deprecated/Unused)
- ✅ Advanced zoom controls
- ✅ Export (PNG/JSON)

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
- ✅ **3 clustering modes (Ecosystem/Health/Depth) - NEW in v3.1.6!**
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

#### **Clustering (NEW!)**

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
npm install -g devcompass@3.1.6

# Local
npm install --save-dev devcompass@3.1.6

# One-time use
npx devcompass@3.1.6 analyze

# Upgrade
npm install -g devcompass@3.1.6
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token
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

**Data Source:** `data/tracked-repos.json`

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

---

## 🎯 Configuration

Create `devcompass.config.json`:

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

## 🐛 Troubleshooting

### Common Issues:

**"Command not found"**
```bash
npm install -g devcompass@3.1.6
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.1.6
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
# Ensure v3.1.6
devcompass --version

# Clear cache
# Hard refresh browser
```

---

## 🤝 Contributing

Contributions welcome! 

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

---

## 🌟 What's Next?

### Completed Features:

- [x] GitHub token configuration (v3.1.5)
- [x] 502 tracked packages (v3.1.5)
- [x] Unified graph system (v3.1.4)
- [x] Dynamic layout switching (v3.1.4)
- [x] Real-time filtering (v3.1.4)
- [x] Advanced zoom controls (v3.1.4)
- [x] **Intelligent clustering (v3.1.6)** ✅
- [x] **Ecosystem grouping (v3.1.6)** ✅
- [x] **Health clustering (v3.1.6)** ✅
- [x] **Depth analysis (v3.1.6)** ✅

### Planned Features:

- [ ] **Web Dashboard** - Team health monitoring
- [ ] **Monorepo Support** - Multi-project analysis
- [ ] **Historical Tracking** - Track changes over time
- [ ] **Compare Mode** - Before/after fix comparison
- [ ] **Timeline View** - Dependency evolution

Want to contribute? Pick a feature and open an issue! 🚀

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass - Keep your dependencies healthy!* 🧭

**Like Lighthouse for your dependencies** ⚡