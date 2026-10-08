import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './ai/ai.module';
import { DocumentsModule } from './documents/documents.module';
import { VideosModule } from './videos/videos.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { QualificationModule } from './qualification/qualification.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { JourneyModule } from './journey/journey.module';
import { CvModule } from './cv/cv.module';
import { CoverLettersModule } from './cover-letters/cover-letters.module';
import { InterviewsModule } from './interviews/interviews.module';
import { OrchestratorModule } from './agents/orchestrator/orchestrator.module';
import { ConsultantModule } from './consultant/consultant.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../../.env.local'),
        path.resolve(__dirname, '../../.env'),
        path.resolve(__dirname, '../.env'),
      ],
    }),
    PrismaModule,
    StorageModule,
    AiModule,
    AuthModule,
    ApplicantsModule,
    DocumentsModule,
    VideosModule,
    QualificationModule,
    OpportunitiesModule,
    RecommendationsModule,
    JourneyModule,
    CvModule,
    CoverLettersModule,
    InterviewsModule,
    OrchestratorModule,
    ConsultantModule,
    AdminModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
