import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';
import { PdfGeneratorService } from './pdf-generator.service';
import {
  CV,
  ApplicantProfile,
  User,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CV,
      ApplicantProfile,
      User,
      AuditLog,
    ]),
  ],
  controllers: [CvController],
  providers: [CvService, PdfGeneratorService],
  exports: [CvService, PdfGeneratorService],
})
export class CvModule {}
