function calculateScore(totalDeps, unusedCount, outdatedCount) {
  let score = 10;
  
  if (totalDeps === 0) {
    return {
      total: 10.0,
      breakdown: {
        unused: 0,
        outdated: 0,
        unusedPenalty: 0,
        outdatedPenalty: 0
      }
    };
  }
  
  const unusedRatio = unusedCount / totalDeps;
  const unusedPenalty = unusedRatio * 4;
  score -= unusedPenalty;
  
  const outdatedRatio = outdatedCount / totalDeps;
  const outdatedPenalty = outdatedRatio * 3;
  score -= outdatedPenalty;
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    total: parseFloat(score.toFixed(1)),
    breakdown: {
      unused: unusedCount,
      outdated: outdatedCount,
      unusedPenalty: parseFloat(unusedPenalty.toFixed(1)),
      outdatedPenalty: parseFloat(outdatedPenalty.toFixed(1))
    }
  };
}

module.exports = { calculateScore };