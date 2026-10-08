import { BadRequestException } from '@nestjs/common';
import { DefaultSpeechToTextService } from './default-speech-to-text.service';

describe('DefaultSpeechToTextService (Whisper STT & Zero-Fake Fallback Verification)', () => {
  let service: DefaultSpeechToTextService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    service = new DefaultSpeechToTextService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('CRITICAL: Throws BadRequestException when GROQ_API_KEY is not configured', async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.AI_PROVIDER_API_KEY;

    await expect(
      service.transcribeAudioOrVideo(Buffer.from('fake-audio'), 'video/mp4', 'intro.mp4'),
    ).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: Throws BadRequestException when media buffer is empty', async () => {
    process.env.GROQ_API_KEY = 'gsk_test_mock_key';

    await expect(
      service.transcribeAudioOrVideo(Buffer.alloc(0), 'video/mp4', 'empty.mp4'),
    ).rejects.toThrow(BadRequestException);
  });

  it('CRITICAL: Provider API failure throws BadRequestException and NEVER manufactures dummy transcript', async () => {
    process.env.GROQ_API_KEY = 'gsk_test_mock_key';

    // Mock global fetch to simulate Groq API 502/400 failure
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: jest.fn().mockResolvedValue('Bad Gateway from Groq Whisper upstream'),
    } as any);

    try {
      await expect(
        service.transcribeAudioOrVideo(Buffer.from('media-bytes'), 'video/mp4', 'intro.mp4'),
      ).rejects.toThrow(BadRequestException);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('CRITICAL: Silent/empty speech output throws BadRequestException and NEVER manufactures text', async () => {
    process.env.GROQ_API_KEY = 'gsk_test_mock_key';

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        text: '   ', // No speech detected
        duration: 15,
      }),
    } as any);

    try {
      await expect(
        service.transcribeAudioOrVideo(Buffer.from('media-bytes'), 'video/mp4', 'intro.mp4'),
      ).rejects.toThrow(BadRequestException);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Valid Groq Whisper response returns authentic transcript and duration', async () => {
    process.env.GROQ_API_KEY = 'gsk_test_mock_key';

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        text: 'Hello, my name is Sudeep. I have a Bachelor degree in Computer Engineering and want to move to Germany.',
        duration: 45.2,
        language: 'en',
        segments: [{ id: 0, avg_logprob: -0.2 }],
      }),
    } as any);

    try {
      const result = await service.transcribeAudioOrVideo(Buffer.from('media-bytes'), 'video/mp4', 'intro.mp4');
      expect(result.transcript).toContain('Hello, my name is Sudeep');
      expect(result.durationSeconds).toBe(45);
      expect(result.confidence).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
