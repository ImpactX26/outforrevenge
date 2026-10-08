import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DockerSandboxAdapter } from './sandbox/docker-sandbox.adapter';
import { RemoteSandboxAdapter } from './sandbox/remote-sandbox.adapter';
import { ISandboxExecutor, RawExecutionResult } from './sandbox/sandbox.interface';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryKb: number;
  passed: boolean;
  isolated: boolean;
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
  private readonly ALLOWED_LANGUAGES = ['javascript', 'js', 'typescript', 'ts', 'python', 'py', 'c'];

  constructor(
    private readonly dockerSandbox: DockerSandboxAdapter,
    private readonly remoteSandbox: RemoteSandboxAdapter,
  ) {}

  private async getActiveSandbox(): Promise<ISandboxExecutor | null> {
    if (await this.remoteSandbox.isAvailable()) {
      return this.remoteSandbox;
    }
    if (await this.dockerSandbox.isAvailable()) {
      return this.dockerSandbox;
    }
    return null;
  }

  async executeCode(
    language: string,
    sourceCode: string,
    testCases: Array<{ input: string; expectedOutput: string; description: string }> = [],
  ): Promise<ExecutionResult> {
    const lang = (language || '').toLowerCase().trim();

    // 1. Strict language allowlist validation
    if (!this.ALLOWED_LANGUAGES.includes(lang)) {
      return {
        stdout: '',
        stderr: `LANGUAGE_REJECTED: Language '${language}' is not in the allowed sandbox runtimes (${this.ALLOWED_LANGUAGES.join(', ')}).`,
        executionTimeMs: 0,
        memoryKb: 0,
        passed: false,
        isolated: true,
        testResults: [],
      };
    }

    // 2. Source code sanity and size limits (max 32KB source)
    if (!sourceCode || sourceCode.trim().length === 0) {
      return {
        stdout: '',
        stderr: 'No source code provided for execution.',
        executionTimeMs: 0,
        memoryKb: 0,
        passed: false,
        isolated: true,
        testResults: [],
      };
    }

    if (sourceCode.length > 32768) {
      return {
        stdout: '',
        stderr: 'Source code exceeds maximum permitted length (32KB).',
        executionTimeMs: 0,
        memoryKb: 0,
        passed: false,
        isolated: true,
        testResults: [],
      };
    }

    // 3. Resolve isolated sandbox runtime
    const sandbox = await this.getActiveSandbox();

    // STRICT COMPLIANCE: If isolated sandbox is unavailable, NEVER fall back to host execution!
    if (!sandbox) {
      this.logger.warn(
        'Code execution requested but no isolated container sandbox (Docker or Remote) is available. Blocking execution.',
      );
      return {
        stdout: '',
        stderr:
          'SANDBOX_UNAVAILABLE: Isolated container execution is not configured or offline. Direct host subprocess execution is strictly disabled for security. Please deploy a container sandbox runner or configure SANDBOX_SERVICE_URL.',
        executionTimeMs: 0,
        memoryKb: 0,
        passed: false,
        isolated: false,
        testResults: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          description: `${tc.description} (Blocked: Sandbox unavailable)`,
        })),
      };
    }

    try {
      const execResult: RawExecutionResult = await sandbox.execute({
        language: lang,
        sourceCode,
        timeoutMs: this.TIMEOUT_MS,
        maxMemoryMb: 128,
      });

      // 4. Evaluate test cases against output
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

      const allPassed =
        testCases.length === 0
          ? execResult.exitCode === 0 && execResult.stderr.length === 0
          : testResults.every((t) => t.passed);

      return {
        stdout: execResult.stdout.slice(0, this.MAX_OUTPUT_SIZE),
        stderr: execResult.stderr.slice(0, this.MAX_OUTPUT_SIZE),
        executionTimeMs: execResult.executionTimeMs,
        memoryKb: 128 * 1024,
        passed: allPassed,
        isolated: true,
        testResults,
      };
    } catch (err: any) {
      this.logger.error(`Sandbox execution exception: ${err.message}`);
      return {
        stdout: '',
        stderr: `Sandbox execution failed: ${err.message}`,
        executionTimeMs: 0,
        memoryKb: 0,
        passed: false,
        isolated: true,
        testResults: [],
      };
    }
  }
}
