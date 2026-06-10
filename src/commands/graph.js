// src/commands/graph.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const GraphGenerator = require('../graph/generator');
const GraphExporter = require('../graph/exporter');
const OutputManager = require('../utils/output-manager');

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

  // ====== INPUT VALIDATION ======
  // Validate layout
  const validLayouts = ['tree', 'force', 'radial', 'conflict'];
  if (!validLayouts.includes(layout)) {
    console.log(chalk.red(`\n❌ Invalid layout: "${layout}"`));
    console.log(chalk.yellow(`   Valid options: ${validLayouts.join(', ')}`));
    console.log(chalk.gray('\nExample:'), chalk.cyan(`devcompass graph --layout force\n`));
    process.exit(1);
  }

  // Validate filter
  const validFilters = ['all', 'vulnerable', 'outdated', 'unused', 'deprecated', 'conflict'];
  if (!validFilters.includes(filter)) {
    console.log(chalk.red(`\n❌ Invalid filter: "${filter}"`));
    console.log(chalk.yellow(`   Valid options: ${validFilters.join(', ')}`));
    console.log(chalk.gray('\nExample:'), chalk.cyan(`devcompass graph --filter vulnerable\n`));
    process.exit(1);
  }

  // Validate dimensions
  if (width < 400 || width > 5000) {
    console.log(chalk.red(`\n❌ Invalid width: ${width}`));
    console.log(chalk.yellow('   Width must be between 400 and 5000 pixels\n'));
    process.exit(1);
  }

  if (height < 300 || height > 5000) {
    console.log(chalk.red(`\n❌ Invalid height: ${height}`));
    console.log(chalk.yellow('   Height must be between 300 and 5000 pixels\n'));
    process.exit(1);
  }

  // Validate depth
  if (depth !== Infinity && (depth < 1 || depth > 20)) {
    console.log(chalk.red(`\n❌ Invalid depth: ${depth}`));
    console.log(chalk.yellow('   Depth must be between 1 and 20\n'));
    process.exit(1);
  }

  console.log(chalk.bold('\n📊 DevCompass - Dependency Graph\n'));

  // Initialize output manager
  const outputManager = new OutputManager(projectPath);

  // ====== VALIDATION ======
  // 1. Check if package.json exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.red('❌ No package.json found in project directory'));
    console.log(chalk.yellow('\n💡 Run this command from a valid Node.js project\n'));
    process.exit(1);
  }

  // 2. Check if analysis cache exists (for enrichment, not required)
  const cacheFile = outputManager.getCachePath('analysis-cache.json');
  const hasCachedAnalysis = fs.existsSync(cacheFile);
  
  if (!hasCachedAnalysis) {
    console.log(chalk.yellow('⚠️  No analysis cache found'));
    console.log(chalk.gray('   Graph will be generated without enrichment data'));
    console.log(chalk.gray('   Run "devcompass analyze" first for better results\n'));
  }

  // For JSON export, use traditional single-layout approach
  const isJSONExport = format === 'json' || output.endsWith('.json');
  
  if (!isJSONExport) {
    console.log(chalk.cyan('💡 Generating unified interactive graph with:'));
    console.log(chalk.gray('   • All layouts (Tree, Force, Radial, Conflict)'));
    console.log(chalk.gray('   • All filters (Vulnerable, Outdated, Unused, Deprecated)'));
    console.log(chalk.gray('   • Dynamic controls (no page reload needed)\n'));
  }

  const spinner = ora('Generating dependency graph...').start();

  try {
    // ====== DATA LOADING ======
    const generator = new GraphGenerator(projectPath);
    
    let analysisLoaded = false;
    let analysisResults = null;
    
    if (hasCachedAnalysis) {
      try {
        const analyzeModule = require('./analyze');
        
        if (typeof analyzeModule.runAnalyze === 'function') {
          spinner.text = 'Running analysis for graph enrichment...';
          analysisResults = await analyzeModule.runAnalyze({
            projectPath,
            silent: true,
            mode: 'silent',
            saveHistory: false
          });
          
          if (analysisResults) {
            generator.setAnalysisResults(analysisResults);
            analysisLoaded = true;
          }
        }
      } catch (error) {
        if (process.env.DEBUG) {
          console.log(chalk.dim(`[DEBUG] Analysis enrichment skipped: ${error.message}`));
        }
      }
    }

    // ====== GRAPH GENERATION ======
    spinner.text = 'Building dependency graph...';
    
    const graphData = await generator.generate({
      maxDepth: depth !== Infinity ? parseInt(depth) : Infinity,
      filter,
      enrichWithIssues: false
    });

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      spinner.fail('No dependencies found');
      console.log(chalk.yellow('\n⚠️  No dependencies found to visualize\n'));
      process.exit(0);
    }

    // ====== METADATA PREPARATION ======
    graphData.metadata = graphData.metadata || {};
    graphData.metadata.availableLayouts = ['tree', 'force', 'radial', 'conflict'];
    graphData.metadata.availableFilters = ['all', 'vulnerable', 'outdated', 'unused', 'deprecated', 'conflict'];
    graphData.metadata.defaultLayout = layout;
    graphData.metadata.defaultFilter = filter;
    graphData.metadata.defaultDepth = depth !== Infinity ? depth : 10;
    graphData.metadata.width = width;
    graphData.metadata.height = height;

    const issueCount = graphData.nodes.filter(n => n.issues && n.issues.length > 0).length;
    spinner.succeed(`Generated graph with ${chalk.cyan(graphData.nodes.length)} nodes${issueCount > 0 ? ` (${chalk.yellow(issueCount)} with issues)` : ''}`);

    // ====== FORMAT DETECTION ======
    let detectedFormat = format;
    if (!detectedFormat) {
      const ext = path.extname(output).toLowerCase();
      detectedFormat = ext.substring(1) || 'html';
    }

    // ====== EXPORT ======
    const exportSpinner = ora(`Exporting to ${detectedFormat.toUpperCase()}...`).start();

    const exporter = new GraphExporter(graphData, {
      layout,
      width: parseInt(width),
      height: parseInt(height),
      filter,
      unified: detectedFormat === 'html'
    });

    // Determine output path using OutputManager
    let outputPath;
    if (path.isAbsolute(output)) {
      outputPath = output;
    } else {
      outputPath = outputManager.getGraphPath(output);
    }
    
    if (!output.endsWith(`.${detectedFormat}`)) {
      const basename = path.basename(output, path.extname(output));
      outputPath = path.join(path.dirname(outputPath), `${basename}.${detectedFormat}`);
    }

    const result = await exporter.export(outputPath);

    // ====== OUTPUT HANDLING ======
    if (result.success) {
      exportSpinner.succeed(`Graph exported: ${chalk.cyan(outputManager.getRelativePath(result.path))}`);

      displaySummary(graphData, result, analysisLoaded, options, outputManager);

      if (result.format === 'HTML' && shouldOpen) {
        try {
          console.log(chalk.cyan('\n🌐 Opening in browser...'));
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
      console.log(chalk.red('\n❌ Failed to export graph'));
      console.log(chalk.gray(`   Error: ${result.error}\n`));
      process.exit(1);
    }

  } catch (error) {
    spinner.fail('Graph generation failed');
    console.error(chalk.red('\n✗ Error:'), error.message);
    
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

function displaySummary(graphData, result, analysisLoaded, options, outputManager) {
  const stats = {
    totalNodes: graphData.nodes.length,
    totalLinks: graphData.links.length,
    maxDepth: graphData.metadata.maxDepth,
    withIssues: graphData.nodes.filter(n => n.issues && n.issues.length > 0).length,
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
    console.log(`  ${chalk.gray('Layouts:')}       Tree, Force, Radial, Conflict ${chalk.gray('(switchable)')}`);
    console.log(`  ${chalk.gray('Filters:')}       All, Vulnerable, Outdated, Unused, Deprecated ${chalk.gray('(switchable)')}`);
  } else {
    console.log(`  ${chalk.gray('Layout:')}        ${options.layout || 'tree'}`);
  }
  
  console.log(`  ${chalk.gray('Total Nodes:')}   ${stats.totalNodes}`);
  console.log(`  ${chalk.gray('Total Links:')}   ${stats.totalLinks}`);
  console.log(`  ${chalk.gray('Max Depth:')}     ${stats.maxDepth}`);
  console.log(`  ${chalk.gray('File Size:')}     ${result.fileSize || getFileSize(result.path)}`);
  
  if (analysisLoaded) {
    console.log(`  ${chalk.gray('Enriched:')}      ${chalk.green('✓ Analysis data applied')}`);
    
    if (stats.withIssues > 0) {
      console.log(`  ${chalk.gray('With Issues:')}   ${stats.withIssues} packages`);
      if (stats.vulnerable > 0) console.log(`    ${chalk.gray('Vulnerable:')} ${chalk.red(stats.vulnerable)}`);
      if (stats.deprecated > 0) console.log(`    ${chalk.gray('Deprecated:')} ${chalk.magenta(stats.deprecated)}`);
      if (stats.outdated > 0) console.log(`    ${chalk.gray('Outdated:')}   ${chalk.yellow(stats.outdated)}`);
      if (stats.unused > 0) console.log(`    ${chalk.gray('Unused:')}     ${chalk.blue(stats.unused)}`);
    }
  }
  
  console.log('\n' + chalk.gray('─'.repeat(70)));

  if (result.format === 'HTML') {
    console.log(chalk.bold('\n📋 INTERACTIVE CONTROLS\n'));
    console.log('  Open the HTML file to access:');
    console.log(`  ${chalk.cyan('•')} Layout switcher (Tree/Force/Radial/Conflict)`);
    console.log(`  ${chalk.cyan('•')} Filter controls (Vulnerable/Outdated/Unused/Deprecated)`);
    console.log(`  ${chalk.cyan('•')} Depth slider (1-10)`);
    console.log(`  ${chalk.cyan('•')} Search functionality`);
    console.log(`  ${chalk.cyan('•')} Zoom & pan controls`);
    console.log(`  ${chalk.cyan('•')} Real-time updates (no page reload)`);
    
    console.log(chalk.bold('\n💡 USAGE TIPS\n'));
    console.log(`  ${chalk.gray('Zoom:')}         Mouse wheel or pinch`);
    console.log(`  ${chalk.gray('Pan:')}          Click and drag background`);
    console.log(`  ${chalk.gray('Move nodes:')}   Drag nodes (Force layout)`);
    console.log(`  ${chalk.gray('Node details:')} Hover over nodes`);
    console.log(`  ${chalk.gray('Search:')}       Type package name in search box`);
    
    console.log(chalk.cyan('\n──────────────────────────────────────────────────────────────────────\n'));
  }

  if (stats.vulnerable > 0 || stats.deprecated > 0 || stats.outdated > 0) {
    console.log(chalk.bold('📋 SUGGESTIONS\n'));
    
    if (stats.vulnerable > 0) {
      console.log(chalk.yellow(`  ⚠️  ${stats.vulnerable} vulnerable package(s) detected`));
      console.log(`     ${chalk.gray('→')} Use ${chalk.cyan('Vulnerable filter')} in the graph UI`);
      console.log(`     ${chalk.gray('→')} Run: ${chalk.cyan('devcompass fix')} to resolve\n`);
    }
    
    if (stats.deprecated > 0) {
      console.log(chalk.yellow(`  ⚠️  ${stats.deprecated} deprecated package(s) found`));
      console.log(`     ${chalk.gray('→')} Use ${chalk.cyan('Deprecated filter')} in the graph UI`);
      console.log(`     ${chalk.gray('→')} Run: ${chalk.cyan('devcompass fix --only quality')}\n`);
    }
    
    if (stats.outdated > 0) {
      console.log(chalk.yellow(`  ⚠️  ${stats.outdated} outdated package(s) found`));
      console.log(`     ${chalk.gray('→')} Use ${chalk.cyan('Outdated filter')} in the graph UI`);
      console.log(`     ${chalk.gray('→')} Run: ${chalk.cyan('npm update')}\n`);
    }
  } else if (analysisLoaded) {
    console.log(chalk.bold('📋 STATUS\n'));
    console.log(`  ${chalk.green('✓')} Your project looks healthy! No critical issues detected.\n`);
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } catch {
    return 'Unknown';
  }
}

function showHelp() {
  console.log(chalk.bold.cyan('\n📊 DevCompass Graph Command\n'));
  console.log(chalk.bold('Usage:'));
  console.log(chalk.gray('  devcompass graph [options]\n'));
  console.log(chalk.bold('Options:'));
  console.log(chalk.cyan('  --output <path>       ') + chalk.gray('Output file path (default: dependency-graph.html)'));
  console.log(chalk.cyan('  --format <type>       ') + chalk.gray('Output format: html, json (default: html)'));
  console.log(chalk.cyan('  --layout <type>       ') + chalk.gray('Default layout: tree, force, radial, conflict (default: tree)'));
  console.log(chalk.cyan('  --filter <type>       ') + chalk.gray('Default filter: all, vulnerable, outdated, unused, deprecated (default: all)'));
  console.log(chalk.cyan('  --depth <n>           ') + chalk.gray('Maximum dependency depth (default: unlimited)'));
  console.log(chalk.cyan('  --width <n>           ') + chalk.gray('Graph width in pixels (default: 1200)'));
  console.log(chalk.cyan('  --height <n>          ') + chalk.gray('Graph height in pixels (default: 800)'));
  console.log(chalk.cyan('  --open                ') + chalk.gray('Open in browser after generation'));
  console.log(chalk.cyan('  --help                ') + chalk.gray('Show this help message\n'));
  console.log(chalk.bold('Examples:'));
  console.log(chalk.gray('  devcompass graph'));
  console.log(chalk.gray('  devcompass graph --output dashboard.html'));
  console.log(chalk.gray('  devcompass graph --layout force --filter vulnerable'));
  console.log(chalk.gray('  devcompass graph --open'));
  console.log(chalk.gray('  devcompass graph --format json --output graph-data.json'));
  console.log(chalk.gray('  devcompass graph --depth 3 --width 1600 --height 900\n'));
  console.log(chalk.bold('Output Location:'));
  console.log(chalk.gray('  Files are saved to .devcompass/graphs/ by default\n'));
}

module.exports = graphCommand;
module.exports.showHelp = showHelp;