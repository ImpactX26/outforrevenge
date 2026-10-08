import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SourceType, VerificationStatus } from '../../common/enums';
import { ApplicantProfile } from './applicant-profile.entity';

@Entity('employments')
export class Employment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => ApplicantProfile, (p) => p.employments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: ApplicantProfile;

  @Column()
  companyName: string;

  @Column()
  role: string;

  @Column({ type: 'text', nullable: true })
  responsibilities: string;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ default: false })
  isCurrent: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: SourceType,
    default: SourceType.APPLICANT_PROVIDED,
  })
  sourceType: SourceType;

  @Column({ nullable: true })
  sourceId: string;

  @Column({ type: 'float', default: 1.0 })
  confidence: number;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
