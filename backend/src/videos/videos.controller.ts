import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Videos')
@Controller('api/videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload 60-second applicant introduction video' })
  async upload(
    @CurrentUser('id') applicantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const video = await this.videosService.uploadVideo(applicantId, file);
    return {
      success: true,
      video,
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload 60-second applicant introduction video (alias)' })
  async uploadAlias(
    @CurrentUser('id') applicantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const video = await this.videosService.uploadVideo(applicantId, file);
    return {
      success: true,
      video,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all introduction videos submitted by applicant' })
  async list(@CurrentUser('id') applicantId: string) {
    const videos = await this.videosService.getVideos(applicantId);
    return {
      success: true,
      videos,
    };
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream introduction video binary' })
  async stream(
    @CurrentUser('id') applicantId: string,
    @Param('id') videoId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.videosService.getVideoBuffer(videoId, applicantId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single video with transcript and analysis' })
  async getOne(
    @CurrentUser('id') applicantId: string,
    @Param('id') videoId: string,
  ) {
    const video = await this.videosService.getVideoById(videoId, applicantId);
    return {
      success: true,
      video,
    };
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Trigger speech-to-text and AI analysis' })
  async analyze(
    @CurrentUser('id') applicantId: string,
    @Param('id') videoId: string,
  ) {
    const analysis = await this.videosService.analyzeVideo(videoId, applicantId);
    return {
      success: true,
      analysis,
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Applicant approves video insights for profile integration' })
  async approve(
    @CurrentUser('id') applicantId: string,
    @Param('id') videoId: string,
  ) {
    return this.videosService.approveAnalysis(videoId, applicantId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry speech-to-text and AI analysis for failed video' })
  async retry(
    @CurrentUser('id') applicantId: string,
    @Param('id') videoId: string,
  ) {
    const analysis = await this.videosService.analyzeVideo(videoId, applicantId);
    return {
      success: true,
      analysis,
    };
  }
}
