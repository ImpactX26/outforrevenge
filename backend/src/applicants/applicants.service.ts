import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { User } from '../database/entities/user.entity';
import { Education } from '../database/entities/education.entity';
import { Employment } from '../database/entities/employment.entity';
import { Skill } from '../database/entities/skill.entity';
import { Language } from '../database/entities/language.entity';
import { Document } from '../database/entities/document.entity';
import { Video } from '../database/entities/video.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { NextStepRecommendation } from '../database/entities/next-step-recommendation.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SourceType, VerificationStatus } from '../common/enums';

@Injectable()
export class ApplicantsService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Education)
    private readonly educationRepo: Repository<Education>,
    @InjectRepository(Employment)
    private readonly employmentRepo: Repository<Employment>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(QualificationAssessment)
    private readonly assessmentRepo: Repository<QualificationAssessment>,
    @InjectRepository(NextStepRecommendation)
    private readonly recommendationRepo: Repository<NextStepRecommendation>,
  ) {}

  async getProfile(userId: string): Promise<any> {
    let profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'educations', 'employments', 'skills', 'languages'],
    });

    if (!profile) {
      // Create empty profile if not exists
      profile = this.profileRepo.create({
        userId,
        profileCompleteness: 15,
        readinessScore: 10,
      });
      await this.profileRepo.save(profile);
      profile = await this.profileRepo.findOne({
        where: { userId },
        relations: ['user', 'educations', 'employments', 'skills', 'languages'],
      });
    }

    const documents = await this.documentRepo.find({
      where: { applicantId: userId },
      relations: ['extraction'],
    });

    const videos = await this.videoRepo.find({
      where: { applicantId: userId },
      relations: ['analysis'],
    });

    const latestAssessment = await this.assessmentRepo.findOne({
      where: { applicantId: userId },
      order: { evaluatedAt: 'DESC' },
    });

    const latestRecommendation = await this.recommendationRepo.findOne({
      where: { applicantId: userId },
      order: { createdAt: 'DESC' },
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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ApplicantProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
    }

    Object.assign(profile, dto);

    // Recalculate metrics
    const documents = await this.documentRepo.find({ where: { applicantId: userId } });
    const videos = await this.videoRepo.find({ where: { applicantId: userId } });
    const latestAssessment = await this.assessmentRepo.findOne({
      where: { applicantId: userId },
      order: { evaluatedAt: 'DESC' },
    });

    const metrics = this.calculateMetrics(profile, documents, videos, latestAssessment);
    profile.profileCompleteness = metrics.profileCompleteness;
    profile.readinessScore = metrics.readinessScore;

    return this.profileRepo.save(profile);
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

  async addEducation(userId: string, data: Partial<Education>): Promise<Education> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const edu = this.educationRepo.create({
      ...data,
      profileId: profile.id,
      sourceType: SourceType.APPLICANT_PROVIDED,
      verificationStatus: VerificationStatus.PENDING,
    });
    return this.educationRepo.save(edu);
  }

  async addEmployment(userId: string, data: Partial<Employment>): Promise<Employment> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const emp = this.employmentRepo.create({
      ...data,
      profileId: profile.id,
      sourceType: SourceType.APPLICANT_PROVIDED,
      verificationStatus: VerificationStatus.PENDING,
    });
    return this.employmentRepo.save(emp);
  }

  async addSkill(userId: string, data: Partial<Skill>): Promise<Skill> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const skill = this.skillRepo.create({
      ...data,
      profileId: profile.id,
      sourceType: SourceType.APPLICANT_PROVIDED,
      verificationStatus: VerificationStatus.PENDING,
    });
    return this.skillRepo.save(skill);
  }

  async addLanguage(userId: string, data: Partial<Language>): Promise<Language> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const lang = this.languageRepo.create({
      ...data,
      profileId: profile.id,
      sourceType: SourceType.APPLICANT_PROVIDED,
      verificationStatus: VerificationStatus.PENDING,
    });
    return this.languageRepo.save(lang);
  }

  private calculateMetrics(
    profile: ApplicantProfile,
    documents: Document[],
    videos: Video[],
    assessment?: QualificationAssessment,
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
      readiness = Math.round(totalCompleteness * 0.4 + assessment.score * 0.6);
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
