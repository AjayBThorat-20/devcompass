// src/features/history/timeline.command.js

const chalk = require('chalk');
const ora = require('ora');
const generator = require('./timeline-generator');
const fs = require('fs');
const path = require('path');

async function timelineCommand(options) {
  const { days = 30, project: projectName = null } = options;
  const spinner = ora('Generating timeline...').start();

  try {
    const timeline = generator.generateTimeline(projectName, days);

    if (timeline.data.length === 0) {
      spinner.warn('No snapshots found');
      console.log(chalk.yellow(`\nNo snapshots found in the last ${days} days.`));
      console.log(chalk.gray('Run "devcompass analyze" to create snapshots.\n'));
      return;
    }

    spinner.succeed(`Timeline generated (${timeline.duration}ms)`);
    displayTimelineSummary(timeline, options);

    if (options.open || options.o || options.output) {
      const outputPath = options.output || 'devcompass-timeline.html';
      const chartData = generator.generateChartData(timeline.data);
      const html = createTimelineHTML(timeline, chartData);
      fs.writeFileSync(path.resolve(outputPath), html, 'utf8');
      console.log(chalk.green(`✓ Saved to: ${path.resolve(outputPath)}`));
      if (options.open || options.o) {
        console.log(chalk.cyan(`📂 Open: xdg-open ${path.resolve(outputPath)}\n`));
      }
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
  console.log(`  Date Range: ${chalk.gray(new Date(summary.dateRange.start).toLocaleDateString())} → ${chalk.gray(new Date(summary.dateRange.end).toLocaleDateString())}`);

  const healthColor = summary.averages.healthScore >= 7 ? chalk.green : summary.averages.healthScore >= 5 ? chalk.yellow : chalk.red;
  console.log(`  Average Health: ${healthColor(summary.averages.healthScore.toFixed(2))}/10`);
  console.log(`  Average Dependencies: ${chalk.cyan(Math.round(summary.averages.dependencies))}\n`);

  const healthTrend = summary.trends.healthScore;
  const icon = healthTrend.trend === 'improving' ? '📈' : healthTrend.trend === 'declining' ? '📉' : '➡️';
  const trendColor = healthTrend.trend === 'improving' ? chalk.green : healthTrend.trend === 'declining' ? chalk.red : chalk.gray;
  console.log(chalk.bold('Trends:'));
  console.log(`  ${icon} Health Score: ${trendColor(healthTrend.trend)} (${healthTrend.from} → ${healthTrend.to})\n`);

  console.log(chalk.bold('Recent Snapshots:\n'));
  data.slice(-5).reverse().forEach(point => {
    const pointHealthColor = point.healthScore >= 7 ? chalk.green : point.healthScore >= 5 ? chalk.yellow : chalk.red;
    console.log(`  ${chalk.gray(new Date(point.timestamp).toLocaleDateString())} - Health: ${pointHealthColor(point.healthScore.toFixed(1))}, Deps: ${chalk.cyan(point.totalDependencies)}`);
  });
  console.log('');
  if (!options.open && !options.output) console.log(chalk.gray('Use --open to view interactive timeline chart\n'));
}

function createTimelineHTML(timeline, chartData) {
  const { data, summary } = timeline;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevCompass Timeline</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0e1a; color: #e0e6ed; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #3b82f6; margin-bottom: 10px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #1a1f35; padding: 20px; border-radius: 8px; border: 1px solid #2a3555; }
    .stat-label { color: #94a3b8; font-size: 0.9em; }
    .stat-value { color: #3b82f6; font-size: 1.8em; font-weight: bold; }
    .chart { background: #1a1f35; padding: 30px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #2a3555; }
    .axis line, .axis path { stroke: #2a3555; }
    .axis text { fill: #94a3b8; font-size: 12px; }
    .grid line { stroke: #2a3555; stroke-opacity: 0.3; }
    .line { fill: none; stroke-width: 3; }
    .tooltip { position: absolute; background: #1a1f35; border: 1px solid #3b82f6; padding: 12px; border-radius: 6px; pointer-events: none; opacity: 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📈 DevCompass Timeline</h1>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Snapshots</div><div class="stat-value">${summary.totalSnapshots}</div></div>
      <div class="stat-card"><div class="stat-label">Average Health Score</div><div class="stat-value">${summary.averages.healthScore.toFixed(2)}/10</div></div>
      <div class="stat-card"><div class="stat-label">Average Dependencies</div><div class="stat-value">${Math.round(summary.averages.dependencies)}</div></div>
      <div class="stat-card"><div class="stat-label">Health Trend</div><div class="stat-value" style="color:${summary.trends.healthScore.trend === 'improving' ? '#10b981' : summary.trends.healthScore.trend === 'declining' ? '#ef4444' : '#94a3b8'}">${summary.trends.healthScore.trend === 'improving' ? '↗' : summary.trends.healthScore.trend === 'declining' ? '↘' : '→'} ${summary.trends.healthScore.trend}</div></div>
    </div>
    <div class="chart" id="healthChart"><h2 style="color:#e0e6ed;margin-bottom:20px">Health Score Over Time</h2><svg id="healthSvg"></svg></div>
    <div class="chart" id="depsChart"><h2 style="color:#e0e6ed;margin-bottom:20px">Dependencies Count Over Time</h2><svg id="depsSvg"></svg></div>
  </div>
  <div class="tooltip" id="tooltip"></div>
  <script>
    const timelineData = ${JSON.stringify(data)};
    const margin = {top:20,right:30,bottom:50,left:60}, width = 1100 - margin.left - margin.right, height = 350 - margin.top - margin.bottom;
    timelineData.forEach(d => { d.timestamp = new Date(d.timestamp); });
    createChart('#healthSvg', d => d.healthScore, 'Health Score', '#3b82f6', [0,10]);
    createChart('#depsSvg', d => d.totalDependencies, 'Dependencies', '#10b981', null);
    function createChart(sel, accessor, label, color, yDomain) {
      const svg = d3.select(sel).attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', \`translate(\${margin.left},\${margin.top})\`);
      const x = d3.scaleTime().domain(d3.extent(timelineData, d => d.timestamp)).range([0, width]);
      const y = d3.scaleLinear().domain(yDomain || [0, d3.max(timelineData, accessor)]).range([height, 0]);
      svg.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickSize(-width).tickFormat(''));
      svg.append('path').datum(timelineData).attr('class', 'line').attr('d', d3.line().x(d => x(d.timestamp)).y(d => y(accessor(d))).curve(d3.curveMonotoneX)).style('stroke', color);
      const tooltip = d3.select('#tooltip');
      svg.selectAll('.dot').data(timelineData).enter().append('circle').attr('cx', d => x(d.timestamp)).attr('cy', d => y(accessor(d))).attr('r', 5).attr('fill', color).attr('stroke', '#1a1f35').attr('stroke-width', 2)
        .on('mouseover', (ev, d) => { tooltip.style('opacity',1).style('left',(ev.pageX+10)+'px').style('top',(ev.pageY-10)+'px').html(\`<div style="color:#3b82f6">\${new Date(d.timestamp).toLocaleDateString()}</div><div>\${label}: \${accessor(d).toFixed(2)}</div>\`); })
        .on('mouseout', () => tooltip.style('opacity', 0));
      svg.append('g').attr('class','axis').attr('transform',\`translate(0,\${height})\`).call(d3.axisBottom(x).ticks(5));
      svg.append('g').attr('class','axis').call(d3.axisLeft(y));
    }
  </script>
</body>
</html>`;
}

module.exports = timelineCommand;