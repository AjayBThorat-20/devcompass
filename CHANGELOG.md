# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-20

### Added
- Initial release of DevCompass
- Unused dependency detection using depcheck
- Outdated package detection using npm-check-updates
- Project health score calculation (0-10 scale)
- Beautiful terminal UI with colored output
- Loading spinners and progress indicators
- Framework-aware detection (React, Next.js, Angular, NestJS)
- Quick win recommendations for cleanup
- CLI command: `devcompass analyze`
- Support for JavaScript and TypeScript projects
- Automatic exclusion of build folders and node_modules

### Features
- AST-based dependency scanning
- Smart detection of implicit dependencies (e.g., React in JSX)
- Version comparison with npm registry
- Penalty-based scoring algorithm
- Error handling for invalid package.json
- Graceful degradation when tools fail

### Technical Details
- Built with Node.js >= 14.0.0
- Dependencies: chalk, commander, depcheck, npm-check-updates, ora
- Package size: 4.3 kB
- Total files: 10

### Documentation
- Comprehensive README with examples
- MIT License
- GitHub repository setup
- npm package published

[1.0.0]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.0


## [1.0.1] - 2025-03-20

### Fixed
- Added autoprefixer, postcss, tailwindcss to framework ignore list (fixes false positives)
- Added prettier, eslint, and related configs to ignore list
- Prevent DevCompass from flagging itself as unused when installed locally
- Better detection of config-based dependencies

### Added
- CHANGELOG.md with version history
- MIT LICENSE file
- Warning message when DevCompass is installed locally instead of globally
- Improved ignore patterns for CSS/PostCSS tooling
- Better ESLint plugin detection

### Changed
- Enhanced documentation about installation methods

[1.0.1]: https://github.com/AjayBThorat-20/devcompass/releases/tag/v1.0.1