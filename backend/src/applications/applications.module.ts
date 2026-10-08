import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { JobApplicationAgent } from '../agents/job-application.agent';
import { ApplicationReadinessAgent } from '../agents/application-readiness.agent';

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    JobApplicationAgent,
    ApplicationReadinessAgent,
  ],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
