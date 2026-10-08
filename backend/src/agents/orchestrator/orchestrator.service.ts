import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from '../../database/entities/applicant-profile.entity';
import { Document } from '../../database/entities/document.entity';
import { Video } from '../../database/entities/video.entity';
import { QualificationAssessment } from '../../database/entities/qualification-assessment.entity';
import { AgentExecution } from '../../database/entities/agent-execution.entity';
import { ConsultantReview } from '../../database/entities/consultant-review.entity';
import { AgentExecutionStatus, ReviewStatus, DocumentStatus } from '../../common/enums';
import { AiService } from '../../ai/ai.service';
import { ConsistencyAgent } from './consistency.agent';
import { MissingInfoAgent } from './missing-info.agent';
import { QualificationService } from '../../qualification/qualification.service';
import { OpportunitiesService } from '../../opportunities/opportunities.service';
import { RecommendationsService } from '../../recommendations/recommendations.service';
import { JourneyService } from '../../journey/journey.service';
import { CvService } from '../../cv/cv.service';

export interface OrchestrationResult {
  orchestrationId: string;
  applicantId: string;
  iterationsRun: number;
  stopReason: string;
  executedAgents: string[];
  finalObservedState: Record<string, any>;
  nextBestAction: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly runningApplicants = new Set<string>(); // In-memory concurrency lock

  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepo: Repository<ApplicantProfile>,
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(QualificationAssessment)
    private readonly assessmentRepo: Repository<QualificationAssessment>,
    @InjectRepository(AgentExecution)
    private readonly executionRepo: Repository<AgentExecution>,
    @InjectRepository(ConsultantReview)
    private readonly reviewRepo: Repository<ConsultantReview>,
    private readonly aiService: AiService,
    private readonly consistencyAgent: ConsistencyAgent,
    private readonly missingInfoAgent: MissingInfoAgent,
    private readonly qualificationService: QualificationService,
    private readonly opportunitiesService: OpportunitiesService,
    private readonly recommendationsService: RecommendationsService,
    private readonly journeyService: JourneyService,
    private readonly cvService: CvService,
  ) {}

  async orchestrate(
    applicantId: string,
    maxIterations = 8,
    triggerSource = 'USER_EVENT',
  ): Promise<OrchestrationResult> {
    // 1. Concurrency guard: prevent two orchestrator loops for the same applicant at the same time
    if (this.runningApplicants.has(applicantId)) {
      this.logger.warn(`Orchestrator already running for applicant ${applicantId}. Skipping duplicate run.`);
      return {
        orchestrationId: 'locked',
        applicantId,
        iterationsRun: 0,
        stopReason: 'CONCURRENT_EXECUTION_BLOCKED',
        executedAgents: [],
        finalObservedState: {},
        nextBestAction: 'Wait for active orchestration to finish.',
      };
    }

    this.runningApplicants.add(applicantId);

    // Create Master Orchestrator AgentExecution record
    const orchestratorExecution = this.executionRepo.create({
      agentType: 'ORCHESTRATOR',
      applicantId,
      status: AgentExecutionStatus.RUNNING,
      inputReference: `Trigger: ${triggerSource}`,
      startedAt: new Date(),
      triggeredBy: triggerSource,
    });
    const savedOrchestrator = await this.executionRepo.save(orchestratorExecution);

    const executedAgents: string[] = [];
    let iterations = 0;
    let stopReason = 'MAX_ITERATIONS_REACHED';
    let nextBestAction = 'Continue your onboarding journey.';
    let lastObservedState: any = {};

    try {
      while (iterations < maxIterations) {
        iterations++;

        // --- STEP 1: OBSERVE shared applicant state from PostgreSQL ---
        const profile = await this.profileRepo.findOne({
          where: { userId: applicantId },
          relations: ['user', 'educations', 'employments', 'skills', 'languages'],
        });

        if (!profile) {
          stopReason = 'PROFILE_NOT_FOUND';
          break;
        }

        const documents = await this.docRepo.find({ where: { applicantId } });
        const videos = await this.videoRepo.find({ where: { applicantId } });
        const latestAssessment = await this.assessmentRepo.findOne({
          where: { applicantId },
          order: { evaluatedAt: 'DESC' },
        });
        const openReview = await this.reviewRepo.findOne({
          where: { applicantId, status: ReviewStatus.PENDING },
        });

        lastObservedState = {
          goal: profile.currentGoal,
          profileCompleteness: profile.profileCompleteness,
          documentsCount: documents.length,
          unprocessedDocumentsCount: documents.filter((d) => d.status === DocumentStatus.UPLOADED).length,
          videosCount: videos.length,
          hasAssessment: !!latestAssessment,
          assessmentScore: latestAssessment?.score,
          hasOpenConsultantReview: !!openReview,
        };

        // Check STOP CONDITIONS
        if (openReview) {
          stopReason = 'CONSULTANT_REVIEW_PENDING';
          nextBestAction = 'Your dossier is currently undergoing human consultant review. An advisor will contact you shortly.';
          break;
        }

        // --- STEP 2: PLAN (deterministic rules first, AI planner fallback) ---
        let plannedAgent: string | null = null;
        let planningReason = '';

        if (lastObservedState.unprocessedDocumentsCount > 0 && !executedAgents.includes('DOCUMENT')) {
          plannedAgent = 'DOCUMENT';
          planningReason = 'Unprocessed documents detected. Extracting credentials.';
        } else if (documents.length > 0 && !executedAgents.includes('CONSISTENCY')) {
          plannedAgent = 'CONSISTENCY';
          planningReason = 'Verifying consistency between applicant declarations and uploaded documents.';
        } else if (!latestAssessment && profile.educations?.length && !executedAgents.includes('QUALIFICATION')) {
          plannedAgent = 'QUALIFICATION';
          planningReason = 'Profile credentials sufficiently established. Running qualification assessment.';
        } else if (latestAssessment && !executedAgents.includes('OPPORTUNITY')) {
          plannedAgent = 'OPPORTUNITY';
          planningReason = 'Qualification outcome available. Finding database-backed opportunity matches.';
        } else if (latestAssessment && !executedAgents.includes('ROUTING')) {
          plannedAgent = 'ROUTING';
          planningReason = 'Evaluating Educaro routing rules to recommend the optimal next step.';
        } else if (!executedAgents.includes('JOURNEY')) {
          plannedAgent = 'JOURNEY';
          planningReason = 'Syncing dynamic journey steps with current state.';
        } else {
          // All priority automated agents have completed in this run
          stopReason = 'WORKFLOW_UP_TO_DATE';
          const nextAct = await this.journeyService.getNextAction(applicantId);
          nextBestAction = nextAct.message;
          break;
        }

        // --- STEP 3: ACT (execute the chosen specialized agent) ---
        this.logger.log(`[Iteration ${iterations}] Running Agent: ${plannedAgent} (${planningReason})`);
        executedAgents.push(plannedAgent);

        if (plannedAgent === 'DOCUMENT') {
          // Handled via documents service on upload
        } else if (plannedAgent === 'CONSISTENCY') {
          await this.consistencyAgent.checkConsistency(profile, documents, videos, savedOrchestrator.id);
        } else if (plannedAgent === 'QUALIFICATION') {
          await this.qualificationService.evaluateApplicant(applicantId, savedOrchestrator.id);
        } else if (plannedAgent === 'OPPORTUNITY') {
          await this.opportunitiesService.matchApplicant(applicantId, savedOrchestrator.id);
        } else if (plannedAgent === 'ROUTING') {
          await this.recommendationsService.refreshRecommendation(applicantId, savedOrchestrator.id);
        } else if (plannedAgent === 'JOURNEY') {
          await this.journeyService.getApplicantJourney(applicantId);
        }

        // Short sleep/yield before next loop iteration
      }
    } catch (err) {
      this.logger.error(`Orchestrator encountered error: ${err.message}`, err.stack);
      savedOrchestrator.status = AgentExecutionStatus.FAILED;
      savedOrchestrator.error = err.message;
    } finally {
      this.runningApplicants.delete(applicantId);

      savedOrchestrator.status = AgentExecutionStatus.COMPLETED;
      savedOrchestrator.completedAt = new Date();
      savedOrchestrator.output = {
        iterationsRun: iterations,
        stopReason,
        executedAgents,
        finalObservedState: lastObservedState,
        nextBestAction,
      };
      await this.executionRepo.save(savedOrchestrator);
    }

    return {
      orchestrationId: savedOrchestrator.id,
      applicantId,
      iterationsRun: iterations,
      stopReason,
      executedAgents,
      finalObservedState: lastObservedState,
      nextBestAction,
    };
  }
}
