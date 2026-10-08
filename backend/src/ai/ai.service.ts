import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAiProvider,
  AI_PROVIDER_TOKEN,
} from './providers/ai-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AgentExecutionStatus } from '../common/enums';
import { AGENT_PROMPTS } from './prompts/agent-prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IAiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async runAgentStructured<T>(
    agentType: string,
    applicantId: string | undefined,
    userPrompt: string,
    schema?: Record<string, any>,
    parentExecutionId?: string,
    triggeredBy = 'ORCHESTRATOR',
  ): Promise<{ data: T; execution: any }> {
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.ORCHESTRATOR;

    const savedExecution = await this.prisma.agentExecution.create({
      data: {
        agentType,
        applicantId,
        status: AgentExecutionStatus.RUNNING,
        inputReference: userPrompt.slice(0, 500),
        parentExecutionId,
        triggeredBy,
        startedAt: new Date(),
      },
    });

    try {
      const data = await this.aiProvider.generateStructured<T>({
        systemPrompt,
        userPrompt,
        schema,
      });

      const updated = await this.prisma.agentExecution.update({
        where: { id: savedExecution.id },
        data: {
          status: AgentExecutionStatus.COMPLETED,
          output: (data as any) || {},
          confidence: (data as any)?.confidence || 0.95,
          completedAt: new Date(),
        },
      });

      return { data, execution: updated };
    } catch (err: any) {
      this.logger.error(`Agent execution error [${agentType}]: ${err.message}`);
      await this.prisma.agentExecution.update({
        where: { id: savedExecution.id },
        data: {
          status: AgentExecutionStatus.FAILED,
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  async runAgentText(agentType: string, userPrompt: string): Promise<string> {
    const systemPrompt = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.ORCHESTRATOR;
    return this.aiProvider.generateText({ systemPrompt, userPrompt });
  }

  async chatWithContext(
    applicantId: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    // Record AgentExecution for context-aware chat
    const execution = await this.prisma.agentExecution.create({
      data: {
        agentType: 'ASSISTANT_CHAT',
        applicantId,
        status: AgentExecutionStatus.RUNNING,
        inputReference: messages[messages.length - 1]?.content.slice(0, 500) || '',
        triggeredBy: 'USER_CHAT',
        startedAt: new Date(),
      },
    });

    try {
      // 1. Load real applicant state from PostgreSQL
      const profile = await this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: {
          user: true,
          educations: true,
          employments: true,
          skills: true,
          languages: true,
        },
      });

      const rawDocuments = await this.prisma.document.findMany({
        where: { applicantId },
        include: { extraction: true },
      });
      const documents = rawDocuments.map((d) => ({
        id: d.id,
        filename: d.filename,
        documentType: d.documentType,
        status: d.status,
        hasExtraction: Boolean(d.extraction),
      }));

      const assessment = await this.prisma.qualificationAssessment.findFirst({
        where: { applicantId },
        orderBy: { evaluatedAt: 'desc' },
      });

      const matches = await this.prisma.opportunityMatch.findMany({
        where: { applicantId },
        include: { opportunity: true },
        orderBy: { matchPercentage: 'desc' },
        take: 3,
      });

      const journey = await this.prisma.journey.findUnique({
        where: { applicantId },
        include: { steps: true },
      });

      const recommendation = await this.prisma.nextStepRecommendation.findFirst({
        where: { applicantId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      const cv = await this.prisma.cV.findFirst({
        where: { applicantId },
        orderBy: { version: 'desc' },
      });

      // Compact authorized snapshot (NEVER include other applicants)
      const snapshot = {
        name: profile?.user ? `${profile.user.firstName} ${profile.user.lastName}` : 'Applicant',
        goal: profile?.currentGoal || 'Not selected',
        profileCompleteness: profile?.profileCompleteness ?? 0,
        readinessScore: profile?.readinessScore ?? 0,
        location: profile?.location || 'Not provided',
        educations: profile?.educations?.map((e) => `${e.degree} at ${e.institution} (${e.graduationDate || 'Completed'})`) || [],
        employments: profile?.employments?.map((emp) => `${emp.role} at ${emp.companyName}`) || [],
        skills: profile?.skills?.map((s) => s.name) || [],
        languages: profile?.languages?.map((l) => `${l.language}: ${l.proficiencyLevel}`) || [],
        uploadedDocuments: documents.map((d) => `${d.filename} (${d.documentType})`),
        qualificationAssessment: assessment
          ? {
              status: assessment.status,
              score: assessment.score,
              satisfied: (assessment.satisfiedRequirements as any[])?.map((s) => s.title) || [],
              missing: (assessment.missingRequirements as any[])?.map((m) => m.title) || [],
            }
          : null,
        topOpportunityMatches: matches.map((m) => `${m.opportunity?.title} (${m.matchPercentage}% match)`),
        currentJourneyState: journey?.currentState || 'ONBOARDING',
        journeyProgress: journey?.progressPercentage ?? 0,
        recommendedNextStep: recommendation ? `${recommendation.title}: ${recommendation.reason}` : null,
        cvCreated: Boolean(cv),
      };

      const systemPrompt = `You are Nexora, an elite, highly knowledgeable and empathetic AI Relocation & Qualification Advisor for moving, studying, or pursuing vocational training (Ausbildung) and employment in Germany.
You are assisting this specific applicant with their genuine journey.

CRITICAL POLICY:
1. Base your answers strictly on the verified applicant state provided below.
2. If the user asks about an aspect of their status, eligibility, or missing items that is NOT supported or known from this data, reply exactly:
"I don't have enough verified information to answer that yet. Please complete your profile or upload the relevant document."
3. Never invent academic credentials, companies, or test scores.
4. Do NOT promise visas, guaranteed admissions, or guaranteed job placements.

VERIFIED APPLICANT SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}`;

      const reply = await this.aiProvider.chat({
        systemPrompt,
        messages,
      });

      await this.prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: AgentExecutionStatus.COMPLETED,
          output: { replyLength: reply.length },
          completedAt: new Date(),
        },
      });

      return reply;
    } catch (err: any) {
      await this.prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: AgentExecutionStatus.FAILED,
          error: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  async getRecentExecutions(applicantId?: string, limit = 20): Promise<any[]> {
    return this.prisma.agentExecution.findMany({
      where: applicantId ? { applicantId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
