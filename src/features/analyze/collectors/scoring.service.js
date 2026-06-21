// src/features/analyze/collectors/scoring.service.js

function calculateScore(totalDeps, unusedCount, outdatedCount, alertsCount = 0, alertPenalty = 0, securityPenalty = 0) {
  if (!totalDeps || totalDeps <= 0) {
    return {
      total: 10.0,
      breakdown: { unused: 0, outdated: 0, alerts: 0, security: 0, unusedPenalty: 0, outdatedPenalty: 0, alertsPenalty: 0, securityPenalty: 0 }
    };
  }

  let score = 10;

  const unusedRatio = (unusedCount || 0) / totalDeps;
  const unusedPenalty = unusedRatio * 4;
  score -= unusedPenalty;

  const outdatedRatio = (outdatedCount || 0) / totalDeps;
  const outdatedPenalty = outdatedRatio * 3;
  score -= outdatedPenalty;

  score -= (alertPenalty || 0);
  score -= (securityPenalty || 0);

  score = Math.max(0, Math.min(10, score));

  return {
    total: parseFloat(score.toFixed(1)),
    breakdown: {
      unused: unusedCount || 0,
      outdated: outdatedCount || 0,
      alerts: alertsCount || 0,
      security: securityPenalty > 0 ? 1 : 0,
      unusedPenalty: parseFloat(unusedPenalty.toFixed(1)),
      outdatedPenalty: parseFloat(outdatedPenalty.toFixed(1)),
      alertsPenalty: parseFloat((alertPenalty || 0).toFixed(1)),
      securityPenalty: parseFloat((securityPenalty || 0).toFixed(1))
    }
  };
}

module.exports = { calculateScore };