import { Module, Global } from '@nestjs/common';
import { GroqAiProvider } from './providers/groq-ai.provider';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import { AiService } from './ai.service';

@Global()
@Module({
  providers: [
    GroqAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GroqAiProvider,
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER_TOKEN],
})
export class AiModule {}
