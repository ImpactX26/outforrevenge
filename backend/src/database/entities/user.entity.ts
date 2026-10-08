import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums';
import { ApplicantProfile } from './applicant-profile.entity';
import { Document } from './document.entity';
import { Video } from './video.entity';
import { QualificationAssessment } from './qualification-assessment.entity';
import { OpportunityMatch } from './opportunity-match.entity';
import { NextStepRecommendation } from './next-step-recommendation.entity';
import { Journey } from './journey.entity';
import { CV } from './cv.entity';
import { CoverLetter } from './cover-letter.entity';
import { InterviewSession } from './interview-session.entity';
import { Notification } from './notification.entity';
import { AgentExecution } from './agent-execution.entity';
import { ConsultantReview } from './consultant-review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.APPLICANT,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => ApplicantProfile, (profile) => profile.user, { cascade: true })
  profile: ApplicantProfile;

  @OneToMany(() => Document, (doc) => doc.applicant)
  documents: Document[];

  @OneToMany(() => Video, (vid) => vid.applicant)
  videos: Video[];

  @OneToMany(() => QualificationAssessment, (qa) => qa.applicant)
  assessments: QualificationAssessment[];

  @OneToMany(() => OpportunityMatch, (om) => om.applicant)
  opportunityMatches: OpportunityMatch[];

  @OneToMany(() => NextStepRecommendation, (rec) => rec.applicant)
  recommendations: NextStepRecommendation[];

  @OneToOne(() => Journey, (journey) => journey.applicant)
  journey: Journey;

  @OneToMany(() => CV, (cv) => cv.applicant)
  cvs: CV[];

  @OneToMany(() => CoverLetter, (cl) => cl.applicant)
  coverLetters: CoverLetter[];

  @OneToMany(() => InterviewSession, (session) => session.applicant)
  interviewSessions: InterviewSession[];

  @OneToMany(() => Notification, (notif) => notif.user)
  notifications: Notification[];

  @OneToMany(() => AgentExecution, (exec) => exec.applicant)
  agentExecutions: AgentExecution[];

  @OneToMany(() => ConsultantReview, (rev) => rev.applicant)
  applicantReviews: ConsultantReview[];

  @OneToMany(() => ConsultantReview, (rev) => rev.consultant)
  assignedReviews: ConsultantReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
