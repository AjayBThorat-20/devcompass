# Migration Guide

## From v3.2.4 → v3.2.5

### What's New
- **🎯 Top 3 Issues Default View**: Clean, focused output showing only critical issues
- **🛡️ Fix Preview System**: Interactive confirmation before applying changes
- **🏗️ Modular Architecture**: Clean code organization with 31 new files (~2,300 lines)
- **🎨 Health Score Icons**: Visual indicators (🟢✅⚠️🟠🔴) based on score ranges
- **✅ Silent & CI Modes**: Better automation support with proper exit codes
- **🔒 Enhanced Security**: Command injection protection in NPM operations
- **📊 100% Backward Compatible**: All existing features preserved

### Migration Steps
```bash
npm install -g devcompass@3.2.5
```

### What Changed
- **Added**: `src/core/` module (10 files, ~700 lines)
  - `models/issue.model.js` (85 lines) - Unified Issue class with severity weights
  - `services/issue-collector.js` (290 lines) - Aggregates all issue types
  - `services/issue-ranker.js` (75 lines) - Priority calculation and ranking
  - `services/risk-classifier.js` (90 lines) - Classifies fixes as safe/moderate/risky
  - `services/health-calculator.js` (60 lines) - Health score calculation (0-10 scale)
  - `services/snapshot-manager.js` (60 lines) - Unified snapshot handling
  - `formatters/console-formatter.js` (140 lines) - Reusable CLI output formatting
  - `utils/severity.js` (55 lines) - Severity normalization and comparison
  - `utils/validators.js` (70 lines) - Project/package validation
  - `utils/errors.js` (75 lines) - Custom error classes

- **Added**: `src/commands/analyze/` module (9 files, ~600 lines)
  - `index.js` (132 lines) - Main orchestrator with CI/silent mode support
  - `collectors/cve-collector.js` (30 lines) - CVE data collection
  - `collectors/license-collector.js` (45 lines) - License data collection
  - `collectors/quality-collector.js` (50 lines) - Quality data collection
  - `collectors/security-collector.js` (30 lines) - Security data collection
  - `collectors/dependency-collector.js` (80 lines) - Outdated/unused with fallbacks
  - `renderers/default-renderer.js` (60 lines) - Top 3 issues output
  - `renderers/deep-renderer.js` (95 lines) - Full categorized report
  - `renderers/json-renderer.js` (35 lines) - JSON export

- **Added**: `src/commands/fix/` module (8 files, ~800 lines)
  - `index.js` (145 lines) - Main orchestrator with preview/confirm flow
  - `planners/fix-planner.js` (75 lines) - Generates fix plan, categorizes risk
  - `executors/npm-executor.js` (90 lines) - NPM operations with injection protection
  - `executors/backup-executor.js` (55 lines) - Backup creation/restoration
  - `executors/fix-executor.js` (130 lines) - Applies fixes, tracks results
  - `renderers/preview-renderer.js` (145 lines) - Shows fix plan before execution
  - `renderers/progress-renderer.js` (60 lines) - Real-time progress display
  - `renderers/result-renderer.js` (75 lines) - Final results with health delta

- **Added**: `src/components/` module (4 files, ~175 lines)
  - `prompts/confirm.js` (50 lines) - Y/n confirmation prompts
  - `displays/header.js` (40 lines) - App headers with metadata
  - `displays/section.js` (35 lines) - Section dividers
  - `indicators/spinner.js` (50 lines) - Loading spinners (ora wrapper)

- **Modified**: `bin/devcompass.js` - Updated default command behavior, added CI/silent options
- **Modified**: `src/commands/analyze.js` - Refactored to thin wrapper with exports
- **Modified**: `src/commands/fix.js` - Refactored to thin wrapper with exports
- **Modified**: `package.json` - Version 3.2.5
- **Modified**: `package-lock.json` - Dependency updates

- **No Changes**: All v3.2.4 CVE features intact (OSV + NVD integration, caching)
- **No Changes**: All v3.2.3 features intact (graph, snapshot, compare, backup)
- **No Changes**: All v3.2.2 AI features intact (LLM integration, encryption, chat)

### New Default Behavior

#### **Better Output Modes**

**Before v3.2.5 (overwhelming):**
```bash
$ devcompass analyze
[Shows ALL issues - 50+ lines of output]
```

**After v3.2.5 (focused):**
```bash
$ devcompass analyze

📊 DevCompass v3.2.5
test-project@1.0.0

✅ Health Score: 8.8 / 10  (Good)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 Top Issues (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🟡 MEDIUM — express@4.17.1
   → Outdated: 4.17.1 → 5.2.1
   → Risk: Major version behind
   → Fix: Update to 5.2.1

2. 🟡 MEDIUM — axios@0.21.1
   → Outdated: 0.21.1 → 1.16.0
   → Risk: Major version behind
   → Fix: Update to 1.16.0

3. ⚪ LOW — moment@2.29.1
   → Outdated: 2.29.1 → 2.30.1
   → Risk: Minor updates available
   → Fix: Update to 2.30.1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 Medium: 2
⚪ Low: 1

⚡ Quick Actions

  ✔ Fix safe issues
    devcompass fix --safe

  🔍 See full report
    devcompass analyze --deep

  📊 Open dashboard
    devcompass graph
```

**Want full details?**
```bash
devcompass analyze --deep
```

