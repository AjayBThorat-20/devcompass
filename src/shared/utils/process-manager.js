// src/shared/utils/process-manager.js

class ProcessManager {
  constructor() {
    this.activeProcesses = new Set();
    this.setupCleanup();
  }

  setupCleanup() {
    const cleanup = async () => { await this.killAll(); process.exit(0); };
    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);
    process.once('exit', () => { this.killAll(); });
  }

  register(childProcess) {
    this.activeProcesses.add(childProcess);
    childProcess.once('exit', () => { this.activeProcesses.delete(childProcess); });
    return childProcess;
  }

  async kill(childProcess, signal = 'SIGTERM') {
    return new Promise(resolve => {
      if (!childProcess || childProcess.killed) { resolve(); return; }
      let exited = false;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.activeProcesses.delete(childProcess);
        resolve();
      };
      childProcess.once('exit', () => { exited = true; finish(); });
      childProcess.kill(signal);
      setTimeout(() => {
        // `.killed` only reflects that a signal was sent, not that the process exited,
        // so escalation must check the actual 'exit' event instead.
        if (!exited) {
          childProcess.kill('SIGKILL');
          setTimeout(finish, 2000);
        }
      }, 5000);
    });
  }

  async killAll() {
    await Promise.all(Array.from(this.activeProcesses).map(proc => this.kill(proc)));
    this.activeProcesses.clear();
  }

  get count() { return this.activeProcesses.size; }
}

module.exports = new ProcessManager();