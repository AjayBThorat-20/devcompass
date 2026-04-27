# 🧭 DevCompass

**AI-powered dependency health checker with unified interactive dashboard featuring 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), intelligent AI recommendations, multi-provider LLM support, modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, backup & rollback, historical tracking with SQLite database, snapshot comparison, timeline visualization, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **get AI-powered recommendations**, **ask questions about your dependencies**, **find package alternatives with AI**, **chat with AI about your project**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **visualize dependency graphs with 5 dynamic layouts including Analytics dashboard**, **modular architecture with zero code duplication**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **track dependency changes over time with SQLite database**, **compare snapshots to see what changed**, **visualize evolution with interactive timelines**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🤖 LATEST v3.2.2:** AI-Powered Analysis - Get intelligent recommendations from OpenAI, Anthropic, Google, or FREE local AI! 🤖  
> **📊 v3.2.1:** Historical Tracking System - Track changes, compare snapshots, visualize trends! 📊  
> **🎨 v3.2.0:** Unified Dashboard Architecture - 50% less code, 5 layouts, dark/light themes! 🎨

## 🎉 Latest Release: v3.2.2 (2026-04-26)

**AI-Powered Dependency Analysis - Smart Recommendations from AI!**

### 🌟 What's New in v3.2.2:

#### **🤖 AI-Powered Analysis**

Get intelligent, context-aware recommendations from AI to help you maintain healthier dependencies.

**Features:**
- ✅ **Multi-Provider Support** - OpenAI, Anthropic (Claude), Google (Gemini), Ollama (FREE local)
- ✅ **Encrypted Token Storage** - AES-256-GCM encryption for API keys
- ✅ **Context-Aware** - AI analyzes your specific project data
- ✅ **Real-Time Streaming** - See responses as they're generated
- ✅ **Interactive Chat** - Multi-turn conversations about your dependencies
- ✅ **Cost Tracking** - Monitor token usage and estimated costs
- ✅ **FREE Option** - Use local AI with Ollama (no API costs)
- ✅ **Package Alternatives** - AI suggests better replacements
- ✅ **Smart Prioritization** - Critical → High → Medium recommendations

**AI Commands:**
```bash
# Setup AI provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm test openai

# Or use FREE local AI
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Get AI-powered analysis
devcompass analyze --ai

# Ask questions
devcompass ai ask "Should I update axios to version 1.15.2?"
devcompass ai ask "What are the security risks in my project?"

# Find alternatives
devcompass ai alternatives moment

# Interactive chat
devcompass ai chat

# View usage
devcompass llm stats
```

**What AI Can Help With:**
- 🔍 **Explain why** packages are outdated
- 🛡️ **Identify** breaking changes in updates
- 📝 **Suggest** migration strategies
- 🔄 **Find** better package alternatives
- ⚡ **Prioritize** updates by risk level
- 🔒 **Explain** security vulnerabilities
- 📋 **Provide** step-by-step fixes

**Privacy & Security:**
- 🔒 Tokens encrypted with AES-256-GCM
- 💾 Stored locally in `~/.devcompass/ai.db`
- 🚫 Your code is never sent to AI (only analysis metadata)
- 🆓 FREE local option with complete privacy

**Supported AI Providers:**

| Provider | Models | Cost | Best For |
|----------|--------|------|----------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | ~$0.03/1K tokens | Fast, accurate responses |
| **Anthropic** | Claude 3.5 Sonnet, Opus, Haiku | ~$0.003/1K tokens | Detailed analysis |
| **Google** | Gemini Pro, Gemini 1.5 Pro | ~$0.00025/1K tokens | Cost-effective |
| **Ollama** | Llama 3, Mistral, CodeLlama | **FREE** | Privacy, no limits |

#### **💰 Cost Comparison**

**Example: 50 AI queries per month**

| Provider | Monthly Cost |
|----------|--------------|
| OpenAI GPT-4 | ~$4.50 |
| Anthropic Claude | ~$0.90 |
| Google Gemini | ~$0.04 |
| **Ollama (Local)** | **$0.00 FREE!** |

## ✨ All Features

