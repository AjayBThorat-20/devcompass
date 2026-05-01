# 🧭 DevCompass

**AI-powered dependency health checker with 10 complete CLI commands featuring CVE vulnerability detection, interactive graph visualization, snapshot management, backup system, unified dashboard with 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), intelligent AI recommendations, multi-provider LLM support, historical tracking with SQLite database, snapshot comparison, timeline visualization, modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect CVE vulnerabilities with OSV + NVD**, **visualize dependency graphs with interactive controls**, **manage snapshots of your project state**, **compare changes over time**, **backup and restore package files**, **get AI-powered recommendations**, **ask questions about your dependencies**, **find package alternatives with AI**, **chat with AI about your project**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **track dependency changes over time with SQLite database**, **visualize evolution with interactive timelines**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🛡️ LATEST v3.2.4:** CVE Vulnerability Detection - Real-time security scanning with OSV + NVD! 🛡️  
> **🎯 v3.2.3:** Feature Complete - All 10 commands now working! Graph, Snapshot, Compare, Backup! 🎯  
> **🤖 v3.2.2:** AI-Powered Analysis - Get intelligent recommendations from OpenAI, Anthropic, Google, or FREE local AI! 🤖

## 🎉 Latest Release: v3.2.4 (2026-05-01)

**🛡️ CVE Vulnerability Detection - Industry-Standard Security Scanning!**

### 🌟 What's New in v3.2.4:

#### **🛡️ Real-Time CVE Detection**
DevCompass now integrates with industry-standard vulnerability databases to detect security issues in real-time!

**Key Features:**

1. **🔍 OSV API Integration** (Primary Source - No Key Required)
   - Open Source Vulnerabilities database
   - npm-focused vulnerability detection
   - Fast, free, comprehensive coverage
   - GitHub Security Advisories integration

2. **🏛️ NVD API Integration** (Secondary Enrichment - Optional Key)
   - National Vulnerability Database (NIST)
   - Official CVE data with CVSS scores
   - Detailed vulnerability metadata
   - Enhanced severity classification

3. **⚡ Intelligent Caching System**
   - 24-hour TTL with automatic expiry
   - SQLite-based local storage
   - Instant subsequent scans (<100ms)
   - Cache version management
   - Batch queries with concurrency control

4. **🔒 Encrypted API Key Storage**
   - AES-256-GCM encryption
   - Machine-specific encryption keys
   - Local-only storage (never transmitted)
   - Secure token management

**CVE Commands:**
```bash
# Configure NVD API key (optional but recommended)
devcompass cve key --set --api-key <your-key>
devcompass cve test                         # Test connection
devcompass cve key                          # Show status

# Cache management
devcompass cve cache --stats                # View statistics
devcompass cve cache --clear                # Clear cache

# Analysis includes CVE detection automatically
devcompass analyze                          # CVE scan included!
```

**Getting NVD API Key:**
1. Visit: https://nvd.nist.gov/developers/request-an-api-key
2. Enter your email and organization name
3. Agree to Terms of Use
4. Check email for activation link (valid 7 days)
5. Activate and copy your API key
6. Run: `devcompass cve key --set --api-key <key>`

#### **🎯 CVE Detection Features**
- 🔍 **Automatic Scanning** - Every `analyze` run checks for CVEs
- 🎨 **Severity Classification** - CRITICAL/HIGH/MEDIUM/LOW ratings
- ⚡ **Fast Performance** - 2-5s first run, <100ms cached
- 📊 **Summary Statistics** - Count by severity level
- 🔗 **Reference Links** - Direct links to CVE details
- 💾 **Smart Caching** - 24-hour local cache with auto-expiry
- 🔒 **Privacy First** - API keys encrypted, never shared
- 🆓 **Free Option** - Works without NVD key (OSV only)

