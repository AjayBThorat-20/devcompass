# Migration Guide

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

*Last updated: April 25, 2026 (v3.2.0)*