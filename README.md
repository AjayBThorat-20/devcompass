# 🧭 DevCompass

**AI-powered dependency health checker with 10 complete CLI commands featuring interactive graph visualization, snapshot management, backup system, unified dashboard with 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), intelligent AI recommendations, multi-provider LLM support, historical tracking with SQLite database, snapshot comparison, timeline visualization, modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **visualize dependency graphs with interactive controls**, **manage snapshots of your project state**, **compare changes over time**, **backup and restore package files**, **get AI-powered recommendations**, **ask questions about your dependencies**, **find package alternatives with AI**, **chat with AI about your project**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **track dependency changes over time with SQLite database**, **visualize evolution with interactive timelines**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🎯 LATEST v3.2.3:** Feature Complete - All 10 commands now working! Graph, Snapshot, Compare, Backup! 🎯  
> **🤖 v3.2.2:** AI-Powered Analysis - Get intelligent recommendations from OpenAI, Anthropic, Google, or FREE local AI! 🤖  
> **📊 v3.2.1:** Historical Tracking System - Track changes, compare snapshots, visualize trends! 📊  
> **🎨 v3.2.0:** Unified Dashboard Architecture - 50% less code, 5 layouts, dark/light themes! 🎨

## 🎉 Latest Release: v3.2.3 (2026-04-30)

**Feature Complete: All 10 Commands Now Working!**

### 🌟 What's New in v3.2.3:

#### **🎯 Complete Command Suite (10/10)**
All missing commands have been implemented - DevCompass now has 100% feature parity!

**New Commands:**

1. **📊 Graph Visualization** - Interactive dependency graphs
   - Multiple layouts (Tree, Force, Radial, Conflict)
   - Real-time filtering (Vulnerable, Outdated, Unused, Deprecated)
   - Dynamic controls (no page reload needed)
   - Export as PNG or JSON
   - Search and zoom capabilities

2. **📸 Snapshot Management** - Complete snapshot lifecycle
   - Save current state manually
   - List all snapshots with filtering
   - View detailed snapshot information
   - Delete old snapshots

3. **🔄 Snapshot Comparison** - Side-by-side diff analysis
   - Compare any two snapshots
   - See added/removed/updated packages
   - Track health score changes
   - Export comparison reports

4. **💾 Backup Management** - Manual backup operations
   - List all backups with metadata
   - Restore from specific backup
   - Show backup details
   - Clean old backups

**Graph Commands:**
```bash
# Generate interactive dependency graph
devcompass graph                            # Default tree layout
devcompass graph --layout force             # Force-directed layout
devcompass graph --filter vulnerable        # Show only vulnerable packages
devcompass graph --open                     # Open in browser
devcompass graph --output dashboard.html    # Custom filename
```

**Snapshot Commands:**
```bash
# Manage snapshots
devcompass snapshot save                    # Save current state
devcompass snapshot list                    # List all snapshots
devcompass snapshot view 123                # View details
devcompass snapshot delete 123              # Delete snapshot
```

**Compare Commands:**
```bash
# Compare snapshots
devcompass compare 51 52                    # Basic comparison
devcompass compare 51 52 --verbose          # Show all packages
devcompass compare 51 52 -o report.md       # Save to file
```

**Backup Commands:**
```bash
# Manage backups
devcompass backup list                      # List all backups
devcompass backup restore --name backup-xxx # Restore from backup
devcompass backup info --name backup-xxx    # Show details
devcompass backup clean                     # Keep latest 5
```

#### **📊 Interactive Graph Features**
- 🎨 Switch between 4 layouts without page reload
- 🔍 Filter packages in real-time
- 🔢 Depth slider (1-10 levels)
- 🔎 Search for specific packages
- 🖱️ Zoom and pan controls
- 💾 Export as PNG or JSON
- 📊 Color-coded nodes by health status
- 🔗 Visual dependency relationships

#### **📸 Snapshot Features**
- 💾 Save project state at any time
- 📋 List all snapshots with metadata
- 🔍 View complete snapshot details
- 🗑️ Delete old snapshots with confirmation
- 📊 Track health scores over time
- 🏷️ Filter by project name

