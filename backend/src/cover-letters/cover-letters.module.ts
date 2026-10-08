import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoverLettersService } from './cover-letters.service';
import { CoverLettersController } from './cover-letters.controller';
import {
  CoverLetter,
  Opportunity,
  ApplicantProfile,
  User,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoverLetter,
      Opportunity,
      ApplicantProfile,
      User,
      AuditLog,
    ]),
  ],
  controllers: [CoverLettersController],
  providers: [CoverLettersService],
  exports: [CoverLettersService],
})
export class CoverLettersModule {}
