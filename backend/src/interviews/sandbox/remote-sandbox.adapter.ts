import { Injectable, Logger } from '@nestjs/common';
import {
  ISandboxExecutor,
  SandboxExecutionOptions,
  RawExecutionResult,
} from './sandbox.interface';

@Injectable()
export class RemoteSandboxAdapter implements ISandboxExecutor {
  private readonly logger = new Logger(RemoteSandboxAdapter.name);
  private readonly serviceUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.serviceUrl = process.env.SANDBOX_SERVICE_URL || '';
    this.apiKey = process.env.SANDBOX_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.serviceUrl) return false;
    try {
      const res = await fetch(`${this.serviceUrl}/health`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async execute(options: SandboxExecutionOptions): Promise<RawExecutionResult> {
    if (!this.serviceUrl) {
      throw new Error('SANDBOX_SERVICE_URL is not configured.');
    }

    const startTime = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.serviceUrl}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language: options.language,
        code: options.sourceCode,
        timeoutMs: options.timeoutMs || 3000,
        memoryLimitMb: options.maxMemoryMb || 128,
      }),
      signal: AbortSignal.timeout((options.timeoutMs || 3000) + 1000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Remote sandbox execution service returned ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    return {
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      exitCode: data.exitCode ?? (data.passed ? 0 : 1),
      executionTimeMs: data.executionTimeMs || Date.now() - startTime,
      timedOut: Boolean(data.timedOut),
      isolated: true,
    };
  }
}
