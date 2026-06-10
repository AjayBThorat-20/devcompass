// src/ai/cost-tracker.js

const aiDatabase = require('./database');

class CostTracker {

  trackUsage(
    providerId,
    conversationIdOrTokens,
    inputTokensOrCost,
    outputTokens,
    estimatedCost
  ) {

    let tokens = 0;
    let cost = 0;

    if (
      typeof outputTokens === 'undefined'
    ) {

      tokens =
        conversationIdOrTokens || 0;

      cost =
        inputTokensOrCost || 0;

    } else {

      tokens =
        (inputTokensOrCost || 0) +
        (outputTokens || 0);

      cost =
        estimatedCost || 0;
    }

    aiDatabase.trackUsage(
      providerId,
      tokens,
      cost
    );

    return cost;
  }

  getCurrentMonthStats() {

    const now = new Date();

    return aiDatabase.getUsageStats(
      now.getFullYear(),
      now.getMonth() + 1
    );
  }

  getMonthStats(year, month) {

    return aiDatabase.getUsageStats(
      year,
      month
    );
  }

  getTotalCostThisMonth() {

    const stats =
      this.getCurrentMonthStats();

    return stats.reduce(
      (sum, s) => sum + s.total_cost,
      0
    );
  }

  getTotalTokensThisMonth() {

    const stats =
      this.getCurrentMonthStats();

    return stats.reduce(
      (sum, s) => sum + s.total_tokens,
      0
    );
  }

  formatStats(stats, providers) {

    return stats.map(s => {

      const provider =
        providers.find(
          p => p.id === s.provider_id
        );

      return {
        provider:
          provider?.provider || 'Unknown',

        model:
          provider?.model || 'Unknown',

        requests:
          s.request_count,

        tokens:
          s.total_tokens,

        cost:
          s.total_cost.toFixed(4)
      };
    });
  }
}

module.exports = new CostTracker();