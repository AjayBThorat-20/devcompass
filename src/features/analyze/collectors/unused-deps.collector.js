// src/features/analyze/collectors/unused-deps.collector.js

const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execFileAsync = promisify(execFile);

let knipConfigData = null;
try {
  knipConfigData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../../data/knip-config.json'), 'utf8')
  );
} catch (error) {
  if (process.env.DEBUG) console.error('Could not load knip-config.json:', error.message);
  knipConfigData = { skipPackages: [] };
}

// knip's CLI entry, resolved from DevCompass's own install (its main entry
// is knip/dist/index.js; the CLI is knip/bin/knip.js).
function resolveKnipBin() {
  return path.join(path.dirname(require.resolve('knip')), '..', 'bin', 'knip.js');
}

// Exact-match against the skip list (or its scoped subpaths), not substring —
// "eslint" must not also swallow "eslint-plugin-unicorn", nor "next" swallow "next-auth".
function shouldSkipPackage(pkg, skipPackages) {
  return skipPackages.some(skip => pkg === skip || pkg.startsWith(`${skip}/`));
}

async function analyzeUnusedDependencies(projectPath, packageJson = null) {
  try {
    if (!packageJson) {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return [];
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    }

    const dependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
    if (Object.keys(dependencies).length === 0) return [];

    // The temp knip config lives in the OS temp dir, never inside the scanned
    // project (analyze must not write there), and is removed afterwards.
    const knipTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-knip-'));
    const knipConfigPath = path.join(knipTempDir, 'knip.json');
    try {
      return await runKnip(projectPath, dependencies, knipConfigPath);
    } finally {
      fs.rmSync(knipTempDir, { recursive: true, force: true });
    }
  } catch (error) {
    if (process.env.DEBUG) console.error('Unused dependencies analysis failed:', error.message);
    return [];
  }
}

