import {
  Controller,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QualificationService } from './qualification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Qualification')
@Controller('api/qualification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Trigger deterministic qualification assessment with AI explanation' })
  async evaluate(@CurrentUser('id') applicantId: string) {
    const assessment = await this.qualificationService.evaluateApplicant(applicantId);
    return {
      success: true,
      assessment,
    };
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current qualification assessment for applicant' })
  async getCurrent(@CurrentUser('id') applicantId: string) {
    const assessment = await this.qualificationService.getLatestAssessment(applicantId);
    return {
      success: true,
      assessment,
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current qualification assessment status for applicant (alias)' })
  async getStatus(@CurrentUser('id') applicantId: string) {
    const assessment = await this.qualificationService.getLatestAssessment(applicantId);
    return {
      success: true,
      assessment,
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest qualification assessment for applicant (alias)' })
  async getLatest(@CurrentUser('id') applicantId: string) {
    const assessment = await this.qualificationService.getLatestAssessment(applicantId);
    return {
      success: true,
      assessment,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get evaluation history for applicant' })
  async getHistory(@CurrentUser('id') applicantId: string) {
    const history = await this.qualificationService.getAssessmentHistory(applicantId);
    return {
      success: true,
      history,
    };
  }
}
