import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { InterviewGateway } from './interview.gateway';
import { CodeExecutionService } from './code-execution.service';
import { DockerSandboxAdapter } from './sandbox/docker-sandbox.adapter';
import { RemoteSandboxAdapter } from './sandbox/remote-sandbox.adapter';
import { InterviewPlanningAgent } from '../agents/interview-planning.agent';
import { TechnicalAssessmentAgent } from '../agents/technical-assessment.agent';
import { LiveInterviewAgent } from '../agents/live-interview.agent';
import { InterviewEvaluationAgent } from '../agents/interview-evaluation.agent';
import { InterviewComplianceAgent } from '../agents/interview-compliance.agent';

@Module({
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    InterviewGateway,
    CodeExecutionService,
    DockerSandboxAdapter,
    RemoteSandboxAdapter,
    InterviewPlanningAgent,
    TechnicalAssessmentAgent,
    LiveInterviewAgent,
    InterviewEvaluationAgent,
    InterviewComplianceAgent,
  ],
  exports: [InterviewsService, InterviewGateway, CodeExecutionService, DockerSandboxAdapter, RemoteSandboxAdapter],
})
export class InterviewsModule {}
