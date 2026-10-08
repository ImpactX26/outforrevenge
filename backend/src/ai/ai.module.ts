import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiAiProvider } from './providers/gemini-ai.provider';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.interface';
import { AiService } from './ai.service';
import { AgentExecution } from '../database/entities/agent-execution.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AgentExecution])],
  providers: [
    GeminiAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiAiProvider,
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER_TOKEN],
})
export class AiModule {}
