import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE_TOKEN } from '../storage/storage.interface';
import { DefaultSpeechToTextService } from './stt/default-speech-to-text.service';
import { AiService } from '../ai/ai.service';
import {
  DocumentStatus,
  SourceType,
  VerificationStatus,
} from '../common/enums';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  private readonly allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
    private readonly sttService: DefaultSpeechToTextService,
    private readonly aiService: AiService,
  ) {}

  async uploadVideo(applicantId: string, file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported video format: ${file.mimetype}. Allowed formats: MP4, WebM, QuickTime.`,
      );
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new BadRequestException('Video exceeds maximum 100MB size limit');
    }

    const uploadResult = await this.storageService.uploadFile(
      applicantId,
      'videos',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const video = await this.prisma.video.create({
      data: {
        applicantId,
        filename: uploadResult.filename,
        storageKey: uploadResult.storageKey,
        fileSize: BigInt(uploadResult.fileSize),
        mimeType: uploadResult.mimeType,
        status: DocumentStatus.UPLOADED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: applicantId,
        action: 'VIDEO_UPLOAD',
        entityType: 'VIDEO',
        entityId: video.id,
      },
    });

    // Auto-trigger speech-to-text and Video Agent analysis
    this.analyzeVideo(video.id, applicantId).catch((err) => {
      this.logger.error(`Background video analysis failed for ${video.id}: ${err.message}`);
    });

    return {
      ...video,
      fileSize: Number(video.fileSize),
    };
  }

  async analyzeVideo(videoId: string, applicantId: string): Promise<any> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { analysis: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to video');
    }

    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: DocumentStatus.EXTRACTING },
    });

    try {
      const buffer = await this.storageService.getFileBuffer(video.storageKey);
      const sttResult = await this.sttService.transcribeAudioOrVideo(
        buffer,
        video.mimeType,
        video.filename,
      );

      // Run Video Agent analysis on REAL transcript
      const prompt = `Analyze this 60-second applicant video introduction transcript:
"""
${sttResult.transcript}
"""
Extract key summaries and skills present in the transcript. Do NOT invent background, degree, or universities. If a field was not mentioned in the transcript, return null or "Not provided".`;

      const aiResponse = await this.aiService.runAgentStructured<any>(
        'VIDEO',
        applicantId,
        prompt,
      );

      const data = aiResponse?.data || {};

      const savedAnalysis = await this.prisma.videoAnalysis.upsert({
        where: { videoId: video.id },
        create: {
          videoId: video.id,
          backgroundSummary: data?.backgroundSummary || null,
          educationSummary: data?.educationSummary || null,
          experienceSummary: data?.experienceSummary || null,
          motivationSummary: data?.motivationSummary || null,
          careerGoals: data?.careerGoals || null,
          germanyMotivation: data?.germanyMotivation || null,
          relevantSkills: Array.isArray(data?.relevantSkills) ? data.relevantSkills : [],
          proposedUpdates: {
            bio: data?.motivationSummary || null,
            rawMotivation: data?.germanyMotivation || null,
            extractedSkills: Array.isArray(data?.relevantSkills) ? data.relevantSkills : [],
          },
          confidence: typeof data?.confidence === 'number' ? data.confidence : 0.9,
          applicantApproved: false,
        },
        update: {
          backgroundSummary: data?.backgroundSummary || null,
          educationSummary: data?.educationSummary || null,
          experienceSummary: data?.experienceSummary || null,
          motivationSummary: data?.motivationSummary || null,
          careerGoals: data?.careerGoals || null,
          germanyMotivation: data?.germanyMotivation || null,
          relevantSkills: Array.isArray(data?.relevantSkills) ? data.relevantSkills : [],
          proposedUpdates: {
            bio: data?.motivationSummary || null,
            rawMotivation: data?.germanyMotivation || null,
            extractedSkills: Array.isArray(data?.relevantSkills) ? data.relevantSkills : [],
          },
          confidence: typeof data?.confidence === 'number' ? data.confidence : 0.9,
        },
      });

      await this.prisma.video.update({
        where: { id: video.id },
        data: {
          status: DocumentStatus.COMPLETED,
          transcript: sttResult.transcript,
          durationSeconds: sttResult.durationSeconds,
        },
      });

      return savedAnalysis;
    } catch (err: any) {
      await this.prisma.video.update({
        where: { id: video.id },
        data: { status: DocumentStatus.FAILED },
      });
      throw err;
    }
  }

  async approveAnalysis(videoId: string, applicantId: string): Promise<{ success: boolean; message: string }> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { analysis: true },
    });

    if (!video || !video.analysis) {
      throw new NotFoundException('Video analysis not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.videoAnalysis.update({
        where: { id: video.analysis!.id },
        data: { applicantApproved: true },
      });

      // Apply proposed updates with provenance VIDEO_EXTRACTED
      const profile = await tx.applicantProfile.findUnique({ where: { userId: applicantId } });
      if (profile) {
        const updateData: any = {};
        if (video.analysis!.germanyMotivation) {
          updateData.rawMotivation = video.analysis!.germanyMotivation;
        }
        updateData.profileCompleteness = Math.min(100, profile.profileCompleteness + 15);

        await tx.applicantProfile.update({
          where: { userId: applicantId },
          data: updateData,
        });

        // Add skills with VIDEO_EXTRACTED provenance
        if (video.analysis!.relevantSkills && video.analysis!.relevantSkills.length > 0) {
          for (const skillName of video.analysis!.relevantSkills) {
            const existing = await tx.skill.findFirst({
              where: { profileId: profile.id, name: skillName },
            });
            if (!existing) {
              await tx.skill.create({
                data: {
                  profileId: profile.id,
                  name: skillName,
                  sourceType: SourceType.VIDEO_EXTRACTED,
                  sourceId: video.id,
                  confidence: 0.92,
                  verificationStatus: VerificationStatus.PENDING,
                },
              });
            }
          }
        }
      }
    });

    return {
      success: true,
      message: 'Video insights approved and successfully incorporated into profile with VIDEO_EXTRACTED provenance.',
    };
  }

  async getVideos(applicantId: string): Promise<any[]> {
    const videos = await this.prisma.video.findMany({
      where: { applicantId },
      include: { analysis: true },
      orderBy: { createdAt: 'desc' },
    });

    return videos.map((v) => ({
      ...v,
      fileSize: Number(v.fileSize),
    }));
  }

  async getVideoById(videoId: string, applicantId: string): Promise<any> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { analysis: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to video');
    }

    return {
      ...video,
      fileSize: Number(video.fileSize),
    };
  }

  async getVideoBuffer(videoId: string, applicantId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const video = await this.getVideoById(videoId, applicantId);
    const buffer = await this.storageService.getFileBuffer(video.storageKey);
    return {
      buffer,
      mimeType: video.mimeType || 'video/mp4',
      filename: video.filename,
    };
  }
}
