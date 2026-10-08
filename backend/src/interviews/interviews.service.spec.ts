import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { UserRole } from '../common/enums';

describe('InterviewsService (WebRTC, AI Live Copilot & Technical Assessment)', () => {
  let service: InterviewsService;
  let mockPrisma: any;
  let mockPlanningAgent: any;
  let mockTechAgent: any;
  let mockLiveAgent: any;
  let mockEvalAgent: any;
  let mockComplianceAgent: any;
  let mockCodeExecutionService: any;

  beforeEach(() => {
    mockPrisma = {
      interviewRoom: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      interviewParticipant: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      interviewInvitation: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      interviewStage: {
        create: jest.fn(),
      },
      interviewQuestion: {
        create: jest.fn(),
      },
      technicalAssessment: {
        create: jest.fn(),
      },
      interviewScorecard: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      codingChallenge: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      codeSubmission: {
        create: jest.fn(),
      },
      codeExecution: {
        create: jest.fn(),
      },
      interviewAnswer: {
        create: jest.fn(),
      },
      jobApplication: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    mockPlanningAgent = {
      planInterview: jest.fn().mockResolvedValue({
        stages: [{ name: 'TECHNICAL', durationMinutes: 30 }],
        recommendedQuestions: ['Explain event loop in Node.js'],
      }),
    };

    mockTechAgent = {
      generateAssessment: jest.fn().mockResolvedValue({
        codingChallenge: {
          title: 'Implement debounce',
          description: 'Implement a debounce function in TypeScript',
          starterCode: 'function debounce() {}',
        },
      }),
    };

    mockLiveAgent = {
      provideLiveAssistance: jest.fn().mockResolvedValue({
        suggestedFollowUp: 'Ask how they handle edge cases in async calls',
        competency: 'System Design',
      }),
    };

    mockEvalAgent = {
      evaluateInterview: jest.fn().mockResolvedValue({
        overallScore: 88,
        recommendation: 'ADVANCE',
      }),
    };

    mockComplianceAgent = {
      recordAudit: jest.fn().mockResolvedValue(true),
    };

    mockCodeExecutionService = {
      executeCode: jest.fn().mockResolvedValue({
        success: true,
        stdout: 'Test passed\n',
        stderr: '',
        executionTimeMs: 45,
        memoryKb: 1200,
        passed: true,
        testResults: [],
      }),
    };

    service = new InterviewsService(
      mockPrisma as any,
      mockPlanningAgent as any,
      mockTechAgent as any,
      mockLiveAgent as any,
      mockEvalAgent as any,
      mockComplianceAgent as any,
      mockCodeExecutionService as any,
    );
  });

  it('CRITICAL: non-existent room throws NotFoundException', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue(null);

    await expect(
      service.getInterviewById('room-non-existent', 'user-1', UserRole.APPLICANT),
    ).rejects.toThrow(NotFoundException);
  });

  it('CRITICAL: applicant cannot access another applicant?s interview room', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-99',
      interviewerId: 'interviewer-1',
      participants: [{ userId: 'applicant-99' }, { userId: 'interviewer-1' }],
    });

    await expect(
      service.getInterviewById('room-1', 'applicant-intruder', UserRole.APPLICANT),
    ).rejects.toThrow(ForbiddenException);
  });

  it('interviewer assigned to room can access room', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-1',
      interviewerId: 'interviewer-1',
      participants: [{ userId: 'applicant-1' }, { userId: 'interviewer-1' }],
    });

    const room = await service.getInterviewById('room-1', 'interviewer-1', UserRole.CONSULTANT);
    expect(room.id).toBe('room-1');
  });

  it('code execution executes securely via sandboxed CodeExecutionService', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-1',
      status: 'SCHEDULED',
      participants: [{ userId: 'applicant-1' }],
    });
    mockPrisma.codingChallenge.findUnique.mockResolvedValue({
      id: 'chal-1',
      testCases: [],
      language: 'javascript',
    });
    mockPrisma.codeExecution.create.mockResolvedValue({
      id: 'exec-1',
    });

    const result = await service.runCode('room-1', 'applicant-1', UserRole.APPLICANT, 'chal-1', 'javascript', 'console.log("hello")');
    expect(result.stdout).toBe('Test passed\n');
    expect(mockCodeExecutionService.executeCode).toHaveBeenCalled();
  });

  it('CRITICAL: applicant cannot execute code in another applicant\'s room', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-1',
      status: 'SCHEDULED',
    });

    await expect(
      service.runCode('room-1', 'intruder-applicant', UserRole.APPLICANT, 'chal-1', 'javascript', 'console.log("hack")'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('CRITICAL: applicant cannot access internal interview scorecard', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-1',
    });

    await expect(
      service.getScorecard('room-1', 'applicant-1', UserRole.APPLICANT),
    ).rejects.toThrow(ForbiddenException);
  });

  it('consultant can access interview scorecard', async () => {
    mockPrisma.interviewRoom.findUnique.mockResolvedValue({
      id: 'room-1',
      applicantId: 'applicant-1',
    });
    mockPrisma.interviewScorecard.findUnique.mockResolvedValue({
      id: 'sc-1',
      roomId: 'room-1',
      technicalScore: 85,
    });

    const card = await service.getScorecard('room-1', 'consultant-1', UserRole.CONSULTANT);
    expect(card?.technicalScore).toBe(85);
  });

  describe('Opportunity-Linked Interview Scheduling (Adaptive Pathways)', () => {
    it('applicant can request and schedule an interview for their submitted application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'applicant-1',
        opportunityId: 'opp-1',
        status: 'SUBMITTED',
        opportunity: { id: 'opp-1', title: 'Fullstack Dev at Siemens', type: 'EMPLOYMENT' },
      });
      mockPrisma.interviewRoom.findFirst.mockResolvedValue(null);
      mockPrisma.interviewRoom.create.mockResolvedValue({
        id: 'room-new',
        applicationId: 'app-1',
        applicantId: 'applicant-1',
        status: 'SCHEDULED',
      });
      mockPrisma.interviewStage.create.mockResolvedValue({ id: 'stage-1' });
      mockPrisma.interviewQuestion.create.mockResolvedValue({ id: 'q-1' });
      mockPrisma.interviewInvitation.create.mockResolvedValue({
        id: 'inv-1',
        roomId: 'room-new',
        applicationId: 'app-1',
        applicantId: 'applicant-1',
        proposedTime: new Date('2026-10-15T10:00:00Z'),
        status: 'ACCEPTED',
      });
      mockPrisma.jobApplication.update.mockResolvedValue({ id: 'app-1', status: 'INTERVIEW_INVITED' });

      const result = await service.requestInterviewSchedule('app-1', 'applicant-1', {
        preferredDate: new Date('2026-10-15T10:00:00Z'),
        timezone: 'Europe/Berlin',
      });

      expect(result.success).toBe(true);
      expect(result.roomId).toBe('room-new');
      expect(mockPrisma.interviewInvitation.create).toHaveBeenCalled();
      expect(mockPrisma.jobApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'INTERVIEW_INVITED' } }),
      );
    });

    it('applicant cannot schedule an interview for another applicant\'s application', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'applicant-1',
        status: 'SUBMITTED',
        opportunity: { id: 'opp-1', title: 'Tech Job' },
      });

      await expect(
        service.requestInterviewSchedule('app-1', 'intruder-applicant', {
          preferredDate: new Date('2026-10-15T10:00:00Z'),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('applicant cannot schedule interview if application is still in DRAFT status', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'applicant-1',
        status: 'DRAFT',
        opportunity: { id: 'opp-1', title: 'Tech Job' },
      });

      await expect(
        service.requestInterviewSchedule('app-1', 'applicant-1', {
          preferredDate: new Date('2026-10-15T10:00:00Z'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requesting interview for non-existent application throws NotFoundException', async () => {
      mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.requestInterviewSchedule('app-missing', 'applicant-1', {
          preferredDate: new Date('2026-10-15T10:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
