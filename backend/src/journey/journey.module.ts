import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyService } from './journey.service';
import { JourneyController } from './journey.controller';
import {
  Journey,
  JourneyStep,
  ApplicantProfile,
  Document,
  Video,
  QualificationAssessment,
  CV,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Journey,
      JourneyStep,
      ApplicantProfile,
      Document,
      Video,
      QualificationAssessment,
      CV,
    ]),
  ],
  controllers: [JourneyController],
  providers: [JourneyService],
  exports: [JourneyService],
})
export class JourneyModule {}