#### **🔄 Comparison Features**
- 📊 Side-by-side diff of snapshots
- ➕ Show added packages
- ➖ Show removed packages
- 🔄 Show updated packages with version changes
- 📈 Track health score changes
- 📝 Export reports in markdown

#### **💾 Backup Features**
- 📦 List all available backups
- 🔄 Restore from specific backup
- 📋 Show detailed backup info
- 🧹 Clean old backups (keep N latest)
- 🛡️ Confirmation prompts for safety
- 📊 Track backup metadata

## ✨ All Features

### **Command Suite (10/10 Complete) ✅**
- 📊 **analyze** - Full dependency analysis with AI support
- 🔧 **fix** - Auto-fix issues with backup
- 📊 **graph** (v3.2.3) - Interactive dependency visualization
- 📸 **snapshot** (v3.2.3) - Snapshot management
- 🔄 **compare** (v3.2.3) - Snapshot comparison
- 💾 **backup** (v3.2.3) - Backup management
- 📈 **timeline** - Health trend visualization
- 🤖 **ai** - AI-powered insights
- 🔑 **llm** - AI provider management
- ⚙️ **config** - DevCompass configuration

### **AI & Intelligence (v3.2.2)**
- 🤖 **AI-Powered Analysis** - Multi-provider LLM integration
- 💬 **Interactive AI Chat** - Ask questions, get answers
- 🔄 **Package Alternatives** - AI-suggested replacements
- 🔒 **Encrypted Tokens** - AES-256-GCM security
- 📊 **Cost Tracking** - Monitor AI usage

### **Tracking & History (v3.2.1)**
- 📊 **Historical Tracking** - SQLite database, auto-save snapshots
- 🔍 **Snapshot Comparison** - Side-by-side diff analysis
- 📈 **Timeline Visualization** - Interactive D3 charts
- 🗂️ **Flexible Dates** - 9 date formats supported

### **Visualization (v3.2.0 + v3.2.3)**
- 🎨 **Unified Dashboard** - 5 layouts, modular architecture
- 📊 **Analytics Layout** - Statistics dashboard
- 🌙 **Theme Support** - Dark/light mode toggle
- ⚡ **Performance** - 4-6× faster rendering
- 🔲 **Intelligent Clustering** - Ecosystem/Health/Depth grouping

### **Configuration & Security**
- 🔧 **Dynamic Data Configuration** - JSON-based scalable config
- 🔑 **GitHub Token Config** - User tokens, no rate limits
- 📦 **502 Tracked Packages** - Comprehensive monitoring

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.3

# Local
npm install --save-dev devcompass@3.2.3

# One-time use
npx devcompass@3.2.3 analyze

# Upgrade from any version
npm install -g devcompass@3.2.3
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (recommended)
devcompass config --github-token <your-token>
devcompass config --show

# Analyze project (auto-saves snapshot!)
devcompass analyze
devcompass analyze --ai  # 🤖 With AI recommendations!
devcompass analyze --no-history  # Skip snapshot

# Generate interactive graph (NEW in v3.2.3!)
devcompass graph --open
devcompass graph --layout force --filter vulnerable

# Auto-fix issues
devcompass fix
devcompass fix --batch
devcompass fix --dry-run
```

### Graph Commands (NEW in v3.2.3)

```bash
# Generate interactive dependency graph
devcompass graph                            # Default tree layout
devcompass graph --layout force             # Force-directed layout
devcompass graph --layout radial            # Radial tree layout
devcompass graph --layout conflict          # Highlight conflicts

# Apply filters
devcompass graph --filter vulnerable        # Show only vulnerable
devcompass graph --filter outdated          # Show only outdated
devcompass graph --filter unused            # Show only unused

# Customize output
devcompass graph --output my-graph.html     # Custom filename
devcompass graph --width 1600 --height 900  # Custom dimensions
devcompass graph --depth 5                  # Limit depth to 5 levels
devcompass graph --open                     # Open in browser

