const { runFix } = require('./fix/index');

async function fixIssues(options = {}) {
  return await runFix(options);
}

module.exports = {
  fixIssues,
  run: fixIssues,
  runFix
};