async function runKnip(projectPath, dependencies, knipConfigPath) {
  try {
    // skipPackages is not part of knip's config schema; it's applied separately
    // below (JS-side) and must not be written into the knip.json file itself.
    const { skipPackages, ...knipSchemaConfig } = knipConfigData;
    fs.writeFileSync(knipConfigPath, JSON.stringify(knipSchemaConfig, null, 2));
  } catch (error) {
    if (process.env.DEBUG) console.error('Could not write knip.json, using fallback detector:', error.message);
    return fallbackUnusedCheck(projectPath, dependencies);
  }

  try {
    // knip exits non-zero whenever it finds issues (its normal/expected behavior,
    // not an execution failure), so the rejected promise still carries valid
    // JSON on stdout and must be read from there rather than treated as a failure.
    //
    // Run the copy of knip DevCompass itself installed, with the current Node
    // binary, instead of `npx knip` — npx resolves against the *scanned*
    // project, so it could silently download and run a different knip
    // version over the network. Running a .js file with process.execPath
    // also needs no shell on any platform.
    let knipOutput;
    try {
      ({ stdout: knipOutput } = await execFileAsync(
        process.execPath,
        [resolveKnipBin(), '--config', knipConfigPath, '--reporter', 'json'],
        { cwd: projectPath, encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      ));
    } catch (execError) {
      if (typeof execError.stdout !== 'string' || !execError.stdout.trim()) throw execError;
      knipOutput = execError.stdout;
    }

    const results = JSON.parse(knipOutput);
    let unused = [];

    if (Array.isArray(results.issues)) {
      const names = new Set();
      results.issues.forEach(fileIssue => {
        [...(fileIssue.dependencies || []), ...(fileIssue.devDependencies || [])].forEach(dep => {
          if (dep?.name) names.add(dep.name);
        });
      });
      unused = Array.from(names).filter(dep => dependencies[dep]);
    }

    const skipPackages = knipConfigData.skipPackages || [];
    unused = unused.filter(pkg => !shouldSkipPackage(pkg, skipPackages));

    return unused;
  } catch (knipError) {
    if (process.env.DEBUG) console.error('Knip analysis unavailable, using fallback:', knipError.message);
    return fallbackUnusedCheck(projectPath, dependencies);
  }
}

const CODE_FILE_PATTERN = /\.(js|jsx|mjs|cjs|ts|tsx|mts|cts|vue|svelte)$/i;
// Other files under src/ that can reference a package by name: stylesheets
// (@import 'bootstrap/...'), HTML, and JSON config.
const TEXT_FILE_PATTERN = /\.(css|scss|sass|less|html|json)$/i;
const IGNORED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.cache']);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// In code, a dependency is used if something requires/imports it by name or
// by a subpath (lodash/debounce, @scope/pkg/sub).
function codeUsagePatterns(dep) {
  const name = escapeRegExp(dep);
  return [
    new RegExp(`require\\(\\s*['"\`]${name}(?:/[^'"\`]*)?['"\`]\\s*\\)`),
    new RegExp(`from\\s+['"\`]${name}(?:/[^'"\`]*)?['"\`]`),
    new RegExp(`import\\s*\\(?\\s*['"\`]${name}(?:/[^'"\`]*)?['"\`]`)
  ];
}

// Config files and stylesheets name a package without importing it
// ("presets": ["@babel/preset-env"], plugins: { tailwindcss: {} },
// @import 'bootstrap/scss/bootstrap'), so there it counts as used when the
// name appears as a whole token — not as a substring ("ms" inside "items").
function referencePattern(dep) {
  return new RegExp(`(^|[^\\w@/.-])${escapeRegExp(dep)}(?=$|[^\\w-]|/)`, 'm');
}

// `explicit` files (index.js, *.config.js, .babelrc, ...) are always read;
// directories are walked for code and text files only.
function collectFiles(entryPath, files = [], explicit = true) {
  let stats;
  try { stats = fs.statSync(entryPath); } catch (error) { return files; }

  if (stats.isDirectory()) {
    if (IGNORED_DIR_NAMES.has(path.basename(entryPath))) return files;
    let entries = [];
    try { entries = fs.readdirSync(entryPath); } catch (error) { return files; }
    entries.forEach(entry => collectFiles(path.join(entryPath, entry), files, false));
  } else if (stats.isFile() && (explicit || CODE_FILE_PATTERN.test(entryPath) || TEXT_FILE_PATTERN.test(entryPath))) {
    files.push(entryPath);
  }
  return files;
}

// A pure-JavaScript scan, not `grep`: Windows has no grep by default, so this
// fallback used to treat every dependency as "used" there.
function checkDependencyUsage(dep, sources) {
  const codePatterns = codeUsagePatterns(dep);
  const reference = referencePattern(dep);

  for (const { content, isCode } of sources) {
    const patterns = isCode ? codePatterns : [reference];
    if (patterns.some(pattern => pattern.test(content))) return { dep, used: true };
  }
  return { dep, used: false };
}

// Each file is read once, not once per dependency. Config files get the
// name-reference rule even when they're JavaScript (postcss.config.js names
// plugins as bare keys, with no require/import).
function readSources(files, configFiles = new Set()) {
  const sources = [];
  for (const file of files) {
    const isCode = CODE_FILE_PATTERN.test(file) && !configFiles.has(file);
    try { sources.push({ content: fs.readFileSync(file, 'utf8'), isCode }); } catch (error) { /* unreadable: skip */ }
  }
  return sources;
}

async function fallbackUnusedCheck(projectPath, dependencies) {
  const skipPackages = knipConfigData.skipPackages || [];

  const srcDir = path.join(projectPath, 'src');
  const candidatePaths = [
    srcDir,
    path.join(projectPath, 'index.js'),
    path.join(projectPath, 'main.js'),
    path.join(projectPath, 'scripts'),
  ].filter(p => fs.existsSync(p));

  // Config files commonly reference a dependency (e.g. postcss.config.js,
  // webpack.config.js) without it ever appearing under src/ — check those too.
  const configGlobPatterns = fs.readdirSync(projectPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(config|rc)\.(js|cjs|mjs|json)$|^\.[a-z]+rc$/i.test(entry.name))
    .map(entry => path.join(projectPath, entry.name));
  candidatePaths.push(...configGlobPatterns);

  if (candidatePaths.length === 0) return [];

  const depsToCheck = Object.keys(dependencies).filter(dep => !shouldSkipPackage(dep, skipPackages));
  const sources = readSources(candidatePaths.flatMap(p => collectFiles(p)), new Set(configGlobPatterns));
  return depsToCheck.filter(dep => !checkDependencyUsage(dep, sources).used);
}

module.exports = { analyzeUnusedDependencies, fallbackUnusedCheck };
