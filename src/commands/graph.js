// src/commands/graph.js
// v3.1.2 - Fixed async generator.generate() call
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const GraphGenerator = require('../graph/generator');
const GraphExporter = require('../graph/exporter');

/**
 * Graph command
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

  // Validate layout option
  const validLayouts = ['tree', 'force', 'radial', 'conflict'];
  if (!validLayouts.includes(layout)) {
    console.error(chalk.red(`✗ Invalid layout: ${layout}`));
    console.log(chalk.gray(`  Valid options: ${validLayouts.join(', ')}`));
    return;
  }

  // Validate filter option
  const validFilters = ['all', 'vulnerable', 'outdated', 'unused', 'conflict'];
  if (!validFilters.includes(filter)) {
    console.error(chalk.red(`✗ Invalid filter: ${filter}`));
    console.log(chalk.gray(`  Valid options: ${validFilters.join(', ')}`));
    return;
  }

  const spinner = ora('Generating dependency graph...').start();

  try {
    // Generate graph data
    const generator = new GraphGenerator(projectPath);
    
    // Try to load analysis results for enrichment
    let analysisLoaded = false;
    try {
      const { analyzeProject } = require('./analyze');
      spinner.text = 'Running analysis for graph enrichment...';
      const analysisResults = await analyzeProject(projectPath, { silent: true });
      
      if (analysisResults) {
        generator.setAnalysisResults(analysisResults);
        analysisLoaded = true;
        
        // Debug: log what we got
        if (process.env.DEBUG) {
          console.log('[graph] Analysis results loaded:');
          console.log('  - Security vulnerabilities:', analysisResults.security?.vulnerabilities?.length || 0);
          console.log('  - Outdated packages:', analysisResults.outdatedPackages?.length || 0);
          console.log('  - Unused dependencies:', analysisResults.unusedDependencies?.length || 0);
          console.log('  - Ecosystem alerts:', analysisResults.ecosystemAlerts?.length || 0);
        }
      }
    } catch (error) {
      // Analysis not available, continue without enrichment
      if (process.env.DEBUG) {
        console.log('[graph] Analysis failed:', error.message);
      }
    }

    spinner.text = 'Building dependency graph...';
    
    // FIXED: generator.generate() is now async, must use await
    const graphData = await generator.generate({
      maxDepth: depth !== Infinity ? parseInt(depth) : Infinity,
      filter,
      enrichWithIssues: false  // Dynamic npm fetching disabled for speed
    });

    if (!graphData) {
      spinner.fail('Failed to generate graph data');
      return;
    }

    spinner.succeed(`Generated graph with ${graphData.nodes.length} nodes`);

    // Detect format from output filename if not specified
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
      filter
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
      console.log('\n' + chalk.gray('─'.repeat(70)));
      console.log(chalk.bold('\n📈 GRAPH SUMMARY\n'));
      console.log(`  ${chalk.gray('Format:')}        ${result.format.toUpperCase()}`);
      console.log(`  ${chalk.gray('Layout:')}        ${layout}`);
      console.log(`  ${chalk.gray('Total Nodes:')}   ${graphData.nodes.length}`);
      console.log(`  ${chalk.gray('Total Links:')}   ${graphData.links.length}`);
      console.log(`  ${chalk.gray('Max Depth:')}     ${graphData.metadata.maxDepth}`);
      console.log(`  ${chalk.gray('File Size:')}     ${result.fileSize || getFileSize(result.path)}`);
      
      if (filter !== 'all') {
        console.log(`  ${chalk.gray('Filter:')}        ${filter}`);
        console.log(`  ${chalk.gray('Filtered:')}      ${graphData.metadata.visibleDependencies} / ${graphData.metadata.totalDependencies}`);
      }
      
      // Show enrichment status
      if (analysisLoaded) {
        const issueNodes = graphData.nodes.filter(n => n.issues && n.issues.length > 0).length;
        const vulnNodes = graphData.nodes.filter(n => n.isVulnerable).length;
        const outdatedNodes = graphData.nodes.filter(n => n.isOutdated).length;
        const unusedNodes = graphData.nodes.filter(n => n.isUnused).length;
        
        if (issueNodes > 0) {
          console.log(`  ${chalk.gray('With Issues:')}   ${issueNodes} packages`);
          if (vulnNodes > 0) console.log(`  ${chalk.gray('  Vulnerable:')} ${chalk.red(vulnNodes)}`);
          if (outdatedNodes > 0) console.log(`  ${chalk.gray('  Outdated:')}   ${chalk.yellow(outdatedNodes)}`);
          if (unusedNodes > 0) console.log(`  ${chalk.gray('  Unused:')}     ${chalk.blue(unusedNodes)}`);
        }
      }
      
      if (result.method) {
        console.log(`  ${chalk.gray('Export Method:')} ${result.method}`);
      }
      
      console.log('\n' + chalk.gray('─'.repeat(70)));

      // Show format-specific tips
      if (result.format === 'html') {
        console.log(chalk.cyan('\n💡 TIPS:'));
        console.log(`  • ${chalk.gray('Zoom:')} Mouse wheel or pinch`);
        console.log(`  • ${chalk.gray('Pan:')} Click and drag`);
        console.log(`  • ${chalk.gray('Details:')} Hover over nodes`);
        
        if (layout === 'force') {
          console.log(`  • ${chalk.gray('Move nodes:')} Drag individual nodes`);
          console.log(`  • ${chalk.gray('Reset:')} Use "Reset Layout" button`);
        }
        
        if (options.includeSearch !== false) {
          console.log(`  • ${chalk.gray('Search:')} Use search panel on left`);
          console.log(`  • ${chalk.gray('Filter:')} Apply filters to focus on issues`);
        }
      }

      // Open in browser if requested
      if (result.format === 'html' && shouldOpen) {
        try {
          console.log(chalk.cyan('\n🌐 Opening in browser...'));
          const open = require('open');
          await open(path.resolve(result.path));
        } catch (error) {
          console.log(chalk.yellow('\n⚠️  Could not open browser automatically'));
          console.log(chalk.gray(`   Open manually: ${path.resolve(result.path)}`));
        }
      }

      // Show next steps
      console.log(chalk.bold('\n📋 NEXT STEPS:\n'));
      
      if (result.format === 'html') {
        console.log(`  1. Open in browser: ${chalk.cyan(`file://${path.resolve(result.path)}`)}`);
        console.log(`  2. Explore dependencies interactively`);
        console.log(`  3. Use filters to identify issues`);
      }
      
      if (filter === 'all') {
        console.log(`  • Try: ${chalk.cyan(`devcompass graph --filter conflict`)} to see only problematic packages`);
      }
      
      if (layout === 'tree') {
        console.log(`  • Try: ${chalk.cyan(`devcompass graph --layout force`)} for interactive physics layout`);
        console.log(`  • Try: ${chalk.cyan(`devcompass graph --layout radial`)} for circular visualization`);
      }

      console.log(chalk.green('\n✓ Graph generation complete!\n'));

    } else {
      exportSpinner.fail(`Export failed: ${result.error}`);
      
      // Show helpful error messages
      if (result.error.includes('puppeteer') || result.error.includes('canvas')) {
        console.log(chalk.yellow('\n💡 TIP: For PNG export, install one of:'));
        console.log(chalk.gray('  npm install -g puppeteer  (recommended, ~300MB)'));
        console.log(chalk.gray('  npm install -g canvas     (lighter, ~50MB)'));
        console.log(chalk.gray('\nOr use HTML/SVG formats which require no additional dependencies.'));
      }
    }

  } catch (error) {
    spinner.fail('Graph generation failed');
    console.error(chalk.red('\n✗ Error:'), error.message);
    
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    
    // Show troubleshooting tips
    console.log(chalk.yellow('\n💡 TROUBLESHOOTING:'));
    console.log(chalk.gray('  • Ensure package.json exists in the project directory'));
    console.log(chalk.gray('  • Run npm install to generate package-lock.json'));
    console.log(chalk.gray('  • Check file permissions for output directory'));
    console.log(chalk.gray(`  • Try: ${chalk.cyan('devcompass graph --format json')} for simpler output`));
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

module.exports = graphCommand;