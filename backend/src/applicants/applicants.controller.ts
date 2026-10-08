import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicantsService } from './applicants.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Applicant')
@Controller('api/applicant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get complete applicant profile with provenance and documents' })
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.applicantsService.getProfile(userId);
    return {
      success: true,
      ...data,
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update applicant profile details' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.applicantsService.updateProfile(userId, dto);
    return {
      success: true,
      profile,
    };
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get real-time profile completion and readiness metrics' })
  async getProgress(@CurrentUser('id') userId: string) {
    return this.applicantsService.getProgress(userId);
  }

  @Post('education')
  @ApiOperation({ summary: 'Add education record to applicant profile' })
  async addEducation(@CurrentUser('id') userId: string, @Body() data: any) {
    const edu = await this.applicantsService.addEducation(userId, data);
    return { success: true, education: edu };
  }

  @Post('employment')
  @ApiOperation({ summary: 'Add employment record to applicant profile' })
  async addEmployment(@CurrentUser('id') userId: string, @Body() data: any) {
    const emp = await this.applicantsService.addEmployment(userId, data);
    return { success: true, employment: emp };
  }

  @Post('skill')
  @ApiOperation({ summary: 'Add skill to applicant profile' })
  async addSkill(@CurrentUser('id') userId: string, @Body() data: any) {
    const skill = await this.applicantsService.addSkill(userId, data);
    return { success: true, skill };
  }

  @Post('language')
  @ApiOperation({ summary: 'Add language proficiency to applicant profile' })
  async addLanguage(@CurrentUser('id') userId: string, @Body() data: any) {
    const lang = await this.applicantsService.addLanguage(userId, data);
    return { success: true, language: lang };
  }
}
