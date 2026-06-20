// src/cli/commands/backup.cmd.js

module.exports = function registerBackupCommand(program) {
  program
    .command('backup <action>')
    .description('Manage backups (list, restore, clean, info)')
    .option('-p, --path <path>', 'Project path', process.cwd())
    .option('-n, --name <name>', 'Backup name (for restore/info commands)')
    .option('-f, --force', 'Skip confirmation prompts', false)
    .option('--keep <number>', 'Number of backups to keep (for clean command)', parseInt, 5)
    .action((action, options) => {
      const backup = require('../../features/backup');
      backup(action, options);
    });
};