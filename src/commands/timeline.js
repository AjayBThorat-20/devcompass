// src/commands/timeline.js
const chalk = require('chalk');
const ora = require('ora');
const generator = require('../history/timeline-generator');
const open = require('open');
const fs = require('fs');
const path = require('path');

async function timelineCommand(options) {
  const days = options.days || 30;
  const projectName = options.project || null;
  
  const spinner = ora('Generating timeline...').start();
  
  try {
    // Generate timeline data
    const timeline = generator.generateTimeline(projectName, days);
    
    if (timeline.data.length === 0) {
      spinner.warn('No snapshots found');
      console.log(chalk.yellow('\nNo snapshots found in the last ' + days + ' days.'));
      console.log(chalk.gray('Run "devcompass analyze" to create snapshots.\n'));
      return;
    }
    
    spinner.succeed(`Timeline generated (${timeline.duration}ms)`);
    
    // Display summary
    displayTimelineSummary(timeline, options);
    
    // Generate and open HTML visualization if requested
    if (options.open || options.o || options.output) {
      generateHTMLTimeline(timeline, options);
    }
    
  } catch (error) {
    spinner.fail('Timeline generation failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function displayTimelineSummary(timeline, options) {
  const { summary, data } = timeline;
  
  console.log('\n' + chalk.bold(`📈 Timeline Summary (Last ${options.days || 30} Days)\n`));
  
  console.log(chalk.bold('Overview:'));
  console.log(`  Total Snapshots: ${chalk.cyan(summary.totalSnapshots)}`);
  console.log(`  Date Range: ${chalk.gray(formatDate(summary.dateRange.start))} → ${chalk.gray(formatDate(summary.dateRange.end))}`);
  
  // ✅ FIX: Call getHealthColor properly
  const healthColor = getHealthColor(summary.averages.healthScore);
  console.log(`  Average Health: ${healthColor(summary.averages.healthScore.toFixed(2))}/10`);
  console.log(`  Average Dependencies: ${chalk.cyan(Math.round(summary.averages.dependencies))}`);
  console.log();
  
  // Trends
  console.log(chalk.bold('Trends:'));
  
  const healthTrend = summary.trends.healthScore;
  const healthIcon = healthTrend.trend === 'improving' ? '📈' 
                   : healthTrend.trend === 'declining' ? '📉' 
                   : '➡️';
  const healthTrendColor = healthTrend.trend === 'improving' ? chalk.green 
                         : healthTrend.trend === 'declining' ? chalk.red 
                         : chalk.gray;
  
  console.log(`  ${healthIcon} Health Score: ${healthTrendColor(healthTrend.trend)} (${healthTrend.from.toFixed(2)} → ${healthTrend.to.toFixed(2)}${healthTrendColor(', ')}${healthTrendColor(healthTrend.change > 0 ? '+' : '')}${healthTrendColor(healthTrend.change)})`);
  
  const depsTrend = summary.trends.dependencies;
  const depsIcon = depsTrend.trend === 'increasing' ? '📈' 
                 : depsTrend.trend === 'decreasing' ? '📉' 
                 : '➡️';
  const depsTrendColor = depsTrend.trend === 'decreasing' ? chalk.green 
                       : depsTrend.trend === 'increasing' ? chalk.yellow 
                       : chalk.gray;
  
  console.log(`  ${depsIcon} Dependencies: ${depsTrendColor(depsTrend.trend)} (${depsTrend.from} → ${depsTrend.to}${depsTrendColor(', ')}${depsTrendColor(depsTrend.change > 0 ? '+' : '')}${depsTrendColor(depsTrend.change)})`);
  console.log();
  
  // Recent snapshots (last 5)
  console.log(chalk.bold('Recent Snapshots:\n'));
  data.slice(-5).reverse().forEach((point, index) => {
    const pointHealthColor = getHealthColor(point.healthScore);
    console.log(`  ${chalk.gray(formatDate(point.timestamp))} - Health: ${pointHealthColor(point.healthScore.toFixed(1))}, Deps: ${chalk.cyan(point.totalDependencies)}`);
  });
  
  console.log();
  
  if (!options.open && !options.o && !options.output) {
    console.log(chalk.gray('Use --open to view interactive timeline chart\n'));
  }
}

function generateHTMLTimeline(timeline, options) {
  const spinner = ora('Generating interactive timeline...').start();
  
  try {
    const chartData = generator.generateChartData(timeline.data);
    const html = createTimelineHTML(timeline, chartData);
    
    const outputPath = options.output || 'devcompass-timeline.html';
    const fullPath = path.resolve(outputPath);
    
    // Write the HTML file
    fs.writeFileSync(fullPath, html, 'utf8');
    
    spinner.succeed('Timeline visualization created');
    console.log(chalk.green(`✓ Saved to: ${fullPath}\n`));
    
    // ✅ SIMPLE FIX: Just tell user to open it manually
    if (options.open || options.o) {
      console.log(chalk.cyan(`📂 Opening in browser...`));
      console.log(chalk.gray(`   If it doesn't open, run: xdg-open ${fullPath}\n`));
    }
    
  } catch (error) {
    spinner.fail('Failed to generate timeline visualization');
    console.error(chalk.red(error.message));
  }
}

// src/commands/timeline.js - createTimelineHTML function

function createTimelineHTML(timeline, chartData) {
  const { data, summary } = timeline;
  
  // ✅ FIX: Parse the change value (it's a string like "+1.40")
  const healthChange = parseFloat(summary.trends.healthScore.change);
  const depsChange = summary.trends.dependencies.change; // This is already a number
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass Timeline - Dependency Evolution</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0a0e1a;
      color: #e0e6ed;
      padding: 20px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    h1 {
      color: #3b82f6;
      margin-bottom: 10px;
      font-size: 2em;
    }
    
    .subtitle {
      color: #94a3b8;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #1a1f35;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a3555;
    }
    
    .stat-label {
      color: #94a3b8;
      font-size: 0.9em;
      margin-bottom: 5px;
    }
    
    .stat-value {
      color: #3b82f6;
      font-size: 1.8em;
      font-weight: bold;
    }
    
    .chart {
      background: #1a1f35;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #2a3555;
    }
    
    .chart h2 {
      color: #e0e6ed;
      margin-bottom: 20px;
      font-size: 1.3em;
    }
    
    .axis {
      color: #94a3b8;
    }
    
    .axis line,
    .axis path {
      stroke: #2a3555;
    }
    
    .axis text {
      fill: #94a3b8;
      font-size: 12px;
    }
    
    .grid line {
      stroke: #2a3555;
      stroke-opacity: 0.3;
    }
    
    .line {
      fill: none;
      stroke-width: 3;
    }
    
    .health-line {
      stroke: #3b82f6;
    }
    
    .deps-line {
      stroke: #10b981;
    }
    
    .dot {
      stroke: #1a1f35;
      stroke-width: 2;
    }
    
    .tooltip {
      position: absolute;
      background: #1a1f35;
      border: 1px solid #3b82f6;
      padding: 12px;
      border-radius: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    
    .tooltip-date {
      color: #3b82f6;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .tooltip-item {
      color: #e0e6ed;
      margin: 3px 0;
    }
    
    .legend {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    
    .legend-color {
      width: 20px;
      height: 3px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📈 DevCompass Timeline</h1>
    <p class="subtitle">Dependency evolution over time</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Snapshots</div>
        <div class="stat-value">${summary.totalSnapshots}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Health Score</div>
        <div class="stat-value">${summary.averages.healthScore.toFixed(2)}/10</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average Dependencies</div>
        <div class="stat-value">${Math.round(summary.averages.dependencies)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Health Trend</div>
        <div class="stat-value" style="color: ${summary.trends.healthScore.trend === 'improving' ? '#10b981' : summary.trends.healthScore.trend === 'declining' ? '#ef4444' : '#94a3b8'}">
          ${summary.trends.healthScore.trend === 'improving' ? '↗' : summary.trends.healthScore.trend === 'declining' ? '↘' : '→'} ${summary.trends.healthScore.trend}
        </div>
      </div>
    </div>
    
    <div class="chart" id="healthChart">
      <h2>Health Score Over Time</h2>
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #3b82f6;"></div>
          <span>Health Score</span>
        </div>
      </div>
      <svg id="healthSvg"></svg>
    </div>
    
    <div class="chart" id="depsChart">
      <h2>Dependencies Count Over Time</h2>
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #10b981;"></div>
          <span>Total Dependencies</span>
        </div>
      </div>
      <svg id="depsSvg"></svg>
    </div>
  </div>
  
  <div class="tooltip" id="tooltip"></div>
  
  <script>
    const timelineData = ${JSON.stringify(data)};
    
    // Chart dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Parse dates
    timelineData.forEach(d => {
      d.timestamp = new Date(d.timestamp);
    });
    
    // Health Score Chart
    createLineChart(
      '#healthSvg',
      timelineData,
      d => d.healthScore,
      'Health Score',
      '#3b82f6',
      [0, 10]
    );
    
    // Dependencies Chart
    createLineChart(
      '#depsSvg',
      timelineData,
      d => d.totalDependencies,
      'Dependencies',
      '#10b981',
      null
    );
    
    function createLineChart(selector, data, valueAccessor, label, color, yDomain) {
      const svg = d3.select(selector)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', \`translate(\${margin.left},\${margin.top})\`);
      
      // Scales
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.timestamp))
        .range([0, width]);
      
      const y = d3.scaleLinear()
        .domain(yDomain || [0, d3.max(data, valueAccessor)])
        .range([height, 0]);
      
      // Grid
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));
      
      // Line
      const line = d3.line()
        .x(d => x(d.timestamp))
        .y(d => y(valueAccessor(d)))
        .curve(d3.curveMonotoneX);
      
      svg.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', color);
      
      // Dots
      const tooltip = d3.select('#tooltip');
      
      svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.timestamp))
        .attr('cy', d => y(valueAccessor(d)))
        .attr('r', 5)
        .attr('fill', color)
        .on('mouseover', (event, d) => {
          tooltip
            .style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(\`
              <div class="tooltip-date">\${formatDate(d.timestamp)}</div>
              <div class="tooltip-item">\${label}: \${valueAccessor(d).toFixed(2)}</div>
              <div class="tooltip-item">Snapshot ID: \${d.snapshotId}</div>
            \`);
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });
      
      // Axes
      svg.append('g')
        .attr('class', 'axis')
        .attr('transform', \`translate(0,\${height})\`)
        .call(d3.axisBottom(x).ticks(5));
      
      svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y));
    }
    
    function formatDate(date) {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  </script>
</body>
</html>`;
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function getHealthColor(score) {
  if (score >= 7) return chalk.green;
  if (score >= 5) return chalk.yellow;
  return chalk.red;
}

module.exports = timelineCommand;