# Export formats
devcompass graph --format json              # Export as JSON
devcompass graph --format html              # Export as HTML (default)
```

### Snapshot Commands (NEW in v3.2.3)

```bash
# Save current state
devcompass snapshot save

# List all snapshots
devcompass snapshot list                    # Last 20 snapshots
devcompass snapshot list --limit 50         # Last 50 snapshots
devcompass snapshot list --project myapp    # Filter by project

# View snapshot details
devcompass snapshot view 123                # Basic info
devcompass snapshot view 123 --verbose      # Detailed info

# Delete old snapshots
devcompass snapshot delete 123              # With confirmation
devcompass snapshot delete 123 --yes        # Skip confirmation
```

### Compare Commands (NEW in v3.2.3)

```bash
# Compare two snapshots
devcompass compare 51 52                    # Basic comparison
devcompass compare 51 52 --verbose          # Show all packages
devcompass compare 51 52 -o report.md       # Save to file
```

### Backup Commands (NEW in v3.2.3)

```bash
# List all backups
devcompass backup list

# Show backup details
devcompass backup info --name backup-2026-04-26T19-50-37-541Z

# Restore from backup
devcompass backup restore --name backup-2026-04-26T19-50-37-541Z
devcompass backup restore --name backup-xxx --force  # Skip confirmation

# Clean old backups
devcompass backup clean                     # Keep latest 5
devcompass backup clean --keep 3            # Keep latest 3
```

### AI Commands (v3.2.2)

```bash
# Setup AI provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# AI Analysis
devcompass analyze --ai
devcompass ai ask "Why is my health score low?"
devcompass ai alternatives moment
devcompass ai chat
devcompass llm stats
```

### History Commands (v3.2.1)

```bash
# List snapshots (also available via 'snapshot list')
devcompass history list
devcompass history list --month 04-2026

# Compare snapshots (also available via 'compare')
devcompass compare 5 8

# Timeline visualization
devcompass timeline --open
devcompass timeline --days 60
```

---

## 📊 Interactive Graph Visualization (v3.2.3)

### Features

**Multiple Layouts:**
- 🌳 **Tree** - Hierarchical tree structure
- 🔵 **Force** - Force-directed physics simulation
- 🎯 **Radial** - Radial tree from center
- ⚠️ **Conflict** - Highlight dependency conflicts

**Real-Time Filtering:**
- 🔴 **Vulnerable** - Show only packages with vulnerabilities
- 📦 **Outdated** - Show only outdated packages
- 🗑️ **Unused** - Show only unused dependencies
- ⚠️ **Deprecated** - Show only deprecated packages

**Interactive Controls:**
- 🎨 Switch layouts without page reload
- 🔍 Filter packages in real-time
- 🔢 Depth slider (1-10 levels)
- 🔎 Search for packages
- 🖱️ Zoom and pan
- 💾 Export as PNG or JSON

### Example

```bash
# Generate graph and open in browser
devcompass graph --open

# Force-directed layout showing only vulnerabilities
devcompass graph --layout force --filter vulnerable --open

# Custom output with depth limit
devcompass graph --output deps.html --depth 3 --open
```

### Output

```
📊 DevCompass - Dependency Graph
✔ Generated graph with 86 nodes (4 with issues)
✔ Graph exported: dependency-graph.html

📈 GRAPH SUMMARY
  Format:        HTML
  Mode:          ✓ Unified Interactive
  Layouts:       Tree, Force, Radial, Conflict (switchable)
  Filters:       All, Vulnerable, Outdated, Unused, Deprecated (switchable)
  Total Nodes:   86
  Total Links:   163
  File Size:     144.68 KB
  Enriched:      ✓ Analysis data applied
