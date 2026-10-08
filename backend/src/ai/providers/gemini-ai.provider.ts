import { Injectable, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AiStructuredOptions,
  AiTextOptions,
  AiChatOptions,
} from './ai-provider.interface';

@Injectable()
export class GeminiAiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.AI_PROVIDER_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gemini-1.5-flash';
  }

  async generateStructured<T>(options: AiStructuredOptions<T>): Promise<T> {
    const prompt = `${options.systemPrompt}\n\nUSER PROMPT:\n${options.userPrompt}\n\nIMPORTANT: Return ONLY valid JSON matching the required schema. Do not include markdown codeblocks or conversational preamble.`;

    if (this.apiKey) {
      try {
        const rawResponse = await this.callGeminiApi(prompt, true);
        const parsed = this.cleanAndParseJson(rawResponse);
        return parsed as T;
      } catch (err) {
        this.logger.warn(`Live Gemini API call failed: ${err.message}. Falling back to deterministic engine.`);
      }
    }

    return this.fallbackStructuredGeneration<T>(options);
  }

  async generateText(options: AiTextOptions): Promise<string> {
    const prompt = `${options.systemPrompt}\n\nUSER PROMPT:\n${options.userPrompt}`;

    if (this.apiKey) {
      try {
        return await this.callGeminiApi(prompt, false);
      } catch (err) {
        this.logger.warn(`Live Gemini text call failed: ${err.message}.`);
      }
    }

    return this.fallbackTextGeneration(options);
  }

  async chat(options: AiChatOptions): Promise<string> {
    const conversation = options.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    if (this.apiKey) {
      try {
        return await this.callGeminiApi(conversation, false);
      } catch (err) {
        this.logger.warn(`Live Gemini chat call failed: ${err.message}.`);
      }
    }

    return this.fallbackChatResponse(options);
  }

  private async callGeminiApi(prompt: string, expectJson: boolean): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        ...(expectJson ? { responseMimeType: 'application/json' } : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API returned status ${res.status}: ${errorText}`);
    }

    const data: any = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned empty response candidates');
    }

    return candidateText;
  }

  private cleanAndParseJson(text: string): any {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(clean);
  }

  private fallbackStructuredGeneration<T>(options: AiStructuredOptions<T>): T {
    const sys = options.systemPrompt.toLowerCase();
    const user = options.userPrompt.toLowerCase();

    if (sys.includes('orchestrator')) {
      let chosenAgent = 'PROFILE';
      let reason = 'Initial profile gathering in progress.';
      if (user.includes('document_uploaded') || user.includes('unprocessed')) {
        chosenAgent = 'DOCUMENT';
        reason = 'Applicant uploaded new supporting documents needing text & credential extraction.';
      } else if (user.includes('check consistency') || user.includes('documents_processed')) {
        chosenAgent = 'CONSISTENCY';
        reason = 'Verifying consistency between applicant claimed data and extracted documents.';
      } else if (user.includes('video')) {
        chosenAgent = 'VIDEO';
        reason = 'Analyzing 60-second video introduction for pathway alignment and communication clarity.';
      } else if (user.includes('qualification') || user.includes('evaluate eligibility')) {
        chosenAgent = 'QUALIFICATION';
        reason = 'Evaluating applicant eligibility against German statutory requirements.';
      } else if (user.includes('opportunity') || user.includes('find matches')) {
        chosenAgent = 'OPPORTUNITY';
        reason = 'Matching verified applicant profile against accredited German opportunities.';
      } else if (user.includes('routing') || user.includes('next step')) {
        chosenAgent = 'ROUTING';
        reason = 'Determining the highest impact next step in the Educaro ecosystem.';
      } else if (user.includes('cv') || user.includes('lebenslauf')) {
        chosenAgent = 'CV';
        reason = 'Generating Germany-standard Lebenslauf CV.';
      }

      return {
        chosenAgent,
        reason,
        observedStateSummary: 'Deterministic rule-order planner executed based on current applicant state milestones.',
        stopConditionMet: false,
      } as unknown as T;
    }

    // Never return fabricated applicant data, dummy CVs, or invented scores
    throw new Error(
      `AI structured generation failed for agent context (${options.systemPrompt.slice(0, 50)}...). Fabricated fallback data is strictly disabled for integrity and compliance.`,
    );
  }

  private fallbackTextGeneration(options: AiTextOptions): string {
    throw new Error('AI provider text generation failed: live provider is unconfigured or returned an error.');
  }

  private fallbackChatResponse(options: AiChatOptions): string {
    return 'I currently do not have a live AI connection available to respond. Please check that GROQ_API_KEY or AI_PROVIDER_API_KEY is configured in your environment.';
  }
}
