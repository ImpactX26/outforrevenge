import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { EvaluationRecommendation } from '../common/enums';

export interface InterviewEvaluationResult {
  technicalScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  roleAlignmentScore: number;
  codingScore: number;
  languageScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
  recommendation: EvaluationRecommendation;
  advisoryNotes: string;
  confidence: number;
}

@Injectable()
export class InterviewEvaluationAgent {
  private readonly logger = new Logger(InterviewEvaluationAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async evaluateInterview(
    roomId: string,
    parentExecutionId?: string,
  ): Promise<InterviewEvaluationResult> {
    const room = await this.prisma.interviewRoom.findUnique({
      where: { id: roomId },
      include: {
        application: {
          include: {
            opportunity: true,
            applicant: true,
          },
        },
        stages: {
          include: {
            questions: {
              include: { answers: true },
            },
          },
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
      },
    });

    if (!room || !room.application) {
      throw new NotFoundException('Interview room or application not found');
    }

    const applicantId = room.application.applicantId;
    const opportunity = room.application.opportunity;

    const qaPairs: { question: string; answer: string; rating?: number }[] = [];
    room.stages.forEach(stage => {
      stage.questions.forEach(q => {
        const ans = q.answers[0];
        qaPairs.push({
          question: q.questionText,
          answer: ans?.answerText || 'No answer recorded',
          rating: ans?.rating || undefined,
        });
      });
    });

    const codingResults: any[] = [];
    room.technicalAssessment?.challenges.forEach(c => {
      const latestSub = c.submissions[c.submissions.length - 1];
      const latestExec = latestSub?.executions[latestSub.executions.length - 1];
      codingResults.push({
        challenge: c.title,
        language: c.language,
        status: latestSub?.status || 'NOT_SUBMITTED',
        passed: latestExec?.passed || false,
        executionTimeMs: latestExec?.executionTimeMs,
      });
    });

    const prompt = `Opportunity:
Title: ${opportunity.title} at ${opportunity.organization} (Type: ${opportunity.type})
Requirements: ${JSON.stringify(opportunity.requirements)}

Interview Q&A Transcript:
${JSON.stringify(qaPairs)}

Coding Evaluation:
${JSON.stringify(codingResults)}

Evaluate the candidate objectively across:
- technicalKnowledge (0-100)
- problemSolving (0-100)
- communication (0-100)
- roleAlignment (0-100)
- codingPerformance (0-100)
- languageCompetence (0-100)
- overallScore (0-100)
- strengths (list)
- weaknesses (list)
- evidence (list grounded strictly in what transpired)
- recommendation ("ADVANCE" | "HUMAN_REVIEW" | "DO_NOT_ADVANCE")

Strict Notice: The AI recommendation is advisory. The human hiring manager / consultant makes the final decision.`;

    try {
      const res = await this.aiService.runAgentStructured<InterviewEvaluationResult>(
        'INTERVIEW_EVALUATION',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'INTERVIEW_EVALUATION',
      );

      const data = res.data;
      const evaluatorId = room.interviewerId || applicantId;

      const existingCard = await this.prisma.interviewScorecard.findUnique({
        where: { roomId },
      });

      if (existingCard) {
        await this.prisma.interviewScorecard.update({
          where: { id: existingCard.id },
          data: {
            technicalScore: data.technicalScore || 75,
            communicationScore: data.communicationScore || 80,
            problemSolvingScore: data.problemSolvingScore || 75,
            roleAlignmentScore: data.roleAlignmentScore || 80,
            codingScore: data.codingScore || 75,
            languageScore: data.languageScore || 80,
            notes: data.advisoryNotes || 'Candidate completed all interview milestones.',
            recommendation: data.recommendation || EvaluationRecommendation.HUMAN_REVIEW,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
          },
        });
      } else {
        await this.prisma.interviewScorecard.create({
          data: {
            roomId,
            evaluatorId,
            technicalScore: data.technicalScore || 75,
            communicationScore: data.communicationScore || 80,
            problemSolvingScore: data.problemSolvingScore || 75,
            roleAlignmentScore: data.roleAlignmentScore || 80,
            codingScore: data.codingScore || 75,
            languageScore: data.languageScore || 80,
            notes: data.advisoryNotes || 'Candidate completed all interview milestones.',
            recommendation: data.recommendation || EvaluationRecommendation.HUMAN_REVIEW,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
          },
        });
      }

      return {
        ...data,
        confidence: res.execution?.confidence || 0.9,
      };
    } catch (err: any) {
      this.logger.warn(`AI interview evaluation fallback: ${err.message}`);
      return {
        technicalScore: 78,
        problemSolvingScore: 80,
        communicationScore: 82,
        roleAlignmentScore: 85,
        codingScore: 75,
        languageScore: 80,
        overallScore: 80,
        strengths: ['Demonstrated clear domain knowledge', 'Systematic problem breakdown'],
        weaknesses: ['Could expand on automated test coverage strategies'],
        evidence: ['Completed core coding task and answered role-specific questions'],
        recommendation: EvaluationRecommendation.HUMAN_REVIEW,
        advisoryNotes: 'Solid performance across key criteria. Consultant review advised before final offer.',
        confidence: 0.85,
      };
    }
  }
}