- 🤖 **AI-Powered Analysis** (v3.2.2) - Multi-provider LLM integration
- 💬 **Interactive AI Chat** (v3.2.2) - Ask questions, get answers
- 🔄 **Package Alternatives** (v3.2.2) - AI-suggested replacements
- 🔒 **Encrypted Tokens** (v3.2.2) - AES-256-GCM security
- 📊 **Cost Tracking** (v3.2.2) - Monitor AI usage
- 📊 **Historical Tracking** (v3.2.1) - SQLite database, auto-save snapshots
- 🔍 **Snapshot Comparison** (v3.2.1) - Side-by-side diff analysis
- 📈 **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- 🗂️ **Flexible Dates** (v3.2.1) - 9 date formats supported
- 🎨 **Unified Dashboard** (v3.2.0) - 5 layouts, modular architecture
- 📊 **Analytics Layout** (v3.2.0) - Statistics dashboard
- 🌙 **Theme Support** (v3.2.0) - Dark/light mode toggle
- ⚡ **Performance** (v3.2.0) - 4-6× faster rendering
- 🔧 **Dynamic Data Configuration** (v3.1.7) - JSON-based scalable config
- 🔲 **Intelligent Clustering** (v3.1.6) - Ecosystem/Health/Depth grouping
- 🔑 **GitHub Token Config** (v3.1.5) - User tokens, no rate limits
- 📦 **502 Tracked Packages** (v3.1.5) - Comprehensive monitoring

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.2

# Local
npm install --save-dev devcompass@3.2.2

# One-time use
npx devcompass@3.2.2 analyze

# Upgrade from any version
npm install -g devcompass@3.2.2
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

# Generate graph (with 5 layouts + themes!)
devcompass graph --open

# Auto-fix issues
devcompass fix
devcompass fix --batch
devcompass fix --dry-run
```

### AI Commands (NEW in v3.2.2)

```bash
# Setup AI provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet
devcompass llm add --provider google --token xxx --model gemini-pro
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Manage providers
devcompass llm list
devcompass llm default openai
devcompass llm test openai
devcompass llm remove openai
devcompass llm stats

# AI Analysis
devcompass analyze --ai
devcompass analyze --ai --ai-provider anthropic

# Ask AI questions
devcompass ai ask "Why is my health score low?"
devcompass ai ask "Should I update axios now?"
devcompass ai ask "What are the breaking changes in React 19?"

# Get recommendations
devcompass ai recommend

# Find alternatives
devcompass ai alternatives moment
devcompass ai alternatives request
devcompass ai alternatives lodash

# Interactive chat
devcompass ai chat
devcompass ai chat --provider anthropic
```

### History Commands (v3.2.1)

```bash
# List snapshots
devcompass history list
devcompass history list --limit 50
devcompass history list --month 04-2026

# Compare snapshots
devcompass compare 5 8
devcompass compare 5 8 --verbose

# Timeline
devcompass timeline --open
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

**Interactive Chat:**
```bash
$ devcompass ai chat

🤖 DevCompass AI Assistant
Ask me anything about your dependencies!

You: Should I remove lodash and moment since they're unused?

🤖 Yes, remove them:
- lodash: 1.3 MB saved
- moment: 4.1 MB saved
Total saved: 5.4 MB

Command: npm uninstall lodash moment

This will improve your health score from 0.5/10 to ~5.3/10!

You: exit
👋 Chat ended. Used 245 tokens (~$0.0001)
```

### Cost Tracking

```bash
$ devcompass llm stats

📊 AI Usage Statistics - 2026-04

local (llama3.2)
   Requests: 28
   Tokens: 11,923
   Cost: $0.0000

──────────────────────────────────
Total Requests: 28
Total Tokens: 11,923
Total Cost: $0.0000

📈 Projected monthly cost: $0.00
```

### Privacy & Security

**What Gets Sent to AI:**
- ✅ Package names and versions
- ✅ Vulnerability counts
- ✅ Health score
- ✅ Outdated/unused package lists

**What Doesn't Get Sent:**
- ❌ Your source code
- ❌ File contents
- ❌ Environment variables
- ❌ API keys

**Encryption:**
- AES-256-GCM encryption for API tokens
- Machine-specific encryption keys
- Tokens stored in `~/.devcompass/ai.db`
- Never sent to DevCompass servers

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

