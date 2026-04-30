# Migration Guide

## From v3.2.2 → v3.2.3

### What's New
- **🎯 Feature Complete**: All 10 CLI commands now fully functional (was 6/10)
- **📊 Graph Visualization**: Interactive dependency graphs with dynamic controls
- **📸 Snapshot Management**: Complete snapshot lifecycle (save/list/view/delete)
- **🔄 Snapshot Comparison**: Side-by-side diff of any two snapshots
- **💾 Backup Management**: Manual backup operations with restore capability
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.2.3
```

### What Changed
- **Added**: 4 new command files (1,560 lines total)
  - `src/commands/graph.js` (450 lines) - Interactive dependency visualization
  - `src/commands/snapshot.js` (380 lines) - Snapshot CRUD operations
  - `src/commands/compare.js` (320 lines) - Snapshot comparison engine
  - `src/commands/backup.js` (410 lines) - Backup lifecycle management
- **Modified**: `bin/devcompass.js` - Added 4 new command integrations
- **No Changes**: All v3.2.2 AI features intact (LLM integration, encryption, chat)
- **No Changes**: All v3.2.1 history features intact (timeline, tracking)

### New Commands Available

#### **Graph Visualization**
```bash
# Generate interactive dependency graph
devcompass graph                            # Default tree layout
devcompass graph --layout force             # Force-directed layout
devcompass graph --filter vulnerable        # Show only vulnerable packages
devcompass graph --open                     # Open in browser
devcompass graph --output dashboard.html    # Custom filename

# Available layouts: tree, force, radial, conflict
# Available filters: all, vulnerable, outdated, unused, deprecated
```

**Interactive Features:**
- 🎨 Switch layouts without page reload (Tree/Force/Radial/Conflict)
- 🔍 Real-time filtering (Vulnerable/Outdated/Unused/Deprecated)
- 🔢 Depth slider (1-10 levels)
- 🔎 Search for packages
- 🖱️ Zoom and pan controls
- 💾 Export as PNG or JSON

**Output:**
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

#### **Snapshot Management**
```bash
# Save current state manually
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

**List Output:**
```
📋 Dependency Snapshots

ID    Project          Version     Health    Deps    Date
──────────────────────────────────────────────────────────────
70    test-project     1.0.0       0.5       6       2026-04-30 7:37:27 AM
69    test-project     1.0.0       0.5       6       2026-04-30 6:02:45 AM
68    devcompass       3.2.2       7.4       7       2026-04-29 7:34:06 PM

Total: 20 snapshot(s)
```

**View Output:**
```
📸 Snapshot #58

Project Information:
  Name: test-project
  Version: 1.0.0
  Date: 2026-04-26 6:13:31 PM

Health Metrics:
  Health Score: 0.5/10
  Total Dependencies: 6

Package Summary:
  🔴 Vulnerable: 2
  📦 Outdated: 6
  🗑️  Unused: 2

💡 Available Actions:
  Compare: devcompass compare <id1> <id2>
  Delete: devcompass snapshot delete 58
```

#### **Snapshot Comparison**
```bash
# Compare two snapshots
devcompass compare 51 52                    # Basic comparison
devcompass compare 51 52 --verbose          # Show all packages
devcompass compare 51 52 -o report.md       # Save to file
```

**Comparison Output:**
```
📊 Snapshot Comparison

Snapshots:
  #51 → #52
  2026-04-26 17:39:12 → 2026-04-26 17:42:44

Changes:
  Total Packages: 6 → 6 (0)
  Health Score: 0.50 → 0.50 (0.00)

  Added: 0
  Removed: 0
  Updated: 0
  Unchanged: 6
```

**With Changes:**
```
🔄 Updated Packages (9):

  ⟳ axios
     Version: 0.21.1 → 1.15.2
     Health: 8.2 → 6.2 (-2.0)
     🔴 New vulnerabilities detected

  ⟳ lodash
     Version: 4.17.20 → 4.18.1
     Health: 9.0 → 9.0 (0.0)
```

#### **Backup Management**
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

**Backup List Output:**
```
💾 DevCompass Backups

Found 3 backup(s):

1. backup-2026-04-26T19-50-37-541Z
   Created: Apr 27, 2026 01:20:37 (3 days ago)
   Files: package.json, package-lock.json
   Reason: Before automated fixes
   Fixes pending: 3
   Health score: 0.5/10

💡 COMMANDS:
   Restore: devcompass backup restore --name backup-2026-04-26T19-50-37-541Z
   Info: devcompass backup info --name backup-2026-04-26T19-50-37-541Z
   Clean: devcompass backup clean
```

**Backup Location:** `.devcompass-backups/` in project directory

### Command Completion Status

**Before v3.2.3: 6/10 commands** ❌
- ✅ analyze, fix, ai, llm, config, timeline
- ❌ graph, snapshot, compare, backup (missing)

**After v3.2.3: 10/10 commands** ✅
- ✅ analyze, fix, ai, llm, config, timeline
- ✅ **graph, snapshot, compare, backup** (new!)

### Performance

| Command | Operation | Time |
|---------|-----------|------|
| graph | Generate 86 nodes | <1s |
| graph | Export HTML (145KB) | <50ms |
| snapshot list | Query 20 snapshots | <10ms |
| snapshot view | Load snapshot data | <5ms |
| compare | Diff two snapshots | <1ms |
| backup list | Scan backup directory | <10ms |

**All operations are instant or near-instant!**

### Integration with Existing Features

#### **Graph + Analysis**
```bash
# Analyze first (for enrichment)
devcompass analyze

# Generate enriched graph
devcompass graph --open

# Graph shows:
# - Vulnerability status from analysis
# - Outdated packages from analysis  
# - Unused dependencies from analysis
# - Health scores from analysis
```

