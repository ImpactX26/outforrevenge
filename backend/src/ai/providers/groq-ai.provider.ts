import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  IAiProvider,
  AiStructuredOptions,
  AiTextOptions,
  AiChatOptions,
} from './ai-provider.interface';

@Injectable()
export class GroqAiProvider implements IAiProvider {
  private readonly logger = new Logger(GroqAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private activeModel: string;
  private readonly fallbackModels = [
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.AI_PROVIDER_API_KEY || '';
    this.model = process.env.GROQ_MODEL || process.env.AI_MODEL || 'openai/gpt-oss-120b';
    this.activeModel = this.model;
  }

  async generateStructured<T>(options: AiStructuredOptions<T>): Promise<T> {
    const systemPrompt = `${options.systemPrompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON conforming to the requested schema. Do not include markdown codeblocks (\`\`\`json) or any conversational introduction or conclusion.`;

    if (this.apiKey) {
      try {
        const rawResponse = await this.callGroqApi(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          true,
          options.temperature ?? 0.2,
        );
        const parsed = this.cleanAndParseJson(rawResponse);
        return parsed as T;
      } catch (err: any) {
        this.logger.warn(`Live Groq API call failed: ${err.message}.`);
        // If it's a rule-based orchestrator, allow deterministic rule-order fallback
        if (options.systemPrompt.toLowerCase().includes('orchestrator')) {
          return this.ruleBasedOrchestratorFallback<T>(options.userPrompt);
        }
        throw new BadRequestException(
          `AI provider call failed: ${err.message}. Please verify your GROQ_API_KEY or retry.`,
        );
      }
    }

    // Only allow deterministic fallback for genuine rule-based orchestrator
    if (options.systemPrompt.toLowerCase().includes('orchestrator')) {
      return this.ruleBasedOrchestratorFallback<T>(options.userPrompt);
    }

    throw new BadRequestException(
      'GROQ_API_KEY is not configured or unavailable for AI structured extraction. Please provide GROQ_API_KEY.',
    );
  }

  async generateText(options: AiTextOptions): Promise<string> {
    if (this.apiKey) {
      try {
        return await this.callGroqApi(
          [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          false,
          options.temperature ?? 0.3,
        );
      } catch (err: any) {
        this.logger.warn(`Live Groq text call failed: ${err.message}.`);
        throw new BadRequestException(`AI provider text generation failed: ${err.message}`);
      }
    }

    throw new BadRequestException('GROQ_API_KEY is not configured.');
  }

  async chat(options: AiChatOptions): Promise<string> {
    if (this.apiKey) {
      try {
        const systemPrompt =
          options.systemPrompt ||
          'You are Nexora, an intelligent AI Journey & Qualification Advisor for moving, studying, or pursuing vocational training (Ausbildung) and employment in Germany.\n' +
          'Answer ONLY based on verified applicant data provided in the prompt context. If the requested information is not supported by the verified data, respond exactly:\n' +
          '"I don\'t have enough verified information to answer that yet. Please complete your profile or upload the relevant document."';

        const formattedMessages: Array<{ role: string; content: string }> = [
          { role: 'system', content: systemPrompt },
        ];

        for (const m of options.messages) {
          if (m.role === 'system') continue;
          formattedMessages.push({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || '',
          });
        }

        return await this.callGroqApi(
          formattedMessages,
          false,
          options.temperature ?? 0.4,
        );
      } catch (err: any) {
        this.logger.warn(`Live Groq chat call failed: ${err.message}.`);
        throw new BadRequestException(`AI chat provider failed: ${err.message}`);
      }
    }

    return "I don't have enough verified information to answer that yet. Please complete your profile or upload the relevant document.";
  }

  private async callGroqApi(
    messages: Array<{ role: string; content: string }>,
    expectJson: boolean,
    temperature = 0.2,
  ): Promise<string> {
    const candidateModels = Array.from(new Set([this.activeModel, ...this.fallbackModels]));
    let lastError: Error | null = null;

    for (const modelToTry of candidateModels) {
      const body: Record<string, any> = {
        model: modelToTry,
        messages,
        temperature,
      };

      if (expectJson) {
        body.response_format = { type: 'json_object' };
      }

      try {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          if (expectJson && (res.status === 400 || errorText.includes('response_format'))) {
            delete body.response_format;
            const retryRes = await fetch(this.apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify(body),
            });
            if (retryRes.ok) {
              const retryData: any = await retryRes.json();
              const retryContent = retryData?.choices?.[0]?.message?.content;
              if (retryContent) {
                this.activeModel = modelToTry;
                return retryContent;
              }
            }
          }
          lastError = new Error(`Model ${modelToTry} returned status ${res.status}: ${errorText}`);
          continue;
        }

        const data: any = await res.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
          lastError = new Error(`Model ${modelToTry} returned empty message content`);
          continue;
        }

        this.activeModel = modelToTry;
        return content;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('All Groq candidate models failed');
  }

  private cleanAndParseJson(text: string): any {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }
    return JSON.parse(clean);
  }

  private ruleBasedOrchestratorFallback<T>(userPrompt: string): T {
    const user = userPrompt.toLowerCase();
    let chosenAgent = 'PROFILE';
    let reason = 'Initial profile gathering in progress.';

    if (user.includes('document_uploaded') || user.includes('unprocessed')) {
      chosenAgent = 'DOCUMENT';
      reason = 'New document uploaded; invoking Document Agent to extract credentials.';
    } else if (user.includes('check consistency') || user.includes('documents_processed')) {
      chosenAgent = 'CONSISTENCY';
      reason = 'Verifying consistency between applicant claimed data and extracted documents.';
    } else if (user.includes('video')) {
      chosenAgent = 'VIDEO';
      reason = 'Analyzing video introduction for pathway alignment and communication clarity.';
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
}
