import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryKb: number;
  passed: boolean;
  testResults: {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    description: string;
  }[];
}

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly TIMEOUT_MS = 3500;
  private readonly MAX_OUTPUT_SIZE = 65536; // 64KB

  async executeCode(
    language: string,
    sourceCode: string,
    testCases: Array<{ input: string; expectedOutput: string; description: string }> = [],
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora_sandbox_'));

    try {
      let runCmd = '';
      let runArgs: string[] = [];
      let filename = '';

      const lang = language.toLowerCase();
      if (lang === 'javascript' || lang === 'js') {
        filename = path.join(tempDir, 'solution.js');
        fs.writeFileSync(filename, sourceCode, 'utf8');
        runCmd = 'node';
        runArgs = [filename];
      } else if (lang === 'typescript' || lang === 'ts') {
        filename = path.join(tempDir, 'solution.ts');
        fs.writeFileSync(filename, sourceCode, 'utf8');
        runCmd = 'node';
        runArgs = ['--experimental-strip-types', filename];
      } else if (lang === 'python' || lang === 'py') {
        filename = path.join(tempDir, 'solution.py');
        fs.writeFileSync(filename, sourceCode, 'utf8');
        runCmd = 'python';
        runArgs = [filename];
      } else {
        // Fallback execution via node wrapper
        filename = path.join(tempDir, 'solution.js');
        fs.writeFileSync(filename, sourceCode, 'utf8');
        runCmd = 'node';
        runArgs = [filename];
      }

      // Execute safely in spawned child process with strict limits
      const execResult = await this.runIsolatedProcess(runCmd, runArgs, tempDir);
      const executionTimeMs = Date.now() - startTime;

      // Evaluate test cases
      const testResults = testCases.map((tc) => {
        const actualTrimmed = execResult.stdout.trim();
        const expectedTrimmed = tc.expectedOutput.trim();
        const passed = actualTrimmed.includes(expectedTrimmed);
        return {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: actualTrimmed.slice(0, 500),
          passed,
          description: tc.description,
        };
      });

      const allPassed = testCases.length === 0 ? execResult.stderr.length === 0 : testResults.every((t) => t.passed);

      return {
        stdout: execResult.stdout.slice(0, this.MAX_OUTPUT_SIZE),
        stderr: execResult.stderr.slice(0, this.MAX_OUTPUT_SIZE),
        executionTimeMs,
        memoryKb: Math.round(process.memoryUsage().heapUsed / 1024),
        passed: allPassed,
        testResults,
      };
    } catch (err: any) {
      this.logger.error(`Code execution sandbox failure: ${err.message}`);
      return {
        stdout: '',
        stderr: err.message || 'Execution error in sandbox',
        executionTimeMs: Date.now() - startTime,
        memoryKb: 0,
        passed: false,
        testResults: [],
      };
    } finally {
      // Immediate sandbox directory clean up
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        // Ignore temp cleanup errors
      }
    }
  }

  private runIsolatedProcess(
    cmd: string,
    args: string[],
    cwd: string,
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const child = spawn(cmd, args, {
        cwd,
        env: {
          NODE_ENV: 'sandbox',
          PATH: process.env.PATH,
        },
        windowsHide: true,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
        resolve({
          stdout,
          stderr: `Execution timed out after ${this.TIMEOUT_MS}ms (CPU/Infinite Loop Guard).`,
        });
      }, this.TIMEOUT_MS);

      child.stdout.on('data', (data) => {
        if (stdout.length < this.MAX_OUTPUT_SIZE) {
          stdout += data.toString();
        }
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < this.MAX_OUTPUT_SIZE) {
          stderr += data.toString();
        }
      });

      child.on('close', () => {
        clearTimeout(timer);
        if (!isTimedOut) {
          resolve({ stdout, stderr });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        if (!isTimedOut) {
          resolve({ stdout, stderr: `Process spawn error: ${err.message}` });
        }
      });
    });
  }
}