```

---

## 📸 Snapshot Management (v3.2.3)

### Features

**Save Snapshots:**
- 💾 Manual snapshot creation
- 📊 Captures complete project state
- 🏷️ Includes health scores and metadata
- ⏰ Timestamped automatically

**List Snapshots:**
- 📋 Table view of all snapshots
- 🔍 Filter by project name
- 📊 Shows health scores and dependency counts
- 📅 Sorted by date

**View Details:**
- 📊 Complete snapshot information
- 🔴 Vulnerability status
- 📦 Outdated package list
- 🗑️ Unused dependencies
- 💯 Health metrics

### Example

```bash
# Save current state
$ devcompass snapshot save
📸 Saving Snapshot...
✅ Snapshot saved successfully!

📸 Snapshot Info:
   ID: 71
   Packages: 6
   Dependencies: 163
   Duration: 12ms

# List all snapshots
$ devcompass snapshot list

📋 Dependency Snapshots

ID    Project          Version     Health    Deps    Date
──────────────────────────────────────────────────────────────
71    test-project     1.0.0       0.5       6       2026-04-30 1:45:23 PM
70    test-project     1.0.0       0.5       6       2026-04-30 7:37:27 AM
69    devcompass       3.2.3       7.5       7       2026-04-30 6:02:45 AM

Total: 20 snapshot(s)

# View details
$ devcompass snapshot view 71

📸 Snapshot #71

Project Information:
  Name: test-project
  Version: 1.0.0
  Date: 2026-04-30 1:45:23 PM

Health Metrics:
  Health Score: 0.5/10
  Total Dependencies: 6

Package Summary:
  🔴 Vulnerable: 2
  📦 Outdated: 6
  🗑️  Unused: 2
```

---

## 🔄 Snapshot Comparison (v3.2.3)

### Features

**Compare Snapshots:**
- 📊 Side-by-side diff
- ➕ Show added packages
- ➖ Show removed packages
- 🔄 Show version changes
- 📈 Track health score changes
- 📝 Export reports

### Example

```bash
# Compare two snapshots
$ devcompass compare 69 71

✔ Comparison complete (0ms)

📊 Snapshot Comparison

Snapshots:
  #69 → #71
  2026-04-30 06:02:45 → 2026-04-30 13:45:23

Changes:
  Total Packages: 7 → 6 (-1)
  Health Score: 7.50 → 0.50 (-7.00) ❌

  Added: 0
  Removed: 1
  Updated: 3
  Unchanged: 3

🗑️ Removed Packages (1):
  - better-sqlite3 (11.14.0)

🔄 Updated Packages (3):
  ⟳ axios
     Version: 0.27.2 → 0.21.1
     Health: 9.0 → 6.2 (-2.8)
     🔴 New vulnerabilities detected

  ⟳ chalk
     Version: 5.4.2 → 4.1.2
     Health: 10.0 → 8.5 (-1.5)

  ⟳ lodash
     Version: 4.17.21 → 4.17.20
     Health: 9.0 → 7.0 (-2.0)
```

---

## 💾 Backup Management (v3.2.3)

### Features

**Backup Operations:**
- 📦 List all backups with metadata
- 🔄 Restore from specific backup
- 📋 Show detailed backup info
- 🧹 Clean old backups
- 🛡️ Safety confirmations
- 📊 Track backup reasons

### Example

```bash
# List all backups
$ devcompass backup list

💾 DevCompass Backups

Found 3 backup(s):

1. backup-2026-04-26T19-50-37-541Z
   Created: Apr 27, 2026 01:20:37 (3 days ago)
   Files: package.json, package-lock.json
   Reason: Before automated fixes
   Fixes pending: 3
   Health score: 0.5/10

2. backup-2026-04-26T18-12-33-397Z
   Created: Apr 26, 2026 23:42:33 (3 days ago)
   Files: package.json, package-lock.json
   Reason: Before automated fixes
   Fixes pending: 3
   Health score: 0.5/10

💡 COMMANDS:
   Restore: devcompass backup restore --name backup-2026-04-26T19-50-37-541Z
   Info: devcompass backup info --name backup-2026-04-26T19-50-37-541Z
   Clean: devcompass backup clean

# Restore from backup
$ devcompass backup restore --name backup-2026-04-26T19-50-37-541Z