#### **Snapshot + History**
```bash
# Snapshots auto-save during analyze (v3.2.1)
devcompass analyze

# Manual snapshot save (v3.2.3)
devcompass snapshot save

# View all snapshots
devcompass snapshot list

# Compare any two
devcompass compare 1 2
```

#### **Backup + Fix**
```bash
# Fix auto-creates backup (existing behavior)
devcompass fix

# Manual backup before risky operation (v3.2.3)
devcompass backup list
devcompass backup restore --name backup-xxx
```

#### **Graph + AI**
```bash
# Analyze with AI
devcompass analyze --ai

# Generate graph with AI-enriched data
devcompass graph --filter vulnerable --open

# Ask AI about graph findings
devcompass ai ask "Why are these packages vulnerable?"
```

### Benefits

**For Visual Learners:**
- ✅ See dependency relationships graphically
- ✅ Understand package hierarchies visually
- ✅ Identify problem areas with color coding
- ✅ Export graphs for documentation

**For Version Control:**
- ✅ Save snapshots before major changes
- ✅ Compare before/after updates
- ✅ Track dependency evolution
- ✅ Audit historical changes

**For Safety:**
- ✅ Manual backups for critical operations
- ✅ Restore to known-good states
- ✅ Confirmation prompts prevent accidents
- ✅ Backup metadata tracks reasons

**For Teams:**
- ✅ Share interactive graphs in PRs
- ✅ Visual code reviews
- ✅ Track project health over time
- ✅ Document dependency decisions

### Breaking Changes
**None!** This is a drop-in upgrade.

- All v3.2.2 features intact (AI, LLM, encryption, chat, cost tracking)
- All v3.2.1 features intact (history, timeline, auto-snapshots)
- All v3.2.0 features intact (unified dashboard, themes)
- All v3.1.x features intact (clustering, GitHub tokens, dynamic config)
- All CLI commands work exactly the same
- Auto-snapshot still works (from analyze command)
- New commands are additive (not replacing anything)

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.3

# Test new graph command
cd /path/to/your/project
devcompass graph --open
# Should open interactive HTML in browser

# Test snapshot commands
devcompass snapshot list
# Should list all saved snapshots

devcompass snapshot view 1
# Should show snapshot details

# Test compare command
devcompass compare 1 2
# Should show comparison (needs 2 snapshots)

# Test backup commands
devcompass backup list
# Should list all backups

# Verify old features still work
devcompass analyze --ai        # AI still works
devcompass history list        # History still works
devcompass timeline --open     # Timeline still works
devcompass llm list            # LLM config still works
```

### Troubleshooting

**Graph not generating:**
```bash
# Ensure package.json exists
ls package.json

# Run analyze first for enrichment
devcompass analyze

# Then generate graph
devcompass graph --open
```

**Snapshot list empty:**
```bash
# Run analyze to create snapshots
devcompass analyze

# Check database exists
ls ~/.devcompass/history.db

# List snapshots
devcompass snapshot list
```

**Compare shows "Snapshot not found":**
```bash
# List available snapshots first
devcompass snapshot list

# Use valid IDs from list
devcompass compare 70 69
```

**Backup list empty:**
```bash
# Backups are created by fix command
devcompass fix --dry-run

# Or manually create backup
# (Not exposed as command yet, created by fix)

# Check backup directory
ls -la .devcompass-backups/
```

**Graph opens but shows errors:**
```bash
# Hard refresh browser
# Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)

# Regenerate with --open flag
devcompass graph --open
```

### Upgrade Path

**From v3.2.2:**
```bash
npm install -g devcompass@3.2.3

# Immediately available - no setup needed!
devcompass graph --open
devcompass snapshot list
devcompass compare 1 2
devcompass backup list
```

**From v3.2.1 or earlier:**
```bash
npm install -g devcompass@3.2.3

# You get ALL features:
# - v3.2.3: graph, snapshot, compare, backup commands
# - v3.2.2: AI integration, LLM management, encryption
# - v3.2.1: history tracking, timeline, comparison
# - v3.2.0: unified dashboard, themes
```

### What You Get (Full v3.2.3 Feature Set)
- ✅ **Graph Visualization** (v3.2.3) - Interactive dependency graphs
- ✅ **Snapshot Management** (v3.2.3) - Save/list/view/delete snapshots
- ✅ **Snapshot Comparison** (v3.2.3) - Side-by-side diff
- ✅ **Backup Management** (v3.2.3) - Manual backup operations
- ✅ **AI Integration** (v3.2.2) - Multi-provider, chat, recommendations
- ✅ **Encrypted Tokens** (v3.2.2) - AES-256-GCM security
- ✅ **Cost Tracking** (v3.2.2) - Monitor AI usage
- ✅ **FREE Local AI** (v3.2.2) - Ollama support
- ✅ **Historical Tracking** (v3.2.1) - SQLite database, auto-save
- ✅ **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- ✅ **Unified Dashboard** (v3.2.0) - 5 layouts, themes
- ✅ **Dynamic Config** (v3.1.7) - JSON-based
- ✅ **Clustering** (v3.1.6) - Ecosystem/Health/Depth
- ✅ **GitHub Tokens** (v3.1.5) - 5,000 req/hr

### Complete Command Reference

**All 10 Commands (100% Complete):**

1. **analyze** - Full dependency analysis with AI support
   ```bash
   devcompass analyze
   devcompass analyze --ai
   devcompass analyze --no-history
   ```

2. **fix** - Auto-fix issues with backup
   ```bash
   devcompass fix
   devcompass fix --dry-run
   devcompass fix --batch
   ```

3. **graph** - Interactive dependency visualization (NEW)
   ```bash
   devcompass graph --open
   devcompass graph --layout force
   devcompass graph --filter vulnerable
   ```

4. **snapshot** - Snapshot management (NEW)
   ```bash
   devcompass snapshot save
   devcompass snapshot list
   devcompass snapshot view 123
   devcompass snapshot delete 123
   ```

5. **compare** - Snapshot comparison (NEW)
   ```bash
   devcompass compare 51 52
   devcompass compare 51 52 --verbose
   ```

6. **backup** - Backup management (NEW)
   ```bash
   devcompass backup list
   devcompass backup restore --name backup-xxx
   devcompass backup clean
   ```

7. **timeline** - Health trend visualization
   ```bash
   devcompass timeline --open
   devcompass timeline --days 60
   ```

8. **ai** - AI-powered insights
   ```bash
   devcompass ai ask "question"
   devcompass ai recommend
   devcompass ai alternatives moment
   devcompass ai chat
   ```

9. **llm** - AI provider management
   ```bash
   devcompass llm add --provider openai
   devcompass llm list
   devcompass llm test openai
   devcompass llm stats
   ```

10. **config** - DevCompass configuration
    ```bash
    devcompass config --github-token ghp-xxx
    devcompass config --show
    ```

### Rollback (if needed)
```bash
# Downgrade to v3.2.2
npm install -g devcompass@3.2.2