**"API key invalid"**
```bash
# Update token
devcompass llm update openai --token sk-new-token

# Test it
devcompass llm test openai
```

**"Quota exceeded"**
```bash
# Check usage
devcompass llm stats

# Switch to free provider
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434
devcompass llm default local
```

### Common Issues

**"Command not found"**
```bash
npm install -g devcompass@3.2.2
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.2
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

- [x] AI-powered analysis (v3.2.2) ✅
- [x] Multi-provider LLM support (v3.2.2) ✅
- [x] Interactive AI chat (v3.2.2) ✅
- [x] Package alternatives with AI (v3.2.2) ✅
- [x] Historical tracking (v3.2.1) ✅
- [x] Snapshot comparison (v3.2.1) ✅
- [x] Timeline visualization (v3.2.1) ✅
- [x] Unified dashboard (v3.2.0) ✅
- [x] Intelligent clustering (v3.1.6) ✅

### Planned Features:
- [ ] **Web Dashboard** - Team health monitoring with AI insights
- [ ] **Monorepo Support** - Multi-project AI analysis

Want to contribute? Pick a feature and open an issue! 🚀

---# 🧭 DevCompass

**AI-powered dependency health checker with unified interactive dashboard featuring 5 dynamic layouts (Tree/Force/Radial/Conflict/Analytics), intelligent AI recommendations, multi-provider LLM support, modular CSS/JS architecture, intelligent clustering (Ecosystem/Health/Depth grouping), real-time filtering, advanced zoom controls, theme support (dark/light), supply chain security with auto-fix, license conflict resolution, package quality auto-fix, batch fix modes, backup & rollback, historical tracking with SQLite database, snapshot comparison, timeline visualization, and professional dependency exploration.**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, **detect security vulnerabilities**, **get AI-powered recommendations**, **ask questions about your dependencies**, **find package alternatives with AI**, **chat with AI about your project**, **monitor GitHub issues in real-time for 502 packages**, **configure your own GitHub token to avoid rate limits**, **customize all configuration via JSON files**, **visualize dependency graphs with 5 dynamic layouts including Analytics dashboard**, **modular architecture with zero code duplication**, **organize packages by ecosystem (React/Vue/Angular/Testing/Build Tools)**, **group by health status (Critical/Warning/Healthy)**, **analyze by depth levels**, **instant layout switching**, **dark/light theme toggle**, **real-time filtering**, **advanced zoom controls**, **track dependency changes over time with SQLite database**, **compare snapshots to see what changed**, **visualize evolution with interactive timelines**, **check bundle sizes**, **verify licenses**, **detect and auto-fix supply chain attacks**, **resolve license conflicts automatically**, **replace abandoned/deprecated packages automatically**, **analyze package quality**, **batch fix with granular control**, **manage backups and rollback changes**, and **automatically fix issues with dry-run, progress tracking, and backups**. Perfect for **CI/CD pipelines** with JSON output and exit codes.

> **🤖 LATEST v3.2.2:** AI-Powered Analysis - Get intelligent recommendations from OpenAI, Anthropic, Google, or FREE local AI! 🤖  
> **📊 v3.2.1:** Historical Tracking System - Track changes, compare snapshots, visualize trends! 📊  
> **🎨 v3.2.0:** Unified Dashboard Architecture - 50% less code, 5 layouts, dark/light themes! 🎨

## 🎉 Latest Release: v3.2.2 (2026-04-26)

**AI-Powered Dependency Analysis - Smart Recommendations from AI!**

### 🌟 What's New in v3.2.2:

#### **🤖 AI-Powered Analysis**

Get intelligent, context-aware recommendations from AI to help you maintain healthier dependencies.

**Features:**
- ✅ **Multi-Provider Support** - OpenAI, Anthropic (Claude), Google (Gemini), Ollama (FREE local)
- ✅ **Encrypted Token Storage** - AES-256-GCM encryption for API keys
- ✅ **Context-Aware** - AI analyzes your specific project data
- ✅ **Real-Time Streaming** - See responses as they're generated
- ✅ **Interactive Chat** - Multi-turn conversations about your dependencies
- ✅ **Cost Tracking** - Monitor token usage and estimated costs
- ✅ **FREE Option** - Use local AI with Ollama (no API costs)
- ✅ **Package Alternatives** - AI suggests better replacements
- ✅ **Smart Prioritization** - Critical → High → Medium recommendations

**AI Commands:**
```bash
# Setup AI provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm test openai