🔄 DevCompass Backup Restore

Backup details:
  Name: backup-2026-04-26T19-50-37-541Z
  Created: Apr 27, 2026 01:20:37
  Files: package.json, package-lock.json

⚠️  WARNING: This will overwrite your current package.json and package-lock.json

Continue with restore? (y/N): y

Step 1: Creating backup of current state...
✓ Current state backed up: backup-2026-04-30T13-50-15-123Z

Step 2: Restoring from backup...
✓ Backup restored successfully!

Files restored:
  ✓ package.json
  ✓ package-lock.json

⚠️  IMPORTANT: Run npm install to sync node_modules
```

---

## 🤖 AI-Powered Analysis Guide (v3.2.2)

### Quick Start

**1. Install Ollama (FREE local AI):**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.2

# Add to DevCompass
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Test it
devcompass llm test local

# Use it!
devcompass analyze --ai
```

**2. Or use OpenAI:**
```bash
# Get API key from: https://platform.openai.com/api-keys

# Add provider
devcompass llm add --provider openai --token sk-your-key --model gpt-4o-mini

# Test connection
devcompass llm test openai

# Use it!
devcompass analyze --ai
```

### Example AI Interactions

**Get Analysis:**
```bash
$ devcompass analyze --ai

🤖 AI Recommendations

🔴 CRITICAL (Do Now):
- Security Vulnerabilities (24 total)
  → Run: npm audit fix
  → Why: 3 high-severity issues expose your app to attacks

🟡 HIGH PRIORITY (This Week):
- Update axios (0.21.1 → 1.15.2)
  → Why: Contains known CVEs
  → Breaking changes: Response format changed
```

**Ask Questions:**
```bash
$ devcompass ai ask "Should I update axios from 0.21.1 to 1.15.2?"

🤖 Yes, you should update axios:

Security: Version 0.21.1 has critical vulnerabilities (CVE-2023-xxxx)
Breaking Changes: Response.data format changed, error handling updated
Migration: Update interceptors, test error handling
Command: npm install axios@latest

Test thoroughly before deploying!
```

**Find Alternatives:**
```bash
$ devcompass ai alternatives moment

🔍 Finding alternatives for "moment"

🤖 Top 3 Alternatives:

1. date-fns (~2KB vs 67KB)
   - Tree-shakeable, modern API
   - Migration: Easy (similar methods)
   
2. dayjs (~2KB)
   - moment.js compatible API
   - Migration: Drop-in replacement
   
3. Luxon (~15KB)
   - Better timezone support
   - Migration: Medium (different API)

Recommendation: Use date-fns for best bundle size
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
# Or use the new snapshot command:
devcompass snapshot list
```

**3. Compare Changes**
```bash
devcompass compare 38 40
```

**4. Visualize Trends**
```bash
devcompass timeline --open
```

---

## 🐛 Troubleshooting

### Graph-Related Issues

**"No analysis cache found"**
```bash
# Run analyze first to generate cache
devcompass analyze

# Then generate graph
devcompass graph --open
```

**"Graph not opening in browser"**
```bash
# Check if HTML file was created
ls dependency-graph.html

# Manually open it
firefox dependency-graph.html
# or
chrome dependency-graph.html
```

### Snapshot-Related Issues

**"Snapshot list empty"**
```bash
# Run analyze to create snapshots
devcompass analyze

# Check database exists
ls ~/.devcompass/history.db

# List snapshots
devcompass snapshot list
```

**"Snapshot not found"**
```bash
# List available snapshots first
devcompass snapshot list

# Use valid ID from list
devcompass snapshot view 70
```

### Backup-Related Issues

**"Backup list empty"**
```bash
# Backups are created by fix command
devcompass fix --dry-run

# Check backup directory
ls -la .devcompass-backups/
```

**"Cannot restore backup"**
```bash
# List available backups
devcompass backup list

# Use exact backup name
devcompass backup restore --name backup-2026-04-26T19-50-37-541Z
```

### AI-Related Issues