# All v3.2.2 features still work
# You'll just lose the 4 new commands:
# - graph, snapshot, compare, backup
```

### Known Limitations

- Graph limited to 500+ nodes (performance optimization)
- Snapshots stored locally only (no cloud sync)
- Backups require manual cleanup (auto-cleanup available with --keep flag)
- Comparison requires 2 different snapshots
- Snapshot delete is permanent (no undo)

### Real-World Usage

**Example Workflow:**
```bash
# 1. Analyze project
devcompass analyze --ai

# 2. Save snapshot before changes
devcompass snapshot save

# 3. Visualize dependencies
devcompass graph --open

# 4. Make changes to package.json
npm install some-package

# 5. Analyze again
devcompass analyze

# 6. Compare before/after
devcompass snapshot list
devcompass compare 70 71

# 7. View changes graphically
devcompass graph --filter outdated --open

# 8. Apply fixes
devcompass fix

# 9. Verify backup created
devcompass backup list
```

**Team Workflow:**
```bash
# Developer 1: Before PR
devcompass analyze --ai
devcompass graph --output pr-graph.html
# Attach pr-graph.html to PR

# Developer 2: Review PR
# Download pr-graph.html
# Open in browser to review dependencies visually

# After merge:
devcompass snapshot save
devcompass compare before-merge-id after-merge-id
```

### Migration Checklist

- [x] Upgrade to v3.2.3
- [x] Verify version: `devcompass --version`
- [x] Test graph: `devcompass graph --open`
- [x] Test snapshots: `devcompass snapshot list`
- [x] Test compare: `devcompass compare 1 2`
- [x] Test backup: `devcompass backup list`
- [x] Verify AI still works: `devcompass ai ask "test"`
- [x] Verify history still works: `devcompass history list`
- [x] Verify timeline still works: `devcompass timeline`

---

## From v3.2.1 → v3.2.2

### What's New
- **🤖 AI-Powered Analysis**: Multi-provider LLM integration (OpenAI, Anthropic, Google, Ollama)
- **🔒 Encrypted Token Storage**: AES-256-GCM encryption for API keys
- **💬 Interactive AI Chat**: Multi-turn conversations with conversation history
- **📊 Context-Aware Recommendations**: AI analyzes your specific project data
- **⚡ Real-Time Streaming**: See AI responses as they're generated
- **💰 Cost Tracking**: Monitor token usage and estimated costs per provider
- **🆓 FREE Local Option**: Use Ollama at zero cost with complete privacy
- **🔧 Security Fix**: Upgraded uuid from 9.0.1 to 14.0.0 (fixes CVE-2026-41907)
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.2.2
```

### What Changed
- **Added**: `src/ai/` module (11 files, 1,554 lines)
  - `database.js` - SQLite schema for AI data
  - `token-manager.js` - Encrypted token CRUD operations
  - `context-builder.js` - Analysis context preparation (9 sections)
  - `prompt-templates.js` - Optimized system prompts for AI
  - `conversation.js` - Session and conversation history management
  - `cost-tracker.js` - Token usage and cost statistics
  - `providers/base-provider.js` - Abstract base class
  - `providers/openai.js` - GPT-4, GPT-3.5 implementation
  - `providers/anthropic.js` - Claude 3.5 Sonnet implementation
  - `providers/google.js` - Gemini Pro implementation
  - `providers/local.js` - Ollama (FREE local) implementation
- **Added**: `src/commands/ai.js` - AI command suite (359 lines)
- **Added**: `src/commands/llm.js` - LLM provider management (336 lines)
- **Added**: `src/utils/encryption.js` - AES-256-GCM crypto utilities (74 lines)
- **Added**: `src/utils/stream-formatter.js` - Real-time streaming formatter (49 lines)
- **Modified**: `bin/devcompass.js` - Added llm/ai commands (506 lines)
- **Modified**: `src/commands/analyze.js` - Added --ai flag integration
- **Modified**: `package.json` - Upgraded uuid to 14.0.0
- **Added**: `~/.devcompass/ai.db` - SQLite database (created automatically)

### New Commands Available

#### **LLM Provider Management**
```bash
# Add AI providers
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet
devcompass llm add --provider google --token xxx --model gemini-pro
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Manage providers
devcompass llm list                    # List all configured providers
devcompass llm default openai          # Set default provider
devcompass llm test openai            # Test provider connection
devcompass llm enable openai          # Enable provider
devcompass llm disable openai         # Disable provider
devcompass llm update openai --token  # Update provider settings
devcompass llm remove openai          # Remove provider
devcompass llm stats                  # View usage statistics and costs
```

