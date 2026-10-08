import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SourceType, VerificationStatus } from '../common/enums';

@Injectable()
export class ApplicantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<any> {
    let profile = await this.prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    if (!profile) {
      // Create empty profile if not exists
      profile = await this.prisma.applicantProfile.create({
        data: {
          userId,
          profileCompleteness: 15,
          readinessScore: 10,
        },
        include: {
          user: true,
          educations: true,
          employments: true,
          skills: true,
          languages: true,
        },
      });
    }

    const rawDocuments = await this.prisma.document.findMany({
      where: { applicantId: userId },
      include: { extraction: true },
    });
    const documents = rawDocuments.map((d) => ({
      ...d,
      fileSize: Number(d.fileSize),
    }));

    const rawVideos = await this.prisma.video.findMany({
      where: { applicantId: userId },
      include: { analysis: true },
    });
    const videos = rawVideos.map((v) => ({
      ...v,
      fileSize: Number(v.fileSize),
    }));

    const latestAssessment = await this.prisma.qualificationAssessment.findFirst({
      where: { applicantId: userId },
      orderBy: { evaluatedAt: 'desc' },
    });

    const latestRecommendation = await this.prisma.nextStepRecommendation.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const metrics = this.calculateMetrics(profile, documents, videos, latestAssessment);

    return {
      profile,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        role: profile.user.role,
        phone: profile.user.phone,
      },
      documents,
      videos,
      latestAssessment,
      latestRecommendation,
      metrics,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const existing = await this.prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    const rawDocuments = await this.prisma.document.findMany({ where: { applicantId: userId } });
    const documents = rawDocuments.map((d) => ({ ...d, fileSize: Number(d.fileSize) }));

    const rawVideos = await this.prisma.video.findMany({ where: { applicantId: userId } });
    const videos = rawVideos.map((v) => ({ ...v, fileSize: Number(v.fileSize) }));

    const latestAssessment = await this.prisma.qualificationAssessment.findFirst({
      where: { applicantId: userId },
      orderBy: { evaluatedAt: 'desc' },
    });

    const tempMerged = { ...(existing || {}), ...dto } as any;
    const metrics = this.calculateMetrics(tempMerged, documents, videos, latestAssessment);

    const updateData: any = {
      ...dto,
      profileCompleteness: metrics.profileCompleteness,
      readinessScore: metrics.readinessScore,
    };

    const updatedProfile = await this.prisma.applicantProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
      include: {
        user: true,
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    return updatedProfile;
  }

  async getProgress(userId: string): Promise<any> {
    const profileData = await this.getProfile(userId);
    return {
      success: true,
      currentGoal: profileData.profile.currentGoal,
      completeness: profileData.metrics.profileCompleteness,
      readinessScore: profileData.metrics.readinessScore,
      categoryScores: profileData.metrics.categoryScores,
      latestAssessment: profileData.latestAssessment,
      latestRecommendation: profileData.latestRecommendation,
    };
  }

  async addEducation(userId: string, data: any): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.education.create({
      data: {
        ...data,
        profileId: profile.id,
        sourceType: data.sourceType || SourceType.APPLICANT_PROVIDED,
        verificationStatus: data.verificationStatus || VerificationStatus.PENDING,
      },
    });
  }

  async addEmployment(userId: string, data: any): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.employment.create({
      data: {
        ...data,
        profileId: profile.id,
        sourceType: data.sourceType || SourceType.APPLICANT_PROVIDED,
        verificationStatus: data.verificationStatus || VerificationStatus.PENDING,
      },
    });
  }

  async addSkill(userId: string, data: any): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.skill.create({
      data: {
        ...data,
        profileId: profile.id,
        sourceType: data.sourceType || SourceType.APPLICANT_PROVIDED,
        verificationStatus: data.verificationStatus || VerificationStatus.PENDING,
      },
    });
  }

  async addLanguage(userId: string, data: any): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.language.create({
      data: {
        ...data,
        profileId: profile.id,
        sourceType: data.sourceType || SourceType.APPLICANT_PROVIDED,
        verificationStatus: data.verificationStatus || VerificationStatus.PENDING,
      },
    });
  }

  private calculateMetrics(
    profile: any,
    documents: any[],
    videos: any[],
    assessment?: any,
  ) {
    let score = 0;

    // 1. Personal & Contact (15%)
    let personalScore = 0;
    if (profile.user?.firstName && profile.user?.lastName) personalScore += 5;
    if (profile.phone || profile.user?.phone) personalScore += 5;
    if (profile.location) personalScore += 5;

    // 2. Goal & Motivation (15%)
    let motivationScore = 0;
    if (profile.currentGoal) motivationScore += 5;
    if (profile.rawMotivation || profile.bio) motivationScore += 5;
    if (profile.availability) motivationScore += 5;

    // 3. Education (20%)
    let eduScore = profile.educations && profile.educations.length > 0 ? 20 : 0;

    // 4. Skills & Languages (20%)
    let skillsScore = profile.skills && profile.skills.length >= 2 ? 10 : (profile.skills?.length ? 5 : 0);
    let langScore = profile.languages && profile.languages.length > 0 ? 10 : 0;

    // 5. Supporting Documents (15%)
    let docScore = documents.length >= 2 ? 15 : (documents.length === 1 ? 8 : 0);

    // 6. Media / Video (15%)
    let mediaScore = videos.length > 0 ? 15 : 0;

    const totalCompleteness = Math.min(
      100,
      personalScore + motivationScore + eduScore + skillsScore + langScore + docScore + mediaScore,
    );

    // Readiness score calculation: weighted combination of completeness, document verification, and assessment
    let readiness = Math.round(totalCompleteness * 0.6);
    if (assessment) {
      readiness = Math.round(totalCompleteness * 0.4 + (assessment.score || 0) * 0.6);
    }

    return {
      profileCompleteness: totalCompleteness,
      readinessScore: readiness,
      categoryScores: {
        personal: Math.round((personalScore / 15) * 100),
        motivation: Math.round((motivationScore / 15) * 100),
        education: Math.round((eduScore / 20) * 100),
        skills: Math.round((skillsScore / 10) * 100),
        languages: Math.round((langScore / 10) * 100),
        documents: Math.round((docScore / 15) * 100),
        media: Math.round((mediaScore / 15) * 100),
      },
    };
  }
}
