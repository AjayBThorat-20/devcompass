# 🧭 DevCompass

**Dependency health checker with ecosystem intelligence, user-configurable GitHub Personal Access Token support, real-time GitHub issue tracking for 502 popular npm packages, unified interactive dependency graph with dynamic layout switching, real-time filtering, advanced zoom controls, supply chain security with auto-fix, license conflict resolution with auto-fix, package quality auto-fix, batch fix modes with granular control, backup & rollback, and professional dependency exploration - all in a single interactive HTML file.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **visualize dependency graphs with unified interactive interface**, **instant layout switching**, **real-time filtering**, **advanced zoom controls**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🔑 LATEST v3.1.5:** GitHub Personal Access Token Support - Configure your own token to bypass rate limits! 🔑  
> **🎨 PREVIOUS v3.1.4:** Unified Interactive Graph System - 40+ files → 1 file with dynamic controls! 🎨  
> **✨ v3.1.3:** Cleanup & Code Improvements - Removed unused dependencies! 🧹

## 🎉 Latest Release: v3.1.5 (2026-04-21)

**GitHub Personal Access Token Support - Avoid Rate Limits!**

### 🌟 What's New in v3.1.5:

#### **🔑 User-Configurable GitHub Token**

No more hardcoded tokens or rate limit errors! Configure your own GitHub Personal Access Token to unlock full monitoring capabilities.

**Benefits:**
- ✅ **Avoid Rate Limits:** 60 → 5,000 requests/hour
- ✅ **Secure:** Token stored locally in `~/.devcompass/github-token`
- ✅ **User-Specific:** Each developer uses their own token
- ✅ **Optional:** Works without token (with rate limits)
- ✅ **Privacy:** Never committed to git or shared

**Quick Setup:**

```bash
# 1. Get a GitHub token
# Visit: https://github.com/settings/tokens/new
# Scope: public_repo (read access only)

# 2. Configure in DevCompass
devcompass config --github-token ghp_YOUR_TOKEN_HERE

# 3. Verify
devcompass config --show
# ✓ GitHub token configured: ghp_xxx***xxx
```

#### **📦 502 Tracked Repositories**

Expanded from hardcoded 60 packages to **502 popular npm packages** tracked via external JSON file:

- Web Frameworks (React, Vue, Angular, Svelte, etc.)
- Meta Frameworks (Next.js, Nuxt, Remix, etc.)
- Build Tools (Webpack, Vite, Rollup, esbuild, etc.)
- Testing (Jest, Vitest, Cypress, Playwright, etc.)
- And 29 more categories!

**File:** `data/tracked-repos.json`

#### **🛡️ Enhanced Security**

**Token Storage:**
- Location: `~/.devcompass/github-token`
- Permissions: `600` (owner read/write only)
- Format: Plain text token string
- Gitignored: `.devcompass/` directory

**Token Validation:**
- Must start with `ghp_` or `github_pat_`
- Automatic validation on save
- Clear error messages

**Masked Display:**
```bash
devcompass config --show
# Shows: ghp_xxx***xxx (first 7 + last 4 characters)
```

#### **📊 Config Command**

New `config` command for token management:

```bash
# Set token
devcompass config --github-token <token>

# Show current token (masked)
devcompass config --show

# Remove token
devcompass config --remove-github-token

# Help
devcompass config --help
```

#### **🚀 Improved GitHub Tracking**

**With Token:**
- 5,000 requests/hour (vs 60 without)
- Tracks all 502 packages without rate limits
- GitHub check completes in ~2 seconds
- No warnings or errors

**Without Token:**
- Falls back to unauthenticated mode
- Shows setup instructions
- Links to token creation page

### 🚀 Upgrade Now:

```bash
npm install -g devcompass@3.1.5
```

### 📈 Migration from v3.1.4:

**No breaking changes!** All existing commands work identically.

**Optional - Configure GitHub Token:**

```bash
# Step 1: Get token from GitHub
# https://github.com/settings/tokens/new
# Select: public_repo scope

# Step 2: Configure in DevCompass
devcompass config --github-token ghp_YOUR_TOKEN_HERE

# Step 3: Enjoy unlimited GitHub API access!
devcompass analyze
# ✅ No rate limits
# ✅ 502 packages tracked
# ✅ GitHub check in ~2s
```

---

## 🔑 GitHub Token Configuration (v3.1.5)

DevCompass now supports user-configurable GitHub Personal Access Tokens to avoid API rate limiting.

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

### Setup Guide

#### 1. Create GitHub Token

Visit: https://github.com/settings/tokens/new

**Token Settings:**
- **Token name:** `DevCompass CLI`
- **Expiration:** `90 days` (or your preference)
- **Scopes:** ☑️ `public_repo` **ONLY** (read access to public repos)

**Important:** Do NOT select `repo` (full private access) - only `public_repo` is needed!

#### 2. Configure Token

```bash
# Set your token
devcompass config --github-token ghp_YOUR_TOKEN_HERE

# Output:
# ✓ GitHub token saved successfully!
# Token stored in: /home/user/.devcompass/github-token
# 🎉 You can now use DevCompass without rate limits!
```

#### 3. Verify Configuration

```bash
# Show masked token
devcompass config --show

# Output:
# ✓ GitHub token configured: ghp_xxx***xxx
```

#### 4. Test It

