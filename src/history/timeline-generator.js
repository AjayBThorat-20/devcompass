// src/history/timeline-generator.js
const loader = require('./snapshot-loader');

class TimelineGenerator {
  
  /**
   * Generate timeline data for visualization
   */
  generateTimeline(projectName = null, days = 30) {
    const startTime = Date.now();
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get snapshots in range
    const snapshots = loader.getSnapshotsInRange(
      startDate.toISOString(),
      endDate.toISOString(),
      projectName
    );
    
    if (snapshots.length === 0) {
      return {
        data: [],
        summary: {
          totalSnapshots: 0,
          dateRange: { start: startDate, end: endDate },
          message: 'No snapshots found in this date range'
        }
      };
    }
    
    // Build timeline data points
    const timelineData = snapshots.map(s => ({
      timestamp: new Date(s.timestamp),
      date: s.timestamp.split('T')[0],
      totalDependencies: s.total_dependencies,
      healthScore: parseFloat(s.health_score.toFixed(2)),
      nodeCount: s.node_count,
      snapshotId: s.id
    }));
    
    // Calculate trends
    const trends = this.calculateTrends(timelineData);
    
    // Generate summary statistics
    const summary = {
      totalSnapshots: snapshots.length,
      dateRange: {
        start: snapshots[0].timestamp,
        end: snapshots[snapshots.length - 1].timestamp
      },
      trends,
      averages: {
        healthScore: this.average(timelineData.map(d => d.healthScore)),
        dependencies: this.average(timelineData.map(d => d.totalDependencies))
      }
    };
    
    const duration = Date.now() - startTime;
    
    return {
      data: timelineData,
      summary,
      duration
    };
  }

  /**
   * Calculate trends from timeline data
   */
  calculateTrends(data) {
    if (data.length < 2) {
      return {
        healthScore: 'stable',
        dependencies: 'stable'
      };
    }
    
    const first = data[0];
    const last = data[data.length - 1];
    
    // Health score trend
    const healthDiff = last.healthScore - first.healthScore;
    const healthTrend = healthDiff > 0.5 ? 'improving' 
                      : healthDiff < -0.5 ? 'declining' 
                      : 'stable';
    
    // Dependencies trend
    const depsDiff = last.totalDependencies - first.totalDependencies;
    const depsTrend = depsDiff > 5 ? 'increasing'
                    : depsDiff < -5 ? 'decreasing'
                    : 'stable';
    
    return {
      healthScore: {
        trend: healthTrend,
        change: healthDiff.toFixed(2),
        from: first.healthScore,
        to: last.healthScore
      },
      dependencies: {
        trend: depsTrend,
        change: depsDiff,
        from: first.totalDependencies,
        to: last.totalDependencies
      }
    };
  }

  /**
   * Generate D3-compatible chart data
   */
  generateChartData(timelineData) {
    return {
      healthScoreChart: {
        type: 'line',
        data: timelineData.map(d => ({
          x: d.timestamp,
          y: d.healthScore
        })),
        label: 'Health Score Over Time',
        yLabel: 'Health Score (0-10)',
        color: '#3b82f6'
      },
      dependenciesChart: {
        type: 'line',
        data: timelineData.map(d => ({
          x: d.timestamp,
          y: d.totalDependencies
        })),
        label: 'Total Dependencies',
        yLabel: 'Count',
        color: '#10b981'
      }
    };
  }

  /**
   * Helper: Calculate average
   */
  average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

module.exports = new TimelineGenerator();