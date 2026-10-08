import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OrchestratorService } from '../agents/orchestrator/orchestrator.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI')
@Controller('api/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Context-aware applicant journey chat assistant' })
  async chat(
    @CurrentUser('id') applicantId: string,
    @Body('message') message: string,
    @Body('history') history?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ) {
    const messages = history || [];
    messages.push({ role: 'user', content: message });

    const reply = await this.aiService.chatWithContext(applicantId, messages);
    return {
      success: true,
      message: reply,
    };
  }

  @Post('orchestrate')
  @ApiOperation({ summary: 'Trigger master agent orchestrator loop for current applicant' })
  async orchestrate(@CurrentUser('id') applicantId: string) {
    const result = await this.orchestratorService.orchestrate(applicantId, 8, 'MANUAL_APPLICANT_TRIGGER');
    return {
      success: true,
      ...result,
    };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent agent execution activity timeline for applicant' })
  async activity(
    @CurrentUser('id') applicantId: string,
    @Query('limit') limit?: number,
  ) {
    const executions = await this.aiService.getRecentExecutions(applicantId, limit || 20);
    return {
      success: true,
      executions,
    };
  }
}