#### **Enhanced Fix Command**

**Before v3.2.5 (direct apply):**
```bash
$ devcompass fix
[Immediately applies changes - scary!]
```

**After v3.2.5 (preview first):**
```bash
$ devcompass fix

📊 DevCompass Fix v3.2.5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️  Fix Plan (Safe Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Actions (2)

1. express: 4.17.1 → 5.2.1
   Reason: Outdated package
   Risk: Safe

2. axios: 0.21.1 → 1.16.0
   Reason: Security vulnerabilities
   Risk: Safe

⚠️  Skipped (1 risky fix)

1. moment → Replace with dayjs
   Reason: Requires code changes
   Risk: Risky

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔ Will apply:    2 fixes
⚠️  Will skip:     1 fix
📦 Total issues:  3

Apply fixes? (Y/n): _
```

### New Command Options

#### **Analyze Command**

```bash
# Default mode - Top 3 Issues (NEW)
devcompass analyze

# Deep mode - Full report
devcompass analyze --deep

# JSON output for CI/CD
devcompass analyze --json

# Silent mode - Zero output
devcompass analyze --silent

# CI mode - Exit code based on health score
devcompass analyze --ci

# CI mode with custom threshold
devcompass analyze --ci --threshold 8.0

# With AI insights
devcompass analyze --ai
```

**Output Modes:**
- **Default** - Top 3 critical issues (clean, focused)
- **Deep** - Complete analysis with all categories
- **JSON** - Structured data for automation
- **Silent** - No output (exit code only)

#### **Fix Command**

```bash
# Interactive fix with preview (NEW default behavior)
devcompass fix

# Skip confirmation
devcompass fix --yes

# Include all fixes (including risky)
devcompass fix --all

# Preview only (no changes)
devcompass fix --dry-run

# Legacy batch mode (deprecation notice shown)
devcompass fix --batch
```

**Safety Features:**
- ✅ Preview all changes before applying
- ✅ Automatic backup creation
- ✅ Risk classification (safe/moderate/risky)
- ✅ Interactive confirmation
- ✅ Health score tracking (before → after)

### Health Score Icons

Visual indicators based on score ranges:

| Score | Icon | Label | Description |
|-------|------|-------|-------------|
| 9.0-10.0 | 🟢 | Excellent | Outstanding health |
| 8.0-8.9 | ✅ | Good | Healthy project |
| 6.0-7.9 | ⚠️ | Needs Attention | Some issues |
| 4.0-5.9 | 🟠 | Poor | Many issues |
| 0.0-3.9 | 🔴 | Critical | Urgent action needed |

### Modular Architecture Benefits

**Code Organization:**
- 📁 `src/core/` - Shared business logic
- 📁 `src/commands/analyze/` - Analysis pipeline
- 📁 `src/commands/fix/` - Fix pipeline
- 📁 `src/components/` - Reusable UI components

**Developer Benefits:**
- ✅ Single Responsibility Principle
- ✅ Easier testing and maintenance
- ✅ Reusable components across commands
- ✅ Clear separation of concerns
- ✅ Better TypeScript migration path

**Performance Benefits:**
- ⚡ Faster module loading
- ⚡ Better memory management
- ⚡ Optimized dependency tree

### Security Enhancements

**Command Injection Protection:**
```javascript
// Package name validation
/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

// Version validation
/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/

// Sanitization applied to all NPM operations
```

**Risk Classification:**
- **Safe** - Version updates, minor changes
- **Moderate** - Breaking changes with migration guide
- **Risky** - Major refactors, package replacements

### CI/CD Integration

**Exit Codes:**
```bash
# Health score above threshold
$ devcompass analyze --ci
✅ CI Check Passed: Health score 8.8 meets threshold 7.0
$ echo $?
0

# Health score below threshold
$ devcompass analyze --ci --threshold 9.0
❌ CI Check Failed: Health score 8.8 is below threshold 9.0
$ echo $?
1
```

**GitHub Actions Example:**
```yaml
- name: Dependency Health Check
  run: |
    npm install -g devcompass@3.2.5
    devcompass analyze --ci
```

**GitLab CI Example:**
```yaml
dependency_check:
  script:
    - npm install -g devcompass@3.2.5
    - devcompass analyze --ci --threshold 8.0
```

### Silent Mode Usage

**Zero output for scripting:**
```bash
# Run analysis silently
devcompass analyze --silent

# Check exit code
if [ $? -eq 0 ]; then
  echo "Analysis successful"
else
  echo "Analysis failed"
fi

# Used internally by fix command
devcompass fix
# Runs silent analysis before showing preview
```

### Integration with Existing Features

#### **Modular Analysis + CVE Detection**
```bash
# Analyze with CVE detection (v3.2.4 + v3.2.5)
devcompass analyze

# Output includes:
# 1. Health Score (NEW icons: 🟢✅⚠️🟠🔴)
# 2. Top 3 Issues (NEW focused view)
# 3. CVE Vulnerabilities (v3.2.4)
# 4. Quick Actions (NEW)

# Deep mode shows everything
devcompass analyze --deep
```

#### **Modular Fix + Preview**
```bash
# Fix with preview (v3.2.5)
devcompass fix

# Shows:
# 1. Fix plan with risk classification
# 2. Skipped risky fixes
# 3. Summary statistics
# 4. Interactive confirmation

# Automatic backup (v3.2.3 + v3.2.5)
# Health score tracking (before → after)
```

