import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Recommendations')
@Controller('api/recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationsController {
  constructor(private readonly recService: RecommendationsService) {}

  @Get('next-step')
  @ApiOperation({ summary: 'Get current recommended Educaro next step' })
  async getNextStep(@CurrentUser('id') applicantId: string) {
    const recommendation = await this.recService.getLatestRecommendation(applicantId);
    return {
      success: true,
      recommendation,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Recalculate Educaro next-step recommendation based on fresh applicant state' })
  async refresh(@CurrentUser('id') applicantId: string) {
    const recommendation = await this.recService.refreshRecommendation(applicantId);
    return {
      success: true,
      recommendation,
    };
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Applicant accepts recommendation' })
  async accept(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
  ) {
    const recommendation = await this.recService.acceptRecommendation(id, applicantId);
    return {
      success: true,
      recommendation,
    };
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Applicant dismisses recommendation' })
  async dismiss(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
  ) {
    const recommendation = await this.recService.dismissRecommendation(id, applicantId);
    return {
      success: true,
      recommendation,
    };
  }
}