#### **AI Analysis**
```bash
# AI-powered analysis
devcompass analyze --ai                                    # Get AI recommendations
devcompass analyze --ai --ai-provider anthropic            # Use specific provider

# Ask questions
devcompass ai ask "Should I update axios to version 1.15.2?"
devcompass ai ask "What are the security risks in my project?"
devcompass ai ask "Why is my health score low?"

# Get prioritized recommendations
devcompass ai recommend

# Find package alternatives
devcompass ai alternatives moment
devcompass ai alternatives request
devcompass ai alternatives lodash

# Interactive chat mode
devcompass ai chat
devcompass ai chat --provider openai
```

### Quick Start: FREE Local AI

**Option 1: Ollama (Recommended - 100% FREE)**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve &

# Pull a model (choose one):
ollama pull llama3.2       # 2GB - Balanced
ollama pull qwen2.5:0.5b   # 397MB - Smallest/Fastest
ollama pull mistral        # 4GB - More capable

# Add to DevCompass
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Test it
devcompass llm test local

# Use it!
devcompass analyze --ai
devcompass ai ask "What should I fix first?"
devcompass ai chat
```

**Option 2: OpenAI (Paid)**
```bash
# Get API key from: https://platform.openai.com/api-keys

# Add to DevCompass
devcompass llm add --provider openai --token sk-your-key --model gpt-4o-mini

# Test it
devcompass llm test openai

# Use it!
devcompass analyze --ai
```

### AI Provider Comparison

| Provider | Models | Cost per 1K tokens | Monthly Cost (50 queries) | Best For |
|----------|--------|-------------------|--------------------------|----------|
| **Ollama** | Llama 3, Mistral, Qwen | **$0.00 FREE** | **$0.00** | Privacy, unlimited use |
| **Google** | Gemini Pro, 1.5 Pro | ~$0.00025 | ~$0.04 | Most cost-effective |
| **Anthropic** | Claude 3.5 Sonnet | ~$0.003 | ~$0.90 | Detailed analysis |
| **OpenAI** | GPT-4, GPT-4 Turbo | ~$0.03 | ~$4.50 | Fast, accurate |

### Context-Aware Analysis

AI receives 9 analysis sections from your project:

1. **📋 Project Overview** - Name, version, health score
2. **💊 Health Metrics** - Dependencies, vulnerabilities
3. **🔒 Security Issues** - Vulnerabilities with severity levels
4. **📦 Outdated Packages** - Current → latest versions
5. **⚠️ Deprecated Packages** - Replacement suggestions
6. **🗑️ Unused Dependencies** - Removal candidates
7. **🛡️ Supply Chain Risks** - Typosquatting, malicious packages
8. **⚖️ License Issues** - GPL/AGPL conflicts
9. **📏 Bundle Size** - Heavy packages >1MB

**Privacy:** Your source code is NEVER sent to AI!

### Security & Privacy

**Encrypted Token Storage:**
- AES-256-GCM authenticated encryption
- Machine-specific encryption keys
- Stored locally in `~/.devcompass/ai.db`
- Never transmitted to DevCompass servers
- Tamper detection with auth tags

**What Gets Sent to AI:**
- ✅ Package names and versions
- ✅ Vulnerability counts (not details)
- ✅ Health scores
- ✅ Outdated/unused package lists

**What NEVER Gets Sent:**
- ❌ Your source code
- ❌ File contents
- ❌ Environment variables
- ❌ API keys
- ❌ Sensitive data

**FREE Local Option:**
- Ollama runs 100% locally
- No data leaves your machine
- No API costs
- No rate limits
- Complete privacy

### Cost Tracking

Monitor your AI usage:

```bash
$ devcompass llm stats

📊 AI Usage Statistics - 2026-04

local (llama3.2)
   Requests: 28
   Tokens: 11,923
   Cost: $0.0000

openai (gpt-4o-mini)
   Requests: 5
   Tokens: 2,341
   Cost: $0.0702

──────────────────────────────────
Total Requests: 33
Total Tokens: 14,264
Total Cost: $0.0702

📈 Projected monthly cost: $2.11
```

### Example Interactions

**Get AI-Powered Analysis:**
```bash
$ devcompass analyze --ai

🤖 AI Recommendations

🔴 CRITICAL (Do Now):
- Security Vulnerabilities (24 total)
  → Run: npm audit fix
  → Why: 3 high-severity issues expose your app

🟡 HIGH PRIORITY (This Week):
- Update axios (0.21.1 → 1.15.2)
  → Why: Contains known CVEs
  → Breaking changes: Response format changed
```

**Ask Specific Questions:**
```bash
$ devcompass ai ask "Should I update axios from 0.21.1 to 1.15.2?"

🤖 Yes, you should update axios:

Security: Version 0.21.1 has critical vulnerabilities
Breaking Changes: Response.data format changed
Migration: Update interceptors, test error handling
Command: npm install axios@latest

Test thoroughly before deploying!
```

**Find Alternatives:**
```bash
$ devcompass ai alternatives moment

🔍 Finding alternatives for "moment"

🤖 Top 3 Alternatives:

1️⃣ date-fns (~2KB vs 67KB)
   - Tree-shakeable, modern API
   - Migration: Easy

2️⃣ dayjs (~2KB)
   - moment.js compatible API
   - Migration: Drop-in replacement

3️⃣ Luxon (~15KB)
   - Better timezone support
   - Migration: Medium
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

You: What's the best alternative to moment?

🤖 I recommend date-fns:
- Size: ~2KB (vs 67KB)
- Tree-shakeable
- Modern API

