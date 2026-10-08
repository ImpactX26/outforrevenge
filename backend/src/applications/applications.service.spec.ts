import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus, GoalType } from '../common/enums';

describe('ApplicationsService (Multi-Agent Job Applications)', () => {
  let service: ApplicationsService;
  let mockPrisma: any;
  let mockReadinessAgent: any;
  let mockAppAgent: any;

  beforeEach(() => {
    mockPrisma = {
      opportunity: {
        findUnique: jest.fn(),
      },
      applicantProfile: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      qualificationAssessment: {
        findFirst: jest.fn(),
      },
      jobApplication: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    mockReadinessAgent = {
      analyzeReadiness: jest.fn().mockResolvedValue({
        readinessScore: 92,
        ready: true,
        missingItems: [],
        warnings: [],
        matchedRequirements: ['Bachelor in Computer Science', 'Node.js experience'],
        unsupportedClaims: [],
        recommendations: ['Highlight cloud deployment'],
        confidence: 0.95,
      }),
    };

    mockAppAgent = {
      prepareApplicationPackage: jest.fn().mockImplementation(async (applicantId, oppId) => {
        if (oppId === 'opp-missing') {
          throw new NotFoundException('Opportunity not found');
        }
        if (applicantId === 'user-missing') {
          throw new NotFoundException('Applicant not found');
        }
        return {
          applicationId: 'app-1',
          opportunityId: oppId,
          readinessScore: 92,
          summary: 'Prepared application package for Backend Engineer',
          fields: { coverLetterEn: 'Dear Team...', cvVersionId: 'cv-1' },
          status: ApplicationStatus.READY_FOR_REVIEW,
        };
      }),
      confirmAndSubmitApplication: jest.fn().mockImplementation(async (appId, applicantId) => {
        if (applicantId === 'wrong-applicant') {
          throw new ForbiddenException('Unauthorized to confirm application');
        }
        return {
          id: appId,
          status: ApplicationStatus.SUBMITTED,
          submittedAt: new Date(),
        };
      }),
    };

    service = new ApplicationsService(
      mockPrisma as any,
      mockAppAgent as any,
      mockReadinessAgent as any,
    );
  });

  it('CRITICAL: must reject application preparation if opportunity does not exist', async () => {
    mockPrisma.qualificationAssessment.findFirst.mockResolvedValue({ id: 'q1', status: 'QUALIFIED' });
    await expect(
      service.prepareApplication('user-1', 'opp-missing'),
    ).rejects.toThrow(NotFoundException);
  });

  it('CRITICAL: must block preparing application if applicant profile does not exist', async () => {
    mockPrisma.qualificationAssessment.findFirst.mockResolvedValue({ id: 'q1', status: 'QUALIFIED' });
    await expect(
      service.prepareApplication('user-missing', 'opp-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('must successfully prepare application when readiness analysis passes', async () => {
    mockPrisma.qualificationAssessment.findFirst.mockResolvedValue({ id: 'q1', status: 'QUALIFIED' });
    const result = await service.prepareApplication('user-1', 'opp-1');
    expect(result.package.readinessScore).toBe(92);
    expect(mockAppAgent.prepareApplicationPackage).toHaveBeenCalledWith('user-1', 'opp-1');
  });

  it('CRITICAL: applicant cannot confirm another applicant?s application', async () => {
    await expect(
      service.confirmApplication('app-1', 'wrong-applicant'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('applicant successfully confirms application readiness', async () => {
    const res = await service.confirmApplication('app-1', 'user-1');
    expect(res.application.status).toBe(ApplicationStatus.SUBMITTED);
  });
});