# Or use FREE local AI
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Get AI-powered analysis
devcompass analyze --ai

# Ask questions
devcompass ai ask "Should I update axios to version 1.15.2?"
devcompass ai ask "What are the security risks in my project?"

# Find alternatives
devcompass ai alternatives moment

# Interactive chat
devcompass ai chat

# View usage
devcompass llm stats
```

**What AI Can Help With:**
- 🔍 **Explain why** packages are outdated
- 🛡️ **Identify** breaking changes in updates
- 📝 **Suggest** migration strategies
- 🔄 **Find** better package alternatives
- ⚡ **Prioritize** updates by risk level
- 🔒 **Explain** security vulnerabilities
- 📋 **Provide** step-by-step fixes

**Privacy & Security:**
- 🔒 Tokens encrypted with AES-256-GCM
- 💾 Stored locally in `~/.devcompass/ai.db`
- 🚫 Your code is never sent to AI (only analysis metadata)
- 🆓 FREE local option with complete privacy

**Supported AI Providers:**

| Provider | Models | Cost | Best For |
|----------|--------|------|----------|
| **OpenAI** | GPT-4, GPT-4 Turbo, GPT-3.5 | ~$0.03/1K tokens | Fast, accurate responses |
| **Anthropic** | Claude 3.5 Sonnet, Opus, Haiku | ~$0.003/1K tokens | Detailed analysis |
| **Google** | Gemini Pro, Gemini 1.5 Pro | ~$0.00025/1K tokens | Cost-effective |
| **Ollama** | Llama 3, Mistral, CodeLlama | **FREE** | Privacy, no limits |

#### **💰 Cost Comparison**

**Example: 50 AI queries per month**

| Provider | Monthly Cost |
|----------|--------------|
| OpenAI GPT-4 | ~$4.50 |
| Anthropic Claude | ~$0.90 |
| Google Gemini | ~$0.04 |
| **Ollama (Local)** | **$0.00 FREE!** |

## ✨ All Features

- 🤖 **AI-Powered Analysis** (v3.2.2) - Multi-provider LLM integration
- 💬 **Interactive AI Chat** (v3.2.2) - Ask questions, get answers
- 🔄 **Package Alternatives** (v3.2.2) - AI-suggested replacements
- 🔒 **Encrypted Tokens** (v3.2.2) - AES-256-GCM security
- 📊 **Cost Tracking** (v3.2.2) - Monitor AI usage
- 📊 **Historical Tracking** (v3.2.1) - SQLite database, auto-save snapshots
- 🔍 **Snapshot Comparison** (v3.2.1) - Side-by-side diff analysis
- 📈 **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- 🗂️ **Flexible Dates** (v3.2.1) - 9 date formats supported
- 🎨 **Unified Dashboard** (v3.2.0) - 5 layouts, modular architecture
- 📊 **Analytics Layout** (v3.2.0) - Statistics dashboard
- 🌙 **Theme Support** (v3.2.0) - Dark/light mode toggle
- ⚡ **Performance** (v3.2.0) - 4-6× faster rendering
- 🔧 **Dynamic Data Configuration** (v3.1.7) - JSON-based scalable config
- 🔲 **Intelligent Clustering** (v3.1.6) - Ecosystem/Health/Depth grouping
- 🔑 **GitHub Token Config** (v3.1.5) - User tokens, no rate limits
- 📦 **502 Tracked Packages** (v3.1.5) - Comprehensive monitoring

## 🚀 Installation

```bash
# Global (recommended)
npm install -g devcompass@3.2.2

# Local
npm install --save-dev devcompass@3.2.2

# One-time use
npx devcompass@3.2.2 analyze

# Upgrade from any version
npm install -g devcompass@3.2.2
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

# Generate graph (with 5 layouts + themes!)
devcompass graph --open

