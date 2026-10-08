import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CvService } from './cv.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('CV')
@Controller('api/cv')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a professional German standard CV from verified profile' })
  async generate(
    @CurrentUser('id') applicantId: string,
    @Body('templateName') templateName?: string,
    @Body('language') language?: string,
  ) {
    const cv = await this.cvService.generateCv(applicantId, templateName, language);
    return {
      success: true,
      cv,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all CV versions for applicant' })
  async list(@CurrentUser('id') applicantId: string) {
    const cvs = await this.cvService.getCvs(applicantId);
    return {
      success: true,
      cvs,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific CV version' })
  async getOne(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
  ) {
    const cv = await this.cvService.getCvById(id, applicantId);
    return {
      success: true,
      cv,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update and edit sections of CV' })
  async update(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    const cv = await this.cvService.updateCv(id, applicantId, updateData);
    return {
      success: true,
      cv,
    };
  }

  @Post(':id/improve-section')
  @ApiOperation({ summary: 'AI polishes a CV section' })
  async improve(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
    @Body('sectionName') sectionName: string,
    @Body('content') content: string,
  ) {
    const result = await this.cvService.improveSection(id, applicantId, sectionName, content);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Export and upload PDF version to object storage' })
  async exportPdf(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.cvService.exportPdf(id, applicantId);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download direct PDF file stream' })
  async download(
    @CurrentUser('id') applicantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.cvService.getPdfBuffer(id, applicantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
