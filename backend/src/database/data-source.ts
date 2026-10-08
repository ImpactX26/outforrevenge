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

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexora';
try {
  const u = new URL(dbUrl);
  u.searchParams.delete('channel_binding');
  dbUrl = u.toString();
} catch (e) {
  // ignore
}

const isRemoteOrSsl =
  process.env.DATABASE_SSL === 'true' ||
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('sslmode=require');

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
  ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : false,
  installExtensions: false,
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
