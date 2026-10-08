import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoverLettersService } from './cover-letters.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cover Letter')
@Controller('api/cover-letters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoverLettersController {
  constructor(private readonly coverLettersService: CoverLettersService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a tailored cover letter (Anschreiben)' })
  async generate(
    @CurrentUser('id') applicantId: string,
    @Body('opportunityId') opportunityId?: string,
  ) {
    const coverLetter = await this.coverLettersService.generateCoverLetter(applicantId, opportunityId);
    return {
      success: true,
      coverLetter,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all cover letters created for applicant' })
  async list(@CurrentUser('id') applicantId: string) {
    const coverLetters = await this.coverLettersService.getCoverLetters(applicantId);
    return {
      success: true,
      coverLetters,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific cover letter by ID' })
  async getOne(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
  ) {
    const coverLetter = await this.coverLettersService.getCoverLetterById(id, applicantId);
    return {
      success: true,
      coverLetter,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit and update cover letter content' })
  async update(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('title') title?: string,
  ) {
    const coverLetter = await this.coverLettersService.updateCoverLetter(id, applicantId, content, title);
    return {
      success: true,
      coverLetter,
    };
  }
}
