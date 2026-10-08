import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentExecutionStatus, ReviewStatus, DocumentStatus } from '../../common/enums';
import { AiService } from '../../ai/ai.service';
import { ConsistencyAgent } from './consistency.agent';
import { MissingInfoAgent } from './missing-info.agent';
import { QualificationService } from '../../qualification/qualification.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { RecommendationsService } from '../../recommendations/recommendations.service';
import { JourneyService } from '../../journey/journey.service';
import { CvService } from '../../cv/cv.service';
import { DocumentsService } from '../../documents/documents.service';

export interface PlanningDecision {
  iteration: number;
  chosenAgent: string;
  reason: string;
  observedState: Record<string, any>;
  timestamp: string;
}

export interface OrchestrationResult {
  orchestrationId: string;
  applicantId: string;
  iterationsRun: number;
  stopReason: string;
  executedAgents: string[];
  planningDecisions: PlanningDecision[];
  finalObservedState: Record<string, any>;
  nextBestAction: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly runningApplicants = new Set<string>();
  private readonly runningDocuments = new Set<string>();

  private readonly validAgents = [
    'DOCUMENT',
    'CONSISTENCY',
    'QUALIFICATION',
    'OPPORTUNITY',
    'ROUTING',
    'JOURNEY',
    'CV',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly consistencyAgent: ConsistencyAgent,
    private readonly missingInfoAgent: MissingInfoAgent,
    private readonly qualificationService: QualificationService,
    private readonly opportunitiesService: OpportunitiesService,
    private readonly recommendationsService: RecommendationsService,
    private readonly journeyService: JourneyService,
    private readonly cvService: CvService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
  ) {}

