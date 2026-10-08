import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { RecommendationType, ReviewStatus, GoalType } from '../common/enums';

describe('RecommendationsService (Educaro Next-Step Routing)', () => {
  let service: RecommendationsService;
  let mockPrisma: any;
  let mockAiService: any;

  beforeEach(async () => {
    mockPrisma = {
      applicantProfile: {
        findUnique: jest.fn(),
      },
      qualificationAssessment: {
        findFirst: jest.fn(),
      },
      consultantReview: {
        findFirst: jest.fn(),
      },
      routingRule: {
        findMany: jest.fn(),
      },
      educaroService: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      nextStepRecommendation: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'rec-1', ...args.data })),
        updateMany: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    mockAiService = {
      runAgentStructured: jest.fn().mockResolvedValue({
        data: { reason: 'AI refined plain language explanation.' },
      }),
    };

    service = new RecommendationsService(mockPrisma as any, mockAiService as any);
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
      targetServiceId: 'svc-lang',
      targetService: mockService,
      priority: 100,
      reasonTemplate: 'Enrolling in the Educaro Language Academy is essential.',
    };

    mockPrisma.applicantProfile.findUnique.mockResolvedValue({
      userId: 'app-1',
      readinessScore: 65,
      currentGoal: GoalType.AUSBILDUNG,
    });

    mockPrisma.qualificationAssessment.findFirst.mockResolvedValue({
      score: 65,
      missingRequirements: [{ ruleCode: 'GERMAN_B1' }],
    });

    mockPrisma.consultantReview.findFirst.mockResolvedValue(null);
    mockPrisma.routingRule.findMany.mockResolvedValue([mockRule]);

    const result = await service.refreshRecommendation('app-1');

    expect(result.type).toBe(RecommendationType.EDUCARO_SERVICE);
    expect(result.targetId).toBe('svc-lang');
    expect(result.title).toBe(mockService.title);
  });

  it('CRITICAL: must route to CONSULTANT_REFERRAL when a pending review exists', async () => {
    mockPrisma.applicantProfile.findUnique.mockResolvedValue({
      userId: 'app-1',
      readinessScore: 50,
      currentGoal: GoalType.STUDY,
    });

    mockPrisma.qualificationAssessment.findFirst.mockResolvedValue(null);
    mockPrisma.consultantReview.findFirst.mockResolvedValue({
      id: 'rev-pending',
      issue: 'Academic credential conflict',
      status: ReviewStatus.PENDING,
    });
    mockPrisma.routingRule.findMany.mockResolvedValue([]);

    const result = await service.refreshRecommendation('app-1');

    expect(result.type).toBe(RecommendationType.CONSULTANT_REFERRAL);
    expect(result.targetId).toBe('rev-pending');
  });
});
