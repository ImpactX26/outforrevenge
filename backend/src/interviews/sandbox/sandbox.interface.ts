export interface SandboxExecutionOptions {
  language: string;
  sourceCode: string;
  timeoutMs?: number;
  maxMemoryMb?: number;
}

export interface RawExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
  isolated: boolean;
}

export interface ISandboxExecutor {
  isAvailable(): Promise<boolean>;
  execute(options: SandboxExecutionOptions): Promise<RawExecutionResult>;
}

export const SANDBOX_EXECUTOR_TOKEN = Symbol('SANDBOX_EXECUTOR_TOKEN');
