import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Interviews')
@Controller('api/interviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule/create interview room with structured stages & coding challenges' })
  async createInterview(
    @Body() dto: {
      applicationId: string;
      interviewerId?: string;
      scheduledAt: string;
      durationMinutes?: number;
      title?: string;
    },
  ) {
    return this.interviewsService.createInterview({
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Get()
  @ApiOperation({ summary: 'List scheduled interviews for current user (or all if consultant/admin)' })
  async listInterviews(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const interviews = await this.interviewsService.listInterviews(userId, role);
    return { success: true, interviews };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interview room details by ID' })
  async getInterviewById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const room = await this.interviewsService.getInterviewById(id, userId, role);
    return { success: true, room };
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Verify permissions, GDPR compliance, and join interview room' })
  async joinRoom(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.joinRoom(id, userId);
  }

  @Post(':id/invitations/:invId/respond')
  @ApiOperation({ summary: 'Accept, decline, or reschedule an interview invitation' })
  async respondInvitation(
    @Param('invId') invId: string,
    @CurrentUser('id') applicantId: string,
    @Body('response') response: 'ACCEPT' | 'DECLINE' | 'RESCHEDULE',
    @Body('proposedTime') proposedTime?: string,
  ) {
    const result = await this.interviewsService.respondInvitation(
      invId,
      applicantId,
      response,
      proposedTime ? new Date(proposedTime) : undefined,
    );
    return { success: true, invitation: result };
  }

  @Post(':id/answers')
  @ApiOperation({ summary: 'Submit applicant interview answer with adaptive live AI assistance' })
  async submitAnswer(
    @Param('id') id: string,
    @CurrentUser('id') applicantId: string,
    @Body('questionId') questionId: string,
    @Body('answerText') answerText: string,
  ) {
    return this.interviewsService.submitAnswer(id, questionId, applicantId, answerText);
  }

  @Post(':id/code/run')
  @ApiOperation({ summary: 'Execute candidate code in isolated sandbox' })
  async runCode(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('challengeId') challengeId: string,
    @Body('language') language: string,
    @Body('code') code: string,
  ) {
    return this.interviewsService.runCode(id, userId, challengeId, language, code);
  }

  @Post(':id/code/submit')
  @ApiOperation({ summary: 'Submit candidate code for formal scoring against test suite' })
  async submitCode(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('challengeId') challengeId: string,
    @Body('language') language: string,
    @Body('code') code: string,
  ) {
    return this.interviewsService.submitCode(id, userId, challengeId, language, code);
  }

  @Get(':id/scorecard')
  @ApiOperation({ summary: 'Get scorecard for interview' })
  async getScorecard(@Param('id') id: string) {
    const scorecard = await this.interviewsService.getScorecard(id);
    return { success: true, scorecard };
  }

  @Patch(':id/scorecard')
  @ApiOperation({ summary: 'Update scorecard by interviewer' })
  async updateScorecard(
    @Param('id') id: string,
    @CurrentUser('id') evaluatorId: string,
    @Body() dto: any,
  ) {
    const updated = await this.interviewsService.updateScorecard(id, evaluatorId, dto);
    return { success: true, scorecard: updated };
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Trigger post-interview evaluation agent' })
  async evaluateInterview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewsService.evaluateInterview(id, userId);
  }
}
