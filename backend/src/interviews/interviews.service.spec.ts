import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      interviewParticipant: {
        findUnique: jest.fn(),
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

    const result = await service.runCode('room-1', 'applicant-1', 'chal-1', 'javascript', 'console.log("hello")');
    expect(result.stdout).toBe('Test passed\n');
    expect(mockCodeExecutionService.executeCode).toHaveBeenCalled();
  });
});
