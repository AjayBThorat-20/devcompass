# 🧭 DevCompass

> **Professional dependency health checker with AI-powered insights, real-time CVE detection, and comprehensive project analysis**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/devcompass.svg)](https://nodejs.org)

**DevCompass** is a comprehensive dependency analysis platform that combines security scanning, health monitoring, and AI-powered recommendations into a single powerful CLI tool. Built for modern JavaScript projects, it provides enterprise-grade insights with developer-friendly workflows.

---

## 🎯 What is DevCompass?

DevCompass analyzes your project dependencies to provide actionable insights about:

- **🛡️ Security** - Real-time CVE detection with OSV + NVD integration
- **📊 Health** - Dependency quality, maintenance status, and project health scores
- **🤖 Intelligence** - AI-powered recommendations and package alternatives
- **📈 History** - Track changes over time with snapshots and timeline visualization
- **🎨 Visualization** - Interactive dependency graphs with multiple layouts
- **🔧 Automation** - Auto-fix issues with intelligent risk classification

---

## ✨ Key Features

### 🛡️ **Security & Vulnerability Detection**

Real-time CVE scanning with industry-standard databases:

- **Dual-Source Detection** - OSV (free) + NVD (optional API key)
- **CVSS Severity Scoring** - CRITICAL/HIGH/MEDIUM/LOW classification
- **Smart Caching** - 24-hour local cache for instant subsequent scans
- **Encrypted Storage** - AES-256-GCM for API keys
- **Batch Processing** - Concurrent vulnerability checks for performance

### 🤖 **AI-Powered Analysis**

Get intelligent insights with multi-provider LLM support:

- **4 AI Providers** - OpenAI, Anthropic, Google, or local Ollama
- **Interactive Chat** - Ask questions about your dependencies
- **Smart Alternatives** - AI-suggested package replacements
- **Context-Aware** - Recommendations based on your project state
- **FREE Option** - Use local Ollama for zero-cost AI analysis

### 📊 **Historical Tracking**

Monitor dependency evolution with comprehensive tracking:

- **Auto-Snapshots** - Automatic state capture on every analysis
- **Comparison Tools** - Side-by-side diff between snapshots
- **Timeline Visualization** - Interactive D3 charts showing trends
- **SQLite Database** - Fast, reliable local storage

### 🎨 **Interactive Visualization**

Explore dependencies with rich, interactive graphs:

- **4 Layout Modes** - Tree, Force-directed, Radial, Conflict
- **Real-Time Filtering** - Show only vulnerable, outdated, or unused packages
- **Dark/Light Themes** - Comfortable viewing in any environment
- **Export Options** - PNG, JSON, or interactive HTML

### 🔧 **Intelligent Fixing**

Automated issue resolution with safety guarantees:

- **Risk Classification** - Safe, moderate, and risky fixes identified
- **Preview Mode** - See all changes before applying
- **Automatic Backups** - Restore point before any modifications
- **Interactive Confirmation** - Review and approve changes

---

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g devcompass

# Local project installation
npm install --save-dev devcompass

# One-time use with npx
npx devcompass analyze
```

### First Analysis

```bash
# Run your first analysis (shows Top 3 critical issues)
devcompass analyze

# Get full detailed report
devcompass analyze --deep

# Get AI-powered recommendations
devcompass analyze --ai

# Generate interactive dependency graph
devcompass graph --open
```

### Configure Security Scanning

```bash
# Get free NVD API key from: https://nvd.nist.gov/developers/request-an-api-key
devcompass cve key --set --api-key YOUR_KEY

# Test connection
devcompass cve test

# Run analysis with CVE detection
devcompass analyze
```

---

## 📖 Complete Command Reference

### Core Analysis

#### `analyze` - Analyze Project Dependencies

Comprehensive dependency analysis with security scanning and health metrics.

```bash
# Basic analysis (Top 3 critical issues)
devcompass analyze

# Full detailed report (all issues)
devcompass analyze --deep

# With AI recommendations
devcompass analyze --ai

# JSON output for CI/CD
devcompass analyze --json

# Silent mode (no output)
devcompass analyze --silent

# CI mode (exit code based on health)
devcompass analyze --ci

# CI mode with custom threshold
devcompass analyze --ci --threshold 8.0
```

**Output Modes:**
- **Default** - Top 3 critical issues (clean, focused output)
- **Deep** - Complete analysis with all issues categorized
- **JSON** - Structured data for automation
- **Silent** - No output (exit code only for scripting)

**Health Score Icons:**
- 🟢 **9.0-10.0** - Excellent (Outstanding health)
- ✅ **8.0-8.9** - Good (Healthy project)
- ⚠️ **6.0-7.9** - Needs Attention (Some issues)
- 🟠 **4.0-5.9** - Poor (Many issues)
- 🔴 **0.0-3.9** - Critical (Urgent action needed)

---

### Security Commands

#### `cve` - CVE Vulnerability Management

Manage CVE detection settings and vulnerability database.

```bash
# Configure NVD API key
devcompass cve key --set --api-key YOUR_KEY
devcompass cve key                    # Show current status
devcompass cve key --remove           # Remove stored key

# Test API connection
devcompass cve test

# Cache management
devcompass cve cache --stats          # View cache statistics
devcompass cve cache --clear          # Clear cached data
```

**Getting NVD API Key:**
1. Visit [NVD Developer Portal](https://nvd.nist.gov/developers/request-an-api-key)
2. Enter email and organization
3. Activate via email link (valid 7 days)
4. Configure in DevCompass

**Cache Behavior:**
- **TTL:** 24 hours
- **Performance:** First run 2-5s, cached <100ms
- **Storage:** SQLite local database

---

### Fixing & Automation

#### `fix` - Automated Issue Resolution

Fix dependency issues with intelligent risk classification and safety guarantees.

```bash
# Interactive fix with preview (NEW default behavior)
devcompass fix

# Skip confirmation
devcompass fix --yes

# Include all fixes (including risky)
devcompass fix --all

# Preview only (no changes)
devcompass fix --dry-run
```

**Safety Features:**
- Automatic backup before changes
- Risk classification (safe/moderate/risky)
- Interactive preview and confirmation
- Health score tracking (before → after)
- Rollback support

---

### Visualization

#### `graph` - Dependency Graph Visualization

Generate interactive dependency graphs with multiple layouts and filters.

```bash
# Generate graph with default settings
devcompass graph

# Specify layout
devcompass graph --layout force       # Force-directed
devcompass graph --layout radial      # Radial tree
devcompass graph --layout conflict    # Highlight conflicts

# Apply filters
devcompass graph --filter vulnerable  # Security issues only
devcompass graph --filter outdated    # Outdated packages
devcompass graph --filter unused      # Unused dependencies

# Customize output
devcompass graph --output my-deps.html
devcompass graph --width 1600 --height 900
devcompass graph --depth 5

# Open in browser
devcompass graph --open
```

**Interactive Features:**
- Switch layouts without reload
- Real-time filtering
- Depth control slider
- Search functionality
- Zoom and pan
- Export as PNG/JSON

---

### History & Tracking

#### `snapshot` - Snapshot Management

Manage project state snapshots for comparison and tracking.

```bash
# Save current state
devcompass snapshot save

# List snapshots
devcompass snapshot list
devcompass snapshot list --limit 50
devcompass snapshot list --project myapp

# View details
devcompass snapshot view 123
devcompass snapshot view 123 --verbose

# Delete snapshot
devcompass snapshot delete 123
devcompass snapshot delete 123 --yes
```

#### `compare` - Snapshot Comparison

Compare two snapshots to track changes over time.

```bash
# Basic comparison
devcompass compare 51 52

# Detailed comparison
devcompass compare 51 52 --verbose

# Save report
devcompass compare 51 52 -o report.md
```

#### `history` - Historical Analysis

View and analyze snapshot history.

```bash
# List all snapshots
devcompass history list
devcompass history list --limit 50
devcompass history list --month 05-2025

# Monthly summary
devcompass history summary

# Statistics
devcompass history stats
```

#### `timeline` - Timeline Visualization

Generate interactive timeline showing dependency evolution.

```bash
# Generate timeline
devcompass timeline

# Customize timeframe
devcompass timeline --days 30
devcompass timeline --days 90

# Open in browser
devcompass timeline --open
```

---

### Backup & Recovery

#### `backup` - Backup Management

Manage package.json and package-lock.json backups.

```bash
# List backups
devcompass backup list

# Show backup details
devcompass backup info --name backup-2025-05-10T19-50-37-541Z

# Restore from backup
devcompass backup restore --name backup-2025-05-10T19-50-37-541Z
devcompass backup restore --name backup-xxx --force

# Clean old backups
devcompass backup clean                # Keep latest 5
devcompass backup clean --keep 3       # Keep latest 3
```

---

### AI Commands

#### `ai` - AI-Powered Insights

Interact with AI for dependency analysis and recommendations.

```bash
# Ask questions
devcompass ai ask "Why is axios outdated?"
devcompass ai ask "Should I update to React 19?"

# Get package alternatives
devcompass ai alternatives moment

# Interactive chat
devcompass ai chat

# Get recommendations
devcompass ai recommend
```

#### `llm` - AI Provider Management

Configure and manage AI/LLM providers.

```bash
# Add provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# List providers
devcompass llm list

# Set default
devcompass llm default openai

# Test connection
devcompass llm test openai

# View usage statistics
devcompass llm stats

# Update provider
devcompass llm update openai --model gpt-4o

# Remove provider
devcompass llm remove anthropic
```

---

### Configuration

#### `config` - DevCompass Configuration

Manage DevCompass settings.

```bash
# Set GitHub token (avoid rate limits)
devcompass config --github-token YOUR_TOKEN

# Show current configuration
devcompass config --show

# Remove GitHub token
devcompass config --remove-github-token
```

---

## 🛡️ Security & CVE Detection

### How It Works

DevCompass integrates with two industry-standard vulnerability databases:

1. **OSV (Open Source Vulnerabilities)** - Primary source, no API key required
   - Comprehensive npm package coverage
   - GitHub Security Advisories
   - Fast, free, always available

2. **NVD (National Vulnerability Database)** - Secondary enrichment, optional
   - Official NIST CVE database
   - CVSS severity scores
   - Detailed vulnerability metadata

### Detection Process

Every `devcompass analyze` automatically:

1. Scans all project dependencies
2. Queries OSV database for vulnerabilities
3. Enriches with NVD data (if configured)
4. Caches results locally for 24 hours
5. Reports findings with severity levels

### Example Output

```
🛡️  CVE VULNERABILITY DATABASE (4)

  🟡 MEDIUM: 12

  Affected Packages:

  axios@0.21.1
    ● GHSA-3p68-rc4w-qgx5 - MEDIUM
      Axios has a NO_PROXY Hostname Normalization Bypass
    ● GHSA-43fc-jf86-j433 - MEDIUM
      Axios Denial of Service vulnerability

  express@4.17.1
    ● GHSA-qw6h-vgh9-j6wx - MEDIUM
      Express.js Open Redirect in malformed URLs
    ● GHSA-rv95-896h-c2vc - MEDIUM
      Express.js path traversal vulnerability

  💡 Sources: OSV + NVD
  Run npm audit fix to address vulnerabilities
```

### Performance

| Operation | Without Cache | With Cache | Improvement |
|-----------|---------------|------------|-------------|
| 6 packages | 2-5 seconds | <100ms | 20-50× faster |
| CVE lookup | 300-500ms | <10ms | 30-50× faster |
| Full scan | 8-12 seconds | 5-6 seconds | ~50% faster |

---

## 🤖 AI Integration Guide

### Quick Start with FREE Local AI

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Start Ollama
ollama serve

# 3. Pull a model
ollama pull llama3.2

# 4. Configure DevCompass
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# 5. Test it
devcompass llm test local

# 6. Use it!
devcompass analyze --ai
devcompass ai ask "What should I update first?"
```

### OpenAI Setup

```bash
# Get API key from: https://platform.openai.com/api-keys

# Configure
devcompass llm add --provider openai --token sk-YOUR-KEY --model gpt-4o-mini

# Test
devcompass llm test openai

# Use
devcompass analyze --ai
```

### AI Capabilities

**Analysis Integration:**
- Automatic health assessment
- Risk prioritization
- Breaking change warnings
- Migration guidance

**Interactive Q&A:**
```bash
devcompass ai ask "Why is my health score low?"
devcompass ai ask "Should I update axios?"
devcompass ai ask "What are the breaking changes in React 19?"
```

**Package Alternatives:**
```bash
devcompass ai alternatives moment

# Returns:
# 1. date-fns (~2KB vs 67KB) - Tree-shakeable, modern API
# 2. dayjs (~2KB) - moment.js compatible, drop-in replacement
# 3. Luxon (~15KB) - Better timezone support, richer features
```

**Interactive Chat:**
```bash
devcompass ai chat

# Opens interactive session:
# You: What's wrong with my dependencies?
# AI: You have 3 packages with known CVEs...
# You: Which should I fix first?
# AI: Priority 1 is axios because...
```

---

## 📊 Use Cases

### CI/CD Integration

```bash
# In your CI pipeline
devcompass analyze --ci --json > analysis.json

# Check exit code
# 0 = health score above threshold
# 1 = health score below threshold
```

```yaml
# GitHub Actions example
- name: Dependency Health Check
  run: |
    npm install -g devcompass
    devcompass analyze --ci
```

### Security Auditing

```bash
# Weekly security scan
devcompass analyze --deep > security-report.txt
devcompass cve cache --stats

# Export for compliance
devcompass analyze --json | jq '.vulnerabilities'
```

### Dependency Management

```bash
# Before updates
devcompass snapshot save
devcompass backup list

# Update dependencies
npm update

# Check impact
devcompass analyze
devcompass compare <before-id> <after-id>

# Rollback if needed
devcompass backup restore --name <backup-name>
```

### Team Health Monitoring

```bash
# Generate weekly report
devcompass analyze --deep > weekly-report.txt
devcompass timeline --days 7 --open

# Track trends
devcompass history summary
devcompass history stats
```

---

## 🔧 Configuration

### File Locations

```
~/.devcompass/
├── history.db          # Snapshot database
├── cve.db             # CVE cache
├── ai.db              # AI conversation history
├── config.db          # Configuration
└── llm.db             # LLM provider settings

<project>/.devcompass-backups/  # Backup files
<project>/.devcompass-cache.json  # Analysis cache
```

### Configuration Files

**Dynamic Package Tracking:**
- `data/tracked-repos.json` - GitHub repositories to monitor
- `data/popular-packages.json` - Common package patterns
- `data/quality-alternatives.json` - Deprecated package replacements
- `data/gpl-alternatives.json` - GPL license alternatives

**Batch Fix Categories:**
- `data/batch-categories.json` - Fix categorization rules
- `data/priorities.json` - Priority classification

---

## 🐛 Troubleshooting

### Common Issues

**Command not found**
```bash
npm install -g devcompass
# or
npx devcompass analyze
```

**Old version installed**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.5
```

**No analysis cache found**
```bash
# Run analyze first
devcompass analyze

# Then other commands work
devcompass graph --open
```

### CVE-Related

**CVE detection not working**
```bash
# Clear cache
devcompass cve cache --clear

# Run fresh scan
devcompass analyze
```

**NVD API key invalid**
```bash
# Test connection
devcompass cve test

# Get new key from: https://nvd.nist.gov/developers/request-an-api-key

# Update key
devcompass cve key --remove
devcompass cve key --set --api-key NEW_KEY
```

### AI-Related

**No AI provider configured**
```bash
# Add a provider
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434
```

**Ollama connection failed**
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Test connection
devcompass llm test local
```

---

## 📈 Version History

### v3.2.5 (2025-05-10) - Refinement & Usability
- 🎯 **Top 3 Issues** default view for cleaner UX
- 🛡️ **Fix Preview** with interactive confirmation
- 🏗️ **Modular Architecture** - 31 new files, clean code organization
- ✅ **Silent & CI Modes** - Better automation support
- 🎨 **Health Score Icons** - Visual indicators (🟢✅⚠️🟠🔴)
- 🔒 **Enhanced Security** - Command injection protection
- 📊 **100% Backward Compatible** - All existing features preserved

### v3.2.4 (2025-05-01) - CVE Detection
- 🛡️ Real-time CVE vulnerability scanning
- 🔍 OSV + NVD database integration
- ⚡ Smart caching (24-hour TTL)
- 🔒 Encrypted API key storage (AES-256-GCM)
- 🎨 CVSS severity classification

### v3.2.3 (2025-04-30) - Feature Complete
- 📊 Interactive graph visualization
- 📸 Snapshot management system
- 🔄 Snapshot comparison tools
- 💾 Backup management

### v3.2.2 (2025-04-27) - AI-Powered
- 🤖 Multi-provider LLM integration
- 💬 Interactive AI chat
- 🔄 Package alternative suggestions
- 🆓 FREE local AI with Ollama

### v3.2.1 (2025-04-26) - Historical Tracking
- 📊 SQLite snapshot database
- 📈 Timeline visualization
- 🔍 Snapshot comparison

### v3.2.0 (2025-04-25) - Unified Dashboard
- 🎨 Modular architecture
- 📊 Analytics layout
- 🌙 Theme support

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Quick Contributions

1. **Package Alternatives** - Add to `data/quality-alternatives.json`
2. **AI Prompts** - Improve `src/ai/prompt-templates.js`
3. **Graph Layouts** - Enhance `src/dashboard/scripts/layouts.js`
4. **Documentation** - Fix typos, add examples

### Code Contributions

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/devcompass.git
cd devcompass

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
npm test

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### Development Setup

```bash
# Install dependencies
npm install

# Link for local testing
npm link

# Test your changes
devcompass analyze

# Run in different project
cd /path/to/test-project
devcompass analyze
```

---

## 📄 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

---

## 🙏 Acknowledgments

- **OSV** - Open Source Vulnerabilities database
- **NVD** - National Vulnerability Database (NIST)
- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Google** - Gemini models
- **Ollama** - Local AI runtime

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/AjayBThorat-20/devcompass/issues)
- **Email:** ajaythorat988@gmail.com
- **Documentation:** [Full Guide](https://github.com/AjayBThorat-20/devcompass#readme)

---

## 🌟 Star History

If DevCompass helps your project, please consider giving it a star! ⭐

---

<div align="center">

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**

*DevCompass v3.2.5 - Professional Dependency Intelligence Platform* 🧭✨

[Get Started](#-quick-start) · [Documentation](#-complete-command-reference) · [Contributing](#-contributing)

</div>