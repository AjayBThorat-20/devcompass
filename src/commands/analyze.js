const { runAnalyze } = require('./analyze/index');

async function analyzeProject(options = {}) {
  return await runAnalyze(options);
}

module.exports = {
  analyzeProject,
  run: analyzeProject,
  runAnalyze
};
