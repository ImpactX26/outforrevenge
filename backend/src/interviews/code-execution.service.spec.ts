import { CodeExecutionService } from './code-execution.service';

describe('CodeExecutionService (Isolated Sandbox Adapter & Host Protection)', () => {
  let service: CodeExecutionService;
  let mockDocker: any;
  let mockRemote: any;

  beforeEach(() => {
    mockDocker = {
      isAvailable: jest.fn().mockResolvedValue(false),
      execute: jest.fn(),
    };
    mockRemote = {
      isAvailable: jest.fn().mockResolvedValue(false),
      execute: jest.fn(),
    };

    service = new CodeExecutionService(mockDocker, mockRemote);
  });

  it('CRITICAL: Rejects disallowed languages (e.g. bash, sh, powershell, ruby)', async () => {
    const result = await service.executeCode('bash', 'rm -rf /', []);
    expect(result.passed).toBe(false);
    expect(result.stderr).toContain('LANGUAGE_REJECTED');
    expect(mockDocker.execute).not.toHaveBeenCalled();
    expect(mockRemote.execute).not.toHaveBeenCalled();
  });

  it('CRITICAL: Blocks execution and returns SANDBOX_UNAVAILABLE when no container runner is available (NO HOST FALLBACK)', async () => {
    mockDocker.isAvailable.mockResolvedValue(false);
    mockRemote.isAvailable.mockResolvedValue(false);

    const result = await service.executeCode('javascript', 'console.log("untrusted candidate code")', []);

    expect(result.passed).toBe(false);
    expect(result.stderr).toContain('SANDBOX_UNAVAILABLE');
    expect(result.isolated).toBe(false);
    // Verified: No child process execution on host!
    expect(mockDocker.execute).not.toHaveBeenCalled();
    expect(mockRemote.execute).not.toHaveBeenCalled();
  });

  it('Executes inside isolated container when remote sandbox service is online', async () => {
    mockRemote.isAvailable.mockResolvedValue(true);
    mockRemote.execute.mockResolvedValue({
      stdout: 'Hello Germany\n',
      stderr: '',
      exitCode: 0,
      executionTimeMs: 120,
      timedOut: false,
      isolated: true,
    });

    const result = await service.executeCode('python', 'print("Hello Germany")', [
      { input: '', expectedOutput: 'Hello Germany', description: 'Greeting test' },
    ]);

    expect(result.passed).toBe(true);
    expect(result.isolated).toBe(true);
    expect(result.stdout).toContain('Hello Germany');
    expect(mockRemote.execute).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'python', sourceCode: 'print("Hello Germany")' }),
    );
  });
});