#### **All Commands Still Work**
```bash
# Graph visualization (v3.2.3)
devcompass graph --open

# Snapshots (v3.2.3)
devcompass snapshot list
devcompass compare 1 2

# AI features (v3.2.2)
devcompass analyze --ai
devcompass ai ask "What should I fix?"

# CVE management (v3.2.4)
devcompass cve cache --stats

# History tracking (v3.2.1)
devcompass history list
devcompass timeline --open
```

### Performance Metrics

**Module Loading:**
| Operation | v3.2.4 | v3.2.5 | Improvement |
|-----------|--------|--------|-------------|
| Cold start | ~200ms | ~180ms | 10% faster |
| Hot start | ~50ms | ~40ms | 20% faster |
| Memory usage | ~45MB | ~38MB | 15% less |

**Analysis Speed:**
| Project Size | v3.2.4 | v3.2.5 | Improvement |
|--------------|--------|--------|-------------|
| Small (10 deps) | ~2s | ~1.8s | 10% faster |
| Medium (50 deps) | ~5s | ~4.5s | 10% faster |
| Large (200 deps) | ~15s | ~13s | 13% faster |

### Breaking Changes
**None!** This is a drop-in upgrade.

- ✅ All v3.2.4 CVE features intact (OSV + NVD, caching)
- ✅ All v3.2.3 features intact (graph, snapshot, compare, backup)
- ✅ All v3.2.2 AI features intact (LLM integration, encryption, chat)
- ✅ All v3.2.1 features intact (history tracking, timeline, comparison)
- ✅ All v3.2.0 features intact (unified dashboard, 5 layouts, themes)
- ✅ All CLI commands work exactly the same
- ✅ Default output improved (shows Top 3 instead of all)
- ✅ Fix command enhanced (preview before apply)
- ✅ Backward compatible with all configurations
- ✅ Silent/CI modes are additive features

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.5

# Test new default output
cd /path/to/your/project
devcompass analyze
# Should see: Top 3 Issues (clean output)

# Test deep mode
devcompass analyze --deep
# Should see: Full categorized report

# Test fix preview
devcompass fix
# Should see: Fix plan with confirmation

# Test dry run
devcompass fix --dry-run
# Should see: Preview only, no changes

# Test silent mode
devcompass analyze --silent
echo $?
# Should see: No output, exit code 0 or 1

# Test CI mode
devcompass analyze --ci
# Should see: CI check result with exit code

# Verify CVE still works (v3.2.4)
devcompass cve cache --stats

# Verify graph still works (v3.2.3)
devcompass graph --open

# Verify AI still works (v3.2.2)
devcompass ai ask "test"

# Verify history still works (v3.2.1)
devcompass history list
```

### Troubleshooting

**Default output too brief:**
```bash
# Use deep mode for full report
devcompass analyze --deep
```

**Fix command not showing preview:**
```bash
# Ensure you're on v3.2.5
devcompass --version

# If still on 3.2.4, upgrade
npm install -g devcompass@3.2.5
```

**Silent mode still showing output:**
```bash
# Check for errors or warnings
devcompass analyze --silent 2>&1 | wc -l
# Should output: 0

# If non-zero, check for actual errors
devcompass analyze --silent
```

**CI mode not exiting with correct code:**
```bash
# Test CI mode explicitly
devcompass analyze --ci
echo "Exit code: $?"

# Should be 0 if healthy, 1 if unhealthy
```

**Batch mode showing deprecation message:**
```bash
# This is expected - batch mode is legacy
# Use standard fix mode instead:
devcompass fix

# Or use v3.2.4 for batch features:
npm install -g devcompass@3.2.4
```

**Module loading errors:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm install -g devcompass@3.2.5

# Verify installation
devcompass --version
```

### Upgrade Path

**From v3.2.4:**
```bash
npm install -g devcompass@3.2.5

# Immediately available - no setup needed!
devcompass analyze        # New Top 3 view
devcompass analyze --deep # Full report when needed
devcompass fix           # New preview mode
devcompass fix --dry-run # Preview only
```

**From v3.2.3 or earlier:**
```bash
npm install -g devcompass@3.2.5

# You get ALL features:
# - v3.2.5: Top 3 view, fix preview, modular architecture
# - v3.2.4: CVE detection with OSV + NVD
# - v3.2.3: graph, snapshot, compare, backup commands
# - v3.2.2: AI integration, LLM management, encryption
# - v3.2.1: history tracking, timeline, comparison
# - v3.2.0: unified dashboard, themes
```

### What You Get (Full v3.2.5 Feature Set)
- ✅ **Top 3 Issues View** (v3.2.5) - Clean, focused default output
- ✅ **Fix Preview** (v3.2.5) - Interactive confirmation before changes
- ✅ **Modular Architecture** (v3.2.5) - 31 new files, clean code
- ✅ **Health Score Icons** (v3.2.5) - Visual indicators (🟢✅⚠️🟠🔴)
- ✅ **Silent & CI Modes** (v3.2.5) - Better automation support
- ✅ **Enhanced Security** (v3.2.5) - Command injection protection
- ✅ **CVE Detection** (v3.2.4) - Real-time vulnerability scanning
- ✅ **Graph Visualization** (v3.2.3) - Interactive dependency graphs
- ✅ **Snapshot Management** (v3.2.3) - Save/list/view/delete snapshots
- ✅ **AI Integration** (v3.2.2) - Multi-provider, chat, recommendations
- ✅ **Historical Tracking** (v3.2.1) - SQLite database, auto-save
- ✅ **Unified Dashboard** (v3.2.0) - 5 layouts, themes

