import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Applications')
@Controller('api/applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List applications for current user (or all if consultant/admin)' })
  async listApplications(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const applications = await this.applicationsService.listApplications(userId, role);
    return { success: true, applications };
  }

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare application package via Application Readiness & Job Application Agents' })
  async prepare(
    @CurrentUser('id') applicantId: string,
    @Body('opportunityId') opportunityId: string,
  ) {
    return this.applicationsService.prepareApplication(applicantId, opportunityId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Explicit applicant confirmation to submit the application' })
  async confirm(
    @Param('id') id: string,
    @CurrentUser('id') applicantId: string,
  ) {
    return this.applicationsService.confirmApplication(id, applicantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details by ID' })
  async getById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const application = await this.applicationsService.getApplicationById(id, userId, role);
    return { success: true, application };
  }
}
