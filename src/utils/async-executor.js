const { spawn } = require('child_process');

class AsyncExecutor {
  constructor() {
    this.activeProcesses = new Set();
  }

  async exec(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const {
        cwd = process.cwd(),
        timeout = 60000,
        maxBuffer = 10 * 1024 * 1024,
        env = process.env
      } = options;

      const child = spawn(command, args, {
        cwd,
        env,
        shell: true,
        windowsHide: true
      });

      this.activeProcesses.add(child);

      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > maxBuffer) {
          killed = true;
          child.kill('SIGTERM');
          clearTimeout(timer);
          reject(new Error('stdout maxBuffer exceeded'));
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > maxBuffer) {
          killed = true;
          child.kill('SIGTERM');
          clearTimeout(timer);
          reject(new Error('stderr maxBuffer exceeded'));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        this.activeProcesses.delete(child);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        this.activeProcesses.delete(child);

        if (killed) {
          reject(new Error('Process terminated due to timeout'));
          return;
        }

        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          error.stdout = stdout;
          error.stderr = stderr;
          error.code = code;
          reject(error);
        }
      });
    });
  }

  async cleanup() {
    const killPromises = Array.from(this.activeProcesses).map(child => {
      return new Promise((resolve) => {
        if (child.killed) {
          resolve();
          return;
        }

        child.once('close', resolve);
        child.kill('SIGTERM');

        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    });

    await Promise.all(killPromises);
    this.activeProcesses.clear();
  }
}

module.exports = AsyncExecutor;