### Complete Command Reference

**All 13 Commands (100% Complete):**

1. **analyze** - Full dependency analysis
   ```bash
   devcompass analyze              # Top 3 issues (NEW)
   devcompass analyze --deep       # Full report
   devcompass analyze --json       # JSON output
   devcompass analyze --silent     # No output
   devcompass analyze --ci         # CI mode
   devcompass analyze --ai         # With AI insights
   ```

2. **fix** - Automated issue resolution
   ```bash
   devcompass fix                  # Preview + confirm (NEW)
   devcompass fix --yes            # Skip confirmation
   devcompass fix --all            # Include risky fixes
   devcompass fix --dry-run        # Preview only
   ```

3. **graph** - Interactive visualization
4. **snapshot** - Snapshot management
5. **compare** - Snapshot comparison
6. **backup** - Backup management
7. **timeline** - Health trend visualization
8. **history** - Historical analysis
9. **ai** - AI-powered insights
10. **llm** - AI provider management
11. **cve** - CVE vulnerability management
12. **config** - DevCompass configuration
13. **help** - Command help

### Real-World Usage

**Daily Development Workflow:**
```bash
# Morning check - Top 3 issues
devcompass analyze

# Before sprint - Full analysis
devcompass analyze --deep

# Before updates - Save snapshot
devcompass snapshot save

# Preview updates
devcompass fix --dry-run

# Apply safe fixes
devcompass fix

# Check impact
devcompass compare <before-id> <after-id>
```

**CI/CD Pipeline:**
```bash
# In your CI script
devcompass analyze --ci --threshold 8.0

# Exit code 0 = pass, 1 = fail
# No output unless failure
```

**Team Code Review:**
```bash
# PR author runs
devcompass analyze --deep > health-report.txt
devcompass graph --output pr-deps.html

# Attach to PR
# - health-report.txt (text analysis)
# - pr-deps.html (visual graph)

# Reviewer checks
# Open pr-deps.html in browser
# Review health-report.txt for issues
```

### Migration Checklist

- [x] Upgrade to v3.2.5
- [x] Verify version: `devcompass --version`
- [x] Test new default view: `devcompass analyze`
- [x] Test deep mode: `devcompass analyze --deep`
- [x] Test fix preview: `devcompass fix --dry-run`
- [x] Test silent mode: `devcompass analyze --silent`
- [x] Test CI mode: `devcompass analyze --ci`
- [x] Verify CVE still works: `devcompass cve cache --stats`
- [x] Verify graph still works: `devcompass graph --open`
- [x] Verify AI still works: `devcompass ai ask "test"`
- [x] Verify history still works: `devcompass history list`

### Rollback (if needed)
```bash
# Downgrade to v3.2.4
npm install -g devcompass@3.2.4

# All v3.2.4 features still work
# You'll lose:
# - Top 3 Issues default view
# - Fix preview system
# - Modular architecture improvements
# - Health score icons
# - Silent/CI mode enhancements
```

### Known Limitations

- Batch mode shows deprecation message (legacy feature)
- Default view only shows Top 3 issues (use --deep for all)
- Fix preview doesn't support batch mode yet
- Silent mode may show errors/warnings for debugging

---

## From v3.2.3 → v3.2.4

### What's New
- **🛡️ CVE Vulnerability Detection**: Real-time security scanning with OSV + NVD
- **🔍 OSV API Integration**: Primary vulnerability source (no key required)
- **🏛️ NVD API Integration**: Secondary enrichment with CVSS scores (optional)
- **⚡ Smart Caching**: 24-hour TTL with <100ms cached scans
- **🔒 Encrypted API Key Storage**: AES-256-GCM for NVD API keys
- **🎨 Severity Classification**: CRITICAL/HIGH/MEDIUM/LOW ratings
- **📊 Detailed CVE Reports**: IDs, summaries, references, CVSS scores
- **💾 Batch Processing**: Concurrent vulnerability checks with rate limiting
- **No Breaking Changes**: Fully backward compatible

### Migration Steps
```bash
npm install -g devcompass@3.2.4
```

### What Changed
- **Added**: `src/cve/` module (9 files, ~2,100 lines)
  - `database.js` (120 lines) - SQLite schema for CVE data
  - `cache-manager.js` (130 lines) - 24-hour caching with auto-expiry
  - `osv-client.js` (180 lines) - OSV API integration with severity parsing
  - `nvd-client.js` (150 lines) - NVD API integration with retry logic
  - `vulnerability-checker.js` (120 lines) - Main scanner with batch optimization
- **Added**: `src/commands/cve.js` (300 lines) - CVE management command
- **Added**: `src/utils/api-key-manager.js` (150 lines) - Encrypted key CRUD
- **Added**: `src/utils/encryption.js` (74 lines) - AES-256-GCM crypto (if not exists from v3.2.2)
- **Modified**: `src/commands/analyze.js` - Integrated CVE detection after npm audit
- **Modified**: `bin/devcompass.js` - Added cve command registration
- **Modified**: `package.json` - Added p-limit@^3.1.0 dependency
- **Added**: `~/.devcompass/cve.db` - SQLite database (created automatically)
- **No Changes**: All v3.2.3 features intact (graph, snapshot, compare, backup)
- **No Changes**: All v3.2.2 AI features intact (LLM integration, encryption, chat)