  async orchestrate(
    applicantId: string,
    maxIterations = 8,
    triggerSource = 'USER_EVENT',
  ): Promise<OrchestrationResult> {
    // 1. Concurrency guard: prevent concurrent runs for the same applicant
    if (this.runningApplicants.has(applicantId)) {
      this.logger.warn(`Orchestrator already running for applicant ${applicantId}. Skipping concurrent execution.`);
      return {
        orchestrationId: 'locked',
        applicantId,
        iterationsRun: 0,
        stopReason: 'CONCURRENT_EXECUTION_BLOCKED',
        executedAgents: [],
        planningDecisions: [],
        finalObservedState: {},
        nextBestAction: 'Wait for active orchestration to finish.',
      };
    }

    this.runningApplicants.add(applicantId);

    // Create Master Orchestrator parent AgentExecution record
    const parentExecution = await this.prisma.agentExecution.create({
      data: {
        agentType: 'ORCHESTRATOR',
        applicantId,
        status: AgentExecutionStatus.RUNNING,
        inputReference: `Trigger: ${triggerSource}`,
        startedAt: new Date(),
        triggeredBy: triggerSource,
      },
    });

    const executedAgents: string[] = [];
    const planningDecisions: PlanningDecision[] = [];
    let iterations = 0;
    let stopReason = 'MAX_ITERATIONS_REACHED';
    let nextBestAction = 'Continue your onboarding journey.';
    let lastObservedState: Record<string, any> = {};

    try {
      while (iterations < maxIterations) {
        iterations++;

        // --- STEP 1: OBSERVE shared applicant state from PostgreSQL ---
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

        if (!profile) {
          stopReason = 'PROFILE_NOT_FOUND';
          break;
        }

        const documents = await this.prisma.document.findMany({ where: { applicantId } });
        const videos = await this.prisma.video.findMany({ where: { applicantId } });
        const latestAssessment = await this.prisma.qualificationAssessment.findFirst({
          where: { applicantId },
          orderBy: { evaluatedAt: 'desc' },
        });
        const openReview = await this.prisma.consultantReview.findFirst({
          where: { applicantId, status: ReviewStatus.PENDING },
        });
        const matches = await this.prisma.opportunityMatch.findMany({
          where: { applicantId },
        });
        const recommendation = await this.prisma.nextStepRecommendation.findFirst({
          where: { applicantId, status: 'ACTIVE' },
        });

        lastObservedState = {
          goal: profile.currentGoal,
          profileCompleteness: profile.profileCompleteness,
          documentsCount: documents.length,
          unprocessedDocumentsCount: documents.filter((d) => d.status === DocumentStatus.UPLOADED).length,
          videosCount: videos.length,
          hasAssessment: !!latestAssessment,
          assessmentScore: latestAssessment?.score,
          assessmentStatus: latestAssessment?.status,
          hasMatches: matches.length > 0,
          hasRecommendation: !!recommendation,
          hasOpenConsultantReview: !!openReview,
        };

        // Check STOP CONDITIONS
        if (openReview) {
          stopReason = 'CONSULTANT_REVIEW_PENDING';
          nextBestAction = 'Your dossier is currently undergoing human consultant review. An advisor will contact you shortly.';
          break;
        }

        // --- STEP 2: PLAN with Schema Validation & Fallback to Rule Order ---
        let plannedAgent: string | null = null;
        let planningReason = '';

        // Deterministic rule-order milestones
        if (lastObservedState.unprocessedDocumentsCount > 0 && !executedAgents.includes('DOCUMENT')) {
          plannedAgent = 'DOCUMENT';
          planningReason = 'Unprocessed documents detected. Invoking Document Agent to extract credentials.';
        } else if (documents.length > 0 && !executedAgents.includes('CONSISTENCY')) {
          plannedAgent = 'CONSISTENCY';
          planningReason = 'Verifying consistency between applicant declarations and uploaded documents.';
        } else if (!latestAssessment && profile.educations?.length && !executedAgents.includes('QUALIFICATION')) {
          plannedAgent = 'QUALIFICATION';
          planningReason = 'Profile credentials sufficiently established. Running qualification assessment.';
        } else if (latestAssessment && matches.length === 0 && !executedAgents.includes('OPPORTUNITY')) {
          plannedAgent = 'OPPORTUNITY';
          planningReason = 'Qualification outcome available. Finding database-backed opportunity matches.';
        } else if (latestAssessment && !executedAgents.includes('ROUTING')) {
          // Educaro Routing Agent is invoked right after opportunity matching
          plannedAgent = 'ROUTING';
          planningReason = 'Evaluating Educaro routing rules to recommend optimal service or action.';
        } else if (!executedAgents.includes('JOURNEY')) {
          plannedAgent = 'JOURNEY';
          planningReason = 'Syncing dynamic journey steps with current state.';
        } else {
          stopReason = 'WORKFLOW_UP_TO_DATE';
          const nextAct = await this.journeyService.getNextAction(applicantId);
          nextBestAction = nextAct.message;
          break;
        }

        // Validate planned agent schema
        if (!this.validAgents.includes(plannedAgent)) {
          this.logger.warn(`Invalid planned agent "${plannedAgent}". Falling back to rule order.`);
          plannedAgent = 'JOURNEY';
          planningReason = 'Fallback to journey sync.';
        }

        // Store Planning Decision
        const decision: PlanningDecision = {
          iteration: iterations,
          chosenAgent: plannedAgent,
          reason: planningReason,
          observedState: { ...lastObservedState },
          timestamp: new Date().toISOString(),
        };
        planningDecisions.push(decision);

        // Create Child AgentExecution linked to Parent
        const childExecution = await this.prisma.agentExecution.create({
          data: {
            agentType: plannedAgent,
            applicantId,
            parentExecutionId: parentExecution.id,
            status: AgentExecutionStatus.RUNNING,
            inputReference: `Iteration ${iterations}: ${planningReason}`,
            triggeredBy: 'ORCHESTRATOR_LOOP',
            startedAt: new Date(),
          },
        });

        this.logger.log(`[Iteration ${iterations}] Running Child Agent: ${plannedAgent} (${planningReason})`);
        executedAgents.push(plannedAgent);

        // --- STEP 3: ACT ---
        let childOutput: Record<string, any> = {};

        try {
          if (plannedAgent === 'DOCUMENT') {
            const unprocessedDocs = documents.filter((d) => d.status === DocumentStatus.UPLOADED);
            for (const doc of unprocessedDocs) {
              if (!this.runningDocuments.has(doc.id)) {
                this.runningDocuments.add(doc.id);
                try {
                  await this.documentsService.analyzeDocument(doc.id, applicantId);
                } finally {
                  this.runningDocuments.delete(doc.id);
                }
              }
            }
            childOutput = { processedCount: unprocessedDocs.length };
          } else if (plannedAgent === 'CONSISTENCY') {
            const consistencyResult = await this.consistencyAgent.checkConsistency(
              profile,
              documents,
              videos,
              childExecution.id,
            );
            childOutput = consistencyResult;

            // Escalate to consultant review if inconsistencies found
            if (consistencyResult.hasInconsistencies) {
              const highSeverity = consistencyResult.findings.find((f) => f.severity === 'HIGH');
              if (highSeverity) {
                stopReason = 'CONSULTANT_REFERRAL_REQUIRED';
                nextBestAction = 'Discrepancy detected between self-reported information and uploaded credentials. Educaro consultant review opened.';
                break;
              }
            }
          } else if (plannedAgent === 'QUALIFICATION') {
            const assessment = await this.qualificationService.evaluateApplicant(
              applicantId,
              childExecution.id,
            );
            childOutput = { score: assessment.score, status: assessment.status };
          } else if (plannedAgent === 'OPPORTUNITY') {
            const matchResults = await this.opportunitiesService.matchApplicant(
              applicantId,
              childExecution.id,
            );
            childOutput = { matchesCount: matchResults.length };
          } else if (plannedAgent === 'ROUTING') {
            const recResult = await this.recommendationsService.refreshRecommendation(
              applicantId,
              childExecution.id,
            );
            childOutput = { recommendationTitle: recResult.title, type: recResult.type };
          } else if (plannedAgent === 'JOURNEY') {
            const jResult = await this.journeyService.getApplicantJourney(applicantId);
            childOutput = { progress: jResult.progressPercentage, state: jResult.currentState };
          }

          // Mark Child Execution Completed
          await this.prisma.agentExecution.update({
            where: { id: childExecution.id },
            data: {
              status: AgentExecutionStatus.COMPLETED,
              output: childOutput,
              completedAt: new Date(),
            },
          });
        } catch (actErr: any) {
          this.logger.error(`Child agent ${plannedAgent} failed: ${actErr.message}`);
          await this.prisma.agentExecution.update({
            where: { id: childExecution.id },
            data: {
              status: AgentExecutionStatus.FAILED,
              error: actErr.message,
              completedAt: new Date(),
            },
          });
          // Non-fatal: continue loop or break if fatal
        }
      }
    } catch (err: any) {
      this.logger.error(`Orchestrator error: ${err.message}`, err.stack);
      await this.prisma.agentExecution.update({
        where: { id: parentExecution.id },
        data: {
          status: AgentExecutionStatus.FAILED,
          error: err.message,
        },
      });
    } finally {
      this.runningApplicants.delete(applicantId);

      await this.prisma.agentExecution.update({
        where: { id: parentExecution.id },
        data: {
          status: AgentExecutionStatus.COMPLETED,
          completedAt: new Date(),
          output: {
            iterationsRun: iterations,
            stopReason,
            executedAgents,
            planningDecisions,
            finalObservedState: lastObservedState,
            nextBestAction,
          } as any,
        },
      });
    }

    return {
      orchestrationId: parentExecution.id,
      applicantId,
      iterationsRun: iterations,
      stopReason,
      executedAgents,
      planningDecisions,
      finalObservedState: lastObservedState,
      nextBestAction,
    };
  }
}
