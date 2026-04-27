// src/ai/cost-tracker.js
const aiDatabase = require('./database');

class CostTracker {
  /**
   * Track usage for a provider
   */
  trackUsage(providerId, tokens, cost) {
    aiDatabase.trackUsage(providerId, tokens, cost);
  }

  /**
   * Get usage stats for current month
   */
  getCurrentMonthStats() {
    const now = new Date();
    return aiDatabase.getUsageStats(now.getFullYear(), now.getMonth() + 1);
  }

  /**
   * Get usage stats for a specific month
   */
  getMonthStats(year, month) {
    return aiDatabase.getUsageStats(year, month);
  }

  /**
   * Get total cost for current month
   */
  getTotalCostThisMonth() {
    const stats = this.getCurrentMonthStats();
    return stats.reduce((sum, s) => sum + s.total_cost, 0);
  }

  /**
   * Get total tokens for current month
   */
  getTotalTokensThisMonth() {
    const stats = this.getCurrentMonthStats();
    return stats.reduce((sum, s) => sum + s.total_tokens, 0);
  }

  /**
   * Format stats for display
   */
  formatStats(stats, providers) {
    return stats.map(s => {
      const provider = providers.find(p => p.id === s.provider_id);
      return {
        provider: provider?.provider || 'Unknown',
        model: provider?.model || 'Unknown',
        requests: s.request_count,
        tokens: s.total_tokens,
        cost: s.total_cost.toFixed(4)
      };
    });
  }
}

module.exports = new CostTracker();