You: exit
👋 Chat ended. Used 245 tokens (~$0.0001)
```

### Database Location
```bash
~/.devcompass/ai.db
```

**Storage:**
- ~2KB per conversation
- SQLite with WAL mode
- Encrypted API tokens
- Conversation history (last 5 turns)

### Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Token encryption | <1ms | AES-256-GCM |
| Token decryption | <1ms | With auth verification |
| Database save | 8-15ms | SQLite WAL mode |
| AI first response | <2s | Streaming starts |
| Full AI response | 5-10s | Depends on length |
| Context building | <50ms | 9 analysis sections |

### Benefits

**For Developers:**
- 💡 Get instant answers about dependency updates
- 🔍 Understand breaking changes before updating
- 🔄 Find modern alternatives to deprecated packages
- 📚 Learn migration strategies from AI

**For Teams:**
- 🚀 Faster code reviews with AI insights
- 📊 Data-driven dependency decisions
- 🎓 Share AI knowledge across team
- ⚠️ Catch issues before they become problems

**For DevOps/CI/CD:**
- 🤖 Automated dependency insights in pipelines
- 📈 Smart alerts for critical issues
- 🔧 AI-powered upgrade recommendations

### Security Fix: uuid Vulnerability

**Fixed in v3.2.2:**
- Upgraded uuid from 9.0.1 to 14.0.0
- Fixes CVE-2026-41907 (CVSS 6.3 Medium)
- CWE-1285: Improper buffer validation
- No breaking changes

**Impact on DevCompass:** LOW
- uuid used only for session ID generation
- No external buffer manipulation
- No user data exposure risk

### Security Enhancement: GitHub Token Encryption

**NEW in v3.2.2:**
- GitHub tokens now encrypted with AES-256-GCM (was plain text)
- Unified config database (`~/.devcompass/config.db`)
- Auto-migration from legacy storage
- Machine-specific encryption keys
- Same security level as AI tokens

**What Changed:**
- Tokens moved from `~/.devcompass/github-token` (plain text)
- To `~/.devcompass/config.db` (encrypted)
- Legacy file automatically deleted after migration
- Migration happens on first use after upgrade

**Migration Behavior:**
```bash
# First command after upgrading
$ devcompass analyze

# You'll see:
✓ Migrated GitHub token to encrypted database
⚡ GitHub check completed in 1.13s

# Verify migration
$ devcompass config --show
✓ GitHub token configured: ghp_s2y***6ybw
  Stored encrypted in: ~/.devcompass/config.db

# Legacy file is gone
$ ls ~/.devcompass/github-token
ls: No such file or directory  # ✅ Deleted
```

**Security Improvements:**
- 🔒 AES-256-GCM authenticated encryption (was plain text)
- 🔒 Machine-specific encryption keys
- 🔒 Tamper detection with auth tags
- 🔒 Consistent with AI token storage
- 🔒 No manual action required

**Impact on DevCompass:** None
- Token still works for GitHub API calls
- No rate limit changes
- Fully backward compatible
- Auto-migration is seamless

**Breaking Changes:** None
- Existing tokens auto-migrate on first use
- No user action required
- Fully backward compatible
- Legacy file removed after migration

### Breaking Changes
**None!** This is a drop-in upgrade.

- All v3.2.1 features intact (history tracking, comparison, timeline)
- All v3.2.0 features intact (unified dashboard, 5 layouts, themes)
- All v3.1.x features intact (clustering, GitHub tokens, dynamic config)
- All CLI commands work exactly the same
- `--ai` flag is completely optional
- AI features are opt-in (requires provider setup)
- Snapshots still auto-save (disable with `--no-history`)

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.2

# Setup FREE local AI
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama3.2
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Test AI features
devcompass llm test local
devcompass analyze --ai
devcompass ai ask "What should I fix first?"
devcompass ai chat

# Verify history still works
devcompass history list
devcompass compare 1 2

# Verify graph still works
devcompass graph --open

# Check costs
devcompass llm stats
```

### Troubleshooting

**No AI provider configured:**
```bash
# Add a provider first
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Or use OpenAI
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini
```

**Ollama connection failed:**
```bash
# Check Ollama is running
ps aux | grep ollama

# Restart Ollama
ollama serve &

# Test connection
devcompass llm test local
```

**API key invalid:**
```bash
# Update token
devcompass llm update openai --token sk-new-token

# Test it
devcompass llm test openai
```

**Quota exceeded:**
```bash
# Check usage
devcompass llm stats

# Switch to free provider
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434
devcompass llm default local
```

**AI responses too verbose:**
```bash
# This is expected with smaller models like qwen2.5:0.5b
# Upgrade to better model:
ollama pull llama3.2
devcompass llm update local --model llama3.2

# Or use paid providers for concise responses:
devcompass llm add --provider anthropic --token sk-ant-xxx --model claude-3-5-sonnet
devcompass llm default anthropic
```

### Upgrade Path

**From v3.2.1:**
```bash
npm install -g devcompass@3.2.2

# Optional: Setup AI
# Option 1: FREE local (recommended)
curl -fsSL https://ollama.com/install.sh | sh
ollama serve &
ollama pull llama3.2
devcompass llm add --provider local --model llama3.2 --base-url http://localhost:11434

# Option 2: OpenAI (paid)
devcompass llm add --provider openai --token sk-xxx --model gpt-4o-mini

# Use it
devcompass analyze --ai
```

**From v3.2.0 or earlier:**
```bash
npm install -g devcompass@3.2.2
# You get ALL v3.2.1 features + v3.2.2 AI features
# Historical tracking + unified dashboard + AI integration
```

### What You Get (Full v3.2.2 Feature Set)
- ✅ **AI Integration** (v3.2.2) - Multi-provider, chat, recommendations
- ✅ **Encrypted Tokens** (v3.2.2) - AES-256-GCM security
- ✅ **Cost Tracking** (v3.2.2) - Monitor AI usage
- ✅ **FREE Local AI** (v3.2.2) - Ollama support
- ✅ **Historical Tracking** (v3.2.1) - SQLite database, auto-save
- ✅ **Snapshot Comparison** (v3.2.1) - Side-by-side diff
- ✅ **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- ✅ **Unified Dashboard** (v3.2.0) - 5 layouts, themes
- ✅ **Dynamic Config** (v3.1.7) - JSON-based
- ✅ **Clustering** (v3.1.6) - Ecosystem/Health/Depth
- ✅ **GitHub Tokens** (v3.1.5) - 5,000 req/hr
- ✅ All previous features (batch fixes, auto-fix, backup/rollback)

