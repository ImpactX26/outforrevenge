import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewPlanningAgent } from '../agents/interview-planning.agent';
import { TechnicalAssessmentAgent } from '../agents/technical-assessment.agent';
import { LiveInterviewAgent } from '../agents/live-interview.agent';
import { InterviewEvaluationAgent } from '../agents/interview-evaluation.agent';
import { InterviewComplianceAgent } from '../agents/interview-compliance.agent';
import { CodeExecutionService } from './code-execution.service';
import {
  InterviewRoomStatus,
  InterviewParticipantRole,
  InvitationStatus,
  ApplicationStatus,
  UserRole,
} from '../common/enums';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planningAgent: InterviewPlanningAgent,
    private readonly technicalAgent: TechnicalAssessmentAgent,
    private readonly liveAgent: LiveInterviewAgent,
    private readonly evaluationAgent: InterviewEvaluationAgent,
    private readonly complianceAgent: InterviewComplianceAgent,
    private readonly codeRunner: CodeExecutionService,
  ) {}

  async createInterview(dto: {
    applicationId: string;
    interviewerId?: string;
    scheduledAt: Date;
    durationMinutes?: number;
    title?: string;
  }) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: dto.applicationId },
      include: { opportunity: true, applicant: true },
    });

    if (!app) throw new NotFoundException('Application not found');

    const duration = dto.durationMinutes || 45;

    // 1. Plan interview via InterviewPlanningAgent
    const plan = await this.planningAgent.planInterview(
      app.opportunityId,
      app.applicantId,
    );

    // 2. Create InterviewRoom
    const room = await this.prisma.interviewRoom.create({
      data: {
        applicationId: app.id,
        applicantId: app.applicantId,
        interviewerId: dto.interviewerId,
        title: dto.title || `Technical & Journey Interview - ${app.opportunity.title}`,
        scheduledAt: dto.scheduledAt,
        durationMinutes: duration,
        status: InterviewRoomStatus.SCHEDULED,
        interviewPlan: plan as any,
      },
    });

    // 3. Create InterviewStages and InterviewQuestions
    for (let i = 0; i < plan.stages.length; i++) {
      const st = plan.stages[i];
      const stage = await this.prisma.interviewStage.create({
        data: {
          roomId: room.id,
          stageType: st.stageType,
          orderIndex: i,
          status: 'PENDING',
        },
      });

      for (let j = 0; j < st.questions.length; j++) {
        const q = st.questions[j];
        await this.prisma.interviewQuestion.create({
          data: {
            roomId: room.id,
            stageId: stage.id,
            orderIndex: j,
            questionText: q.text,
            competency: q.competency,
            difficulty: q.difficulty,
            expectedConcepts: q.expectedKeyPoints,
          },
        });
      }
    }

    // 4. If technical assessment required, create TechnicalAssessment and CodingChallenges
    if (plan.technicalAssessmentRequired) {
      const techPlan = await this.technicalAgent.generateAssessment(
        app.opportunityId,
        app.applicantId,
      );

      const assess = await this.prisma.technicalAssessment.create({
        data: {
          roomId: room.id,
          title: techPlan.title,
          description: techPlan.description,
          roleSeniority: 'MID',
          requiredSkills: [techPlan.roleDomain],
          rubric: techPlan.challenges[0]?.rubric as any,
        },
      });

      for (const ch of techPlan.challenges) {
        await this.prisma.codingChallenge.create({
          data: {
            assessmentId: assess.id,
            title: ch.title,
            problemStatement: ch.description,
            language: ch.language,
            starterCode: ch.starterCode,
            testCases: ch.testCases as any,
            difficulty: 'MID',
          },
        });
      }
    }

    // 5. Create InterviewInvitation
    const invitation = await this.prisma.interviewInvitation.create({
      data: {
        roomId: room.id,
        applicationId: app.id,
        applicantId: app.applicantId,
        interviewerId: dto.interviewerId || app.applicantId,
        proposedTime: dto.scheduledAt,
        durationMinutes: duration,
        status: InvitationStatus.PENDING,
      },
    });

    // 6. Update Application Status
    await this.prisma.jobApplication.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.INTERVIEW_INVITED },
    });

    return {
      success: true,
      roomId: room.id,
      invitationId: invitation.id,
      room,
    };
  }

  async listInterviews(userId: string, role: string) {
    if (role === UserRole.ADMIN || role === UserRole.CONSULTANT) {
      return this.prisma.interviewRoom.findMany({
        include: {
          application: { include: { opportunity: true } },
          applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
          interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
          scorecard: true,
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    return this.prisma.interviewRoom.findMany({
      where: { applicantId: userId },
      include: {
        application: { include: { opportunity: true } },
        interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        scorecard: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getInterviewById(roomId: string, userId: string, role: string) {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
      include: {
        application: {
          include: {
            opportunity: true,
            cv: true,
            coverLetter: true,
          },
        },
        applicant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        interviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        stages: {
          include: {
            questions: {
              include: { answers: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        technicalAssessment: {
          include: {
            challenges: {
              include: {
                submissions: {
                  include: { executions: true },
                },
              },
            },
          },
        },
        scorecard: true,
        invitations: true,
      },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    if (role === UserRole.APPLICANT && room.applicantId !== userId) {
      throw new ForbiddenException('Access denied: You cannot view interviews for other candidates.');
    }

    return room;
  }

  async respondInvitation(
    invitationId: string,
    applicantId: string,
    response: 'ACCEPT' | 'DECLINE' | 'RESCHEDULE',
    proposedTime?: Date,
  ) {
    const inv = await this.prisma.interviewInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!inv || inv.applicantId !== applicantId) {
      throw new NotFoundException('Invitation not found or unauthorized');
    }

    let status = InvitationStatus.ACCEPTED;
    if (response === 'DECLINE') status = InvitationStatus.DECLINED;
    if (response === 'RESCHEDULE') status = InvitationStatus.RESCHEDULE_REQUESTED;

    const updated = await this.prisma.interviewInvitation.update({
      where: { id: invitationId },
      data: {
        status,
        proposedTime: proposedTime || inv.proposedTime,
        notes: proposedTime ? `Reschedule requested to ${proposedTime.toISOString()}` : undefined,
      },
    });

    if (status === InvitationStatus.ACCEPTED) {
      await this.prisma.interviewRoom.update({
        where: { id: inv.roomId },
        data: { status: InterviewRoomStatus.SCHEDULED },
      });
    }

    return updated;
  }

  async joinRoom(roomId: string, userId: string) {
    // 1. Compliance authorization check
    const compliance = await this.complianceAgent.verifyParticipantAccess(roomId, userId);

    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
      include: {
        application: { include: { opportunity: true } },
        stages: { include: { questions: true } },
        technicalAssessment: { include: { challenges: true } },
      },
    });

    if (!room) throw new NotFoundException('Room not found');

    // Update room status to LIVE if scheduled
    if (room.status === InterviewRoomStatus.SCHEDULED || room.status === InterviewRoomStatus.WAITING) {
      await this.prisma.interviewRoom.update({
        where: { id: roomId },
        data: {
          status: InterviewRoomStatus.LIVE,
          startedAt: room.startedAt || new Date(),
        },
      });
    }

    // Register participant
    const existing = await this.prisma.interviewParticipant.findFirst({
      where: { roomId, userId },
    });

    if (!existing) {
      await this.prisma.interviewParticipant.create({
        data: {
          roomId,
          userId,
          role: compliance.participantRole,
        },
      });
    }

    return {
      success: true,
      roomId,
      role: compliance.participantRole,
      title: room.title,
      roomStatus: room.status,
      stages: room.stages,
      challenges: room.technicalAssessment?.challenges || [],
      privacyNotice: 'Under German privacy regulations, no recording or biometric analysis is conducted without explicit authorization.',
    };
  }

  async submitAnswer(
    roomId: string,
    questionId: string,
    applicantId: string,
    answerText: string,
  ) {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    if (room.applicantId !== applicantId) {
      throw new ForbiddenException('Access denied: You cannot submit answers to another candidate\'s interview.');
    }

    if (room.status === InterviewRoomStatus.CANCELLED || room.status === InterviewRoomStatus.COMPLETED) {
      throw new BadRequestException('Cannot submit answers to a completed or cancelled interview.');
    }

    const question = await this.prisma.interviewQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new NotFoundException('Question not found');

    const answer = await this.prisma.interviewAnswer.create({
      data: {
        questionId,
        applicantId,
        answerText,
      },
    });

    // Invoke LiveInterviewAgent in the background to provide live intelligence to the interviewer
    let liveIntel;
    try {
      liveIntel = await this.liveAgent.generateInterviewerAssistance(
        roomId,
        question.questionText,
        answerText,
      );

      await this.prisma.interviewRoom.update({
        where: { id: roomId },
        data: { liveIntelligence: liveIntel as any },
      });
    } catch (e: any) {
      this.logger.warn(`Live intelligence generation fallback: ${e.message}`);
    }

    return {
      success: true,
      answer,
      liveIntelligence: liveIntel,
    };
  }

  async runCode(
    roomId: string,
    userId: string,
    role: string,
    challengeId: string,
    language: string,
    sourceCode: string,
  ) {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    if (role === UserRole.APPLICANT && room.applicantId !== userId) {
      throw new ForbiddenException('Access denied: You cannot run code in an interview belonging to another candidate.');
    }

    if (room.status === InterviewRoomStatus.CANCELLED || room.status === InterviewRoomStatus.COMPLETED) {
      throw new BadRequestException('Code execution is disabled for completed or cancelled interviews.');
    }

    const challenge = await this.prisma.codingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    const testCases = (challenge.testCases as any[]) || [];

    const result = await this.codeRunner.executeCode(
      language,
      sourceCode,
      testCases,
    );

    // Save CodeExecution record
    const execution = await this.prisma.codeExecution.create({
      data: {
        roomId,
        userId,
        language,
        sourceCode,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTimeMs: result.executionTimeMs,
        memoryKb: result.memoryKb,
        passed: result.passed,
        testResults: result.testResults as any,
      },
    });

    return {
      success: true,
      executionId: execution.id,
      ...result,
    };
  }

  async submitCode(
    roomId: string,
    userId: string,
    role: string,
    challengeId: string,
    language: string,
    sourceCode: string,
  ) {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    if (role === UserRole.APPLICANT && room.applicantId !== userId) {
      throw new ForbiddenException('Access denied: You cannot submit code for another candidate\'s interview.');
    }

    if (room.status === InterviewRoomStatus.CANCELLED || room.status === InterviewRoomStatus.COMPLETED) {
      throw new BadRequestException('Code submission is disabled for completed or cancelled interviews.');
    }

    const challenge = await this.prisma.codingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    const testCases = (challenge.testCases as any[]) || [];
    const result = await this.codeRunner.executeCode(
      language,
      sourceCode,
      testCases,
    );

    // Create CodeSubmission
    const submission = await this.prisma.codeSubmission.create({
      data: {
        challengeId,
        userId,
        language,
        sourceCode,
        status: result.passed ? 'PASSED' : 'FAILED',
      },
    });

    // Link Execution to Submission
    await this.prisma.codeExecution.create({
      data: {
        submissionId: submission.id,
        roomId,
        userId,
        language,
        sourceCode,
        stdout: result.stdout,
        stderr: result.stderr,
        executionTimeMs: result.executionTimeMs,
        memoryKb: result.memoryKb,
        passed: result.passed,
        testResults: result.testResults as any,
      },
    });

    return {
      success: true,
      submissionId: submission.id,
      status: submission.status,
      ...result,
    };
  }

  async evaluateInterview(roomId: string, userId: string, role: string) {
    if (role === UserRole.APPLICANT) {
      throw new ForbiddenException('Candidates are not authorized to trigger interview evaluations.');
    }

    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    this.logger.log(`Evaluating interview room ${roomId} by user ${userId}`);

    const result = await this.evaluationAgent.evaluateInterview(roomId);

    await this.prisma.interviewRoom.update({
      where: { id: roomId },
      data: {
        status: InterviewRoomStatus.COMPLETED,
        endedAt: new Date(),
      },
    });

    return {
      success: true,
      evaluation: result,
    };
  }

  async getScorecard(roomId: string, userId: string, role: string) {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    if (role === UserRole.APPLICANT) {
      throw new ForbiddenException('Candidates are not permitted to view internal interview scorecards.');
    }

    const card = await this.prisma.interviewScorecard.findUnique({
      where: { roomId },
      include: { evaluator: { select: { firstName: true, lastName: true, email: true } } },
    });

    return card;
  }

  async updateScorecard(roomId: string, evaluatorId: string, role: string, data: any) {
    if (role === UserRole.APPLICANT) {
      throw new ForbiddenException('Candidates are not permitted to update interview scorecards.');
    }

    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Interview room not found');

    const existing = await this.prisma.interviewScorecard.findUnique({
      where: { roomId },
    });

    if (existing) {
      return this.prisma.interviewScorecard.update({
        where: { id: existing.id },
        data: {
          ...data,
          evaluatorId,
        },
      });
    }

    return this.prisma.interviewScorecard.create({
      data: {
        roomId,
        evaluatorId,
        ...data,
      },
    });
  }
}
