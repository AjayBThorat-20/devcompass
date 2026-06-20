// src/features/ai/cost.tracker.js

const aiDatabase = require('./ai.database');

class CostTracker {
  trackUsage(providerId, tokensOrConversationId, inputTokensOrCost, outputTokens, estimatedCost) {
    let tokens = 0;
    let cost = 0;
    if (typeof outputTokens === 'undefined') {
      tokens = tokensOrConversationId || 0;
      cost = inputTokensOrCost || 0;
    } else {
      tokens = (inputTokensOrCost || 0) + (outputTokens || 0);
      cost = estimatedCost || 0;
    }
    aiDatabase.trackUsage(providerId, tokens, cost);
    return cost;
  }

  getCurrentMonthStats() {
    const now = new Date();
    return aiDatabase.getUsageStats(now.getFullYear(), now.getMonth() + 1);
  }

  getTotalCostThisMonth() { return this.getCurrentMonthStats().reduce((sum, s) => sum + s.total_cost, 0); }

  formatStats(stats, providers) {
    return stats.map(s => {
      const provider = providers.find(p => p.id === s.provider_id);
      return { provider: provider?.provider || 'Unknown', model: provider?.model || 'Unknown', requests: s.request_count, tokens: s.total_tokens, cost: s.total_cost.toFixed(4) };
    });
  }
}

module.exports = new CostTracker();