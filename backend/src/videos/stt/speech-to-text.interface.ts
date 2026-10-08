export interface SpeechToTextResult {
  transcript: string;
  durationSeconds: number;
  confidence: number;
  languageDetected?: string;
}

export interface ISpeechToTextProvider {
  transcribeAudioOrVideo(
    buffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<SpeechToTextResult>;
}

export const SPEECH_TO_TEXT_PROVIDER_TOKEN = 'ISpeechToTextProvider';