#### **📊 Enhanced Security Output**
```bash
🛡️  CVE VULNERABILITY DATABASE (4)

  🟡 MEDIUM: 12

  Affected Packages:

  axios@0.21.1
    ● GHSA-3p68-rc4w-qgx5 - MEDIUM
      Axios has a NO_PROXY Hostname Normalization Bypass that Leads to SSRF
    ● GHSA-43fc-jf86-j433 - MEDIUM
      Axios Denial of Service vulnerability

  express@4.17.1
    ● GHSA-qw6h-vgh9-j6wx - MEDIUM
      Express.js Open Redirect in malformed URLs

  💡 Sources: OSV (Open Source Vulnerabilities) + NVD (National Vulnerability Database)
  Run npm audit fix to fix known vulnerabilities
```

## ✨ All Features

### **Command Suite (10/10 Complete) ✅**
- 📊 **analyze** - Full dependency analysis with AI + CVE detection
- 🔧 **fix** - Auto-fix issues with backup
- 📊 **graph** - Interactive dependency visualization
- 📸 **snapshot** - Snapshot management
- 🔄 **compare** - Snapshot comparison
- 💾 **backup** - Backup management
- 📈 **timeline** - Health trend visualization
- 🤖 **ai** - AI-powered insights
- 🔑 **llm** - AI provider management
- 🛡️ **cve** (v3.2.4) - CVE vulnerability management
- ⚙️ **config** - DevCompass configuration

### **Security & Vulnerability Detection (v3.2.4)**
- 🛡️ **CVE Detection** - OSV + NVD integration
- 🔍 **Real-Time Scanning** - Check every package
- 🎨 **Severity Classification** - CRITICAL/HIGH/MEDIUM/LOW
- ⚡ **Smart Caching** - 24-hour TTL for performance
- 🔒 **Encrypted Storage** - AES-256-GCM for API keys
- 📊 **Detailed Reports** - CVE IDs, summaries, references
- 💾 **Batch Processing** - Concurrent vulnerability checks
- 🆓 **Free Tier** - Works without API keys

### **AI & Intelligence (v3.2.2)**
- 🤖 **AI-Powered Analysis** - Multi-provider LLM integration
- 💬 **Interactive AI Chat** - Ask questions, get answers
- 🔄 **Package Alternatives** - AI-suggested replacements
- 🔒 **Encrypted Tokens** - AES-256-GCM security
- 📊 **Cost Tracking** - Monitor AI usage

### **Tracking & History (v3.2.1 + v3.2.3)**
- 📊 **Historical Tracking** - SQLite database, auto-save snapshots
- 🔍 **Snapshot Comparison** - Side-by-side diff analysis
- 📈 **Timeline Visualization** - Interactive D3 charts
- 💾 **Backup Management** - Manual backup/restore operations
- 🗂️ **Flexible Dates** - 9 date formats supported

### **Visualization (v3.2.0 + v3.2.3)**
- 🎨 **Unified Dashboard** - 5 layouts, modular architecture
- 📊 **Interactive Graphs** - Multiple layouts with real-time filtering
- 📊 **Analytics Layout** - Statistics dashboard
- 🌙 **Theme Support** - Dark/light mode toggle
- ⚡ **Performance** - 4-6× faster rendering
- 🔲 **Intelligent Clustering** - Ecosystem/Health/Depth grouping

### **Configuration & Security**
- 🔧 **Dynamic Data Configuration** - JSON-based scalable config
- 🔑 **GitHub Token Config** - User tokens, no rate limits
- 🔒 **Encrypted Storage** - AES-256-GCM for sensitive data
- 📦 **502 Tracked Packages** - Comprehensive monitoring

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.4

# Local
npm install --save-dev devcompass@3.2.4

# One-time use
npx devcompass@3.2.4 analyze

# Upgrade from any version
npm install -g devcompass@3.2.4
```

## 📖 Usage

### Basic Commands

```bash
# Configure GitHub token (recommended)
devcompass config --github-token <your-token>
devcompass config --show

# Analyze project (includes CVE detection!)
devcompass analyze
devcompass analyze --ai  # 🤖 With AI recommendations!
devcompass analyze --no-history  # Skip snapshot

# Generate interactive graph
devcompass graph --open
devcompass graph --layout force --filter vulnerable

