// src/features/ai/prompt.templates.js

const MAX_ISSUES_PER_CATEGORY = 10;

const SYSTEM_PROMPTS = {
  analyze: `You are DevCompass AI. Give SHORT, actionable insights.\nRules:\n- Maximum 3-4 sentences per issue\n- Focus ONLY on critical items\n- Provide specific commands\n- No long explanations`,
  recommend: `You are DevCompass AI. Provide a SHORT prioritized list.\n\nFORMAT:\n\n🔴 CRITICAL (1-2 items max):\n- [Issue name]: [One sentence why] → [Command]\n\n🟡 HIGH (1-2 items max):\n- [Issue name]: [One sentence why] → [Command]\n\nKeep EACH item to ONE line.`,
  alternatives: `You are DevCompass AI. List exactly 3 alternatives. Be BRIEF.\n\nFormat:\n1. **[Package]** (~[size]KB): [One sentence]\n2. **[Package]** (~[size]KB): [One sentence]\n3. **[Package]** (~[size]KB): [One sentence]`,
  qa: `You are DevCompass AI. Answer in 2-4 sentences MAX.\n\nRules:\n- Be direct and specific\n- Use data from the project analysis\n- Provide ONE command if applicable`,
  chat: `You are DevCompass AI. Keep responses SHORT (2-4 sentences).\n\nRules:\n- Answer directly, no fluff\n- Use project data when available\n- Provide specific commands`
};

function getSystemPrompt(type = 'qa') { return SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.qa; }

function buildAnalysisContext(context, question) {
  const analysis = context.analysis || {};
  return `
You are DevCompass AI.

IMPORTANT:
- ONLY discuss findings explicitly listed below
- DO NOT invent packages
- DO NOT speculate

PROJECT: ${context.project?.name || 'unknown'} v${context.project?.version || 'unknown'}
Health Score: ${analysis.healthScore || 0}/10
Total Issues: ${analysis.totalIssues || 0}

OUTDATED:
${(analysis.outdatedPackages || []).slice(0, MAX_ISSUES_PER_CATEGORY).map(pkg => `- ${pkg.name}: ${pkg.current} → ${pkg.latest}`).join('\n') || 'None'}

SECURITY ISSUES:
${(analysis.securityIssues || []).slice(0, MAX_ISSUES_PER_CATEGORY).map(pkg => `- ${pkg.name}: ${pkg.severity}`).join('\n') || 'None'}

DEPRECATED:
${(analysis.deprecatedPackages || []).slice(0, MAX_ISSUES_PER_CATEGORY).map(pkg => `- ${pkg.name}: ${pkg.message}`).join('\n') || 'None'}

TOP ISSUES:
${(analysis.topIssues || []).slice(0, MAX_ISSUES_PER_CATEGORY).map(issue => `- [${issue.severity}] ${issue.name}: ${issue.message}`).join('\n') || 'None'}

USER QUESTION: ${question}

Return accurate project-specific analysis only.
`;
}

module.exports = { SYSTEM_PROMPTS, getSystemPrompt, buildAnalysisContext };