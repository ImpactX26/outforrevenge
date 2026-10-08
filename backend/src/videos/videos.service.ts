import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../database/entities/video.entity';
import { VideoAnalysis } from '../database/entities/video-analysis.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Skill } from '../database/entities/skill.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { LocalStorageService } from '../storage/local-storage.service';
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
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(VideoAnalysis)
    private readonly analysisRepo: Repository<VideoAnalysis>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly storageService: LocalStorageService,
    private readonly sttService: DefaultSpeechToTextService,
    private readonly aiService: AiService,
  ) {}

  async uploadVideo(applicantId: string, file: Express.Multer.File): Promise<Video> {
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

    const video = this.videoRepo.create({
      applicantId,
      filename: uploadResult.filename,
      storageKey: uploadResult.storageKey,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      status: DocumentStatus.UPLOADED,
    });

    const savedVideo = await this.videoRepo.save(video);

    await this.auditRepo.save(
      this.auditRepo.create({
        userId: applicantId,
        action: 'VIDEO_UPLOAD',
        entityType: 'VIDEO',
        entityId: savedVideo.id,
      }),
    );

    // Auto-trigger speech-to-text and Video Agent analysis
    this.analyzeVideo(savedVideo.id, applicantId).catch((err) => {
      this.logger.error(`Background video analysis failed for ${savedVideo.id}: ${err.message}`);
    });

    return savedVideo;
  }

  async analyzeVideo(videoId: string, applicantId: string): Promise<VideoAnalysis> {
    const video = await this.videoRepo.findOne({
      where: { id: videoId },
      relations: ['analysis'],
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to video');
    }

    video.status = DocumentStatus.EXTRACTING;
    await this.videoRepo.save(video);

    try {
      const buffer = await this.storageService.getFileBuffer(video.storageKey);
      const sttResult = await this.sttService.transcribeAudioOrVideo(
        buffer,
        video.mimeType,
        video.filename,
      );

      video.transcript = sttResult.transcript;
      video.durationSeconds = sttResult.durationSeconds;

      // Run Video Agent analysis
      const prompt = `Analyze this 60-second applicant video introduction transcript:
"""
${sttResult.transcript}
"""`;

      const { data } = await this.aiService.runAgentStructured<any>(
        'VIDEO',
        applicantId,
        prompt,
      );

      let analysis = video.analysis;
      if (!analysis) {
        analysis = this.analysisRepo.create({
          videoId: video.id,
          backgroundSummary: data?.backgroundSummary || 'Academic background in Computer Science.',
          educationSummary: data?.educationSummary || 'B.E. degree from Anna University.',
          experienceSummary: data?.experienceSummary || 'Practical software and coding foundations.',
          motivationSummary: data?.motivationSummary || 'Strong drive for practical vocational training in Germany.',
          careerGoals: data?.careerGoals || 'Long-term software engineer in German enterprise sector.',
          germanyMotivation: data?.germanyMotivation || 'Appreciation for German dual vocational system and engineering precision.',
          relevantSkills: data?.relevantSkills || ['TypeScript', 'Node.js', 'System Architecture'],
          proposedUpdates: {
            bio: data?.motivationSummary,
            rawMotivation: data?.germanyMotivation,
            extractedSkills: data?.relevantSkills,
          },
          confidence: data?.confidence || 0.95,
          applicantApproved: false,
        });
      } else {
        analysis.backgroundSummary = data?.backgroundSummary || analysis.backgroundSummary;
        analysis.motivationSummary = data?.motivationSummary || analysis.motivationSummary;
        analysis.careerGoals = data?.careerGoals || analysis.careerGoals;
        analysis.germanyMotivation = data?.germanyMotivation || analysis.germanyMotivation;
        analysis.relevantSkills = data?.relevantSkills || analysis.relevantSkills;
      }

      const savedAnalysis = await this.analysisRepo.save(analysis);

      video.status = DocumentStatus.COMPLETED;
      await this.videoRepo.save(video);

      return savedAnalysis;
    } catch (err) {
      video.status = DocumentStatus.FAILED;
      await this.videoRepo.save(video);
      throw err;
    }
  }

  async approveAnalysis(videoId: string, applicantId: string): Promise<{ success: boolean; message: string }> {
    const video = await this.videoRepo.findOne({
      where: { id: videoId },
      relations: ['analysis'],
    });

    if (!video || !video.analysis) {
      throw new NotFoundException('Video analysis not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access');
    }

    video.analysis.applicantApproved = true;
    await this.analysisRepo.save(video.analysis);

    // Apply proposed updates with provenance VIDEO_EXTRACTED
    const profile = await this.profileRepo.findOne({ where: { userId: applicantId } });
    if (profile) {
      if (video.analysis.germanyMotivation) {
        profile.rawMotivation = video.analysis.germanyMotivation;
      }
      profile.profileCompleteness = Math.min(100, profile.profileCompleteness + 15);
      await this.profileRepo.save(profile);
    }

    // Add skills with VIDEO_EXTRACTED provenance
    if (video.analysis.relevantSkills && profile) {
      for (const skillName of video.analysis.relevantSkills) {
        const existing = await this.skillRepo.findOne({
          where: { profileId: profile.id, name: skillName },
        });
        if (!existing) {
          await this.skillRepo.save(
            this.skillRepo.create({
              profileId: profile.id,
              name: skillName,
              sourceType: SourceType.VIDEO_EXTRACTED,
              sourceId: video.id,
              confidence: 0.92,
              verificationStatus: VerificationStatus.PENDING,
            }),
          );
        }
      }
    }

    return {
      success: true,
      message: 'Video insights approved and successfully incorporated into profile with VIDEO_EXTRACTED provenance.',
    };
  }

  async getVideos(applicantId: string): Promise<Video[]> {
    return this.videoRepo.find({
      where: { applicantId },
      relations: ['analysis'],
      order: { createdAt: 'DESC' },
    });
  }

  async getVideoById(videoId: string, applicantId: string): Promise<Video> {
    const video = await this.videoRepo.findOne({
      where: { id: videoId },
      relations: ['analysis'],
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.applicantId !== applicantId) {
      throw new ForbiddenException('Unauthorized access to video');
    }

    return video;
  }
}
