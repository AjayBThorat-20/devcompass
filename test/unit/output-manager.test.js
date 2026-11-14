// test/unit/output-manager.test.js
// C-11: `analyze` used to create all six .devcompass/ subfolders up front
// and append to (or create) the project's .gitignore on every run, even
// though a given command only ever writes to one of those folders. getPath()
// now creates only the folder actually being written to, and nothing edits
// .gitignore automatically.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const OutputManager = require('../../src/shared/utils/output-manager');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devcompass-output-manager-test-'));
}

test("getPath('graphs') creates only the graphs/ folder, not the other five", () => {
  const projectPath = makeTempProject();
  try {
    const outputManager = new OutputManager(projectPath);
    const graphsDir = outputManager.getPath('graphs');

    assert.ok(fs.existsSync(graphsDir));
    assert.ok(fs.existsSync(path.join(projectPath, '.devcompass', 'graphs')));

    for (const type of ['cache', 'reports', 'exports', 'temp']) {
      assert.equal(fs.existsSync(path.join(projectPath, '.devcompass', type)), false, `${type} should not have been created`);
    }
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('getPath() never creates or edits .gitignore', () => {
  const projectPath = makeTempProject();
  try {
    const outputManager = new OutputManager(projectPath);
    outputManager.getPath('graphs');

    assert.equal(fs.existsSync(path.join(projectPath, '.gitignore')), false);
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test('getPath() leaves an existing .gitignore untouched', () => {
  const projectPath = makeTempProject();
  try {
    const gitignorePath = path.join(projectPath, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n');

    const outputManager = new OutputManager(projectPath);
    outputManager.getPath('cache');

    assert.equal(fs.readFileSync(gitignorePath, 'utf8'), 'node_modules/\n');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

test("exists() checks without creating the directory", () => {
  const projectPath = makeTempProject();
  try {
    const outputManager = new OutputManager(projectPath);
    assert.equal(outputManager.exists('reports'), false);
    assert.equal(fs.existsSync(path.join(projectPath, '.devcompass', 'reports')), false, 'exists() must not have a side effect of creating the directory');
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

// CL-10: backups actually live in <project>/.devcompass-backups/, a
// separate top-level folder from <project>/.devcompass/ — not
// <project>/.devcompass/backups/, which nothing ever wrote to.
test("the 'backups' directory points at <project>/.devcompass-backups/, not <project>/.devcompass/backups/", () => {
  const projectPath = makeTempProject();
  try {
    const outputManager = new OutputManager(projectPath);
    assert.equal(outputManager.getPath('backups'), path.join(projectPath, '.devcompass-backups'));
  } finally {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});