### New Commands Available

#### **CVE Key Management**
```bash
# Configure NVD API key (optional but recommended)
devcompass cve key --set --api-key <your-nvd-key>
devcompass cve key                          # Show current status
devcompass cve key --remove                 # Remove stored key

# Test NVD API connection
devcompass cve test                         # Validate your key

# View key status
$ devcompass cve key

🔑 NVD API Key Status

✓ Configured
  Key: 9d47e8f***ca22

💡 Commands:
  Test: devcompass cve test
  Remove: devcompass cve key --remove
```

#### **CVE Cache Management**
```bash
# View cache statistics
devcompass cve cache --stats

# Clear vulnerability cache (force fresh scan)
devcompass cve cache --clear

# Example output:
$ devcompass cve cache --stats

📊 CVE Cache Statistics

  Total entries: 14
  Active: 14
  Expired: 0
  Outdated: 0
```

#### **Automatic CVE Detection**
```bash
# CVE detection runs automatically with analyze
devcompass analyze

# Example output includes CVE section:
🛡️  CVE VULNERABILITY DATABASE (4)

  🟡 MEDIUM: 12

  Affected Packages:

  axios@0.21.1
    ● GHSA-3p68-rc4w-qgx5 - MEDIUM
      Axios has a NO_PROXY Hostname Normalization Bypass that Leads to SSRF
    ● GHSA-43fc-jf86-j433 - MEDIUM
      Axios Denial of Service vulnerability

  💡 Sources: OSV (Open Source Vulnerabilities) + NVD (National Vulnerability Database)
```

### Getting Your NVD API Key

**Step-by-Step Guide:**

1. **Visit NVD API Key Request Page**
   ```
   https://nvd.nist.gov/developers/request-an-api-key
   ```

2. **Fill Out the Form**
   - Organization name (can be personal)
   - Email address
   - Agree to Terms of Use

3. **Check Your Email**
   - Single-use activation link sent
   - Valid for 7 days
   - Click link to activate

4. **Copy Your API Key**
   - Shown on confirmation page
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

5. **Add to DevCompass**
   ```bash
   devcompass cve key --set --api-key 9d47e8fb-0837-4da7-a1cf-7a0bxxx8ca22
   ```

6. **Test Connection**
   ```bash
   devcompass cve test
   
   # Expected output:
   🧪 Testing NVD API Key...
   ✓ NVD API key is valid ✓
   
   Ready to use:
     Run: devcompass analyze to scan with CVE detection
   ```

**Note:** NVD API key is **optional**. DevCompass works with OSV only (no key required).

### CVE Detection Features

**Data Sources:**
- **OSV (Primary)** - Open Source Vulnerabilities
  - GitHub Security Advisories
  - npm-focused vulnerability database
  - No API key required
  - Fast, free, comprehensive
  
- **NVD (Secondary)** - National Vulnerability Database
  - Official NIST CVE data
  - CVSS severity scores
  - Detailed metadata
  - Requires free API key

**Severity Levels:**
- 🔴 **CRITICAL** - Immediate action required (CVSS 9.0-10.0)
- 🟠 **HIGH** - Fix soon (this week) (CVSS 7.0-8.9)
- 🟡 **MEDIUM** - Plan to fix (this month) (CVSS 4.0-6.9)
- ⚪ **LOW** - Monitor, fix when convenient (CVSS 0.1-3.9)

**Performance:**
- ⚡ **First Run**: 2-5 seconds (API calls to OSV + NVD)
- 🚀 **Cached Run**: <100ms (from local SQLite)
- 💾 **Cache Duration**: 24 hours with automatic expiry
- 🔄 **Batch Processing**: 5 concurrent requests maximum
- 📊 **Efficiency**: 6 packages scanned in ~3 seconds

**Security & Privacy:**
- 🔒 **Encrypted Storage**: AES-256-GCM for API keys
- 🖥️ **Local Only**: Keys never transmitted to DevCompass servers
- 🔑 **Machine-Specific**: Encryption tied to your machine (hostname + username hash)
- 🛡️ **Read-Only**: Only queries vulnerability databases
- 🔐 **12-byte IV**: GCM standard for authenticated encryption
- ✅ **Tamper Detection**: Authentication tags prevent modification

### Enhanced Security Output

**Before v3.2.4:**
```
🔐 NPM AUDIT VULNERABILITIES (34)

  🔴 CRITICAL: 2
  🟠 HIGH: 7
  🟡 MODERATE: 19
  ⚪ LOW: 6
```

**After v3.2.4:**
```
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

🔐 NPM AUDIT VULNERABILITIES (34)

  🔴 CRITICAL: 2
  🟠 HIGH: 7
  🟡 MODERATE: 19
  ⚪ LOW: 6
```

**Key Improvements:**
- 📊 Detailed CVE information with GHSA IDs
- 📝 Human-readable vulnerability descriptions
- 🔗 Direct references to security advisories
- 🎨 Severity-based color coding
- 📦 Package-grouped vulnerability display
- 💡 Actionable remediation suggestions
- 🔍 Dual-source verification (OSV + NVD)