### Rollback (if needed)
```bash
# Downgrade to v3.2.1
npm install -g devcompass@3.2.1

# AI database will remain (safe to delete if needed)
rm ~/.devcompass/ai.db

# History database still works
devcompass history list
```

---

## From v3.2.0 → v3.2.1

### What's New
- **Historical Tracking System**: SQLite database for automatic snapshot storage
- **Snapshot Comparison**: Side-by-side diff of any two snapshots
- **Timeline Visualization**: Interactive D3 charts showing dependency evolution
- **9 Flexible Date Formats**: DD-MM-YYYY, MM-YYYY, YYYY, YYYY-MM-DD, YYYY-MM
- **Auto-Grouped Display**: Automatic monthly grouping for >20 snapshots
- **Monthly Summary**: Aggregated statistics per month
- **Bug Fixes**: Typosquatting false positives eliminated (distance 2→1)
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.2.1
```

### What Changed
- **Added**: `src/history/` module (5 files)
  - `database.js` - SQLite connection and schema
  - `snapshot-saver.js` - Transaction-based saving
  - `snapshot-loader.js` - Query methods with date filtering
  - `comparator.js` - Snapshot comparison engine
  - `timeline-generator.js` - Timeline data and D3 charts
- **Added**: `src/utils/date-parser.js` - Smart date parser (9 formats)
- **Added**: `src/commands/` - 3 new CLI commands
  - `history.js` - History management
  - `compare.js` - Snapshot comparison
  - `timeline.js` - Timeline generation
- **Modified**: `src/commands/analyze.js` - Auto-save snapshots to database
- **Modified**: `src/services/dynamic-security.js` - Fixed typosquatting threshold (2→1)
- **Modified**: `data/popular-packages.json` - Added knip to whitelist
- **Added**: `~/.devcompass/history.db` - SQLite database (created automatically)

### New Commands Available
```bash
# History management
devcompass history list                    # List all snapshots
devcompass history list --date 25-04-2026  # Filter by date
devcompass history list --month 04-2026    # Filter by month
devcompass history list --year 2026        # Filter by year
devcompass history show 5                  # Show snapshot details
devcompass history summary                 # Monthly breakdown
devcompass history cleanup --keep 30       # Delete old snapshots
devcompass history stats                   # Overall statistics

# Snapshot comparison
devcompass compare 5 8                     # Compare two snapshots
devcompass compare 5 8 --verbose           # Detailed comparison
devcompass compare 5 8 -o report.md        # Save to file

# Timeline visualization
devcompass timeline                        # Generate timeline
devcompass timeline --days 60              # Last 60 days
devcompass timeline --open                 # Open interactive chart
devcompass timeline -o my-timeline.html    # Custom output
```

### Date Filtering
All history commands support 9 date formats:

```bash
# European formats
--date 25-04-2026      # DD-MM-YYYY (day)
--month 04-2026        # MM-YYYY (month)

# ISO formats
--date 2026-04-25      # YYYY-MM-DD (day)
--month 2026-04        # YYYY-MM (month)

# Year only
--year 2026            # YYYY

# Date ranges
--from 01-04-2026 --to 30-04-2026
--after 15-04-2026
--before 30-04-2026
```

### Auto-Save Feature
Snapshots are **automatically saved** on every `devcompass analyze`:

```bash
# Auto-saves snapshot
devcompass analyze

# Output:
# ✔ Scanned 6 dependencies in project
# 📸 Snapshot saved (ID: 40, 19ms)
#    Use "devcompass history list" to view all snapshots

# Disable auto-save if needed
devcompass analyze --no-history
```

### New Features Available
- **📊 Automatic Tracking** - Every analysis saved to SQLite database
- **🔍 Snapshot Comparison** - See exactly what changed between versions
- **📈 Timeline Charts** - Visualize dependency evolution over time
- **🗂️ Flexible Queries** - 9 date formats for natural searching
- **📊 Grouped Display** - Auto-groups >20 snapshots by month
- **📊 Monthly Summary** - Aggregated statistics per month
- **⚡ Ultra-Fast** - 6-83× faster than performance targets
- **🐛 Bug Fixes** - Zero false positives for typosquatting

### Performance
| Operation | Target | Actual | Improvement |
|-----------|--------|--------|-------------|
| Snapshot Save | <100ms | 8-19ms | **6-11× faster** |
| Snapshot Load | <50ms | ~4ms | **12× faster** |
| Comparison | <200ms | 4-5ms | **50× faster** |
| Timeline Gen | <500ms | 6ms | **83× faster** |
| Database Size | ~5KB | ~3KB | **40% smaller** |

### Database Location
```bash
~/.devcompass/history.db
```

**Storage:**
- ~3KB per snapshot
- SQLite with WAL mode
- 4 optimized indexes
- <10ms query speed

### Benefits
- **Zero Configuration** - Works automatically, no setup needed
- **Automatic Tracking** - Build dependency history over time
- **Fast Queries** - <10ms for all operations
- **Lightweight** - Only 3KB per snapshot
- **Regression Detection** - Spot when health scores drop
- **Audit Trail** - Complete history of dependency changes
- **Data-Driven Decisions** - See trends and patterns
- **CI/CD Integration** - Compare builds automatically

### Breaking Changes
**None!** This is a drop-in upgrade.

- All v3.2.0 features intact (unified dashboard, 5 layouts, themes)
- All v3.1.7 features intact (dynamic configuration)
- All v3.1.6 features intact (clustering)
- All v3.1.5 features intact (GitHub tokens)
- All CLI commands work exactly the same
- Snapshots saved automatically (can disable with `--no-history`)
- Database created automatically on first analyze
- Graph visualization unchanged
- Configuration files unchanged

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.1

# Run analysis (auto-saves snapshot)
cd /path/to/your/project
devcompass analyze

# View history
devcompass history list

# Compare snapshots (after running analyze twice)
devcompass analyze  # Creates snapshot #1
# Make changes...
devcompass analyze  # Creates snapshot #2
devcompass compare 1 2

# Generate timeline (needs multiple snapshots)
devcompass timeline --open

# Test date filtering
devcompass history list --date 26-04-2026
devcompass history list --month 04-2026

# Verify bug fixes
# Should show NO typosquatting warnings for knip
devcompass analyze
```

