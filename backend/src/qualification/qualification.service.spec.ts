import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QualificationService } from './qualification.service';
import { QualificationRequirement } from '../database/entities/qualification-requirement.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { Document } from '../database/entities/document.entity';
import { AiService } from '../ai/ai.service';
import { GoalType, QualificationStatus, SourceType, VerificationStatus } from '../common/enums';

describe('QualificationService (Deterministic Rule Engine & Evidence)', () => {
  let service: QualificationService;
  let mockReqRepo: any;
  let mockAssessmentRepo: any;
  let mockProfileRepo: any;
  let mockDocRepo: any;
  let mockAiService: any;

  beforeEach(async () => {
    mockReqRepo = {
      find: jest.fn(),
    };
    mockAssessmentRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((dto) => Promise.resolve({ id: 'assess-1', ...dto })),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mockProfileRepo = {
      findOne: jest.fn(),
      save: jest.fn((dto) => Promise.resolve(dto)),
    };
    mockDocRepo = {
      find: jest.fn(),
    };
    mockAiService = {
      runAgentStructured: jest.fn().mockResolvedValue({
        data: { explanation: 'Ground truth explanation generated.' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualificationService,
        { provide: getRepositoryToken(QualificationRequirement), useValue: mockReqRepo },
        { provide: getRepositoryToken(QualificationAssessment), useValue: mockAssessmentRepo },
        { provide: getRepositoryToken(ApplicantProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(Document), useValue: mockDocRepo },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<QualificationService>(QualificationService);
  });

  it('CRITICAL: must evaluate deterministic requirement as NOT SATISFIED when applicant has German A2 and B1 is required', async () => {
    const mockRequirements = [
      {
        id: 'req-b1',
        pathway: GoalType.AUSBILDUNG,
        ruleCode: 'GERMAN_B1',
        title: 'German B1 Certificate',
        description: 'B1 required for vocational school',
        required: true,
        weight: 35,
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
      educations: [],
    };

    mockReqRepo.find.mockResolvedValue(mockRequirements);
    mockProfileRepo.findOne.mockResolvedValue(mockProfile);
    mockDocRepo.find.mockResolvedValue([]);

    const result = await service.evaluateApplicant('app-1');

    expect(result.status).toBe(QualificationStatus.NOT_CURRENTLY_QUALIFIED);
    expect(result.missingRequirements).toHaveLength(1);
    expect(result.missingRequirements[0].ruleCode).toBe('GERMAN_B1');
    expect(result.missingRequirements[0].remediationAction).toContain('Advance German level from A2 to B1');
    expect(result.satisfiedRequirements).toHaveLength(0);
  });

  it('should mark requirement as SATISFIED when applicant has verified German B1', async () => {
    const mockRequirements = [
      {
        id: 'req-b1',
        pathway: GoalType.AUSBILDUNG,
        ruleCode: 'GERMAN_B1',
        title: 'German B1 Certificate',
        required: true,
        weight: 35,
      },
    ];

    const mockProfile = {
      id: 'prof-1',
      userId: 'app-1',
      currentGoal: GoalType.AUSBILDUNG,
      languages: [
        {
          language: 'German',
          proficiencyLevel: 'B1',
          sourceType: SourceType.DOCUMENT_EXTRACTED,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      ],
      educations: [],
    };

    mockReqRepo.find.mockResolvedValue(mockRequirements);
    mockProfileRepo.findOne.mockResolvedValue(mockProfile);
    mockDocRepo.find.mockResolvedValue([]);

    const result = await service.evaluateApplicant('app-1');

    expect(result.status).toBe(QualificationStatus.QUALIFIED);
    expect(result.satisfiedRequirements).toHaveLength(1);
    expect(result.missingRequirements).toHaveLength(0);
  });
});
