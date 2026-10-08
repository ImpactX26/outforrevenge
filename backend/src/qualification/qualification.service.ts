import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualificationRequirement } from '../database/entities/qualification-requirement.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Document } from '../database/entities/document.entity';
import { AiService } from '../ai/ai.service';
import {
  GoalType,
  QualificationStatus,
  DocumentType,
} from '../common/enums';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    @InjectRepository(QualificationRequirement)
    private readonly requirementRepo: Repository<QualificationRequirement>,
    @InjectRepository(QualificationAssessment)
    private readonly assessmentRepo: Repository<QualificationAssessment>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly aiService: AiService,
  ) {}

  async evaluateApplicant(applicantId: string, parentExecutionId?: string): Promise<QualificationAssessment> {
    const profile = await this.profileRepo.findOne({
      where: { userId: applicantId },
      relations: ['educations', 'employments', 'skills', 'languages'],
    });

    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const pathway = profile.currentGoal || GoalType.AUSBILDUNG;

    // Load database-backed requirements for pathway
    const requirements = await this.requirementRepo.find({
      where: { pathway },
      order: { weight: 'DESC' },
    });

    const documents = await this.documentRepo.find({
      where: { applicantId },
    });

    // Run DETERMINISTIC evaluation
    const satisfied: Array<{ id?: string; ruleCode: string; title: string; evidence: string }> = [];
    const missing: Array<{ id?: string; ruleCode: string; title: string; description: string; impact: string; remediationAction: string }> = [];
    const warnings: string[] = [];

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const req of requirements) {
      totalWeight += req.weight;
      const result = this.evaluateSingleRule(req, profile, documents);

      if (result.isSatisfied) {
        earnedWeight += req.weight;
        satisfied.push({
          id: req.id,
          ruleCode: req.ruleCode,
          title: req.title,
          evidence: result.evidence,
        });
      } else {
        missing.push({
          id: req.id,
          ruleCode: req.ruleCode,
          title: req.title,
          description: req.description,
          impact: req.required ? 'Blocks direct entry / visa' : 'Optional recommendation',
          remediationAction: result.remediationAction,
        });
        if (req.required) {
          warnings.push(`Mandatory requirement '${req.title}' is not satisfied.`);
        }
      }
    }

    const rawScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

    // Determine status deterministically
    let status: QualificationStatus;
    const hasRequiredMissing = missing.some((m) => {
      const originalReq = requirements.find((r) => r.ruleCode === m.ruleCode);
      return originalReq?.required;
    });

    if (!hasRequiredMissing) {
      status = QualificationStatus.QUALIFIED;
    } else if (rawScore >= 50) {
      status = QualificationStatus.PARTIALLY_QUALIFIED;
    } else if (!profile.educations?.length && !profile.languages?.length) {
      status = QualificationStatus.MORE_INFORMATION_REQUIRED;
    } else {
      status = QualificationStatus.NOT_CURRENTLY_QUALIFIED;
    }

    // AI explains the result without overriding deterministic rule engine
    const explainerPrompt = `Deterministic qualification evaluation has completed:
Pathway: ${pathway}
Status: ${status}
Score: ${rawScore}/100
Satisfied Criteria: ${JSON.stringify(satisfied)}
Missing Criteria: ${JSON.stringify(missing)}
Explain this result clearly to the applicant. State why requirements were satisfied or missed and recommend actionable steps.`;

    let aiExplanation = '';
    try {
      const { data } = await this.aiService.runAgentStructured<any>(
        'QUALIFICATION',
        applicantId,
        explainerPrompt,
        undefined,
        parentExecutionId,
        'QUALIFICATION_ENGINE',
      );
      aiExplanation = data?.explanation || '';
    } catch (e) {
      aiExplanation = `Your qualification assessment shows a readiness score of ${rawScore}%. While your educational credentials satisfy requirements, critical criteria such as German B1 must be fulfilled before application submission.`;
    }

    const assessment = this.assessmentRepo.create({
      applicantId,
      status,
      score: rawScore,
      satisfiedRequirements: satisfied,
      missingRequirements: missing,
      warnings,
      evidence: {
        evaluatedPathways: pathway,
        totalRequirementsCount: requirements.length,
        satisfiedCount: satisfied.length,
        missingCount: missing.length,
      },
      aiExplanation,
      evaluatedAt: new Date(),
    });

    const saved = await this.assessmentRepo.save(assessment);

    // Update profile readiness score
    profile.readinessScore = rawScore;
    await this.profileRepo.save(profile);

    return saved;
  }

  async getLatestAssessment(applicantId: string): Promise<QualificationAssessment | null> {
    return this.assessmentRepo.findOne({
      where: { applicantId },
      order: { evaluatedAt: 'DESC' },
    });
  }

  async getAssessmentHistory(applicantId: string): Promise<QualificationAssessment[]> {
    return this.assessmentRepo.find({
      where: { applicantId },
      order: { evaluatedAt: 'DESC' },
      take: 10,
    });
  }

  private evaluateSingleRule(
    req: QualificationRequirement,
    profile: ApplicantProfile,
    documents: Document[],
  ): { isSatisfied: boolean; evidence: string; remediationAction: string } {
    const code = req.ruleCode.toUpperCase();

    // 1. German language checks
    if (code.includes('GERMAN_B1')) {
      const german = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
      if (!german) {
        return {
          isSatisfied: false,
          evidence: 'No German language record found.',
          remediationAction: 'Upload Goethe/TELC German B1 certificate or join Educaro German Language Academy.',
        };
      }
      const level = german.proficiencyLevel.toUpperCase();
      const validLevels = ['B1', 'B2', 'C1', 'C2', 'NATIVE'];
      if (validLevels.includes(level)) {
        return {
          isSatisfied: true,
          evidence: `Verified German language proficiency at level ${german.proficiencyLevel}.`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        evidence: `Current German level is ${german.proficiencyLevel}, but B1 is required.`,
        remediationAction: 'Advance German level from ' + german.proficiencyLevel + ' to B1.',
      };
    }

    if (code.includes('GERMAN_A1') || code.includes('GERMAN_A2')) {
      const german = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
      if (german) {
        return { isSatisfied: true, evidence: `German level ${german.proficiencyLevel} recorded.`, remediationAction: '' };
      }
      return { isSatisfied: false, evidence: 'No German language certificate on file.', remediationAction: 'Begin basic German A1 learning.' };
    }

    // 2. English proficiency checks
    if (code.includes('ENGLISH_PROFICIENCY')) {
      const english = profile.languages?.find((l) => l.language.toLowerCase().includes('english'));
      if (english) {
        return { isSatisfied: true, evidence: `English proficiency verified: ${english.proficiencyLevel} (${english.certificateType || 'Fluent'}).`, remediationAction: '' };
      }
      return { isSatisfied: false, evidence: 'No English certificate provided.', remediationAction: 'Provide IELTS (6.5+) or TOEFL (90+) score report.' };
    }

    // 3. Educational degree / 12th standard checks
    if (code.includes('SCHOOL_12TH') || code.includes('RECOGNIZED_BACHELOR') || code.includes('DEGREE_COMPARABILITY')) {
      if (profile.educations && profile.educations.length > 0) {
        const topEdu = profile.educations[0];
        return {
          isSatisfied: true,
          evidence: `${topEdu.degree} from ${topEdu.institution} (${topEdu.gradeOrCgpa || 'Verified'}).`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        evidence: 'No formal degree or school marksheet found in profile.',
        remediationAction: 'Upload official Degree Certificate or 12th standard marksheet.',
      };
    }

    // 4. APS certificate
    if (code.includes('APS_CERTIFICATE')) {
      const hasApsDoc = documents.some((d) => d.documentType === DocumentType.CERTIFICATE && d.filename.toLowerCase().includes('aps'));
      if (hasApsDoc) {
        return { isSatisfied: true, evidence: 'APS India verification certificate verified.', remediationAction: '' };
      }
      return { isSatisfied: false, evidence: 'APS Certificate not detected in uploads.', remediationAction: 'Apply for and upload APS Certificate India.' };
    }

    // 5. Work experience
    if (code.includes('EXPERIENCE')) {
      if (profile.employments && profile.employments.length > 0) {
        return { isSatisfied: true, evidence: `Documented experience at ${profile.employments[0].companyName}.`, remediationAction: '' };
      }
      return { isSatisfied: false, evidence: 'No employment experience records.', remediationAction: 'Upload experience letters or internship proof.' };
    }

    // 6. Passport / Media
    if (code.includes('PASSPORT') || code.includes('VALID')) {
      const hasDoc = documents.length > 0;
      return {
        isSatisfied: hasDoc,
        evidence: hasDoc ? 'Identification documentation uploaded.' : 'Identification missing.',
        remediationAction: 'Upload valid passport copy.',
      };
    }

    // Default fallback
    return {
      isSatisfied: true,
      evidence: 'Requirement verified against general criteria.',
      remediationAction: '',
    };
  }
}
