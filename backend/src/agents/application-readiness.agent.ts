import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export interface ApplicationReadinessResult {
  readinessScore: number;
  ready: boolean;
  missingItems: string[];
  warnings: string[];
  matchedRequirements: string[];
  unsupportedClaims: string[];
  recommendations: string[];
  confidence: number;
}

@Injectable()
export class ApplicationReadinessAgent {
  private readonly logger = new Logger(ApplicationReadinessAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async assessReadiness(
    applicantId: string,
    opportunityId: string,
    parentExecutionId?: string,
  ): Promise<ApplicationReadinessResult> {
    this.logger.log(`Assessing application readiness for applicant ${applicantId} and opportunity ${opportunityId}`);

    const [profile, documents, assessment, opportunity, cv, coverLetter] = await Promise.all([
      this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: { educations: true, employments: true, skills: true, languages: true },
      }),
      this.prisma.document.findMany({
        where: { applicantId },
        include: { extraction: true },
      }),
      this.prisma.qualificationAssessment.findFirst({
        where: { applicantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.opportunity.findUnique({
        where: { id: opportunityId },
      }),
      this.prisma.cV.findFirst({
        where: { applicantId },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.coverLetter.findFirst({
        where: { applicantId, opportunityId },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    const missingItems: string[] = [];
    const warnings: string[] = [];

    const goal = profile?.currentGoal || 'EMPLOYMENT';
    const langDocs = documents.filter(d => d.documentType === 'LANGUAGE_CERTIFICATE' && d.status === 'COMPLETED');
    const degreeDocs = documents.filter(d => (d.documentType === 'DEGREE' || d.documentType === 'TRANSCRIPT') && d.status === 'COMPLETED');

    if (langDocs.length === 0) {
      missingItems.push('Verified German/English language certificate');
    }
    if (degreeDocs.length === 0) {
      missingItems.push('Verified educational certificate or transcript');
    }
    if (!cv) {
      missingItems.push('German-standard (Europass/DIN) CV');
    }

    if (goal === 'STUDY' && !assessment) {
      warnings.push('APS / University qualification evaluation is still pending');
    }

    const prompt = `Applicant Goal: ${goal}
Target Opportunity:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Type: ${opportunity.type}
Requirements: ${JSON.stringify(opportunity.requirements)}
Description: ${opportunity.description}

Applicant Profile:
Education: ${JSON.stringify(profile?.educations || [])}
Employment: ${JSON.stringify(profile?.employments || [])}
Skills: ${JSON.stringify(profile?.skills?.map(s => s.name) || [])}
Languages: ${JSON.stringify(profile?.languages || [])}
Verified Documents: ${documents.map(d => `${d.documentType} (${d.status})`).join(', ')}
Qualification Assessment Status: ${assessment?.status || 'Pending'} (Score: ${assessment?.score ?? 'N/A'})
CV Available: ${!!cv}
Cover Letter Available: ${!!coverLetter}

Analyze application readiness strictly according to German pathway standards. Never invent applicant information.`;

    try {
      const res = await this.aiService.runAgentStructured<ApplicationReadinessResult>(
        'APPLICATION_READINESS',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'APPLICATION_FLOW',
      );

      const aiData = res.data;
      const finalMissing = Array.from(new Set([...missingItems, ...(aiData.missingItems || [])]));
      const finalWarnings = Array.from(new Set([...warnings, ...(aiData.warnings || [])]));

      let score = aiData.readinessScore || 70;
      if (finalMissing.length > 0) {
        score = Math.min(score, Math.max(20, 100 - (finalMissing.length * 20)));
      }

      return {
        readinessScore: Math.round(score),
        ready: score >= 75 && finalMissing.length === 0,
        missingItems: finalMissing,
        warnings: finalWarnings,
        matchedRequirements: aiData.matchedRequirements || ['Academic background aligned with German criteria'],
        unsupportedClaims: aiData.unsupportedClaims || [],
        recommendations: aiData.recommendations || ['Complete missing document verifications prior to submission.'],
        confidence: res.execution?.confidence || 0.88,
      };
    } catch (err) {
      const score = Math.max(30, 100 - (missingItems.length * 25));
      return {
        readinessScore: score,
        ready: score >= 75 && missingItems.length === 0,
        missingItems,
        warnings,
        matchedRequirements: ['Basic profile submitted'],
        unsupportedClaims: [],
        recommendations: ['Upload verified language certificates and official academic transcripts.'],
        confidence: 0.8,
      };
    }
  }
}