# Auto-fix issues
devcompass fix
devcompass fix --batch
devcompass fix --dry-run
```

### CVE Commands (NEW in v3.2.4)

```bash
# Configure NVD API key (optional)
devcompass cve key --set --api-key <your-nvd-key>
devcompass cve key                          # Show current status
devcompass cve key --remove                 # Remove stored key

# Test NVD API connection
devcompass cve test                         # Validate your key

# Cache management
devcompass cve cache --stats                # View cache statistics
devcompass cve cache --clear                # Clear vulnerability cache

# CVE detection runs automatically with analyze
devcompass analyze                          # Includes CVE scan!
```

**Getting Your NVD API Key:**
```bash
# 1. Visit: https://nvd.nist.gov/developers/request-an-api-key
# 2. Fill in:
#    - Email address
#    - Organization name
#    - Agree to Terms of Use
# 3. Check your email for single-use activation link
# 4. Click link to activate (must activate within 7 days)
# 5. Copy your API key from the confirmation page
# 6. Add to DevCompass:
devcompass cve key --set --api-key 9d47e8fb-0837-4da7-a1cf-7a0bxxx8ca22

# 7. Test it:
devcompass cve test

# Output:
# 🧪 Testing NVD API Key...
# ✓ NVD API key is valid ✓
```

### Graph Commands (v3.2.3)

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

### Snapshot Commands (v3.2.3)

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

### Compare Commands (v3.2.3)

```bash
# Compare two snapshots
devcompass compare 51 52                    # Basic comparison
devcompass compare 51 52 --verbose          # Show all packages
devcompass compare 51 52 -o report.md       # Save to file
```

### Backup Commands (v3.2.3)

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

## 🛡️ CVE Vulnerability Detection (v3.2.4)

### How It Works

**Automatic Detection:**
Every time you run `devcompass analyze`, the tool automatically:
1. 📦 Scans all dependencies in your project
2. 🔍 Queries OSV database for known vulnerabilities
3. 🏛️ Enriches with NVD data (if key configured)
4. 💾 Caches results locally for 24 hours
5. 📊 Reports findings with severity levels

**Data Sources:**
- **OSV (Open Source Vulnerabilities)** - Primary source, no key required
- **NVD (National Vulnerability Database)** - Secondary enrichment, optional API key

### Features

**Severity Classification:**
- 🔴 **CRITICAL** - Immediate action required
- 🟠 **HIGH** - Fix soon (this week)
- 🟡 **MEDIUM** - Plan to fix (this month)
- ⚪ **LOW** - Monitor, fix when convenient

**Performance:**
- ⚡ **First Run:** 2-5 seconds (API calls to OSV + NVD)
- 🚀 **Cached Run:** <100ms (from local SQLite)
- 💾 **Cache Duration:** 24 hours with automatic expiry
- 🔄 **Batch Processing:** 5 concurrent requests max

**Security & Privacy:**
- 🔒 **Encrypted Storage:** AES-256-GCM for API keys
- 🖥️ **Local Only:** Keys never transmitted to DevCompass servers
- 🔑 **Machine-Specific:** Encryption tied to your machine
- 🛡️ **Read-Only:** Only queries vulnerability databases

### Example Output

```bash
$ devcompass analyze

🔍 DevCompass v3.2.4 - Analyzing your project...

✔ Scanned 6 dependencies in project
⚡ GitHub check completed in 4.76s
📦 CVE check completed (6/6 from cache)