```bash
# Run analysis
devcompass analyze

# Should see:
# ⚡ GitHub check completed in 2.08s (parallel processing)
# ✅ No unusual activity detected (502+ packages monitored)!
# (No rate limit warnings!)
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

### Security & Privacy

**Local Storage:**
- Token stored in: `~/.devcompass/github-token`
- File permissions: `600` (owner read/write only)
- Never committed to git (`.devcompass/` in `.gitignore`)

**Token Safety:**
- Only needs `public_repo` scope (read-only)
- Cannot access private repositories
- Cannot modify anything
- Can be revoked anytime on GitHub

**Privacy:**
- Token stored locally on your machine
- Not shared or transmitted anywhere
- Each developer uses their own token
- No central token storage

### Troubleshooting

**Token not working?**
```bash
# Verify token is set
devcompass config --show

# Check file permissions
ls -la ~/.devcompass/github-token
# Should show: -rw------- (600)

# Verify token on GitHub
# https://github.com/settings/tokens
```

**Rate limit errors?**
```bash
# If you see rate limit warnings:
# 1. Verify token is configured
devcompass config --show

# 2. Check token hasn't expired
# Visit: https://github.com/settings/tokens

# 3. Generate new token if needed
# https://github.com/settings/tokens/new
```

**Want to remove token?**
```bash
# Remove token
devcompass config --remove-github-token

# DevCompass will work with rate limits (60/hour)
```

---

## 📦 Tracked Repositories (v3.1.5)

DevCompass now tracks **502 popular npm packages** across 33 categories!

### Coverage by Category:

- **Web Frameworks (25):** React, Vue, Angular, Svelte, Solid, Preact, etc.
- **Meta Frameworks (15):** Next.js, Nuxt, Remix, Astro, SvelteKit, etc.
- **Mobile (10):** React Native, Expo, Ionic, NativeScript, etc.
- **Backend (20):** Express, Fastify, Koa, NestJS, Hono, etc.
- **Build Tools (25):** Webpack, Vite, Rollup, esbuild, Turbopack, etc.
- **Testing (25):** Jest, Vitest, Cypress, Playwright, Testing Library, etc.
- **Linters & Formatters (15):** ESLint, Prettier, Biome, etc.
- **TypeScript Tools (15):** tsc, ts-node, tsup, tsx, etc.
- **State Management (20):** Redux, Zustand, Jotai, MobX, Pinia, etc.
- **HTTP Clients (20):** Axios, Fetch, Got, Ky, Superagent, etc.
- **Utilities (50):** Lodash, Ramda, date-fns, Zod, Yup, etc.
- **CSS & Styling (25):** Tailwind, Styled Components, Emotion, etc.
- **Documentation (15):** Storybook, Docusaurus, VitePress, etc.
- **Database & ORM (20):** Prisma, Drizzle, TypeORM, Sequelize, etc.
- **GraphQL (15):** Apollo, Relay, urql, GraphQL Yoga, etc.
- **Authentication (15):** Passport, NextAuth, Auth0, Clerk, etc.
- **And 17 more categories!**

**Total: 502 packages monitored for GitHub activity!**

### Data Source

All tracked repositories are defined in:
```
data/tracked-repos.json
```

Format:
```json
{
  "repositories": {
    "react": "facebook/react",
    "vue": "vuejs/core",
    "angular": "angular/angular",
    ...
  },
  "metadata": {
    "total": 502,
    "categories": 33,
    "lastUpdated": "2026-04-21"
  }
}
```

---

## 🎨 Unified Graph Visualization (v3.1.4)

DevCompass features a **revolutionary unified interactive graph** - all layouts, filters, and controls in one beautiful interface!

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

```
Statistics
───────────────
Total:       142
Vulnerable:   14
Deprecated:    0
Outdated:      4
Unused:        5
Healthy:     119
```

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

---

## ✨ All Features at a Glance

- 🔑 **GitHub Token Configuration** (v3.1.5) - User-configurable tokens, no rate limits
- 📦 **502 Tracked Packages** (v3.1.5) - Comprehensive GitHub monitoring
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
npm install -g devcompass@3.1.5
```

**Local installation:**

```bash
npm install --save-dev devcompass@3.1.5
```

**One-time use (no installation):**

```bash
npx devcompass@3.1.5 analyze
```

**Upgrade from previous versions:**

```bash
npm install -g devcompass@3.1.5
```

**No additional dependencies needed!** All features work out of the box. 🎉

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (NEW in v3.1.5!)
devcompass config --github-token <your-token>
devcompass config --show
devcompass config --help

# Analyze your project
devcompass analyze

# Generate unified interactive graph (v3.1.4)
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
npm install -g devcompass@3.1.5
```

**Issue:** Old version installed
```bash
# Solution: Update to latest
npm update -g devcompass
```

**Issue:** GitHub rate limit errors
```bash
# Solution: Configure your GitHub token
devcompass config --github-token <your-token>

# Get token: https://github.com/settings/tokens/new
# Scope: public_repo only
```

**Issue:** Token not working
```bash
# Verify token is set
devcompass config --show

# Check file permissions
ls -la ~/.devcompass/github-token

# Should show: -rw------- (600)
```

**Issue:** Graph controls not working
```bash
# Solution: Ensure you're on v3.1.5
devcompass --version  # Should show 3.1.5

# Clear browser cache
# Hard refresh (Ctrl+F5 or Cmd+Shift+R)
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
- [x] ~~User-configurable GitHub tokens~~ ✅ **Added in v3.1.5!**
- [x] ~~Expand to 502 tracked packages~~ ✅ **Added in v3.1.5!**
- [x] ~~GitHub API rate limit bypass~~ ✅ **Added in v3.1.5!**
- [x] ~~Secure token storage~~ ✅ **Added in v3.1.5!**
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