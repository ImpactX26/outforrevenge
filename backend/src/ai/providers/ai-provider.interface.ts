export interface AiStructuredOptions<T = any> {
  systemPrompt: string;
  userPrompt: string;
  schema?: Record<string, any>;
  temperature?: number;
}

export interface AiTextOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatOptions {
  messages: AiChatMessage[];
  systemPrompt?: string;
  temperature?: number;
}

export interface IAiProvider {
  generateStructured<T>(options: AiStructuredOptions<T>): Promise<T>;
  generateText(options: AiTextOptions): Promise<string>;
  chat(options: AiChatOptions): Promise<string>;
}

export const AI_PROVIDER_TOKEN = 'IAiProvider';
