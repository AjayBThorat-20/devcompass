# 🧭 DevCompass

**Dependency health checker for JavaScript/TypeScript projects**

[![npm version](https://img.shields.io/npm/v/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![npm downloads](https://img.shields.io/npm/dm/devcompass.svg)](https://www.npmjs.com/package/devcompass)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Analyze your JavaScript projects to find unused dependencies, outdated packages, and get a health score.

## ✨ Features

- 🔍 **Detect unused dependencies** - Find packages you're not actually using
- 📦 **Check for outdated packages** - See what needs updating
- 📊 **Project health score** - Get a 0-10 rating for your dependencies
- 🎨 **Beautiful terminal UI** - Colored output with clear sections
- ⚡ **Fast analysis** - Scans projects in seconds
- 🔧 **Framework-aware** - Handles React, Next.js, Angular, NestJS

## 🚀 Installation
```bash
npm install -g devcompass
```

## 📖 Usage

Navigate to your project directory and run:
```bash
devcompass analyze
```

### Example Output
```
🔍 DevCompass v1.0.0 - Analyzing your project...
✔ Scanned 15 dependencies in project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 UNUSED DEPENDENCIES (2)
  ● lodash
  ● moment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 OUTDATED PACKAGES (3)
  react          18.2.0 → ^19.0.0  (major update)
  axios          1.4.0 → ^1.6.0   (minor update)
  express        4.18.0 → ^4.19.0  (patch update)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PROJECT HEALTH
  Overall Score:       6.5/10
  Total Dependencies:  15
  Unused:              2
  Outdated:            3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK WIN
  Clean up unused dependencies:
  npm uninstall lodash moment

  Expected impact:
  ✓ Remove 2 unused packages
  ✓ Reduce node_modules size
  ✓ Improve health score → 7.5/10
```

## 🎯 What It Detects

### Unused Dependencies
- Uses AST parsing via [depcheck](https://github.com/depcheck/depcheck)
- Scans all `.js`, `.jsx`, `.ts`, `.tsx` files
- Excludes `node_modules`, `dist`, `build` folders
- Framework-aware (won't flag React, Next.js core packages)

### Outdated Packages
- Checks against npm registry
- Shows current vs latest versions
- Indicates update type (major/minor/patch)

### Health Score
- Calculated from 0-10 based on:
  - Percentage of unused dependencies (-4 points per 100%)
  - Percentage of outdated packages (-3 points per 100%)
- Higher score = healthier project

## ⚙️ Options
```bash
# Analyze current directory
devcompass analyze

# Show version
devcompass --version

# Show help
devcompass --help
```

## 🛠️ Requirements

- Node.js >= 14.0.0
- npm or yarn

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT © [Ajay Thorat](https://github.com/AjayBThorat-20)

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/devcompass)
- [GitHub Repository](https://github.com/AjayBThorat-20/devcompass)
- [Report Issues](https://github.com/AjayBThorat-20/devcompass/issues)

## 🙏 Acknowledgments

Built with:
- [depcheck](https://github.com/depcheck/depcheck) - Dependency checker
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates) - Package updater
- [chalk](https://github.com/chalk/chalk) - Terminal colors
- [ora](https://github.com/sindresorhus/ora) - Spinners
- [commander](https://github.com/tj/commander.js) - CLI framework

---

**Made with ❤️ by [Ajay Thorat](https://github.com/AjayBThorat-20)**