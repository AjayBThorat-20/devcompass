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
        // shell:false (the default) so args are passed as literal argv instead of
        // being concatenated into a shell command line, where metacharacters in a
        // caller-supplied arg (e.g. a package name) could be interpreted by the shell.
        child = spawn(command, args, { cwd, env, windowsHide: true });
      } catch (error) {
        reject(error);
        return;
      }

      this.activeProcesses.add(child);

      let stdout = '';
      let stderr = '';
      let killed = false;
      let settled = false;
      let exited = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        // `.killed` reflects that a signal was sent, not that the process exited,
        // so escalation must check the actual exit state instead.
        setTimeout(() => { if (!exited) child.kill('SIGKILL'); }, 5000);
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
        exited = true;
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
      let exited = false;
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      child.once('close', () => { exited = true; finish(); });
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!exited) {
          child.kill('SIGKILL');
          setTimeout(finish, 2000);
        }
      }, 5000);
    }));

    await Promise.all(killPromises);
    this.activeProcesses.clear();
  }
}

module.exports = AsyncExecutor;