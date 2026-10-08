import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReviewStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('consultant_reviews')
export class ConsultantReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, (u) => u.applicantReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({ nullable: true })
  consultantId: string;

  @ManyToOne(() => User, (u) => u.assignedReviews, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consultantId' })
  consultant: User;

  @Column()
  issue: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, any>;

  @Column({ nullable: true })
  agentType: string;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ nullable: true })
  recommendedAction: string;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  consultantNotes: string;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
