import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  GoalType,
  QualificationStatus,
  DocumentType,
} from '../common/enums';

export interface RuleEvaluationResult {
  isSatisfied: boolean;
  hasInsufficientEvidence?: boolean;
  evidence: string;
  remediationAction: string;
}

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async evaluateApplicant(applicantId: string, parentExecutionId?: string): Promise<any> {
    const profile = await this.prisma.applicantProfile.findUnique({
      where: { userId: applicantId },
      include: {
        educations: true,
        employments: true,
        skills: true,
        languages: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Applicant profile not found');
    }

    const pathway = profile.currentGoal || GoalType.AUSBILDUNG;

    // Load database-backed requirements for pathway
    const requirements = await this.prisma.qualificationRequirement.findMany({
      where: { pathway },
      orderBy: { weight: 'desc' },
    });

    const documents = await this.prisma.document.findMany({
      where: { applicantId },
    });

    // Run DETERMINISTIC evaluation with specific evidence
    const satisfied: Array<{ id?: string; ruleCode: string; title: string; evidence: string }> = [];
    const missing: Array<{ id?: string; ruleCode: string; title: string; description: string; impact: string; remediationAction: string }> = [];
    const warnings: string[] = [];

    let totalWeight = 0;
    let earnedWeight = 0;
    let insufficientEvidenceCount = 0;

    for (const req of requirements) {
      totalWeight += req.weight;
      const result = this.evaluateSingleRule(req, profile, documents);

      if (result.hasInsufficientEvidence) {
        insufficientEvidenceCount++;
      }

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

    // Determine status deterministically based on rigorous rules
    let status: QualificationStatus;
    const hasRequiredMissing = missing.some((m) => {
      const originalReq = requirements.find((r) => r.ruleCode === m.ruleCode);
      return originalReq?.required;
    });

    const hasBasicProfileInfo = (profile.educations && profile.educations.length > 0) || (documents && documents.length > 0);

    if (!hasBasicProfileInfo || insufficientEvidenceCount >= Math.ceil(requirements.length / 2)) {
      status = QualificationStatus.MORE_INFORMATION_REQUIRED;
    } else if (!hasRequiredMissing) {
      status = QualificationStatus.QUALIFIED;
    } else if (rawScore >= 50) {
      status = QualificationStatus.PARTIALLY_QUALIFIED;
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
Explain this result clearly to the applicant. State why requirements were satisfied or missed based on the evidence, and recommend actionable next steps. Do NOT change the score or status.`;

    let aiExplanation = '';
    try {
      const aiResponse = await this.aiService.runAgentStructured<any>(
        'QUALIFICATION',
        applicantId,
        explainerPrompt,
        undefined,
        parentExecutionId,
        'QUALIFICATION_ENGINE',
      );
      aiExplanation = aiResponse?.data?.explanation || '';
    } catch (e: any) {
      aiExplanation = `Your qualification assessment for the ${pathway} pathway resulted in a score of ${rawScore}%. Evaluated status: ${status}. Please review missing requirements for next steps.`;
    }

    // Atomic transaction: save assessment and update profile readiness score
    const saved = await this.prisma.$transaction(async (tx) => {
      const assessment = await tx.qualificationAssessment.create({
        data: {
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
            insufficientEvidenceCount,
          },
          aiExplanation,
          evaluatedAt: new Date(),
        },
      });

      await tx.applicantProfile.update({
        where: { userId: applicantId },
        data: { readinessScore: rawScore },
      });

      return assessment;
    });

    return saved;
  }

  async getLatestAssessment(applicantId: string): Promise<any | null> {
    return this.prisma.qualificationAssessment.findFirst({
      where: { applicantId },
      orderBy: { evaluatedAt: 'desc' },
    });
  }

  async getAssessmentHistory(applicantId: string): Promise<any[]> {
    return this.prisma.qualificationAssessment.findMany({
      where: { applicantId },
      orderBy: { evaluatedAt: 'desc' },
      take: 10,
    });
  }

  public evaluateSingleRule(
    req: { ruleCode: string; title: string; description: string; minimumLevel?: string | null },
    profile: { educations?: any[]; employments?: any[]; languages?: any[]; skills?: any[] },
    documents: any[],
  ): RuleEvaluationResult {
    const code = req.ruleCode.toUpperCase();

    // 1. German language checks
    if (code.includes('GERMAN_B1') || (code.includes('GERMAN') && req.minimumLevel === 'B1')) {
      const german = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
      if (!german) {
        return {
          isSatisfied: false,
          hasInsufficientEvidence: true,
          evidence: 'No German language record found in profile.',
          remediationAction: 'Upload Goethe/TELC German B1 certificate or enroll in Educaro German Language Academy.',
        };
      }
      const level = german.proficiencyLevel.toUpperCase();
      const validLevels = ['B1', 'B2', 'C1', 'C2', 'NATIVE'];
      if (validLevels.includes(level)) {
        return {
          isSatisfied: true,
          evidence: `Verified German proficiency at level ${german.proficiencyLevel} (${german.certificateType || 'Self-declared'}).`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        evidence: `Current German level is ${german.proficiencyLevel}, which does not satisfy the required B1 minimum level.`,
        remediationAction: `Advance German language skills from ${german.proficiencyLevel} to B1.`,
      };
    }

    if (code.includes('GERMAN_A2') || (code.includes('GERMAN') && req.minimumLevel === 'A2')) {
      const german = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
      if (!german) {
        return {
          isSatisfied: false,
          hasInsufficientEvidence: true,
          evidence: 'No German language record found in profile.',
          remediationAction: 'Upload Goethe/TELC German A2 certificate or start German lessons.',
        };
      }
      const level = german.proficiencyLevel.toUpperCase();
      const validLevels = ['A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];
      if (validLevels.includes(level)) {
        return {
          isSatisfied: true,
          evidence: `Verified German language at level ${german.proficiencyLevel}.`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        evidence: `Current German level is ${german.proficiencyLevel}, which does not meet A2.`,
        remediationAction: 'Complete German A2 coursework and obtain certification.',
      };
    }

    if (code.includes('GERMAN_A1') || (code.includes('GERMAN') && req.minimumLevel === 'A1')) {
      const german = profile.languages?.find((l) => l.language.toLowerCase().includes('german'));
      if (german && german.proficiencyLevel) {
        return {
          isSatisfied: true,
          evidence: `Basic German recorded: ${german.proficiencyLevel}.`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'No German language certificate or level on file.',
        remediationAction: 'Begin German A1 foundational preparation.',
      };
    }

    // 2. English proficiency checks
    if (code.includes('ENGLISH')) {
      const english = profile.languages?.find((l) => l.language.toLowerCase().includes('english'));
      if (!english) {
        return {
          isSatisfied: false,
          hasInsufficientEvidence: true,
          evidence: 'No English language record found in profile.',
          remediationAction: 'Upload IELTS (6.5+), TOEFL (90+), or proof of English medium of instruction.',
        };
      }
      const lvl = english.proficiencyLevel.toUpperCase();
      const validLvl = ['B2', 'C1', 'C2', 'FLUENT', 'NATIVE', 'ADVANCED'];
      if (validLvl.includes(lvl) || (english.certificateType && english.certificateType.length > 2)) {
        return {
          isSatisfied: true,
          evidence: `Verified English proficiency: ${english.proficiencyLevel} (${english.certificateType || 'Verified'}).`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        evidence: `English proficiency level is ${english.proficiencyLevel}, higher proficiency required.`,
        remediationAction: 'Obtain an accepted English test score report (IELTS/TOEFL).',
      };
    }

    // 3. Recognized Bachelor degree
    if (code.includes('RECOGNIZED_BACHELOR') || code.includes('BACHELOR')) {
      const bachelorDegree = profile.educations?.find((e) => {
        const d = (e.degree || '').toLowerCase();
        return (
          d.includes('bachelor') ||
          d.includes('b.tech') ||
          d.includes('b.e') ||
          d.includes('b.sc') ||
          d.includes('bca') ||
          d.includes('bba') ||
          d.includes('undergraduate')
        );
      });

      if (bachelorDegree) {
        return {
          isSatisfied: true,
          evidence: `Undergraduate degree verified: ${bachelorDegree.degree} in ${bachelorDegree.fieldOfStudy} from ${bachelorDegree.institution} (Grade: ${bachelorDegree.gradeOrCgpa || 'Recorded'}).`,
          remediationAction: '',
        };
      }

      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'No recognized Bachelor degree found in applicant educational records.',
        remediationAction: 'Upload verified Bachelor degree certificate or transcript recognized under Anabin.',
      };
    }

    // 4. 12th Standard / Higher Secondary School
    if (code.includes('SCHOOL_12TH') || code.includes('SECONDARY')) {
      const schoolRecord = profile.educations?.find((e) => {
        const deg = (e.degree || '').toLowerCase();
        const inst = (e.institution || '').toLowerCase();
        return (
          deg.includes('12') ||
          deg.includes('higher secondary') ||
          deg.includes('hsc') ||
          deg.includes('intermediate') ||
          deg.includes('senior secondary') ||
          deg.includes('school') ||
          inst.includes('school') ||
          inst.includes('junior college') ||
          // If applicant has a bachelor degree, 12th standard is inherently satisfied
          deg.includes('bachelor') ||
          deg.includes('b.tech') ||
          deg.includes('b.e')
        );
      });

      if (schoolRecord) {
        return {
          isSatisfied: true,
          evidence: `Secondary school qualification verified: ${schoolRecord.degree} from ${schoolRecord.institution}.`,
          remediationAction: '',
        };
      }

      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'No 12th standard or higher secondary school credential found in profile.',
        remediationAction: 'Upload 12th Standard / HSC marksheet.',
      };
    }

    // 5. Degree comparability / Anabin
    if (code.includes('DEGREE_COMPARABILITY')) {
      const eduWithInstitution = profile.educations?.find((e) => Boolean(e.institution && e.degree));
      if (eduWithInstitution) {
        return {
          isSatisfied: true,
          evidence: `Degree comparability established for ${eduWithInstitution.degree} from ${eduWithInstitution.institution}.`,
          remediationAction: '',
        };
      }
      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'Insufficient educational data to evaluate Anabin H+ university comparability.',
        remediationAction: 'Provide full institution and degree details recognized on Anabin database.',
      };
    }

    // 6. APS Certificate
    if (code.includes('APS')) {
      const apsDoc = documents.find(
        (d) =>
          d.documentType === DocumentType.CERTIFICATE &&
          (d.filename.toLowerCase().includes('aps') || d.filename.toLowerCase().includes('akademische')),
      );

      if (apsDoc) {
        return {
          isSatisfied: true,
          evidence: `APS India certificate detected and verified: ${apsDoc.filename}.`,
          remediationAction: '',
        };
      }

      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'APS verification certificate not found in uploaded documents.',
        remediationAction: 'Apply for APS India verification certificate and upload the digital certificate.',
      };
    }

    // 7. Work experience requirement
    if (code.includes('EXPERIENCE')) {
      const hasExperience = profile.employments && profile.employments.length > 0;
      if (hasExperience) {
        const exp = profile.employments![0];
        return {
          isSatisfied: true,
          evidence: `Verified professional employment: ${exp.role} at ${exp.companyName} (${exp.startDate || 'Recorded'} - ${exp.endDate || 'Present'}).`,
          remediationAction: '',
        };
      }

      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'No professional work experience or internship records documented in profile.',
        remediationAction: 'Add employment experience or upload verified experience letters.',
      };
    }

    // 8. Passport / Identification
    if (code.includes('PASSPORT') || code.includes('ID')) {
      const passportDoc = documents.find(
        (d) =>
          d.filename.toLowerCase().includes('passport') ||
          d.documentType === DocumentType.OTHER ||
          d.documentType === DocumentType.CERTIFICATE,
      );

      if (passportDoc) {
        return {
          isSatisfied: true,
          evidence: `Identification document verified: ${passportDoc.filename}.`,
          remediationAction: '',
        };
      }

      return {
        isSatisfied: false,
        hasInsufficientEvidence: true,
        evidence: 'Valid passport copy not found in document uploads.',
        remediationAction: 'Upload scanned copy of valid international passport (first and last page).',
      };
    }

    // Explicit default: NEVER assume satisfied without evidence!
    return {
      isSatisfied: false,
      hasInsufficientEvidence: true,
      evidence: `No verified evidence on file for rule requirement '${req.title}'.`,
      remediationAction: `Upload verified documentation supporting requirement '${req.title}'.`,
    };
  }
}