🔴 CVE VULNERABILITIES DETECTED (4 packages)

  🟡 MEDIUM: 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️  CVE VULNERABILITY DATABASE (4)

  🟡 MEDIUM: 12

  Affected Packages:

  axios@0.21.1
    ● GHSA-3p68-rc4w-qgx5 - MEDIUM
      Axios has a NO_PROXY Hostname Normalization Bypass that Leads to SSRF
    ● GHSA-43fc-jf86-j433 - MEDIUM
      Axios Denial of Service vulnerability

  express@4.17.1
    ● GHSA-qw6h-vgh9-j6wx - MEDIUM
      Express.js Open Redirect in malformed URLs
    ● GHSA-rv95-896h-c2vc - MEDIUM
      Express.js path traversal vulnerability

  lodash@4.17.21
    ● GHSA-f23m-r3pf-42rh - MEDIUM
      Prototype pollution in lodash
    ● GHSA-r5fr-rjxr-66jc - MEDIUM
      Command injection in lodash templates

  request@2.88.2
    ● GHSA-p8p7-x288-28g6 - MEDIUM
      Server-Side Request Forgery in request

  💡 Sources: OSV (Open Source Vulnerabilities) + NVD (National Vulnerability Database)
  Run npm audit fix to fix known vulnerabilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Cache Management

```bash
# View cache statistics
$ devcompass cve cache --stats

📊 CVE Cache Statistics

  Total entries: 14
  Active: 14
  Expired: 0
  Outdated: 0

# Clear cache (force fresh scan)
$ devcompass cve cache --clear

✓ Cleared 14 cached CVE entries
```

### API Key Management

```bash
# Show current status
$ devcompass cve key

🔑 NVD API Key Status

✓ Configured
  Key: 9d47e8f***ca22

💡 Commands:
  Test: devcompass cve test
  Remove: devcompass cve key --remove

# Test your API key
$ devcompass cve test

🧪 Testing NVD API Key...

✓ NVD API key is valid ✓

Ready to use:
  Run: devcompass analyze to scan with CVE detection

# Remove API key
$ devcompass cve key --remove

✓ NVD API key removed
```

### Performance Comparison

| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| Scan 6 packages | ~2-5s | <100ms | 20-50× faster |
| CVE lookup | 300-500ms | <10ms | 30-50× faster |
| Full analysis | ~8-12s | ~5-6s | 40-50% faster |

### Technical Details

**Database Schema:**
```sql
-- Encrypted API keys
api_keys (id, service, api_key, is_active, created_at)

-- Cached vulnerability data
vulnerability_cache (
  id, package_name, package_version, 
  vulnerabilities, cache_version,
  cached_at, expires_at
)

-- Cache metadata
cache_metadata (key, value)
```

**Encryption:**
- Algorithm: AES-256-GCM
- Key Derivation: SHA-256(hostname + username)
- IV: 12 bytes (GCM standard)
- Tag: 16 bytes (authentication)

**Cache Version Management:**
- Automatic cache invalidation on parser updates
- Version tracking in metadata table
- Seamless migration on upgrades

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
71    test-project     1.0.0       0.5       6       2026-05-01 1:45:23 PM
70    test-project     1.0.0       0.5       6       2026-04-30 7:37:27 AM
69    devcompass       3.2.4       7.5       7       2026-04-30 6:02:45 AM

Total: 20 snapshot(s)

# View details
$ devcompass snapshot view 71

📸 Snapshot #71

Project Information:
  Name: test-project
  Version: 1.0.0
  Date: 2026-05-01 1:45:23 PM

Health Metrics:
  Health Score: 0.5/10
  Total Dependencies: 6
  CVE Vulnerabilities: 12 (MEDIUM)

Package Summary:
  🔴 Vulnerable: 4
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
- 🛡️ Track CVE vulnerability changes
- 📝 Export reports

### Example

```bash
# Compare two snapshots
$ devcompass compare 69 71

✔ Comparison complete (0ms)

📊 Snapshot Comparison

Snapshots:
  #69 → #71
  2026-04-30 06:02:45 → 2026-05-01 13:45:23

Changes:
  Total Packages: 7 → 6 (-1)
  Health Score: 7.50 → 0.50 (-7.00) ❌
  CVE Vulnerabilities: 0 → 12 (+12) 🔴

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
     🔴 New vulnerabilities detected: 2 MEDIUM CVEs

  ⟳ chalk
     Version: 5.4.2 → 4.1.2
     Health: 10.0 → 8.5 (-1.5)

  ⟳ lodash
     Version: 4.17.21 → 4.17.20
     Health: 9.0 → 7.0 (-2.0)
     🔴 New vulnerabilities detected: 2 MEDIUM CVEs
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
✓ Current state backed up: backup-2026-05-01T13-50-15-123Z

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
- Security Vulnerabilities (12 CVEs detected)
  → Run: npm audit fix
  → Why: MEDIUM severity issues in axios, express, lodash

🟡 HIGH PRIORITY (This Week):
- Update axios (0.21.1 → 1.15.2)
  → Why: Contains 2 known CVEs (GHSA-3p68-rc4w-qgx5, GHSA-43fc-jf86-j433)
  → Breaking changes: Response format changed
```

