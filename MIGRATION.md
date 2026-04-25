# Migration Guide

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