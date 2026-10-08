import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ISpeechToTextProvider,
  SpeechToTextResult,
} from './speech-to-text.interface';

@Injectable()
export class DefaultSpeechToTextService implements ISpeechToTextProvider {
  private readonly logger = new Logger(DefaultSpeechToTextService.name);

  async transcribeAudioOrVideo(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<SpeechToTextResult> {
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_PROVIDER_API_KEY;

    if (!apiKey) {
      this.logger.error(`Speech-to-text provider API key is not configured for ${filename}`);
      throw new BadRequestException(
        'Speech-to-text provider is not configured. Please configure GROQ_API_KEY for Whisper transcription in your environment.',
      );
    }

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Audio/video media buffer is empty or corrupted.');
    }

    this.logger.log(
      `Sending media to Groq Whisper transcription API for ${filename} (${mimeType}, ${buffer.length} bytes)`,
    );

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Groq Whisper API returned ${response.status}: ${errorText}`);
        throw new BadRequestException(
          `Speech-to-text transcription service failed (${response.status}): ${errorText}`,
        );
      }

      const result: any = await response.json();
      const transcript = (result.text || '').trim();
      const durationSeconds = Math.round(result.duration || 0);
      const languageDetected = result.language || 'en';

      if (!transcript) {
        throw new BadRequestException(
          `No audible speech detected in ${filename}. Please provide a clear recording with spoken audio.`,
        );
      }

      // Compute actual confidence from segment logprobs if provided by Whisper
      let calculatedConfidence: number | undefined = undefined;
      if (Array.isArray(result.segments) && result.segments.length > 0) {
        const validLogprobs = result.segments
          .map((s: any) => s.avg_logprob)
          .filter((lp: any) => typeof lp === 'number' && !isNaN(lp));
        if (validLogprobs.length > 0) {
          const avgLogprob = validLogprobs.reduce((a: number, b: number) => a + b, 0) / validLogprobs.length;
          calculatedConfidence = Math.min(1, Math.max(0, Math.round(Math.exp(avgLogprob) * 100) / 100));
        }
      }

      return {
        transcript,
        durationSeconds,
        confidence: calculatedConfidence,
        languageDetected,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Speech-to-text API call encountered exception for ${filename}: ${err.message}`);
      throw new BadRequestException(
        `Failed to transcribe audio/video via Whisper API: ${err.message}`,
      );
    }
  }
}
