import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GoalType } from '../common/enums';

@ApiTags('Interview')
@Controller('api/interview')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a German interview preparation session' })
  async start(
    @CurrentUser('id') applicantId: string,
    @Body('pathway') pathway: GoalType,
    @Body('targetRole') targetRole?: string,
  ) {
    const session = await this.interviewsService.startSession(
      applicantId,
      pathway || GoalType.AUSBILDUNG,
      targetRole,
    );
    return {
      success: true,
      session,
    };
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Submit answer to interview question and receive AI feedback' })
  async answer(
    @CurrentUser('id') applicantId: string,
    @Param('id') sessionId: string,
    @Body('questionId') questionId: string,
    @Body('answerText') answerText: string,
  ) {
    const session = await this.interviewsService.submitAnswer(
      sessionId,
      applicantId,
      questionId,
      answerText,
    );
    return {
      success: true,
      session,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interview session details and evaluations' })
  async getOne(
    @CurrentUser('id') applicantId: string,
    @Param('id') sessionId: string,
  ) {
    const session = await this.interviewsService.getSession(sessionId, applicantId);
    return {
      success: true,
      session,
    };
  }
}
