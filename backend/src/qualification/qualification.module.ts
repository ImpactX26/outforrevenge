import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualificationService } from './qualification.service';
import { QualificationController } from './qualification.controller';
import {
  QualificationRequirement,
  QualificationAssessment,
  ApplicantProfile,
  Document,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QualificationRequirement,
      QualificationAssessment,
      ApplicantProfile,
      Document,
    ]),
  ],
  controllers: [QualificationController],
  providers: [QualificationService],
  exports: [QualificationService],
})
export class QualificationModule {}
