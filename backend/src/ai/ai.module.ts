import { Module, Global, forwardRef } from '@nestjs/common';
import { GroqAiProvider } from './providers/groq-ai.provider';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OrchestratorModule } from '../agents/orchestrator/orchestrator.module';

@Global()
@Module({
  imports: [forwardRef(() => OrchestratorModule)],
  controllers: [AiController],
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