# Auto-fix issues
devcompass fix
devcompass fix --batch
devcompass fix --dry-run
```

### AI Commands (NEW in v3.2.2)

```bash
# Setup AI provider
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet
devcompass llm add --provider google --token xxx --model gemini-pro
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Manage providers
devcompass llm list
devcompass llm default openai
devcompass llm test openai
devcompass llm remove openai
devcompass llm stats

# AI Analysis
devcompass analyze --ai
devcompass analyze --ai --ai-provider anthropic

# Ask AI questions
devcompass ai ask "Why is my health score low?"
devcompass ai ask "Should I update axios now?"
devcompass ai ask "What are the breaking changes in React 19?"

# Get recommendations
devcompass ai recommend

# Find alternatives
devcompass ai alternatives moment
devcompass ai alternatives request
devcompass ai alternatives lodash

# Interactive chat
devcompass ai chat
devcompass ai chat --provider anthropic
```

### History Commands (v3.2.1)

```bash
# List snapshots
devcompass history list
devcompass history list --limit 50
devcompass history list --month 04-2026

# Compare snapshots
devcompass compare 5 8
devcompass compare 5 8 --verbose

# Timeline
devcompass timeline --open
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

**Interactive Chat:**
```bash
$ devcompass ai chat

🤖 DevCompass AI Assistant
Ask me anything about your dependencies!

You: Should I remove lodash and moment since they're unused?

🤖 Yes, remove them:
- lodash: 1.3 MB saved
- moment: 4.1 MB saved
Total saved: 5.4 MB

Command: npm uninstall lodash moment

This will improve your health score from 0.5/10 to ~5.3/10!

You: exit
👋 Chat ended. Used 245 tokens (~$0.0001)
```

### Cost Tracking

```bash
$ devcompass llm stats

📊 AI Usage Statistics - 2026-04

local (llama3.2)
   Requests: 28
   Tokens: 11,923
   Cost: $0.0000

──────────────────────────────────
Total Requests: 28
Total Tokens: 11,923
Total Cost: $0.0000

📈 Projected monthly cost: $0.00
```

### Privacy & Security

**What Gets Sent to AI:**
- ✅ Package names and versions
- ✅ Vulnerability counts
- ✅ Health score
- ✅ Outdated/unused package lists

**What Doesn't Get Sent:**
- ❌ Your source code
- ❌ File contents
- ❌ Environment variables
- ❌ API keys

**Encryption:**
- AES-256-GCM encryption for API tokens
- Machine-specific encryption keys
- Tokens stored in `~/.devcompass/ai.db`
- Never sent to DevCompass servers

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

**"API key invalid"**
```bash
# Update token
devcompass llm update openai --token sk-new-token

# Test it
devcompass llm test openai
```

**"Quota exceeded"**
```bash
# Check usage
devcompass llm stats

# Switch to free provider
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434
devcompass llm default local
```

### Common Issues

**"Command not found"**
```bash
npm install -g devcompass@3.2.2
```

**Old version**
```bash
npm update -g devcompass
devcompass --version  # Should show 3.2.2
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

- [x] AI-powered analysis (v3.2.2) ✅
- [x] Multi-provider LLM support (v3.2.2) ✅
- [x] Interactive AI chat (v3.2.2) ✅
- [x] Package alternatives with AI (v3.2.2) ✅
- [x] Historical tracking (v3.2.1) ✅
- [x] Snapshot comparison (v3.2.1) ✅
- [x] Timeline visualization (v3.2.1) ✅
- [x] Unified dashboard (v3.2.0) ✅
- [x] Intelligent clustering (v3.1.6) ✅

### Planned Features:
- [ ] **Web Dashboard** - Team health monitoring with AI insights
- [ ] **Monorepo Support** - Multi-project AI analysis

Want to contribute? Pick a feature and open an issue! 🚀

---

## 📊 Version History

### v3.2.2 (2026-04-26) - AI-Powered Analysis
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

*DevCompass v3.2.2 - AI-Powered Dependency Intelligence!* 🧭🤖

**Like Lighthouse for your dependencies, now with AI superpowers** ⚡


## 📊 Version History

### v3.2.2 (2026-04-26) - AI-Powered Analysis
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

*DevCompass v3.2.2 - AI-Powered Dependency Intelligence!* 🧭🤖

**Like Lighthouse for your dependencies, now with AI superpowers** ⚡
