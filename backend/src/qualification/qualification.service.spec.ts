import { Test, TestingModule } from '@nestjs/testing';
import { QualificationService } from './qualification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GoalType, QualificationStatus, SourceType, VerificationStatus, DocumentType } from '../common/enums';

describe('QualificationService (Deterministic Rule Engine & Evidence)', () => {
  let service: QualificationService;
  let mockPrisma: any;
  let mockAiService: any;

  beforeEach(async () => {
    mockPrisma = {
      applicantProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      qualificationRequirement: {
        findMany: jest.fn(),
      },
      document: {
        findMany: jest.fn(),
      },
      qualificationAssessment: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'assess-1', ...args.data })),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockAiService = {
      runAgentStructured: jest.fn().mockResolvedValue({
        data: { explanation: 'Ground truth explanation generated.' },
      }),
    };

    service = new QualificationService(mockPrisma as any, mockAiService as any);
  });

  describe('Rule: German Language (GERMAN_B1 / GERMAN_B2)', () => {
    it('must evaluate as NOT SATISFIED when applicant has German A2 and B1 is required', async () => {
      const mockRequirements = [
        {
          id: 'req-b1',
          pathway: GoalType.AUSBILDUNG,
          ruleCode: 'GERMAN_B1',
          title: 'German B1 Certificate',
          description: 'B1 required for vocational school',
          required: true,
          weight: 50,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.AUSBILDUNG,
        languages: [
          {
            language: 'German',
            proficiencyLevel: 'A2',
            sourceType: SourceType.DOCUMENT_EXTRACTED,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        ],
        educations: [{ degree: '12th Standard', fieldOfStudy: 'Science', completed: true }],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.NOT_CURRENTLY_QUALIFIED);
      expect(result.missingRequirements).toHaveLength(1);
      expect(result.missingRequirements[0].ruleCode).toBe('GERMAN_B1');
      expect(result.missingRequirements[0].remediationAction).toContain('Advance German language skills from A2 to B1');
      expect(result.satisfiedRequirements).toHaveLength(0);
    });

    it('must evaluate as SATISFIED when applicant has verified German B2 meeting B1 requirement', async () => {
      const mockRequirements = [
        {
          id: 'req-b1',
          pathway: GoalType.AUSBILDUNG,
          ruleCode: 'GERMAN_B1',
          title: 'German B1 Certificate',
          description: 'B1 required for vocational school',
          required: true,
          weight: 50,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.AUSBILDUNG,
        languages: [
          {
            language: 'German',
            proficiencyLevel: 'B2',
            sourceType: SourceType.DOCUMENT_EXTRACTED,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        ],
        educations: [{ degree: 'Higher Secondary', completed: true }],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.QUALIFIED);
      expect(result.satisfiedRequirements).toHaveLength(1);
      expect(result.satisfiedRequirements[0].evidence).toContain('B2');
    });
  });

  describe('Rule: Degree Qualification (RECOGNIZED_BACHELOR)', () => {
    it('must evaluate as SATISFIED when applicant holds a recognized bachelor degree', async () => {
      const mockRequirements = [
        {
          id: 'req-bach',
          pathway: GoalType.EMPLOYMENT,
          ruleCode: 'RECOGNIZED_BACHELOR',
          title: 'Recognized Bachelor Degree',
          description: 'H+ recognized degree',
          required: true,
          weight: 50,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.EMPLOYMENT,
        languages: [],
        educations: [
          {
            degree: 'Bachelor of Technology',
            fieldOfStudy: 'Computer Science',
            institution: 'Anna University',
            completed: true,
            anabinStatus: 'H+',
          },
        ],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.QUALIFIED);
      expect(result.satisfiedRequirements[0].evidence).toContain('Bachelor of Technology in Computer Science');
    });

    it('must evaluate as MORE_INFORMATION_REQUIRED when degree is missing', async () => {
      const mockRequirements = [
        {
          id: 'req-bach',
          pathway: GoalType.EMPLOYMENT,
          ruleCode: 'RECOGNIZED_BACHELOR',
          title: 'Recognized Bachelor Degree',
          description: 'H+ recognized degree',
          required: true,
          weight: 50,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.EMPLOYMENT,
        languages: [],
        educations: [
          {
            degree: 'High School Diploma',
            fieldOfStudy: 'General',
            completed: true,
          },
        ],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.MORE_INFORMATION_REQUIRED);
      expect(result.missingRequirements[0].ruleCode).toBe('RECOGNIZED_BACHELOR');
      expect(result.missingRequirements[0].remediationAction).toContain('Anabin');
    });
  });

  describe('Rule: School Education (SCHOOL_12TH)', () => {
    it('must evaluate as SATISFIED when 12th standard completion certificate is verified', async () => {
      const mockRequirements = [
        {
          id: 'req-12th',
          pathway: GoalType.AUSBILDUNG,
          ruleCode: 'SCHOOL_12TH',
          title: '12 Years School Education',
          description: 'Completed 12th standard certificate',
          required: true,
          weight: 40,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.AUSBILDUNG,
        languages: [],
        educations: [
          {
            degree: 'Higher Secondary Certificate (12th)',
            fieldOfStudy: 'Science',
            institution: 'St. Mary High School',
            completed: true,
          },
        ],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.QUALIFIED);
      expect(result.satisfiedRequirements[0].ruleCode).toBe('SCHOOL_12TH');
    });
  });

  describe('Rule: APS Certificate (APS_CERTIFICATE)', () => {
    it('must evaluate as SATISFIED when APS certificate document is verified', async () => {
      const mockRequirements = [
        {
          id: 'req-aps',
          pathway: GoalType.STUDY,
          ruleCode: 'APS_CERTIFICATE',
          title: 'APS Certificate',
          description: 'Academic Evaluation Centre verification',
          required: true,
          weight: 40,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.STUDY,
        languages: [],
        educations: [{ degree: 'Bachelor', institution: 'University', completed: true }],
        employments: [],
        skills: [],
      };

      const mockDocuments = [
        {
          documentType: DocumentType.CERTIFICATE,
          filename: 'aps_certificate.pdf',
          verificationStatus: VerificationStatus.VERIFIED,
        },
      ];

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.QUALIFIED);
      expect(result.satisfiedRequirements[0].ruleCode).toBe('APS_CERTIFICATE');
    });

    it('must evaluate as MORE_INFORMATION_REQUIRED when APS certificate is missing', async () => {
      const mockRequirements = [
        {
          id: 'req-aps',
          pathway: GoalType.STUDY,
          ruleCode: 'APS_CERTIFICATE',
          title: 'APS Certificate',
          description: 'Academic Evaluation Centre verification',
          required: true,
          weight: 40,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.STUDY,
        languages: [],
        educations: [{ degree: 'Bachelor', institution: 'University', completed: true }],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.MORE_INFORMATION_REQUIRED);
      expect(result.missingRequirements[0].ruleCode).toBe('APS_CERTIFICATE');
    });
  });

  describe('Rule: Work Experience (WORK_EXPERIENCE)', () => {
    it('must evaluate as SATISFIED when applicant has relevant employment history', async () => {
      const mockRequirements = [
        {
          id: 'req-exp',
          pathway: GoalType.EMPLOYMENT,
          ruleCode: 'WORK_EXPERIENCE',
          title: 'Professional Experience',
          description: 'At least 1 year in related domain',
          required: true,
          weight: 30,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.EMPLOYMENT,
        languages: [],
        educations: [{ degree: 'B.Tech', institution: 'Tech Inst', completed: true }],
        employments: [
          {
            role: 'Software Engineer',
            companyName: 'Tech Corp',
            startDate: '2022-01-01',
            endDate: '2024-01-01',
          },
        ],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.QUALIFIED);
      expect(result.satisfiedRequirements[0].evidence).toContain('Software Engineer');
    });
  });

  describe('Insufficient Evidence -> MORE_INFORMATION_REQUIRED', () => {
    it('must return MORE_INFORMATION_REQUIRED when profile lacks basic data', async () => {
      const mockRequirements = [
        {
          id: 'req-1',
          pathway: GoalType.STUDY,
          ruleCode: 'APS_CERTIFICATE',
          title: 'APS Certificate',
          required: true,
          weight: 50,
        },
        {
          id: 'req-2',
          pathway: GoalType.STUDY,
          ruleCode: 'RECOGNIZED_BACHELOR',
          title: 'Bachelor Degree',
          required: true,
          weight: 50,
        },
      ];

      const emptyProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.STUDY,
        languages: [],
        educations: [],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(emptyProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.evaluateApplicant('app-1');

      expect(result.status).toBe(QualificationStatus.MORE_INFORMATION_REQUIRED);
    });
  });

  describe('AI Role In Qualification', () => {
    it('AI cannot alter deterministic status or score, only provides explanation', async () => {
      const mockRequirements = [
        {
          id: 'req-b1',
          pathway: GoalType.AUSBILDUNG,
          ruleCode: 'GERMAN_B1',
          title: 'German B1 Certificate',
          required: true,
          weight: 100,
        },
      ];

      const mockProfile = {
        id: 'prof-1',
        userId: 'app-1',
        currentGoal: GoalType.AUSBILDUNG,
        languages: [
          {
            language: 'German',
            proficiencyLevel: 'A1',
            sourceType: SourceType.APPLICANT_PROVIDED,
            verificationStatus: VerificationStatus.UNVERIFIED,
          },
        ],
        educations: [{ degree: '12th', institution: 'School', completed: true }],
        employments: [],
        skills: [],
      };

      mockPrisma.applicantProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.qualificationRequirement.findMany.mockResolvedValue(mockRequirements);
      mockPrisma.document.findMany.mockResolvedValue([]);

      // Mock AI attempting to give a different score or status
      mockAiService.runAgentStructured.mockResolvedValue({
        data: {
          explanation: 'AI says applicant is qualified (hallucination)',
          status: 'QUALIFIED',
          score: 100,
        },
      });

      const result = await service.evaluateApplicant('app-1');

      // The status must remain deterministically NOT_CURRENTLY_QUALIFIED
      expect(result.status).toBe(QualificationStatus.NOT_CURRENTLY_QUALIFIED);
      expect(result.score).toBe(0);
      expect(result.aiExplanation).toBe('AI says applicant is qualified (hallucination)');
    });
  });
});
