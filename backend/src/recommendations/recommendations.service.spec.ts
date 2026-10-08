import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { NextStepRecommendation } from '../database/entities/next-step-recommendation.entity';
import { EducaroService } from '../database/entities/educaro-service.entity';
import { RoutingRule } from '../database/entities/routing-rule.entity';
import { QualificationAssessment } from '../database/entities/qualification-assessment.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { ConsultantReview } from '../database/entities/consultant-review.entity';
import { Notification } from '../database/entities/notification.entity';
import { AiService } from '../ai/ai.service';
import { RecommendationType, RecommendationStatus, ReviewStatus, GoalType } from '../common/enums';

describe('RecommendationsService (Educaro Next-Step Routing)', () => {
  let service: RecommendationsService;
  let mockRecRepo: any;
  let mockServiceRepo: any;
  let mockRuleRepo: any;
  let mockAssessmentRepo: any;
  let mockProfileRepo: any;
  let mockReviewRepo: any;
  let mockNotifRepo: any;
  let mockAiService: any;

  beforeEach(async () => {
    mockRecRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((dto) => Promise.resolve({ id: 'rec-1', ...dto })),
      update: jest.fn(),
      findOne: jest.fn(),
    };
    mockServiceRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    mockRuleRepo = {
      find: jest.fn(),
    };
    mockAssessmentRepo = {
      findOne: jest.fn(),
    };
    mockProfileRepo = {
      findOne: jest.fn(),
    };
    mockReviewRepo = {
      findOne: jest.fn(),
    };
    mockNotifRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((dto) => Promise.resolve(dto)),
    };
    mockAiService = {
      runAgentStructured: jest.fn().mockResolvedValue({
        data: { reason: 'AI refined plain language explanation.' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: getRepositoryToken(NextStepRecommendation), useValue: mockRecRepo },
        { provide: getRepositoryToken(EducaroService), useValue: mockServiceRepo },
        { provide: getRepositoryToken(RoutingRule), useValue: mockRuleRepo },
        { provide: getRepositoryToken(QualificationAssessment), useValue: mockAssessmentRepo },
        { provide: getRepositoryToken(ApplicantProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(ConsultantReview), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Notification), useValue: mockNotifRepo },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('CRITICAL: must route to Educaro Language Academy when German requirement is missing', async () => {
    const mockService = {
      id: 'svc-lang',
      title: 'Educaro Fast-Track German Language Academy',
      category: 'LANGUAGE_PREPARATION',
    };

    const mockRule = {
      id: 'rule-lang',
      name: 'Missing German -> Language Academy',
      conditionType: 'MISSING_LANGUAGE',
      targetType: RecommendationType.EDUCARO_SERVICE,
      targetService: mockService,
      priority: 100,
      reasonTemplate: 'Enrolling in the Educaro Language Academy is essential.',
    };

    mockProfileRepo.findOne.mockResolvedValue({
      userId: 'app-1',
      readinessScore: 65,
      currentGoal: GoalType.AUSBILDUNG,
    });

    mockAssessmentRepo.findOne.mockResolvedValue({
      score: 65,
      missingRequirements: [{ ruleCode: 'GERMAN_B1' }],
    });

    mockReviewRepo.findOne.mockResolvedValue(null);
    mockRuleRepo.find.mockResolvedValue([mockRule]);

    const result = await service.refreshRecommendation('app-1');

    expect(result.type).toBe(RecommendationType.EDUCARO_SERVICE);
    expect(result.targetId).toBe('svc-lang');
    expect(result.title).toBe(mockService.title);
  });

  it('CRITICAL: must route to CONSULTANT_REFERRAL when a pending review exists', async () => {
    mockProfileRepo.findOne.mockResolvedValue({
      userId: 'app-1',
      readinessScore: 50,
      currentGoal: GoalType.STUDY,
    });

    mockAssessmentRepo.findOne.mockResolvedValue(null);
    mockReviewRepo.findOne.mockResolvedValue({
      id: 'rev-pending',
      issue: 'Academic credential conflict',
      status: ReviewStatus.PENDING,
    });
    mockRuleRepo.find.mockResolvedValue([]);

    const result = await service.refreshRecommendation('app-1');

    expect(result.type).toBe(RecommendationType.CONSULTANT_REFERRAL);
    expect(result.targetId).toBe('rev-pending');
  });
});
