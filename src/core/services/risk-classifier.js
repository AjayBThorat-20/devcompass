function classifyFixRisk(issue, packageInfo = {}) {
  if (issue.type === 'unused') {
    return {
      risk: 'safe',
      reason: 'Removing unused dependency',
      breakingChangeProbability: 'low'
    };
  }

  if (issue.type === 'security' && issue.safeFix) {
    return {
      risk: 'safe',
      reason: 'Patch or minor security update',
      breakingChangeProbability: 'low'
    };
  }

  if (issue.type === 'outdated') {
    const metadata = issue.metadata || {};
    if (metadata.updateType === 'patch') {
      return {
        risk: 'safe',
        reason: 'Patch version update',
        breakingChangeProbability: 'very-low'
      };
    }
    if (metadata.updateType === 'minor') {
      return {
        risk: 'moderate',
        reason: 'Minor version update',
        breakingChangeProbability: 'low'
      };
    }
    if (metadata.updateType === 'major') {
      return {
        risk: 'risky',
        reason: 'Major version update',
        breakingChangeProbability: 'high'
      };
    }
  }

  if (issue.type === 'quality' || issue.type === 'license') {
    if (issue.metadata?.alternative) {
      return {
        risk: 'risky',
        reason: 'Package replacement required',
        breakingChangeProbability: 'high'
      };
    }
  }

  return {
    risk: 'moderate',
    reason: 'Manual review recommended',
    breakingChangeProbability: 'medium'
  };
}

function categorizeFixes(issues) {
  const safe = [];
  const moderate = [];
  const risky = [];

  issues.forEach(issue => {
    const classification = classifyFixRisk(issue);
    
    if (classification.risk === 'safe') {
      safe.push({ ...issue, riskInfo: classification });
    } else if (classification.risk === 'moderate') {
      moderate.push({ ...issue, riskInfo: classification });
    } else {
      risky.push({ ...issue, riskInfo: classification });
    }
  });

  return { safe, moderate, risky };
}

module.exports = {
  classifyFixRisk,
  categorizeFixes
};