// src/commands/graph.js
// v3.1.4 - Unified graph with dynamic layout/filter controls

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const GraphGenerator = require('../graph/generator');
const GraphExporter = require('../graph/exporter');

/**
 * Graph command - Generate unified interactive dependency visualization
 */
async function graphCommand(options) {
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

  console.log(chalk.bold('\n📊 DevCompass - Dependency Graph\n'));

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
    // Generate graph data
    const generator = new GraphGenerator(projectPath);
    
    // Try to load analysis results for enrichment
    let analysisLoaded = false;
    let analysisResults = null;
    
    try {
      const analyzeModule = require('./analyze');
      
      if (typeof analyzeModule.analyzeProject === 'function') {
        spinner.text = 'Running analysis for graph enrichment...';
        analysisResults = await analyzeModule.analyzeProject(projectPath, { silent: true });
        
        if (analysisResults) {
          generator.setAnalysisResults(analysisResults);
          analysisLoaded = true;
        }
      }
    } catch (error) {
      // Analysis not available, continue without enrichment
    }

    spinner.text = 'Building dependency graph...';
    
    const graphData = await generator.generate({
      maxDepth: depth !== Infinity ? parseInt(depth) : Infinity,
      filter,
      enrichWithIssues: false
    });

    if (!graphData) {
      spinner.fail('Failed to generate graph data');
      return;
    }

    // Add metadata for unified HTML
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

    // Detect format
    let detectedFormat = format;
    if (!detectedFormat) {
      const ext = path.extname(output).toLowerCase();
      detectedFormat = ext.substring(1) || 'html';
    }

    const exportSpinner = ora(`Exporting to ${detectedFormat.toUpperCase()}...`).start();

    const exporter = new GraphExporter(graphData, {
      layout,
      width: parseInt(width),
      height: parseInt(height),
      filter,
      unified: detectedFormat === 'html' // Enable unified mode for HTML
    });

    // Ensure output path has correct extension
    let outputPath = output;
    if (!output.endsWith(`.${detectedFormat}`)) {
      const basename = path.basename(output, path.extname(output));
      outputPath = path.join(path.dirname(output), `${basename}.${detectedFormat}`);
    }

    const result = await exporter.export(outputPath);

    if (result.success) {
      exportSpinner.succeed(`Graph exported: ${chalk.cyan(result.path)}`);

      // Display summary
      displaySummary(graphData, result, analysisLoaded, options);

      // Open in browser if requested
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
    }

  } catch (error) {
    spinner.fail('Graph generation failed');
    console.error(chalk.red('\n✗ Error:'), error.message);
    
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
  }
}

/**
 * Display comprehensive summary
 */
function displaySummary(graphData, result, analysisLoaded, options) {
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

  // Suggestions
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

/**
 * Get file size helper
 */
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

module.exports = graphCommand;