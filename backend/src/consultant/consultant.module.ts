import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantService } from './consultant.service';
import { ConsultantController } from './consultant.controller';
import {
  ConsultantReview,
  User,
  Notification,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultantReview,
      User,
      Notification,
      AuditLog,
    ]),
  ],
  controllers: [ConsultantController],
  providers: [ConsultantService],
  exports: [ConsultantService],
})
export class ConsultantModule {}
