import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OpportunityType } from '../common/enums';

@ApiTags('Opportunities')
@Controller('api/opportunities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all database-backed opportunities' })
  @ApiQuery({ name: 'type', enum: OpportunityType, required: false })
  async getAll(@Query('type') type?: OpportunityType) {
    const opportunities = await this.opportunitiesService.getAllOpportunities(type);
    return {
      success: true,
      opportunities,
    };
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get personalized opportunity matches for current applicant' })
  async getMatches(@CurrentUser('id') applicantId: string) {
    const matches = await this.opportunitiesService.getApplicantMatches(applicantId);
    return {
      success: true,
      matches,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity details by ID' })
  async getOne(@Param('id') id: string) {
    const opportunity = await this.opportunitiesService.getOpportunityById(id);
    return {
      success: true,
      opportunity,
    };
  }
}