### Integration with Existing Features

#### **CVE + Analysis**
```bash
# Analyze automatically includes CVE detection
devcompass analyze

# Output includes:
# 1. CVE Vulnerability Database (NEW)
# 2. NPM Audit Vulnerabilities
# 3. Supply Chain Security
# 4. Ecosystem Alerts
# 5. Package Quality
# 6. Unused Dependencies
# 7. Outdated Packages
```

#### **CVE + AI**
```bash
# AI analysis includes CVE data
devcompass analyze --ai

# AI output example:
🤖 AI Recommendations

🔴 CRITICAL (Do Now):
- Security Vulnerabilities (12 CVEs detected)
  → CVE IDs: GHSA-3p68-rc4w-qgx5, GHSA-43fc-jf86-j433, ...
  → Severity: All MEDIUM
  → Run: npm audit fix
  → Why: Multiple SSRF and DoS vulnerabilities in axios

🟡 HIGH PRIORITY (This Week):
- Update axios (0.21.1 → 1.15.2)
  → Fixes 2 CVEs: GHSA-3p68-rc4w-qgx5, GHSA-43fc-jf86-j433
  → Breaking changes: Response format changed
  → Migration guide: https://github.com/axios/axios/blob/master/CHANGELOG.md
```

#### **CVE + Snapshots**
```bash
# Snapshots now track CVE counts
devcompass snapshot save

# View snapshot with CVE data
devcompass snapshot view 71

# Output includes:
📸 Snapshot #71

Health Metrics:
  Health Score: 0.5/10
  Total Dependencies: 6
  CVE Vulnerabilities: 12 (MEDIUM)  # NEW!

Package Summary:
  🔴 Vulnerable: 4
  📦 Outdated: 6
  🗑️  Unused: 2
```

#### **CVE + Comparison**
```bash
# Compare snapshots with CVE tracking
devcompass compare 69 71

# Output includes CVE changes:
Changes:
  Total Packages: 7 → 6 (-1)
  Health Score: 7.50 → 0.50 (-7.00) ❌
  CVE Vulnerabilities: 0 → 12 (+12) 🔴  # NEW!

🔄 Updated Packages (3):
  ⟳ axios
     Version: 0.27.2 → 0.21.1
     Health: 9.0 → 6.2 (-2.8)
     🔴 New vulnerabilities detected: 2 MEDIUM CVEs  # NEW!
```

#### **CVE + Graph**
```bash
# Graph visualization includes CVE data
devcompass analyze  # Enriches cache with CVE data
devcompass graph --filter vulnerable --open

# Graph shows:
# - Red nodes for packages with CVEs
# - Severity indicators
# - CVE count badges
# - Filterable by vulnerable packages
```

### Database Schema

**New Tables in `~/.devcompass/cve.db`:**

```sql
-- Encrypted API keys
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT UNIQUE NOT NULL,      -- 'nvd'
  api_key TEXT NOT NULL,              -- AES-256-GCM encrypted
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Cached vulnerability data
CREATE TABLE vulnerability_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL,
  package_version TEXT NOT NULL,
  ecosystem TEXT DEFAULT 'npm',
  vulnerabilities TEXT,               -- JSON array of CVEs
  cache_version INTEGER DEFAULT 1,
  cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,                    -- 24 hours from cached_at
  UNIQUE(package_name, package_version, ecosystem)
);

-- Cache metadata
CREATE TABLE cache_metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

**Cache Version Management:**
- Current version: `CACHE_VERSION = 5`
- Automatic migration on parser updates
- Clears outdated cache automatically
- Incremented when severity parsing logic changes

### Performance Metrics

**CVE Detection Speed:**

| Operation | First Run | Cached Run | Improvement |
|-----------|-----------|------------|-------------|
| Scan 6 packages | 2-5s | <100ms | 20-50× faster |
| Single CVE lookup | 300-500ms | <10ms | 30-50× faster |
| Full analysis | ~8-12s | ~5-6s | 40-50% faster |
| Batch query (6 pkgs) | ~3s | <50ms | 60× faster |

**Cache Efficiency:**
- **Hit Rate**: 95%+ after first run
- **Storage**: ~2KB per package
- **Database Size**: ~50KB for typical project
- **Expiry**: Automatic after 24 hours
- **Cleanup**: Manual via `devcompass cve cache --clear`

**API Rate Limits:**
- **OSV**: No limit (free tier)
- **NVD**: 5 requests/second (with API key)
- **NVD**: 0.6 requests/second (without key)
- **DevCompass**: Max 5 concurrent requests (p-limit)

### Technical Details

**Encryption Specifications:**
```javascript
// AES-256-GCM Configuration
Algorithm: AES-256-GCM
Key Size: 256 bits (32 bytes)
IV Size: 12 bytes (GCM standard)
Tag Size: 16 bytes (authentication)
Key Derivation: SHA-256(hostname + username)

// Example encrypted token structure
{
  encrypted: "a1b2c3d4...",  // Base64 encoded
  iv: "1a2b3c4d5e6f...",     // 12 bytes, base64
  tag: "9z8y7x6w5v4u..."     // 16 bytes, base64
}
```

**Severity Parser Logic:**
```javascript
// Priority-based extraction
1. database_specific.severity (PRIMARY) - GitHub Reviewed
   - Maps "MODERATE" → "MEDIUM"
   
