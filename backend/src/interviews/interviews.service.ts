import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoalType } from '../common/enums';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async startSession(
    applicantId: string,
    pathway: GoalType,
    targetRole?: string,
    opportunityId?: string,
  ): Promise<any> {
    let roleName = targetRole || (pathway === GoalType.AUSBILDUNG
      ? 'Fachinformatiker für Anwendungsentwicklung'
      : pathway === GoalType.STUDY
      ? 'Master of Science Candidate'
      : 'Software Engineer');

    if (opportunityId) {
      const opp = await this.prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (opp) {
        roleName = `${opp.title} (${opp.organization})`;
      }
    }

    const questions = [
      {
        id: uuidv4(),
        question: `Warum möchten Sie eine Ausbildung / ein Studium als ${roleName} in Deutschland absolvieren? (Why do you wish to pursue this pathway in Germany?)`,
        category: 'Motivation & Pathway Alignment',
        tips: 'Focus on your appreciation of the practical German dual system or academic rigor, and articulate long-term career commitment.',
      },
      {
        id: uuidv4(),
        question: `Wie gehen Sie mit technischen Herausforderungen oder komplexen Fehlern in der Rolle als ${roleName} um? (How do you handle technical challenges?)`,
        category: 'Problem Solving & Competence',
        tips: 'Describe a structured approach: reproduction, logging/debugging, hypothesis testing, and solution verification.',
      },
      {
        id: uuidv4(),
        question: 'Wie schätzen Sie Ihre aktuellen Deutschkenntnisse ein und wie bereiten Sie sich auf den Arbeitsalltag in Deutschland vor? (Language & Cultural Adaptation)',
        category: 'Language & Integration',
        tips: 'Be honest about your current CEFR level (e.g. A2/B1/B2), and emphasize active immersion and professional German etiquette.',
      },
      {
        id: uuidv4(),
        question: 'Sind Ihre Zeugnisse (APS, Anabin-Anerkennung, Sperrkonto) vorbereitet und wie planen Sie Ihren Umzug nach Deutschland? (Visa & Logistics Readiness)',
        category: 'Visa & Logistics Readiness',
        tips: 'Outline your documentation status including degree verification, financial proof, and your targeted arrival timeline.',
      },
    ];

    return this.prisma.interviewSession.create({
      data: {
        applicantId,
        pathway,
        targetRole: roleName,
        questions,
        answers: [],
        feedback: [],
      },
    });
  }

  async submitAnswer(
    sessionId: string,
    applicantId: string,
    questionId: string,
    answerText: string,
  ): Promise<any> {
    const session = await this.prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');

    const questions = session.questions as any[];
    const questionObj = questions.find((q) => q.id === questionId);
    if (!questionObj) throw new NotFoundException('Question not found in session');

    // AI evaluation
    const prompt = `Interview Target Role: ${session.targetRole} (${session.pathway})
Question: "${questionObj.question}"
Candidate Answer:
"${answerText}"

Evaluate this answer. Return structured JSON with:
relevance (number 0-100), clarity (number 0-100), structure (number 0-100), missingPoints (array of strings), improvements (array of strings), summary (string).
Do NOT promise hiring decisions or visa guarantees.`;

    const aiResponse = await this.aiService.runAgentStructured<any>(
      'INTERVIEW',
      applicantId,
      prompt,
    );

    const data = aiResponse?.data;
    if (!data) {
      throw new BadRequestException('AI feedback generation failed. Please retry.');
    }

    const answers = [...((session.answers as any[]) || [])];
    const existingAnsIndex = answers.findIndex((a) => a.questionId === questionId);
    const newAnswer = {
      questionId,
      answerText,
      submittedAt: new Date().toISOString(),
    };
    if (existingAnsIndex >= 0) {
      answers[existingAnsIndex] = newAnswer;
    } else {
      answers.push(newAnswer);
    }

    const feedbacks = [...((session.feedback as any[]) || [])];
    const newFeedback = {
      questionId,
      relevance: typeof data.relevance === 'number' ? data.relevance : 85,
      clarity: typeof data.clarity === 'number' ? data.clarity : 80,
      structure: typeof data.structure === 'number' ? data.structure : 80,
      missingPoints: Array.isArray(data.missingPoints) ? data.missingPoints : [],
      improvements: Array.isArray(data.improvements) ? data.improvements : [],
      summary: data.summary || 'Answer evaluated against professional German interview benchmarks.',
    };

    const existingFbIndex = feedbacks.findIndex((f) => f.questionId === questionId);
    if (existingFbIndex >= 0) {
      feedbacks[existingFbIndex] = newFeedback;
    } else {
      feedbacks.push(newFeedback);
    }

    // Calculate overall average
    const totalScore = feedbacks.reduce((sum, f) => sum + (f.relevance + f.clarity + f.structure) / 3, 0);
    const overallScore = Math.round(totalScore / feedbacks.length);

    let completedAt = session.completedAt;
    if (answers.length >= questions.length && !completedAt) {
      completedAt = new Date();
    }

    return this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        answers,
        feedback: feedbacks,
        overallScore,
        completedAt,
      },
    });
  }

  async getSession(sessionId: string, applicantId: string): Promise<any> {
    const session = await this.prisma.interviewSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');
    return session;
  }

  async getApplicantSessions(applicantId: string): Promise<any[]> {
    return this.prisma.interviewSession.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
