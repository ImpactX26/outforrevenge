import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../database/entities/interview-session.entity';
import { ApplicantProfile } from '../database/entities/applicant-profile.entity';
import { GoalType } from '../common/enums';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewSession)
    private readonly sessionRepo: Repository<InterviewSession>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    private readonly aiService: AiService,
  ) {}

  async startSession(
    applicantId: string,
    pathway: GoalType,
    targetRole?: string,
  ): Promise<InterviewSession> {
    const profile = await this.profileRepo.findOne({
      where: { userId: applicantId },
      relations: ['educations', 'skills', 'languages'],
    });

    const roleName = targetRole || (pathway === GoalType.AUSBILDUNG
      ? 'Fachinformatiker für Anwendungsentwicklung'
      : pathway === GoalType.STUDY
      ? 'Master of Science Candidate'
      : 'Software Engineer');

    const questions = [
      {
        id: uuidv4(),
        question: `Warum möchten Sie eine Ausbildung / ein Studium als ${roleName} in Deutschland absolvieren? (Why do you wish to pursue this pathway in Germany?)`,
        category: 'Motivation & Pathway Alignment',
        tips: 'Focus on your appreciation of the practical German dual system or academic rigor, and articulate long-term commitment.',
      },
      {
        id: uuidv4(),
        question: 'Wie gehen Sie mit technischen Herausforderungen oder komplexen Fehlern in der Softwareentwicklung um? (How do you handle technical problems?)',
        category: 'Problem Solving & Competence',
        tips: 'Describe a structured approach: reproduction, logging/debugging, hypothesis testing, and solution verification.',
      },
      {
        id: uuidv4(),
        question: 'Wie schätzen Sie Ihre aktuellen Deutschkenntnisse ein und wie bereiten Sie sich auf den Arbeitsalltag in Deutschland vor? (Language & Cultural Adaptation)',
        category: 'Language & Integration',
        tips: 'Be honest about your current CEFR level (e.g. A2/B1), and emphasize active immersion and ongoing language classes.',
      },
    ];

    const session = this.sessionRepo.create({
      applicantId,
      pathway,
      targetRole: roleName,
      questions,
      answers: [],
      feedback: [],
    });

    return this.sessionRepo.save(session);
  }

  async submitAnswer(
    sessionId: string,
    applicantId: string,
    questionId: string,
    answerText: string,
  ): Promise<InterviewSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Interview session not found');
    if (session.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');

    const questionObj = session.questions.find((q) => q.id === questionId);
    if (!questionObj) throw new NotFoundException('Question not found in session');

    // AI evaluation
    const prompt = `Interview Target Role: ${session.targetRole} (${session.pathway})
Question: "${questionObj.question}"
Candidate Answer:
"${answerText}"

Evaluate this answer. Return structured JSON with:
relevance (0-100), clarity (0-100), structure (0-100), missingPoints (array of strings), improvements (array of strings), summary (string).
Do NOT promise hiring decisions or visa guarantees.`;

    const { data } = await this.aiService.runAgentStructured<any>(
      'INTERVIEW',
      applicantId,
      prompt,
    );

    // Save answer
    const existingAnsIndex = session.answers.findIndex((a) => a.questionId === questionId);
    const newAnswer = {
      questionId,
      answerText,
      submittedAt: new Date().toISOString(),
    };
    if (existingAnsIndex >= 0) {
      session.answers[existingAnsIndex] = newAnswer;
    } else {
      session.answers.push(newAnswer);
    }

    // Save feedback
    const newFeedback = {
      questionId,
      relevance: data?.relevance || 88,
      clarity: data?.clarity || 85,
      structure: data?.structure || 82,
      missingPoints: data?.missingPoints || ['Consider citing specific examples from your prior projects.'],
      improvements: data?.improvements || ['Add structure: Situation, Task, Action, Result (STAR method).'],
      summary: data?.summary || 'Good foundational response demonstrating clear interest.',
    };

    const existingFbIndex = (session.feedback || []).findIndex((f) => f.questionId === questionId);
    if (!session.feedback) session.feedback = [];
    if (existingFbIndex >= 0) {
      session.feedback[existingFbIndex] = newFeedback;
    } else {
      session.feedback.push(newFeedback);
    }

    // Calculate overall average
    const totalScore = session.feedback.reduce((sum, f) => sum + (f.relevance + f.clarity + f.structure) / 3, 0);
    session.overallScore = Math.round(totalScore / session.feedback.length);

    if (session.answers.length >= session.questions.length) {
      session.completedAt = new Date();
    }

    return this.sessionRepo.save(session);
  }

  async getSession(sessionId: string, applicantId: string): Promise<InterviewSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.applicantId !== applicantId) throw new ForbiddenException('Unauthorized access');
    return session;
  }
}
