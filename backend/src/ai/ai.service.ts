import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
  AiStructuredOptions,
  AiTextOptions,
  AiChatOptions,
} from './providers/ai-provider.interface';
import { AgentExecution } from '../database/entities/agent-execution.entity';
import { AgentExecutionStatus } from '../common/enums';
import { AGENT_PROMPTS } from './prompts/agent-prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAiProvider,
    @InjectRepository(AgentExecution)
    private readonly executionRepo: Repository<AgentExecution>,
  ) {}

  async runAgentStructured<T>(
    agentType: string,
    applicantId: string | undefined,
    userPrompt: string,
    schema?: Record<string, any>,
    parentExecutionId?: string,
    triggeredBy = 'ORCHESTRATOR',
  ): Promise<{ data: T; execution: AgentExecution }> {
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.ORCHESTRATOR;

    const execution = this.executionRepo.create({
      agentType,
      applicantId,
      status: AgentExecutionStatus.RUNNING,
      inputReference: userPrompt.slice(0, 500),
      parentExecutionId,
      triggeredBy,
      startedAt: new Date(),
    });
    const savedExecution = await this.executionRepo.save(execution);

    try {
      const data = await this.aiProvider.generateStructured<T>({
        systemPrompt,
        userPrompt,
        schema,
      });

      savedExecution.status = AgentExecutionStatus.COMPLETED;
      savedExecution.output = (data as any) || {};
      savedExecution.confidence = (data as any)?.confidence || 0.95;
      savedExecution.completedAt = new Date();
      await this.executionRepo.save(savedExecution);

      return { data, execution: savedExecution };
    } catch (err) {
      this.logger.error(`Agent execution error [${agentType}]: ${err.message}`, err.stack);
      savedExecution.status = AgentExecutionStatus.FAILED;
      savedExecution.error = err.message;
      savedExecution.completedAt = new Date();
      await this.executionRepo.save(savedExecution);
      throw err;
    }
  }

  async runAgentText(agentType: string, userPrompt: string): Promise<string> {
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.ORCHESTRATOR;
    return this.aiProvider.generateText({ systemPrompt, userPrompt });
  }

  async chat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
    return this.aiProvider.chat({ messages });
  }

  async getRecentExecutions(applicantId?: string, limit = 20): Promise<AgentExecution[]> {
    const query = this.executionRepo.createQueryBuilder('exec')
      .orderBy('exec.createdAt', 'DESC')
      .take(limit);

    if (applicantId) {
      query.where('exec.applicantId = :applicantId', { applicantId });
    }

    return query.getMany();
  }
}
