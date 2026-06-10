class ProcessManager {
  constructor() {
    this.activeProcesses = new Set();
    this.setupCleanup();
  }

  setupCleanup() {
    const cleanup = async () => {
      await this.killAll();
      process.exit(0);
    };

    process.once('SIGINT', cleanup);
    process.once('SIGTERM', cleanup);
    process.once('exit', () => {
      this.killAll();
    });
  }

  register(childProcess) {
    this.activeProcesses.add(childProcess);

    childProcess.once('exit', () => {
      this.activeProcesses.delete(childProcess);
    });

    return childProcess;
  }

  async kill(childProcess, signal = 'SIGTERM') {
    return new Promise((resolve) => {
      if (!childProcess || childProcess.killed) {
        resolve();
        return;
      }

      childProcess.once('exit', () => {
        this.activeProcesses.delete(childProcess);
        resolve();
      });

      childProcess.kill(signal);

      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }

  async killAll() {
    const killPromises = Array.from(this.activeProcesses).map(proc => 
      this.kill(proc)
    );

    await Promise.all(killPromises);
    this.activeProcesses.clear();
  }

  get count() {
    return this.activeProcesses.size;
  }
}

module.exports = new ProcessManager();