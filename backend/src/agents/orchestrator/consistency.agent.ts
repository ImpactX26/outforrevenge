import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from '../../database/entities/applicant-profile.entity';
import { Document } from '../../database/entities/document.entity';
import { Video } from '../../database/entities/video.entity';
import { ConsultantReview } from '../../database/entities/consultant-review.entity';
import { ReviewStatus } from '../../common/enums';
import { AiService } from '../../ai/ai.service';

export interface ConsistencyCheckResult {
  hasInconsistencies: boolean;
  findings: Array<{
    field: string;
    reportedValue: string;
    extractedValue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    requiresConsultant: boolean;
  }>;
  summary: string;
}

@Injectable()
export class ConsistencyAgent {
  private readonly logger = new Logger(ConsistencyAgent.name);

  constructor(
    @InjectRepository(ConsultantReview)
    private readonly reviewRepo: Repository<ConsultantReview>,
    private readonly aiService: AiService,
  ) {}

  async checkConsistency(
    profile: ApplicantProfile,
    documents: Document[],
    videos: Video[],
    parentExecutionId?: string,
  ): Promise<ConsistencyCheckResult> {
    const findings: ConsistencyCheckResult['findings'] = [];

    // 1. Deterministic checks
    const claimedGerman = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
    const langDocs = documents.filter((d) => d.documentType === 'LANGUAGE_CERTIFICATE' && d.extraction);

    if (claimedGerman && langDocs.length > 0) {
      const docLevel = langDocs[0].extraction?.extractedJson?.level;
      if (docLevel && claimedGerman.proficiencyLevel && docLevel.toUpperCase() !== claimedGerman.proficiencyLevel.toUpperCase()) {
        findings.push({
          field: 'German Language Level',
          reportedValue: claimedGerman.proficiencyLevel,
          extractedValue: docLevel,
          severity: 'MEDIUM',
          message: `Potential inconsistency detected. Self-reported German level (${claimedGerman.proficiencyLevel}) differs from certificate level (${docLevel}). Please verify.`,
          requiresConsultant: false,
        });
      }
    }

    // 2. AI Semantic Comparison
    const prompt = `Compare applicant self-reported data against verified documents:
Applicant: ${profile.user?.firstName} ${profile.user?.lastName}
Educations: ${JSON.stringify(profile.educations?.map((e) => ({ degree: e.degree, institution: e.institution })))}
Claimed Languages: ${JSON.stringify(profile.languages?.map((l) => ({ lang: l.language, level: l.proficiencyLevel })))}
Extracted Documents: ${JSON.stringify(documents.map((d) => ({ type: d.documentType, data: d.extraction?.extractedJson })))}
Video Transcript: ${videos[0]?.transcript || 'None'}

Are there conflicting statements? Ground your answer strictly in the text. Return structured JSON with: hasInconsistencies, findings: [{field, reportedValue, extractedValue, severity, message, requiresConsultant}], summary.`;

    try {
      const { data } = await this.aiService.runAgentStructured<any>(
        'CONSISTENCY',
        profile.userId,
        prompt,
        undefined,
        parentExecutionId,
        'CONSISTENCY_AGENT',
      );

      if (data?.findings && Array.isArray(data.findings)) {
        for (const item of data.findings) {
          if (!findings.some((f) => f.field === item.field)) {
            findings.push(item);
          }
        }
      }
    } catch (e) {
      this.logger.warn(`AI consistency comparison fallback: ${e.message}`);
    }

    const hasInconsistencies = findings.length > 0;
    const summary = hasInconsistencies
      ? `${findings.length} item(s) flagged for applicant clarification or verification.`
      : 'All extracted document credentials align consistently with applicant self-reported background.';

    // Escalate high severity to ConsultantReview
    const criticalFindings = findings.filter((f) => f.requiresConsultant || f.severity === 'HIGH');
    if (criticalFindings.length > 0) {
      const existingReview = await this.reviewRepo.findOne({
        where: { applicantId: profile.userId, status: ReviewStatus.PENDING },
      });
      if (!existingReview) {
        await this.reviewRepo.save(
          this.reviewRepo.create({
            applicantId: profile.userId,
            issue: 'Profile & Document Discrepancy',
            reason: criticalFindings[0].message,
            evidence: { findings: criticalFindings },
            agentType: 'CONSISTENCY_AGENT',
            confidence: 0.88,
            recommendedAction: 'Verify original documents with applicant.',
            status: ReviewStatus.PENDING,
          }),
        );
      }
    }

    return {
      hasInconsistencies,
      findings,
      summary,
    };
  }
}