**Ask Questions:**
```bash
$ devcompass ai ask "Should I update axios from 0.21.1 to 1.15.2?"

🤖 Yes, you should update axios:

Security: Version 0.21.1 has 2 MEDIUM CVEs detected:
- GHSA-3p68-rc4w-qgx5: NO_PROXY Hostname Normalization Bypass
- GHSA-43fc-jf86-j433: Denial of Service vulnerability

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

### CVE-Related Issues

**"CVE detection not working"**
```bash
# Make sure you ran analyze first
devcompass analyze

# Check if CVE database exists
ls ~/.devcompass/cve.db

# Clear cache and try again
devcompass cve cache --clear
devcompass analyze
```

**"NVD API key invalid"**
```bash
# Test your API key
devcompass cve test

# If invalid, get a new key from:
# https://nvd.nist.gov/developers/request-an-api-key

# Remove old key and add new one
devcompass cve key --remove
devcompass cve key --set --api-key <new-key>
```

**"All CVEs showing as UNKNOWN severity"**
```bash
# This is a cache issue - clear it
devcompass cve cache --clear

# Run fresh scan
devcompass analyze
```

**"CVE scan too slow"**
```bash
# First run is always slower (2-5s for API calls)
# Subsequent runs use cache (<100ms)

# Check cache status
devcompass cve cache --stats

# If cache expired, it will re-fetch
# Cache TTL is 24 hours
```

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
npm install -g devcompass@3.2.4
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.4
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

5. **Enhance CVE Detection**
   - Improve severity parsing in `src/cve/osv-client.js`
   - Add more vulnerability sources
   - Enhance caching strategies

6. **Code Contributions**
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
- [x] **CVE vulnerability detection** (v3.2.4) ✅
- [x] **OSV + NVD integration** (v3.2.4) ✅
- [x] **Encrypted API key storage** (v3.2.4) ✅
- [x] **Smart caching system** (v3.2.4) ✅
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
- [ ] **CVSS Score Visualization** - Visual severity indicators
- [ ] **CVE Trend Analysis** - Track vulnerability trends over time
- [ ] **Automated CVE Fixes** - Auto-update vulnerable packages
- [ ] **Cloud Snapshot Sync** - Sync snapshots across team
- [ ] **Graph Export Formats** - PDF, SVG export
- [ ] **Web Dashboard** - Team health monitoring with AI insights
- [ ] **Monorepo Support** - Multi-project AI analysis
- [ ] **Automated Backup Policies** - Schedule automatic backups
- [ ] **Snapshot Diff Visualization** - Visual diff tool

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

### v3.2.4 (2026-05-01) - CVE Vulnerability Detection
- 🛡️ **CVE Detection System** - Real-time vulnerability scanning
- 🔍 **OSV API Integration** - Primary source (no key required)
- 🏛️ **NVD API Integration** - Secondary enrichment (optional)
- ⚡ **Smart Caching** - 24-hour TTL, <100ms cached scans
- 🔒 **Encrypted Storage** - AES-256-GCM for API keys
- 🎨 **Severity Classification** - CRITICAL/HIGH/MEDIUM/LOW
- 📊 **Detailed Reports** - CVE IDs, summaries, references
- 💾 **Batch Processing** - Concurrent vulnerability checks
- ✅ Zero breaking changes (100% backward compatible)

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

*DevCompass v3.2.4 - Complete Dependency Intelligence + Security Platform!* 🧭✨

**Like Lighthouse for your dependencies, now with real-time CVE detection** 🛡️⚡
