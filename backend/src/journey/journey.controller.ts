import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JourneyService } from './journey.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Journey')
@Controller('api/journey')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get()
  @ApiOperation({ summary: 'Get current applicant personalized journey' })
  async getJourney(@CurrentUser('id') applicantId: string) {
    const journey = await this.journeyService.getApplicantJourney(applicantId);
    return {
      success: true,
      journey,
    };
  }

  @Get('next-action')
  @ApiOperation({ summary: 'Get next immediate recommended action from journey' })
  async getNextAction(@CurrentUser('id') applicantId: string) {
    const result = await this.journeyService.getNextAction(applicantId);
    return {
      success: true,
      ...result,
    };
  }

  @Post('complete-step')
  @ApiOperation({ summary: 'Mark a journey step as completed' })
  async completeStep(
    @CurrentUser('id') applicantId: string,
    @Body('stepCode') stepCode: string,
  ) {
    const journey = await this.journeyService.completeStep(applicantId, stepCode);
    return {
      success: true,
      journey,
    };
  }
}