### Troubleshooting

**Database not created:**
```bash
# Check if database exists
ls -la ~/.devcompass/history.db

# If missing, run analyze
devcompass analyze

# Check for errors
DEBUG=1 devcompass analyze
```

**Date format not recognized:**
```bash
# Use supported formats:
# DD-MM-YYYY: 25-04-2026
# MM-YYYY: 04-2026
# YYYY: 2026
# YYYY-MM-DD: 2026-04-25
# YYYY-MM: 2026-04

# Example:
devcompass history list --date 25-04-2026
```

**Timeline not generating:**
```bash
# Ensure you have multiple snapshots
devcompass history list

# If you only have 1 snapshot, run analyze again
devcompass analyze

# Then generate timeline
devcompass timeline --open
```

**Comparison showing no changes:**
```bash
# Verify snapshot IDs exist
devcompass history list

# Compare different snapshots
devcompass compare  

# Example:
devcompass compare 1 5
```

**Typosquatting still showing false positives:**
```bash
# Verify you're on v3.2.1
devcompass --version

# If still on 3.2.0, upgrade
npm install -g devcompass@3.2.1

# Test
devcompass analyze
# Should show: ✅ SUPPLY CHAIN SECURITY - No supply chain risks detected!
```

**"Knip analysis unavailable" warning:**
```bash
# This is normal - Knip fallback is working
# Warning only shows in DEBUG mode now

# To verify it's suppressed:
devcompass analyze
# Should NOT show "Knip failed" message

# In DEBUG mode (should show):
DEBUG=1 devcompass analyze
# Shows: "Knip analysis unavailable, using fallback"
```

### Upgrade Path

**From v3.2.0:**
```bash
npm install -g devcompass@3.2.1
devcompass analyze  # Starts tracking history automatically
```

**From v3.1.x:**
```bash
npm install -g devcompass@3.2.1
# You get ALL v3.2.0 features + v3.2.1 features
# Unified dashboard + historical tracking
```

**From v2.x or v1.x:**
```bash
npm install -g devcompass@3.2.1
# Major upgrade with all v3.x features
# See previous migration sections below
```

### What You Get (Full v3.2.1 Feature Set)
- ✅ **Historical Tracking** (v3.2.1) - SQLite database, auto-save
- ✅ **Snapshot Comparison** (v3.2.1) - Side-by-side diff
- ✅ **Timeline Visualization** (v3.2.1) - Interactive D3 charts
- ✅ **9 Date Formats** (v3.2.1) - Flexible querying
- ✅ **Unified Dashboard** (v3.2.0) - 5 layouts, modular architecture
- ✅ **Analytics Layout** (v3.2.0) - Statistics dashboard
- ✅ **Theme Support** (v3.2.0) - Dark/light mode
- ✅ **Dynamic Config** (v3.1.7) - JSON-based configuration
- ✅ **Clustering** (v3.1.6) - Ecosystem/Health/Depth
- ✅ **GitHub Tokens** (v3.1.5) - 5,000 req/hr
- ✅ All previous features (batch fixes, auto-fix, backup/rollback)

### Rollback (if needed)
```bash
# Downgrade to v3.2.0
npm install -g devcompass@3.2.0

# Database will remain (safe to delete if needed)
rm ~/.devcompass/history.db

# Restore any backups
devcompass backup restore --name 
```

---

## From v3.1.7 → v3.2.0

### What's New
- **Unified Dashboard Architecture**: Replaced 4 duplicated layout files (3,600 lines) with modular dashboard (1,800 lines)
- **5 Dynamic Layouts**: Tree, Force, Radial, Conflict, **Analytics** (new!)
- **Modular CSS/JS**: Separated into reusable components (6 JS files, 5 CSS files)
- **Theme Support**: Dark/Light mode toggle with localStorage persistence
- **Performance**: 4-6× faster rendering with optimized D3 operations
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.2.0
```

### What Changed
- **Removed**: `src/graph/layouts/` folder (4 files → 1 unified)
- **Removed**: `src/graph/template.html` (replaced by `src/dashboard/index.html`)
- **Added**: `src/dashboard/` modular architecture (12 files total)
  - `index.html` - Main template
  - `scripts/` - 6 modular JS files (core, layouts, controls, tooltip, stats, utils)
  - `styles/` - 5 modular CSS files (base, layout, controls, graph, themes)
- **Updated**: `src/graph/exporter.js` (uses new dashboard system)
- **Updated**: `src/graph/visualizer.js` (simplified wrapper)

### New Features Available
- **📊 Analytics Tab** - Click to see comprehensive statistics dashboard
- **🌙 Theme Toggle** - Click sun/moon icon to switch between dark/light themes
- **⚡ Performance** - 4-6× faster graph rendering across all layouts
- **🎨 Better UI** - Cleaner, more organized interface

### Benefits
- **50% code reduction** - Easier to maintain and update
- **Single source of truth** - Update CSS/JS once, applies everywhere
- **4× faster updates** - No more copy-paste across 4 layout files
- **Zero duplication** - Shared styles and utilities across all layouts
- **New Analytics layout** - Instant insights without leaving dashboard
- **Theme customization** - Choose dark or light mode
- **Performance boost** - Optimized rendering for large dependency graphs

### Breaking Changes
**None!** This is a drop-in replacement.

- All CLI commands work exactly the same
- All existing features preserved (clustering, filtering, zoom, export)
- Graph data format unchanged
- Configuration files unchanged
- GitHub token system unchanged
- All v3.1.7 dynamic config features intact

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.0

# Generate graph
cd /path/to/your/project
devcompass graph --output test.html --open

# Verify new features:
# 1. Click "📊 Analytics" tab - should show statistics dashboard
# 2. Click 🌙/☀️ button - should toggle theme
# 3. All 5 tabs work (Tree/Force/Radial/Conflict/Analytics)
# 4. Search, filters, clustering all functional
# 5. Graph renders 4-6× faster than v3.1.7
```