**"No AI provider configured"**
```bash
# Add a provider first
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Or use OpenAI
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
```

**"Ollama connection failed"**
```bash
# Check Ollama is running
ps aux | grep ollama

# Restart Ollama
ollama serve &

# Test connection
devcompass llm test local
```

### Common Issues

**"Command not found"**
```bash
npm install -g devcompass@3.2.3
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.3
```

---

## 🤝 Contributing

Contributions welcome! 

### Ways to Contribute:

1. **Add Package Alternatives**
   - Edit `data/quality-alternatives.json`
   - Submit PR with new deprecated package alternatives

2. **Improve AI Prompts**
   - Edit `src/ai/prompt-templates.js`
   - Make recommendations more helpful

3. **Add AI Providers**
   - Create new provider in `src/ai/providers/`
   - Follow existing provider patterns

4. **Improve Graph Layouts**
   - Edit `src/dashboard/scripts/layouts.js`
   - Add new visualization styles

5. **Code Contributions**
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
- [x] **Graph visualization** (v3.2.3) ✅
- [x] **Snapshot management** (v3.2.3) ✅
- [x] **Snapshot comparison** (v3.2.3) ✅
- [x] **Backup management** (v3.2.3) ✅
- [x] **AI-powered analysis** (v3.2.2) ✅
- [x] **Multi-provider LLM support** (v3.2.2) ✅
- [x] **Interactive AI chat** (v3.2.2) ✅
- [x] **Package alternatives with AI** (v3.2.2) ✅
- [x] **Historical tracking** (v3.2.1) ✅
- [x] **Timeline visualization** (v3.2.1) ✅
- [x] **Unified dashboard** (v3.2.0) ✅
- [x] **Intelligent clustering** (v3.1.6) ✅

### Planned Features:
- [ ] **Cloud Snapshot Sync** - Sync snapshots across team
- [ ] **Graph Export Formats** - PDF, SVG export
- [ ] **Web Dashboard** - Team health monitoring with AI insights
- [ ] **Monorepo Support** - Multi-project AI analysis
- [ ] **Automated Backup Policies** - Schedule automatic backups
- [ ] **Snapshot Diff Visualization** - Visual diff tool

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

### v3.2.3 (2026-04-30) - Feature Complete
- 🎯 **All 10 commands now working** (was 6/10)
- 📊 **Graph visualization** - Interactive dependency graphs with 4 layouts
- 📸 **Snapshot management** - Save/list/view/delete snapshots
- 🔄 **Snapshot comparison** - Side-by-side diff with health tracking
- 💾 **Backup management** - Manual backup operations
- ⚡ Instant operations (<1ms for most commands)
- ✅ Zero breaking changes (100% backward compatible)

### v3.2.2 (2026-04-27) - AI-Powered Analysis
- 🤖 Multi-provider AI integration (OpenAI, Anthropic, Google, Ollama)
- 💬 Interactive AI chat with conversation history
- 🔄 AI-powered package alternative suggestions
- 🔒 AES-256-GCM encrypted token storage
- 📊 Cost tracking and usage statistics
- ⚡ Real-time streaming responses
- 🆓 FREE local AI option with Ollama
- 📝 Context-aware recommendations
- ✅ Zero breaking changes (100% backward compatible)

### v3.2.1 (2026-04-26) - Historical Tracking System
- 📊 SQLite database for snapshot storage
- 🔍 Snapshot comparison with side-by-side diff
- 📈 Timeline visualization with D3 charts
- 🗂️ 9 flexible date formats
- ⚡ 6-83× performance improvements
- 🐛 Bug fixes for typosquatting and security

### v3.2.0 (2026-04-25) - Unified Dashboard
- 🎨 Unified modular architecture (50% code reduction)
- 📊 Analytics layout
- 🌙 Dark/light themes
- ⚡ 4-6× performance improvements

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass v3.2.3 - Complete Dependency Intelligence Platform!* 🧭✨

**Like Lighthouse for your dependencies, now with complete tooling** ⚡