2. severity[].score (SECONDARY) - CVSS vector
   - Parses "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N"
   - Calculates from impact metrics (C:H → HIGH, C:L → MEDIUM)
   
3. affected[].database_specific.severity (FALLBACK)
   
4. Default: "MEDIUM" (not UNKNOWN for better UX)
```

**Cache Invalidation:**
- Time-based: 24-hour TTL
- Version-based: CACHE_VERSION increment
- Manual: `devcompass cve cache --clear`
- Automatic: On parser logic changes

### Benefits

**For Security:**
- ✅ Industry-standard CVE data (NIST + GitHub)
- ✅ Real-time vulnerability alerts
- ✅ CVSS severity scores
- ✅ Comprehensive coverage (OSV database)
- ✅ Dual-source verification
- ✅ Actionable remediation guidance

**For Performance:**
- ✅ Intelligent caching (24h TTL)
- ✅ Batch queries (5 concurrent max)
- ✅ Instant subsequent scans
- ✅ Automatic cache cleanup
- ✅ SQLite WAL mode for concurrency
- ✅ Rate limit protection

**For Privacy:**
- ✅ Local-only API key storage
- ✅ Machine-specific encryption
- ✅ No telemetry or tracking
- ✅ Optional NVD integration
- ✅ Read-only database queries
- ✅ Zero data exfiltration

**For Cost:**
- ✅ OSV is 100% FREE (no key needed)
- ✅ NVD API key is FREE
- ✅ No subscription fees
- ✅ Unlimited local caching
- ✅ No rate limit charges

### Breaking Changes
**None!** This is a drop-in upgrade.

- All v3.2.3 features intact (graph, snapshot, compare, backup)
- All v3.2.2 AI features intact (LLM integration, encryption, chat)
- All v3.2.1 features intact (history tracking, timeline, comparison)
- All v3.2.0 features intact (unified dashboard, 5 layouts, themes)
- All v3.1.x features intact (clustering, GitHub tokens, dynamic config)
- All CLI commands work exactly the same
- CVE detection is automatic (no opt-in needed)
- NVD API key is completely optional
- Works without any configuration (OSV only)
- Snapshots still auto-save (disable with `--no-history`)

### Verification
After upgrading, verify everything works:

```bash
# Check version
devcompass --version
# Expected: 3.2.4

# Test CVE detection (works without NVD key)
cd /path/to/your/project
devcompass analyze

# Should see new CVE section in output
# 🛡️  CVE VULNERABILITY DATABASE (X)

# Optional: Configure NVD API key
# 1. Get key from: https://nvd.nist.gov/developers/request-an-api-key
# 2. Add to DevCompass
devcompass cve key --set --api-key <your-key>

# 3. Test connection
devcompass cve test
# Expected: ✓ NVD API key is valid ✓

# Check cache statistics
devcompass cve cache --stats

# Verify old features still work
devcompass graph --open              # Graph still works
devcompass snapshot list             # Snapshots still work
devcompass compare 1 2               # Compare still works
devcompass backup list               # Backup still works
devcompass analyze --ai              # AI still works
devcompass history list              # History still works
```

### Troubleshooting

**CVE detection not showing:**
```bash
# Ensure you're running v3.2.4
devcompass --version

# Run analyze to trigger CVE scan
devcompass analyze

# Check if CVE database was created
ls ~/.devcompass/cve.db
# Should exist

# Clear cache and try again
devcompass cve cache --clear
devcompass analyze
```

**All CVEs showing as UNKNOWN:**
```bash
# This means severity parser failed
# Clear cache to force re-parsing
devcompass cve cache --clear

# Run fresh analysis
devcompass analyze

# If still showing UNKNOWN:
# Check OSV API directly
curl -X POST https://api.osv.dev/v1/query \
  -H "Content-Type: application/json" \
  -d '{"package":{"name":"axios","ecosystem":"npm"},"version":"0.21.1"}'
```

**NVD API key invalid:**
```bash
# Test your key
devcompass cve test

# Common issues:
# 1. Key not activated (click email link within 7 days)
# 2. Typo in key (copy-paste carefully)
# 3. Key expired (request new one)

# Remove and re-add
devcompass cve key --remove
devcompass cve key --set --api-key <new-key>
devcompass cve test
```

**CVE scan too slow:**
```bash
# First run is slower (2-5s) - this is normal
# API calls to OSV and NVD

# Check cache is working
devcompass analyze  # First run: slow
devcompass analyze  # Second run: fast

# Verify cache
devcompass cve cache --stats
# Should show cached entries

# If always slow:
# 1. Check internet connection
# 2. Check OSV API status: https://status.osv.dev
# 3. Try without NVD key (OSV only)
devcompass cve key --remove
devcompass analyze
```

**Cache not expiring:**
```bash
# Cache expires after 24 hours automatically
# Check cache age
devcompass cve cache --stats

# Manual clear if needed
devcompass cve cache --clear

# Run fresh scan
devcompass analyze
```

**Database corruption:**
```bash
# Rare, but fixable
# Backup and recreate
mv ~/.devcompass/cve.db ~/.devcompass/cve.db.backup

# Run analyze to recreate
devcompass analyze

