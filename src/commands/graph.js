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

  const spinner = ora('Generating dependency graph...').start();

  try {
    const generator = new GraphGenerator(projectPath);
    const graphData = generator.generate({
      maxDepth: depth,
      filter
    });

    if (!graphData) {
      spinner.fail('Failed to generate graph data');
      return;
    }

    spinner.succeed(`Generated graph with ${graphData.nodes.length} nodes`);

    const exportSpinner = ora(`Exporting to ${format || 'auto-detect'}...`).start();

    const exporter = new GraphExporter(graphData, {
      layout,
      width,
      height
    });

    let outputPath = output;
    if (format && !output.endsWith(`.${format}`)) {
      const basename = path.basename(output, path.extname(output));
      outputPath = path.join(path.dirname(output), `${basename}.${format}`);
    }

    const result = await exporter.export(outputPath);

    if (result.success) {
      exportSpinner.succeed(`Graph exported: ${chalk.cyan(result.path)}`);

      console.log('\n' + chalk.gray('─'.repeat(70)));
      console.log(chalk.bold('\n📈 GRAPH SUMMARY\n'));
      console.log(`  ${chalk.gray('Format:')}        ${result.format.toUpperCase()}`);
      console.log(`  ${chalk.gray('Layout:')}        ${layout}`);
      console.log(`  ${chalk.gray('Total Nodes:')}   ${graphData.nodes.length}`);
      console.log(`  ${chalk.gray('Total Links:')}   ${graphData.links.length}`);
      console.log(`  ${chalk.gray('Max Depth:')}     ${graphData.metadata.maxDepth}`);
      console.log(`  ${chalk.gray('File Size:')}     ${getFileSize(result.path)}`);
      console.log('\n' + chalk.gray('─'.repeat(70)));

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

      console.log(chalk.green('\n✓ Graph generation complete!\n'));
    } else {
      exportSpinner.fail(`Export failed: ${result.error}`);
    }

  } catch (error) {
    spinner.fail('Graph generation failed');
    console.error(chalk.red('\nError:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
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
