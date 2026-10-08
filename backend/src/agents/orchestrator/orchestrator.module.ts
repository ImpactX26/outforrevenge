import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestratorService } from './orchestrator.service';
import { ConsistencyAgent } from './consistency.agent';
import { MissingInfoAgent } from './missing-info.agent';
import { AiController } from '../../ai/ai.controller';
import {
  ApplicantProfile,
  Document,
  Video,
  QualificationAssessment,
  AgentExecution,
  ConsultantReview,
} from '../../database/entities';
import { QualificationModule } from '../../qualification/qualification.module';
import { OpportunitiesModule } from '../../opportunities/opportunities.module';
import { RecommendationsModule } from '../../recommendations/recommendations.module';
import { JourneyModule } from '../../journey/journey.module';
import { CvModule } from '../../cv/cv.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantProfile,
      Document,
      Video,
      QualificationAssessment,
      AgentExecution,
      ConsultantReview,
    ]),
    QualificationModule,
    OpportunitiesModule,
    RecommendationsModule,
    JourneyModule,
    CvModule,
  ],
  controllers: [AiController],
  providers: [OrchestratorService, ConsistencyAgent, MissingInfoAgent],
  exports: [OrchestratorService, ConsistencyAgent, MissingInfoAgent],
})
export class OrchestratorModule {}