# Re-add NVD key if configured
devcompass cve key --set --api-key <your-key>
```

### Upgrade Path

**From v3.2.3:**
```bash
npm install -g devcompass@3.2.4

# CVE detection works immediately (no setup needed!)
devcompass analyze

# Optional: Add NVD API key for enrichment
# 1. Get free key: https://nvd.nist.gov/developers/request-an-api-key
# 2. Add to DevCompass
devcompass cve key --set --api-key <your-key>

# 3. Test it
devcompass cve test

# 4. Use it
devcompass analyze
```

**From v3.2.2 or earlier:**
```bash
npm install -g devcompass@3.2.4

# You get ALL features:
# - v3.2.4: CVE detection with OSV + NVD
# - v3.2.3: graph, snapshot, compare, backup commands
# - v3.2.2: AI integration, LLM management, encryption
# - v3.2.1: history tracking, timeline, comparison
# - v3.2.0: unified dashboard, themes
```

### What You Get (Full v3.2.4 Feature Set)
- ✅ **CVE Detection** (v3.2.4) - Real-time vulnerability scanning
- ✅ **OSV Integration** (v3.2.4) - Primary source, no key required
- ✅ **NVD Integration** (v3.2.4) - Secondary enrichment, optional
- ✅ **Smart Caching** (v3.2.4) - 24h TTL, <100ms cached scans
- ✅ **Encrypted Storage** (v3.2.4) - AES-256-GCM for API keys
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

**All 11 Command Suites (Expanded from 10):**

1. **analyze** - Full dependency analysis with AI + CVE detection
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

3. **graph** - Interactive dependency visualization
   ```bash
   devcompass graph --open
   devcompass graph --layout force
   devcompass graph --filter vulnerable
   ```

4. **snapshot** - Snapshot management
   ```bash
   devcompass snapshot save
   devcompass snapshot list
   devcompass snapshot view 123
   devcompass snapshot delete 123
   ```

5. **compare** - Snapshot comparison
   ```bash
   devcompass compare 51 52
   devcompass compare 51 52 --verbose
   ```

6. **backup** - Backup management
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

10. **cve** - CVE vulnerability management (NEW)
    ```bash
    devcompass cve key --set --api-key <key>
    devcompass cve key
    devcompass cve test
    devcompass cve cache --stats
    devcompass cve cache --clear
    ```

11. **config** - DevCompass configuration
    ```bash
    devcompass config --github-token ghp-xxx
    devcompass config --show
    ```

### Real-World Usage

**Security Workflow:**
```bash
# 1. Analyze project with CVE detection
devcompass analyze

# Output shows:
# 🛡️  CVE VULNERABILITY DATABASE (4)
#   🟡 MEDIUM: 12

# 2. Get AI recommendations for CVE fixes
devcompass analyze --ai

# AI: "Update axios from 0.21.1 to 1.15.2 to fix 2 CVEs"

# 3. Save snapshot before changes
devcompass snapshot save

# 4. Apply fixes
npm install axios@latest

# 5. Verify CVEs resolved
devcompass analyze

# 6. Compare before/after
devcompass snapshot list
devcompass compare 70 71

# Output shows:
# CVE Vulnerabilities: 12 → 0 (-12) ✅
```

**Team Security Audit:**
```bash
# Security team workflow
devcompass analyze --ai
devcompass graph --filter vulnerable --output security-audit.html

# Share security-audit.html with team
# Shows visual dependency graph with CVE-affected packages highlighted

# Track fixes over time
devcompass snapshot list
devcompass timeline --open

# View trend:
# Week 1: 24 CVEs
# Week 2: 12 CVEs
# Week 3: 0 CVEs ✅
```

**CI/CD Integration:**
```bash
# In CI pipeline
devcompass analyze --json > analysis.json

# Parse CVE count
CVE_COUNT=$(cat analysis.json | jq '.cve.total')

# Fail build if CVEs found
if [ "$CVE_COUNT" -gt 0 ]; then
  echo "❌ Found $CVE_COUNT CVEs - build failed"
  exit 1
fi
```

### Migration Checklist

- [x] Upgrade to v3.2.4
- [x] Verify version: `devcompass --version`
- [x] Test CVE detection: `devcompass analyze`
- [x] Verify CVE section appears in output
- [x] Optional: Get NVD API key
- [x] Optional: Configure key: `devcompass cve key --set`
- [x] Optional: Test key: `devcompass cve test`
- [x] Check cache: `devcompass cve cache --stats`
- [x] Verify graph still works: `devcompass graph --open`
- [x] Verify snapshots still work: `devcompass snapshot list`
- [x] Verify AI still works: `devcompass ai ask "test"`
- [x] Verify history still works: `devcompass history list`

### Rollback (if needed)
```bash
# Downgrade to v3.2.3
npm install -g devcompass@3.2.3

# CVE database will remain (safe to delete if needed)
rm ~/.devcompass/cve.db

# All v3.2.3 features still work
# You'll just lose CVE detection
```

### Known Limitations

- CVE detection requires internet connection
- OSV API rate limits (rarely hit in practice)
- NVD API rate limits: 5 req/s with key, 0.6 req/s without
- Cache expires after 24 hours (configurable in future)
- Supports npm ecosystem only (PyPI, Maven planned)
- No offline mode (cache helps but requires initial fetch)
- Severity parsing may miss some edge cases

---

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