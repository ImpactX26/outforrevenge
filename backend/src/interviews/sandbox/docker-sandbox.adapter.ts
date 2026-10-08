import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ISandboxExecutor,
  SandboxExecutionOptions,
  RawExecutionResult,
} from './sandbox.interface';

@Injectable()
export class DockerSandboxAdapter implements ISandboxExecutor {
  private readonly logger = new Logger(DockerSandboxAdapter.name);
  private dockerChecked = false;
  private dockerAvailable = false;

  async isAvailable(): Promise<boolean> {
    if (this.dockerChecked) {
      return this.dockerAvailable;
    }

    return new Promise((resolve) => {
      const proc = spawn('docker', ['info'], { windowsHide: true });
      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        this.dockerChecked = true;
        this.dockerAvailable = false;
        resolve(false);
      }, 1500);

      proc.on('close', (code) => {
        clearTimeout(timer);
        this.dockerChecked = true;
        this.dockerAvailable = code === 0;
        resolve(this.dockerAvailable);
      });

      proc.on('error', () => {
        clearTimeout(timer);
        this.dockerChecked = true;
        this.dockerAvailable = false;
        resolve(false);
      });
    });
  }

  async execute(options: SandboxExecutionOptions): Promise<RawExecutionResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(
        'Docker sandbox container daemon is not accessible. Isolated container execution unavailable.',
      );
    }

    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 3000;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora_docker_sandbox_'));

    try {
      let image = 'node:20-alpine';
      let entryCmd = ['node', '/app/solution.js'];
      const lang = options.language.toLowerCase();

      if (lang === 'python' || lang === 'py') {
        image = 'python:3.11-alpine';
        const filePath = path.join(tempDir, 'solution.py');
        fs.writeFileSync(filePath, options.sourceCode, 'utf8');
        entryCmd = ['python', '/app/solution.py'];
      } else if (lang === 'typescript' || lang === 'ts') {
        image = 'node:20-alpine';
        const filePath = path.join(tempDir, 'solution.ts');
        fs.writeFileSync(filePath, options.sourceCode, 'utf8');
        entryCmd = ['node', '--experimental-strip-types', '/app/solution.ts'];
      } else if (lang === 'c') {
        image = 'gcc:alpine';
        const filePath = path.join(tempDir, 'solution.c');
        fs.writeFileSync(filePath, options.sourceCode, 'utf8');
        entryCmd = ['sh', '-c', 'gcc -O2 /app/solution.c -o /tmp/sol && /tmp/sol'];
      } else {
        const filePath = path.join(tempDir, 'solution.js');
        fs.writeFileSync(filePath, options.sourceCode, 'utf8');
        entryCmd = ['node', '/app/solution.js'];
      }

      const dockerArgs = [
        'run',
        '--rm',
        '--network', 'none',
        '--memory', `${options.maxMemoryMb || 128}m`,
        '--cpus', '0.5',
        '--pids-limit', '25',
        '--read-only',
        '--user', '1000:1000',
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
        '-v', `${tempDir}:/app:ro`,
        image,
        ...entryCmd,
      ];

      return await new Promise<RawExecutionResult>((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const child = spawn('docker', dockerArgs, { windowsHide: true });

        const timer = setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
          resolve({
            stdout,
            stderr: `Container execution timed out after ${timeoutMs}ms (resource limit guard).`,
            exitCode: 124,
            executionTimeMs: Date.now() - startTime,
            timedOut: true,
            isolated: true,
          });
        }, timeoutMs);

        child.stdout.on('data', (d) => {
          if (stdout.length < 65536) stdout += d.toString();
        });

        child.stderr.on('data', (d) => {
          if (stderr.length < 65536) stderr += d.toString();
        });

        child.on('close', (code) => {
          clearTimeout(timer);
          if (!timedOut) {
            resolve({
              stdout,
              stderr,
              exitCode: code ?? 0,
              executionTimeMs: Date.now() - startTime,
              timedOut: false,
              isolated: true,
            });
          }
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          if (!timedOut) {
            resolve({
              stdout,
              stderr: `Container spawn error: ${err.message}`,
              exitCode: 1,
              executionTimeMs: Date.now() - startTime,
              timedOut: false,
              isolated: true,
            });
          }
        });
      });
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        // cleanup ignore
      }
    }
  }
}
