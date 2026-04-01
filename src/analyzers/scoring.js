// src/analyzers/scoring.js
function calculateScore(totalDeps, unusedCount, outdatedCount, alertsCount = 0, alertPenalty = 0) {
  let score = 10;
  
  if (totalDeps === 0) {
    return {
      total: 10.0,
      breakdown: {
        unused: 0,
        outdated: 0,
        alerts: 0,
        unusedPenalty: 0,
        outdatedPenalty: 0,
        alertsPenalty: 0
      }
    };
  }
  
  // Unused dependencies penalty
  const unusedRatio = unusedCount / totalDeps;
  const unusedPenalty = unusedRatio * 4;
  score -= unusedPenalty;
  
  // Outdated packages penalty
  const outdatedRatio = outdatedCount / totalDeps;
  const outdatedPenalty = outdatedRatio * 3;
  score -= outdatedPenalty;
  
  // Ecosystem alerts penalty (from formatter.calculateAlertPenalty)
  score -= alertPenalty;
  
  // Ensure score is between 0 and 10
  score = Math.max(0, Math.min(10, score));
  
  return {
    total: parseFloat(score.toFixed(1)),
    breakdown: {
      unused: unusedCount,
      outdated: outdatedCount,
      alerts: alertsCount,
      unusedPenalty: parseFloat(unusedPenalty.toFixed(1)),
      outdatedPenalty: parseFloat(outdatedPenalty.toFixed(1)),
      alertsPenalty: parseFloat(alertPenalty.toFixed(1))
    }
  };
}

module.exports = { calculateScore };