import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export interface LiveInterviewSuggestion {
  suggestedFollowUp: string;
  competencyTested: string;
  profileEvidence: string[];
  missingEvidence: string[];
  decisionRationale: string;
  nextRecommendedTopic: string;
  warningFlags?: string[];
  confidence: number;
}

@Injectable()
export class LiveInterviewAgent {
  private readonly logger = new Logger(LiveInterviewAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateInterviewerAssistance(
    interviewRoomId: string,
    currentQuestionText: string,
    candidateAnswerText: string,
    parentExecutionId?: string,
  ): Promise<LiveInterviewSuggestion> {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: interviewRoomId },
      include: {
        application: {
          include: {
            opportunity: true,
            cv: true,
          },
        },
      },
    });

    if (!room || !room.application) {
      throw new Error('Interview room or linked application not found');
    }

    const applicantId = room.application.applicantId;
    const opportunity = room.application.opportunity;

    const [profile, previousAnswers] = await Promise.all([
      this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: { educations: true, employments: true, skills: true, languages: true },
      }),
      this.prisma.interviewAnswer.findMany({
        where: {
          question: {
            stage: {
              roomId: interviewRoomId,
            },
          },
        },
        include: { question: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const prompt = `Context:
Role: ${opportunity.title} at ${opportunity.organization}
Requirements: ${JSON.stringify(opportunity.requirements)}

Applicant Verified Profile:
Skills: ${JSON.stringify(profile?.skills?.map(s => s.name) || [])}
Employments: ${JSON.stringify(profile?.employments || [])}
CV Summary: ${room.application.cv?.summary || 'Not provided'}

Current Question Asked: "${currentQuestionText}"
Candidate Live Answer: "${candidateAnswerText}"

Past Answers: ${previousAnswers.map(a => `Q: ${a.question.questionText} -> A: ${a.answerText || 'No answer'}`).join(' | ')}

Strict Policy:
- Assist the human interviewer with intelligent, grounded follow-up questions.
- Identify profile evidence supporting or contradicting the candidate's claim.
- Identify missing evidence.
- Suggest whether to probe deeper or advance to the next competency.
- NEVER perform emotion detection, attractiveness scoring, or biometric facial analysis.`;

    try {
      const res = await this.aiService.runAgentStructured<LiveInterviewSuggestion>(
        'LIVE_INTERVIEW',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'LIVE_INTERVIEW_COPILOT',
      );

      return {
        ...res.data,
        confidence: res.execution?.confidence || 0.9,
      };
    } catch (err: any) {
      this.logger.warn(`AI live interview copilot fallback: ${err.message}`);
      return {
        suggestedFollowUp: 'Can you elaborate on how you handled edge cases and testing in that specific implementation?',
        competencyTested: 'Problem Solving & Quality Assurance',
        profileEvidence: profile?.skills?.map(s => s.name).slice(0, 3) || ['Relevant domain coursework'],
        missingEvidence: ['Specific production metrics', 'Test coverage statistics'],
        decisionRationale: 'Candidate responded to core question; probe for technical depth.',
        nextRecommendedTopic: 'Concurrency, memory safety, and performance constraints.',
        confidence: 0.8,
      };
    }
  }
}
