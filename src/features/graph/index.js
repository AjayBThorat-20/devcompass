// src/features/graph/index.js

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const GraphGenerator = require('./graph.generator');
const GraphExporter = require('./graph.exporter');
const OutputManager = require('../../shared/utils/output-manager');

async function graphCommand(options = {}) {
  const {
    path: projectPath = process.cwd(),
    output = 'dependency-graph.html',
    format,
    layout = 'tree',
    depth = Infinity,
    filter = 'all',
    width = 1200,
    height = 800,
    open: shouldOpen = false
  } = options;

  const validLayouts = ['tree', 'force', 'radial', 'conflict', 'analytics'];
  const validFilters = ['all', 'vulnerable', 'outdated', 'unused', 'deprecated', 'conflict'];

  if (!validLayouts.includes(layout)) {
    console.log(chalk.red(`\n❌ Invalid layout: "${layout}". Valid: ${validLayouts.join(', ')}\n`));
    process.exit(1);
  }
  if (!validFilters.includes(filter)) {
    console.log(chalk.red(`\n❌ Invalid filter: "${filter}". Valid: ${validFilters.join(', ')}\n`));
    process.exit(1);
  }
  if (width < 400 || width > 5000 || height < 300 || height > 5000) {
    console.log(chalk.red('\n❌ Width must be 400-5000, height must be 300-5000\n'));
    process.exit(1);
  }
  if (depth !== Infinity && (depth < 1 || depth > 20)) {
    console.log(chalk.red('\n❌ Depth must be between 1 and 20\n'));
    process.exit(1);
  }

  console.log(chalk.bold('\n📊 DevCompass - Dependency Graph\n'));

  const outputManager = new OutputManager(projectPath);
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red('❌ No package.json found in project directory\n'));
    process.exit(1);
  }

  const isJSONExport = format === 'json' || output.endsWith('.json');
  if (!isJSONExport) {
    console.log(chalk.cyan('💡 Generating unified interactive graph with:'));
    console.log(chalk.gray('   • All layouts (Tree, Force, Radial, Conflict, Analytics)'));
    console.log(chalk.gray('   • All filters (Vulnerable, Outdated, Unused, Deprecated)'));
    console.log(chalk.gray('   • Dynamic controls (no page reload needed)\n'));
  }

  const spinner = ora('Generating dependency graph...').start();

  try {
    const generator = new GraphGenerator(projectPath);
    let analysisResults = null;

    const cacheFile = outputManager.getCachePath('analysis-cache.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const { runAnalyze } = require('../analyze');
        analysisResults = await runAnalyze({ projectPath, silent: true, mode: 'silent', saveHistory: false });
        if (analysisResults) generator.setAnalysisResults(analysisResults);
      } catch (error) {
        if (process.env.DEBUG) console.log(chalk.dim(`[DEBUG] Analysis enrichment skipped: ${error.message}`));
      }
    }

    spinner.text = 'Building dependency graph...';
    const graphData = await generator.generate({ maxDepth: depth !== Infinity ? parseInt(depth) : Infinity, filter, enrichWithIssues: false });

    if (!graphData?.nodes?.length) {
      spinner.fail('No dependencies found');
      console.log(chalk.yellow('\n⚠️  No dependencies found to visualize\n'));
      process.exit(0);
    }

    graphData.metadata = { ...graphData.metadata, availableLayouts: ['tree', 'force', 'radial', 'conflict', 'analytics'], availableFilters: validFilters, defaultLayout: layout, defaultFilter: filter, defaultDepth: depth !== Infinity ? depth : 10, width, height };

    const issueCount = graphData.nodes.filter(n => n.issues?.length > 0).length;
    spinner.succeed(`Generated graph with ${chalk.cyan(graphData.nodes.length)} nodes${issueCount > 0 ? ` (${chalk.yellow(issueCount)} with issues)` : ''}`);

    let detectedFormat = format;
    if (!detectedFormat) { const ext = path.extname(output).toLowerCase(); detectedFormat = ext.substring(1) || 'html'; }

    const exportSpinner = ora(`Exporting to ${detectedFormat.toUpperCase()}...`).start();
    const exporter = new GraphExporter(graphData, { layout, width: parseInt(width), height: parseInt(height), filter, unified: detectedFormat === 'html' });

    let outputPath;
    if (path.isAbsolute(output)) { outputPath = output; }
    else { outputPath = outputManager.getGraphPath(output); }
    if (!output.endsWith(`.${detectedFormat}`)) {
      const basename = path.basename(output, path.extname(output));
      outputPath = path.join(path.dirname(outputPath), `${basename}.${detectedFormat}`);
    }

    const result = await exporter.export(outputPath);

    if (result.success) {
      exportSpinner.succeed(`Graph exported: ${chalk.cyan(outputManager.getRelativePath(result.path))}`);
      displaySummary(graphData, result, !!analysisResults, options, outputManager);

      if (result.format === 'HTML' && shouldOpen) {
        try {
          const open = require('open');
          await open(path.resolve(result.path));
        } catch (error) {
          console.log(chalk.yellow('\n⚠️  Could not open browser automatically'));
          console.log(chalk.gray(`   Open manually: ${path.resolve(result.path)}`));
        }
      }
      console.log(chalk.green('\n✓ Graph generation complete!\n'));
    } else {
      exportSpinner.fail(`Export failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Graph generation failed');
    console.error(chalk.red('\n✗ Error:'), error.message);
    if (process.env.DEBUG) console.error(chalk.gray(error.stack));
    process.exit(1);
  }
}

function displaySummary(graphData, result, analysisLoaded, options, outputManager) {
  const stats = {
    totalNodes: graphData.nodes.length,
    totalLinks: graphData.links.length,
    maxDepth: graphData.metadata.maxDepth,
    withIssues: graphData.nodes.filter(n => n.issues?.length > 0).length,
    vulnerable: graphData.nodes.filter(n => n.isVulnerable).length,
    deprecated: graphData.nodes.filter(n => n.isDeprecated).length,
    outdated: graphData.nodes.filter(n => n.isOutdated).length,
    unused: graphData.nodes.filter(n => n.isUnused).length
  };

  console.log('\n' + chalk.gray('─'.repeat(70)));
  console.log(chalk.bold('\n📈 GRAPH SUMMARY\n'));
  console.log(`  ${chalk.gray('Format:')}        ${result.format}`);
  console.log(`  ${chalk.gray('Location:')}      ${outputManager.getRelativePath(result.path)}`);
  if (result.format === 'HTML') {
    console.log(`  ${chalk.gray('Mode:')}          ${chalk.green('✓ Unified Interactive')}`);
    console.log(`  ${chalk.gray('Layouts:')}       Tree, Force, Radial, Conflict, Analytics ${chalk.gray('(switchable)')}`);
  }
  console.log(`  ${chalk.gray('Total Nodes:')}   ${stats.totalNodes}`);
  console.log(`  ${chalk.gray('Total Links:')}   ${stats.totalLinks}`);
  console.log(`  ${chalk.gray('Max Depth:')}     ${stats.maxDepth}`);

  if (analysisLoaded && stats.withIssues > 0) {
    console.log(`  ${chalk.gray('With Issues:')}   ${stats.withIssues} packages`);
    if (stats.vulnerable > 0) console.log(`    ${chalk.gray('Vulnerable:')} ${chalk.red(stats.vulnerable)}`);
    if (stats.outdated > 0) console.log(`    ${chalk.gray('Outdated:')}   ${chalk.yellow(stats.outdated)}`);
    if (stats.unused > 0) console.log(`    ${chalk.gray('Unused:')}     ${chalk.blue(stats.unused)}`);
  }

  console.log('\n' + chalk.gray('─'.repeat(70)) + '\n');
}

module.exports = graphCommand;