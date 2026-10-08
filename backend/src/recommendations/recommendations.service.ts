import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NextStepRecommendation } from '../database/entities/next-step-recommendation.entity';
import { EducaroService } from '../database/entities/educaro-service.entity';
import { RoutingRule } from '../database/entities/routing-rule.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { ConsultantReview } from '../database/entities/consultant-review.entity';
import { Notification } from '../database/entities/notification.entity';
import {
  RecommendationType,
  RecommendationStatus,
  ReviewStatus,
} from '../common/enums';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectRepository(NextStepRecommendation)
    private readonly recRepo: Repository<NextStepRecommendation>,
    @InjectRepository(EducaroService)
    private readonly serviceRepo: Repository<EducaroService>,
    @InjectRepository(RoutingRule)
    private readonly ruleRepo: Repository<RoutingRule>,
    @InjectRepository(QualificationAssessment)
    private readonly assessmentRepo: Repository<QualificationAssessment>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(ConsultantReview)
    private readonly reviewRepo: Repository<ConsultantReview>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly aiService: AiService,
  ) {}

  async getEducaroServices(): Promise<EducaroService[]> {
    return this.serviceRepo.find({ order: { createdAt: 'ASC' } });
  }

  async getLatestRecommendation(applicantId: string): Promise<NextStepRecommendation | null> {
    const rec = await this.recRepo.findOne({
      where: { applicantId, status: RecommendationStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!rec) {
      return this.refreshRecommendation(applicantId);
    }

    return rec;
  }

  async refreshRecommendation(applicantId: string, parentExecutionId?: string): Promise<NextStepRecommendation> {
    const profile = await this.profileRepo.findOne({ where: { userId: applicantId } });
    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const latestAssessment = await this.assessmentRepo.findOne({
      where: { applicantId },
      order: { evaluatedAt: 'DESC' },
    });

    const openReview = await this.reviewRepo.findOne({
      where: { applicantId, status: ReviewStatus.PENDING },
    });

    const rules = await this.ruleRepo.find({
      order: { priority: 'DESC' },
      relations: ['targetService'],
    });

    // Supersede existing ACTIVE recommendations
    await this.recRepo.update(
      { applicantId, status: RecommendationStatus.ACTIVE },
      { status: RecommendationStatus.SUPERSEDED },
    );

    let chosenType = RecommendationType.EDUCARO_SERVICE;
    let targetId: string | null = null;
    let title = 'Educaro Pathway Guidance';
    let reason = 'Review your profile and explore Germany preparation services.';
    let evidence: Record<string, any> = {};

    // 1. Check for open review
    if (openReview) {
      chosenType = RecommendationType.CONSULTANT_REFERRAL;
      targetId = openReview.id;
      title = 'Educaro Consultant Review in Progress';
      reason = 'Your dossier is currently assigned to an Educaro advisor for personal qualification and credential verification.';
      evidence = { reviewIssue: openReview.issue };
    } else {
      // Evaluate database-backed routing rules
      let matchedRule: RoutingRule | null = null;

      for (const rule of rules) {
        if (rule.conditionType === 'MISSING_LANGUAGE') {
          const hasMissingLang = latestAssessment?.missingRequirements?.some((m) =>
            m.ruleCode.includes('GERMAN'),
          );
          if (hasMissingLang) {
            matchedRule = rule;
            break;
          }
        } else if (rule.conditionType === 'MISSING_DOCUMENTS') {
          const hasMissingDocs = latestAssessment?.missingRequirements?.some((m) =>
            m.ruleCode.includes('APS') || m.ruleCode.includes('DEGREE'),
          );
          if (hasMissingDocs) {
            matchedRule = rule;
            break;
          }
        } else if (rule.conditionType === 'QUALIFIED_READY') {
          if (latestAssessment?.score && latestAssessment.score >= 80) {
            matchedRule = rule;
            break;
          }
        }
      }

      if (matchedRule && matchedRule.targetService) {
        chosenType = matchedRule.targetType;
        targetId = matchedRule.targetService.id;
        title = matchedRule.targetService.title;
        reason = matchedRule.reasonTemplate;
        evidence = { ruleName: matchedRule.name, priority: matchedRule.priority };
      } else {
        // Fallback to primary Educaro Language or counseling service
        const defaultService = await this.serviceRepo.findOne({
          where: { category: 'LANGUAGE_PREPARATION' },
        });
        if (defaultService) {
          chosenType = RecommendationType.EDUCARO_SERVICE;
          targetId = defaultService.id;
          title = defaultService.title;
          reason = 'Enrolling in the Educaro Language Academy guarantees structured progress toward required German language certificates.';
        }
      }
    }

    // Call Routing Agent via AiService to polish plain-language explanation
    const prompt = `Applicant: ${applicantId}
Chosen Recommendation Type: ${chosenType}
Target Title: ${title}
Base Reason: ${reason}
Readiness Score: ${profile.readinessScore}%
Current Goal: ${profile.currentGoal}
Explain clearly to the applicant what this step accomplishes in the Educaro ecosystem and why it accelerates their journey to Germany.`;

    try {
      const { data } = await this.aiService.runAgentStructured<any>(
        'ROUTING',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'ROUTING_AGENT',
      );
      if (data?.reason) {
        reason = data.reason;
      }
    } catch (e) {
      // keep deterministic base reason
    }

    const recommendation = this.recRepo.create({
      applicantId,
      type: chosenType,
      targetId: targetId || undefined,
      title,
      reason,
      supportingEvidence: evidence,
      confidence: 0.96,
      status: RecommendationStatus.ACTIVE,
    });

    const saved = await this.recRepo.save(recommendation);

    // Notify applicant
    await this.notifRepo.save(
      this.notifRepo.create({
        userId: applicantId,
        title: 'New Recommended Step',
        message: `${title}: ${reason.slice(0, 100)}...`,
        type: 'ACTION_REQUIRED',
      }),
    );

    return saved;
  }

  async acceptRecommendation(id: string, applicantId: string): Promise<NextStepRecommendation> {
    const rec = await this.recRepo.findOne({ where: { id, applicantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    rec.status = RecommendationStatus.ACCEPTED;
    return this.recRepo.save(rec);
  }

  async dismissRecommendation(id: string, applicantId: string): Promise<NextStepRecommendation> {
    const rec = await this.recRepo.findOne({ where: { id, applicantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    rec.status = RecommendationStatus.DISMISSED;
    return this.recRepo.save(rec);
  }
}
