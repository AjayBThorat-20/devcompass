// // src/shared/utils/output-manager.js

// const fs = require('fs');
// const path = require('path');

// class OutputManager {
//   constructor(projectPath = process.cwd()) {
//     this.projectPath = projectPath;
//     this.baseDir = path.join(projectPath, '.devcompass');
//     this.directories = {
//       root: this.baseDir,
//       cache: path.join(this.baseDir, 'cache'),
//       backups: path.join(this.baseDir, 'backups'),
//       graphs: path.join(this.baseDir, 'graphs'),
//       reports: path.join(this.baseDir, 'reports'),
//       exports: path.join(this.baseDir, 'exports'),
//       temp: path.join(this.baseDir, 'temp')
//     };
//   }

//   ensureDirectories() {
//     Object.values(this.directories).forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
//     this.ensureGitignore();
//   }

//   ensureGitignore() {
//     const gitignorePath = path.join(this.projectPath, '.gitignore');
//     const entry = '.devcompass/';
//     try {
//       let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
//       if (!content.includes(entry)) fs.writeFileSync(gitignorePath, content.trim() + '\n\n# DevCompass outputs\n' + entry + '\n', 'utf8');
//     } catch (error) { if (process.env.DEBUG) console.error('Failed to update .gitignore:', error.message); }
//   }

//   getPath(type, filename = '') {
//     const dir = this.directories[type] || this.directories.root;
//     this.ensureDirectories();
//     return filename ? path.join(dir, filename) : dir;
//   }

//   getCachePath(filename = '') { return this.getPath('cache', filename); }
//   getBackupPath(filename = '') { return this.getPath('backups', filename); }
//   getGraphPath(filename = '') { return this.getPath('graphs', filename); }
//   getReportPath(filename = '') { return this.getPath('reports', filename); }
//   getExportPath(filename = '') { return this.getPath('exports', filename); }
//   getTempPath(filename = '') { return this.getPath('temp', filename); }

//   getRelativePath(absolutePath) { return path.relative(this.projectPath, absolutePath); }
//   exists(type, filename = '') { return fs.existsSync(this.getPath(type, filename)); }

//   list(type) {
//     const dir = this.directories[type];
//     if (!fs.existsSync(dir)) return [];
//     try {
//       return fs.readdirSync(dir).map(file => {
//         const filePath = path.join(dir, file);
//         return { name: file, path: filePath, relativePath: path.relative(this.projectPath, filePath), stats: fs.statSync(filePath) };
//       });
//     } catch (error) { return []; }
//   }

//   getSize(type) { return this.list(type).reduce((total, file) => file.stats.isDirectory() ? total : total + file.stats.size, 0); }

//   getSummary() {
//     return {
//       baseDir: this.baseDir,
//       relativePath: path.relative(this.projectPath, this.baseDir),
//       directories: Object.keys(this.directories).map(type => ({
//         type,
//         path: this.directories[type],
//         exists: fs.existsSync(this.directories[type]),
//         files: this.list(type).length,
//         size: this.getSize(type)
//       }))
//     };
//   }
// }

// module.exports = OutputManager;