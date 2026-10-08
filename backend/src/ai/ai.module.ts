import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroqAiProvider } from './providers/groq-ai.provider';
import { GeminiAiProvider } from './providers/gemini-ai.provider';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import { AiService } from './ai.service';
import { AgentExecution } from '../database/entities/agent-execution.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AgentExecution])],
  providers: [
    GroqAiProvider,
    GeminiAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (groqProvider: GroqAiProvider, geminiProvider: GeminiAiProvider) => {
        const providerName = (process.env.AI_PROVIDER || 'groq').toLowerCase();
        if (providerName === 'gemini') {
          return geminiProvider;
        }
        return groqProvider;
      },
      inject: [GroqAiProvider, GeminiAiProvider],
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER_TOKEN],
})
export class AiModule {}
