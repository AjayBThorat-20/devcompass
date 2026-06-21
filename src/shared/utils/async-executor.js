// src/shared/utils/async-executor.js

const { spawn } = require('child_process');

class AsyncExecutor {
  constructor() {
    this.activeProcesses = new Set();
  }

  async exec(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const { cwd = process.cwd(), timeout = 60000, maxBuffer = 10 * 1024 * 1024, env = process.env } = options;

      let child;
      try {
        child = spawn(command, args, { cwd, env, shell: true, windowsHide: true });
      } catch (error) {
        reject(error);
        return;
      }

      this.activeProcesses.add(child);

      let stdout = '';
      let stderr = '';
      let killed = false;
      let settled = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        setTimeout(() => { if (!child.killed) child.kill('SIGKILL'); }, 5000);
      }, timeout);

      const settle = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > maxBuffer) {
          killed = true;
          child.kill('SIGTERM');
          settle(reject, new Error('stdout maxBuffer exceeded'));
        }
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > maxBuffer) {
          killed = true;
          child.kill('SIGTERM');
          settle(reject, new Error('stderr maxBuffer exceeded'));
        }
      });

      child.on('error', (error) => {
        this.activeProcesses.delete(child);
        settle(reject, error);
      });

      child.on('close', (code) => {
        this.activeProcesses.delete(child);

        if (killed) {
          settle(reject, new Error('Process terminated due to timeout'));
          return;
        }

        if (code === 0) {
          settle(resolve, { stdout, stderr, code });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          error.stdout = stdout;
          error.stderr = stderr;
          error.code = code;
          settle(reject, error);
        }
      });
    });
  }

  async cleanup() {
    const killPromises = Array.from(this.activeProcesses).map(child => new Promise((resolve) => {
      if (child.killed) { resolve(); return; }
      child.once('close', resolve);
      child.kill('SIGTERM');
      setTimeout(() => { if (!child.killed) child.kill('SIGKILL'); resolve(); }, 5000);
    }));

    await Promise.all(killPromises);
    this.activeProcesses.clear();
  }
}

module.exports = AsyncExecutor;