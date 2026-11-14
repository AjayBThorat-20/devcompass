// test/unit/markdown-renderer.test.js
// FT-03: Markdown output for PR comments and $GITHUB_STEP_SUMMARY — a short
// table of findings and the score, not the full --deep report.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderMarkdownOutput } = require('../../src/features/analyze/renderers/markdown.renderer');

function captureStdout(fn) {
  const original = console.log;
  let output = '';
  console.log = (...args) => { output += args.join(' ') + '\n'; };
  try { fn(); } finally { console.log = original; }
  return output;
}

test('renderMarkdownOutput() includes the health score and a findings table', () => {
  const issues = [{ name: 'minimist', version: '1.2.5', type: 'security', severity: 'HIGH', message: 'Prototype pollution', fix: 'Update to 1.2.6' }];
  const output = captureStdout(() => renderMarkdownOutput(issues, { projectInfo: 'demo@1.0.0', healthScore: 6.4 }));

  assert.match(output, /demo@1\.0\.0/);
  assert.match(output, /6\.4 \/ 10/);
  assert.match(output, /\| Severity \| Package \| Type \| Message \| Fix \|/);
  assert.match(output, /minimist@1\.2\.5/);
});

test('renderMarkdownOutput() with no issues says so instead of an empty table', () => {
  const output = captureStdout(() => renderMarkdownOutput([], { projectInfo: 'demo@1.0.0', healthScore: 10 }));
  assert.match(output, /No issues found/);
});

test('renderMarkdownOutput() truncates to the top 20 and notes how many more exist', () => {
  const issues = Array.from({ length: 25 }, (_, i) => ({ name: `pkg${i}`, version: '1.0.0', type: 'outdated', severity: 'LOW', message: 'outdated' }));
  const output = captureStdout(() => renderMarkdownOutput(issues, { projectInfo: 'demo', healthScore: 8 }));
  assert.match(output, /\.\.\.and 5 more/);
});

test('renderMarkdownOutput() escapes pipe characters in messages so they cannot break the table', () => {
  const issues = [{ name: 'pkg', version: '1.0.0', type: 'quality', severity: 'MEDIUM', message: 'a | b', fix: 'c | d' }];
  const output = captureStdout(() => renderMarkdownOutput(issues, { projectInfo: 'demo', healthScore: 9 }));
  assert.match(output, /a \\\| b/);
});
