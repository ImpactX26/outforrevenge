import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  User,
  RefreshToken,
  ApplicantProfile,
  Education,
  Employment,
  Skill,
  Language,
  Document,
  DocumentExtraction,
  Video,
  VideoAnalysis,
  QualificationRequirement,
  QualificationAssessment,
  Opportunity,
  OpportunityMatch,
  EducaroService,
  RoutingRule,
  NextStepRecommendation,
  Journey,
  JourneyStep,
  CV,
  CoverLetter,
  InterviewSession,
  Notification,
  AgentExecution,
  ConsultantReview,
  AuditLog,
} from './entities';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexora';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: dbUrl,
  entities: [
    User,
    RefreshToken,
    ApplicantProfile,
    Education,
    Employment,
    Skill,
    Language,
    Document,
    DocumentExtraction,
    Video,
    VideoAnalysis,
    QualificationRequirement,
    QualificationAssessment,
    Opportunity,
    OpportunityMatch,
    EducaroService,
    RoutingRule,
    NextStepRecommendation,
    Journey,
    JourneyStep,
    CV,
    CoverLetter,
    InterviewSession,
    Notification,
    AgentExecution,
    ConsultantReview,
    AuditLog,
  ],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: process.env.NODE_ENV !== 'production', // Synchronize schema in dev or run migrations
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
