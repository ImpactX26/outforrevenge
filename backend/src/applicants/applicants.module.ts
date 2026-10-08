import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantsService } from './applicants.service';
import { ApplicantsController } from './applicants.controller';
import {
  ApplicantProfile,
  User,
  Education,
  Employment,
  Skill,
  Language,
  Document,
  Video,
  QualificationAssessment,
  NextStepRecommendation,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantProfile,
      User,
      Education,
      Employment,
      Skill,
      Language,
      Document,
      Video,
      QualificationAssessment,
      NextStepRecommendation,
    ]),
  ],
  controllers: [ApplicantsController],
  providers: [ApplicantsService],
  exports: [ApplicantsService],
})
export class ApplicantsModule {}
