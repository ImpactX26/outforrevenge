import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getEducaroServices(): Promise<any[]> {
    return this.prisma.educaroService.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async getLatestRecommendation(applicantId: string): Promise<any | null> {
    const rec = await this.prisma.nextStepRecommendation.findFirst({
      where: { applicantId, status: RecommendationStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });

    if (!rec) {
      return this.refreshRecommendation(applicantId);
    }

    return rec;
  }

  async refreshRecommendation(applicantId: string, parentExecutionId?: string): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({ where: { userId: applicantId } });
    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const latestAssessment = await this.prisma.qualificationAssessment.findFirst({
      where: { applicantId },
      orderBy: { evaluatedAt: 'desc' },
    });

    const openReview = await this.prisma.consultantReview.findFirst({
      where: { applicantId, status: ReviewStatus.PENDING },
    });

    const rules = await this.prisma.routingRule.findMany({
      orderBy: { priority: 'desc' },
      include: { targetService: true },
    });

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
      let matchedRule: any = null;

      const missingReqs = Array.isArray(latestAssessment?.missingRequirements)
        ? (latestAssessment.missingRequirements as any[])
        : [];

      for (const rule of rules) {
        if (rule.conditionType === 'MISSING_LANGUAGE') {
          const hasMissingLang = missingReqs.some((m) =>
            m.ruleCode && m.ruleCode.includes('GERMAN'),
          );
          if (hasMissingLang) {
            matchedRule = rule;
            break;
          }
        } else if (rule.conditionType === 'MISSING_DOCUMENTS') {
          const hasMissingDocs = missingReqs.some((m) =>
            m.ruleCode && (m.ruleCode.includes('APS') || m.ruleCode.includes('DEGREE')),
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
        const defaultService = await this.prisma.educaroService.findFirst({
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
      const aiResponse = await this.aiService.runAgentStructured<any>(
        'ROUTING',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'ROUTING_AGENT',
      );
      if (aiResponse?.data?.reason) {
        reason = aiResponse.data.reason;
      }
    } catch (e: any) {
      // keep deterministic base reason
    }

    // Atomic transaction for superseding previous recommendations, saving new, and notifying
    const saved = await this.prisma.$transaction(async (tx) => {
      await tx.nextStepRecommendation.updateMany({
        where: { applicantId, status: RecommendationStatus.ACTIVE },
        data: { status: RecommendationStatus.SUPERSEDED },
      });

      const recommendation = await tx.nextStepRecommendation.create({
        data: {
          applicantId,
          type: chosenType,
          targetId: targetId || undefined,
          title,
          reason,
          supportingEvidence: evidence,
          confidence: 0.96,
          status: RecommendationStatus.ACTIVE,
        },
      });

      // Notify applicant
      await tx.notification.create({
        data: {
          userId: applicantId,
          title: 'New Recommended Step',
          message: `${title}: ${reason.slice(0, 100)}...`,
          type: 'ACTION_REQUIRED',
        },
      });

      return recommendation;
    });

    return saved;
  }

  async acceptRecommendation(id: string, applicantId: string): Promise<any> {
    const rec = await this.prisma.nextStepRecommendation.findFirst({ where: { id, applicantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    return this.prisma.nextStepRecommendation.update({
      where: { id },
      data: { status: RecommendationStatus.ACCEPTED },
    });
  }

  async dismissRecommendation(id: string, applicantId: string): Promise<any> {
    const rec = await this.prisma.nextStepRecommendation.findFirst({ where: { id, applicantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    return this.prisma.nextStepRecommendation.update({
      where: { id },
      data: { status: RecommendationStatus.DISMISSED },
    });
  }
}
