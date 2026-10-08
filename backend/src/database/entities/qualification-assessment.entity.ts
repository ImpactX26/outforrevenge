import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QualificationStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('qualification_assessments')
export class QualificationAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, (u) => u.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({
    type: 'enum',
    enum: QualificationStatus,
  })
  status: QualificationStatus;

  @Column({ type: 'int' })
  score: number; // 0-100

  @Column({ type: 'jsonb' })
  satisfiedRequirements: Array<{
    id?: string;
    ruleCode: string;
    title: string;
    evidence: string;
  }>;

  @Column({ type: 'jsonb' })
  missingRequirements: Array<{
    id?: string;
    ruleCode: string;
    title: string;
    description: string;
    impact: string;
    remediationAction: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  warnings: string[];

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  aiExplanation: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  evaluatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
