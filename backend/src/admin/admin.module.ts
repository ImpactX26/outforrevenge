import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import {
  User,
  Opportunity,
  QualificationRequirement,
  EducaroService,
  RoutingRule,
  AgentExecution,
  AuditLog,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Opportunity,
      QualificationRequirement,
      EducaroService,
      RoutingRule,
      AgentExecution,
      AuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
