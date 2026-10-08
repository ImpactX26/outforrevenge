export type UserRole = 'APPLICANT' | 'CONSULTANT' | 'ADMIN';
export type GoalType = 'STUDY' | 'AUSBILDUNG' | 'EMPLOYMENT';
export type DocumentType =
  | 'CV'
  | 'DEGREE'
  | 'TRANSCRIPT'
  | 'CERTIFICATE'
  | 'EXPERIENCE_LETTER'
  | 'LANGUAGE_CERTIFICATE'
  | 'PROFESSIONAL_CERTIFICATE'
  | 'OTHER';
export type DocumentStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'CHECKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REQUIRES_REVIEW';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SourceType =
  | 'APPLICANT_PROVIDED'
  | 'DOCUMENT_EXTRACTED'
  | 'VIDEO_EXTRACTED'
  | 'AI_GENERATED'
  | 'CONSULTANT_VERIFIED';
export type QualificationStatus =
  | 'QUALIFIED'
  | 'PARTIALLY_QUALIFIED'
  | 'MORE_INFORMATION_REQUIRED'
  | 'NOT_CURRENTLY_QUALIFIED';
export type OpportunityType = 'STUDY' | 'AUSBILDUNG' | 'EMPLOYMENT';
export type RecommendationType = 'EDUCARO_SERVICE' | 'CONSULTANT_REFERRAL' | 'APPLICANT_ACTION';
export type JourneyStepStatus = 'LOCKED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REQUIRES_REVIEW';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface ApplicantProfile {
  id: string;
  userId: string;
  currentGoal: GoalType;
  phone?: string;
  location?: string;
  availability?: string;
  bio?: string;
  profileCompleteness: number;
  readinessScore: number;
  rawMotivation?: string;
  preferredPathways?: string[];
  educations?: Education[];
  employments?: Employment[];
  skills?: Skill[];
  languages?: Language[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate?: string;
  gradeOrCgpa?: string;
  sourceType: SourceType;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface Employment {
  id: string;
  companyName: string;
  role: string;
  responsibilities?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  sourceType: SourceType;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiencyLevel?: string;
  sourceType: SourceType;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface Language {
  id: string;
  language: string;
  proficiencyLevel: string;
  certificateType?: string;
  sourceType: SourceType;
  confidence: number;
  verificationStatus: VerificationStatus;
}

export interface DocumentItem {
  id: string;
  filename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
  extraction?: {
    rawText: string;
    extractedJson: Record<string, any>;
    confidence: number;
    warnings?: string[];
  };
}

export interface VideoItem {
  id: string;
  filename: string;
  status: DocumentStatus;
  durationSeconds?: number;
  transcript?: string;
  analysis?: {
    backgroundSummary?: string;
    motivationSummary?: string;
    germanyMotivation?: string;
    relevantSkills?: string[];
    confidence: number;
    applicantApproved: boolean;
  };
}

export interface QualificationAssessment {
  id: string;
  status: QualificationStatus;
  score: number;
  satisfiedRequirements: Array<{ ruleCode: string; title: string; evidence: string }>;
  missingRequirements: Array<{ ruleCode: string; title: string; remediationAction: string }>;
  aiExplanation?: string;
  evaluatedAt: string;
}

export interface OpportunityItem {
  id: string;
  title: string;
  type: OpportunityType;
  organization: string;
  location: string;
  description: string;
  requirements?: any;
  tags?: string[];
  deadline?: string;
  isDemoData: boolean;
}

export interface OpportunityMatch {
  id: string;
  opportunityId: string;
  opportunity: OpportunityItem;
  matchPercentage: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  reason: string;
  nextAction?: string;
}

export interface NextStepRecommendation {
  id: string;
  type: RecommendationType;
  targetId?: string;
  title: string;
  reason: string;
  confidence: number;
  status: string;
  supportingEvidence?: any;
}

export interface EducaroService {
  id: string;
  title: string;
  category: string;
  description: string;
  duration?: string;
  fee?: string;
  benefits?: string[];
  isDemoData: boolean;
}

export interface JourneyStep {
  id: string;
  stepOrder: number;
  code: string;
  title: string;
  description: string;
  status: JourneyStepStatus;
}

export interface Journey {
  id: string;
  currentState: string;
  progressPercentage: number;
  steps: JourneyStep[];
}

export interface CV {
  id: string;
  title: string;
  templateName: string;
  version: number;
  summary?: string;
  isSummaryAiGenerated: boolean;
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
  };
  educationData: any[];
  employmentData: any[];
  skillsData: any[];
  languagesData: any[];
  pdfUrl?: string;
}

export interface AgentExecution {
  id: string;
  agentType: string;
  status: string;
  confidence?: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  output?: any;
}