### Troubleshooting

**Graph not loading:**
```bash
# Hard refresh browser
# Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
```

**Analytics tab empty:**
```bash
# Ensure you're on v3.2.0
devcompass --version

# Regenerate graph
devcompass graph --output new.html --open
```

**Theme not switching:**
```bash
# Clear browser cache and hard refresh
# Check browser console (F12) for errors
```

**Old layout files showing:**
```bash
# If you customized old layouts, they're removed
# Customizations must be ported to new dashboard files
# Located in: src/dashboard/scripts/ and src/dashboard/styles/
```

---

## From v3.1.6 → v3.1.7

### What's New
- **Dynamic Data Configuration**: All hardcoded data moved to external JSON files
- **8 JSON Config Files**: licenses, priorities, knip-config, license-risks, gpl-alternatives, quality-alternatives, popular-packages, batch-categories
- **Scalable Architecture**: Add/remove items by editing JSON (no code changes)
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.1.7
```

### Benefits
- Customize configuration without code changes
- Version control data separately from code
- Teams can maintain custom thresholds
- Easier to extend and maintain

### What Changed
- 7 source files refactored for dynamic loading
- Zero hardcoded data in codebase
- -325 net lines (more maintainable)
- All data in `data/` directory

---

## From v3.1.5 → v3.1.6

### What's New
- **Intelligent Clustering**: Organize dependencies by Ecosystem/Health/Depth
- **12 Ecosystem Categories**: React, Vue, Angular, Testing, Build Tools, etc.
- **Health Clustering**: Group by Critical/Warning/Healthy status
- **Depth Clustering**: Visualize direct vs transitive dependencies
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.1.6
```

### Benefits
- Better understand your tech stack
- Identify problem areas faster
- Organize packages logically
- Click clusters to highlight on graph

---

## From v3.0-3.1.5 → v3.1.6+

### Critical Updates
- **v3.1.6**: Adds intelligent clustering system
- **v3.1.5**: Fixes GitHub token system (5,000 req/hr vs 60)
- **Action**: `npm install -g devcompass@latest`

### Why Upgrade?
- Avoid GitHub rate limits with token config
- Organize dependencies with clustering
- Track 502 popular packages in real-time
- Better insights with ecosystem detection

---

## From v2.x → v3.x

### Major Changes
- **Breaking changes**: None for CLI usage
- **New features**: 
  - Interactive dependency graphs (4 layouts)
  - Intelligent clustering (Ecosystem/Health/Depth)
  - GitHub token configuration
  - Dynamic data configuration
- **Action**: `npm install -g devcompass@latest`

### What You Get
- Unified interactive graph visualization
- Real-time filtering and search
- Advanced zoom controls
- Export capabilities (PNG/JSON)
- All v2.x features preserved (batch fixes, auto-fix, backup/rollback)

---

## From v1.x → v3.x

### Major Changes
- **Breaking changes**: None for CLI usage
- **New features**:
  - Complete graph visualization system
  - Batch fix modes with granular control
  - Intelligent clustering
  - GitHub token support
  - Dynamic configuration
- **Action**: `npm install -g devcompass@latest`

### What You Get
- Everything from v2.x
- Plus: Advanced graph features, clustering, themes
- All v1.x analysis features preserved
- Enhanced with visual exploration tools

---

## General Upgrade Tips

### Before Upgrading
```bash
# Check current version
devcompass --version

# Backup your config (if customized)
cp ~/.devcompass/github-token ~/.devcompass/github-token.backup
cp devcompass.config.json devcompass.config.json.backup

# List current backups
devcompass backup list
```

### After Upgrading
```bash
# Verify new version
devcompass --version

# Test basic commands
devcompass analyze
devcompass graph --open

# Verify token still configured (if applicable)
devcompass config --show
```

### Rollback (if needed)
```bash
# Install specific previous version
npm install -g devcompass@3.1.7

# Restore backups if needed
devcompass backup restore --name <backup-name>
```

---

## Version Compatibility Matrix

| Version | Node.js | npm | Features |
|---------|---------|-----|----------|
| v3.2.0 | ≥14.0.0 | ≥6.0.0 | Unified dashboard, 5 layouts, themes |
| v3.1.7 | ≥14.0.0 | ≥6.0.0 | Dynamic config, clustering |
| v3.1.6 | ≥14.0.0 | ≥6.0.0 | Clustering, 4 layouts |
| v3.1.5 | ≥14.0.0 | ≥6.0.0 | GitHub tokens, 502 packages |
| v3.0-3.1.4 | ≥14.0.0 | ≥6.0.0 | Interactive graphs |
| v2.x | ≥14.0.0 | ≥6.0.0 | Batch fixes, auto-fix |
| v1.x | ≥14.0.0 | ≥6.0.0 | Basic analysis |

---

## Need Help?

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/AjayBThorat-20/devcompass/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

*Last updated: April 27, 2026 (v3.2.2)*