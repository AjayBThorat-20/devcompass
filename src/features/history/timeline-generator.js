// src/features/history/timeline-generator.js

const loader = require('./snapshot-loader');

class TimelineGenerator {
  generateTimeline(projectName = null, days = 30) {
    const startTime = Date.now();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshots = loader.getSnapshotsInRange(startDate.toISOString(), endDate.toISOString(), projectName);

    if (snapshots.length === 0) {
      return { data: [], summary: { totalSnapshots: 0, dateRange: { start: startDate, end: endDate }, message: 'No snapshots found in this date range' } };
    }

    const timelineData = snapshots.map(s => {
      const timestamp = new Date(s.timestamp);
      return {
        timestamp,
        // Derived from the parsed Date rather than string-split on s.timestamp, since
        // SQLite stores "YYYY-MM-DD HH:MM:SS" (space-separated, no 'T') not ISO format.
        date: timestamp.toISOString().split('T')[0],
        totalDependencies: s.total_dependencies,
        healthScore: parseFloat((s.health_score || 0).toFixed(2)),
        nodeCount: s.node_count,
        snapshotId: s.id
      };
    });

    const trends = this.calculateTrends(timelineData);
    const summary = {
      totalSnapshots: snapshots.length,
      dateRange: { start: snapshots[0].timestamp, end: snapshots[snapshots.length - 1].timestamp },
      trends,
      averages: {
        healthScore: this.average(timelineData.map(d => d.healthScore)),
        dependencies: this.average(timelineData.map(d => d.totalDependencies))
      }
    };

    return { data: timelineData, summary, duration: Date.now() - startTime };
  }

  calculateTrends(data) {
    if (data.length < 2) return { healthScore: { trend: 'stable', change: '0.00', from: 0, to: 0 }, dependencies: { trend: 'stable', change: 0, from: 0, to: 0 } };

    const first = data[0];
    const last = data[data.length - 1];
    const healthDiff = last.healthScore - first.healthScore;
    const depsDiff = last.totalDependencies - first.totalDependencies;

    return {
      healthScore: { trend: healthDiff > 0.5 ? 'improving' : healthDiff < -0.5 ? 'declining' : 'stable', change: healthDiff.toFixed(2), from: first.healthScore, to: last.healthScore },
      dependencies: { trend: depsDiff > 5 ? 'increasing' : depsDiff < -5 ? 'decreasing' : 'stable', change: depsDiff, from: first.totalDependencies, to: last.totalDependencies }
    };
  }

  generateChartData(timelineData) {
    return {
      healthScoreChart: { type: 'line', data: timelineData.map(d => ({ x: d.timestamp, y: d.healthScore })), label: 'Health Score Over Time', color: '#3b82f6' },
      dependenciesChart: { type: 'line', data: timelineData.map(d => ({ x: d.timestamp, y: d.totalDependencies })), label: 'Total Dependencies', color: '#10b981' }
    };
  }

  average(numbers) {
    if (!numbers.length) return 0;
return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }   
}

module.exports = new TimelineGenerator();