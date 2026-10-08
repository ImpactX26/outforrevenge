import { Module, forwardRef } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { ConsistencyAgent } from './consistency.agent';
import { MissingInfoAgent } from './missing-info.agent';
import { QualificationModule } from '../../qualification/qualification.module';
import { OpportunitiesModule } from '../../opportunities/opportunities.module';
import { RecommendationsModule } from '../../recommendations/recommendations.module';
import { JourneyModule } from '../../journey/journey.module';
import { CvModule } from '../../cv/cv.module';
import { DocumentsModule } from '../../documents/documents.module';

@Module({
  imports: [
    QualificationModule,
    OpportunitiesModule,
    RecommendationsModule,
    JourneyModule,
    CvModule,
    forwardRef(() => DocumentsModule),
  ],
  controllers: [],
  providers: [OrchestratorService, ConsistencyAgent, MissingInfoAgent],
  exports: [OrchestratorService, ConsistencyAgent, MissingInfoAgent],
})
export class OrchestratorModule {}
