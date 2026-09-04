// src/features/fix/migrations/ai-migrator.js

const MAX_AI_FILE_SIZE_BYTES = 20 * 1024;

function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return fenced ? fenced[1] : trimmed;
}

function buildPrompt({ packageName, fromVersion, toVersion, filePath, content }) {
  return [
    `The npm package "${packageName}" is being upgraded from version ${fromVersion} to ${toVersion} in this project, which crosses a major version boundary and may include breaking API changes.`,
    `Update ONLY the call-sites in the file below that use "${packageName}" so they are compatible with ${toVersion}. Leave everything else in the file byte-for-byte unchanged — same formatting, same unrelated code, same imports for other packages.`,
    `If nothing in this file actually needs to change for the new version, return the file completely unchanged.`,
    `Respond with ONLY the complete, updated file content. No explanations, no markdown code fences, no commentary.`,
    ``,
    `File: ${filePath}`,
    `--- BEGIN FILE ---`,
    content,
    `--- END FILE ---`
  ].join('\n');
}

// Sanity-checks the model's rewrite before it's trusted to overwrite a real
// file: reject empty output and output that's wildly shorter/longer than the
// original, since that's a strong signal of truncation or a hallucinated
// rewrite rather than a targeted edit.
function isPlausibleRewrite(original, candidate) {
  if (!candidate || typeof candidate !== 'string' || candidate.trim().length === 0) return false;
  const ratio = candidate.length / Math.max(original.length, 1);
  return ratio >= 0.5 && ratio <= 2;
}

async function migrateWithAI({ provider, packageName, fromVersion, toVersion, filePath, content }) {
  if (Buffer.byteLength(content, 'utf8') > MAX_AI_FILE_SIZE_BYTES) {
    return { success: false, reason: `File too large for automatic AI migration (>${MAX_AI_FILE_SIZE_BYTES / 1024}KB) — manual review needed` };
  }

  const prompt = buildPrompt({ packageName, fromVersion, toVersion, filePath, content });

  let result;
  try {
    result = await provider.sendPrompt([{ role: 'user', content: prompt }], { maxTokens: 4000, temperature: 0 });
  } catch (error) {
    return { success: false, reason: `AI request failed: ${error.message}` };
  }

  const candidate = stripCodeFence(result?.content || '');
  if (candidate === content) return { success: false, reason: 'No syntax change needed' };
  if (!isPlausibleRewrite(content, candidate)) {
    return { success: false, reason: 'AI response looked unreliable (empty or drastically different size) — manual review needed' };
  }

  return { success: true, content: candidate };
}

module.exports = { migrateWithAI, MAX_AI_FILE_SIZE_BYTES, isPlausibleRewrite };
