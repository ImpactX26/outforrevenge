import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import {
  NextStepRecommendation,
  EducaroService,
  RoutingRule,
  QualificationAssessment,
  ApplicantProfile,
  ConsultantReview,
  Notification,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NextStepRecommendation,
      EducaroService,
      RoutingRule,
      QualificationAssessment,
      ApplicantProfile,
      ConsultantReview,
      Notification,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
