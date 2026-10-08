import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultantService } from './consultant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ReviewStatus } from '../common/enums';

@ApiTags('Consultant')
@Controller('api/consultant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSULTANT, UserRole.ADMIN)
@ApiBearerAuth()
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('applicants')
  @ApiOperation({ summary: 'Get all applicants assigned for consultant evaluation' })
  async getApplicants(@CurrentUser('id') consultantId: string) {
    const applicants = await this.consultantService.getAssignedApplicants(consultantId);
    return {
      success: true,
      applicants,
    };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List consultant review items' })
  async getReviews(@Query('status') status?: ReviewStatus) {
    const reviews = await this.consultantService.getReviews(status);
    return {
      success: true,
      reviews,
    };
  }

  @Post('reviews/:id/approve')
  @ApiOperation({ summary: 'Approve applicant review item' })
  async approve(
    @Param('id') reviewId: string,
    @CurrentUser('id') consultantId: string,
    @Body('notes') notes?: string,
  ) {
    const review = await this.consultantService.approveReview(reviewId, consultantId, notes);
    return {
      success: true,
      review,
    };
  }

  @Post('reviews/:id/reject')
  @ApiOperation({ summary: 'Reject review item with reason' })
  async reject(
    @Param('id') reviewId: string,
    @CurrentUser('id') consultantId: string,
    @Body('reason') reason: string,
  ) {
    const review = await this.consultantService.rejectReview(reviewId, consultantId, reason);
    return {
      success: true,
      review,
    };
  }

  @Post('reviews/:id/request-clarification')
  @ApiOperation({ summary: 'Request clarification from applicant' })
  async requestClarification(
    @Param('id') reviewId: string,
    @CurrentUser('id') consultantId: string,
    @Body('clarificationPrompt') prompt: string,
  ) {
    const review = await this.consultantService.requestClarification(reviewId, consultantId, prompt);
    return {
      success: true,
      review,
    };
  }
}
