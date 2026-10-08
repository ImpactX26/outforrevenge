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

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => ApplicantProfile, (p) => p.languages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: ApplicantProfile;

  @Column()
  language: string;

  @Column()
  proficiencyLevel: string; // e.g. A1, A2, B1, B2, C1, C2, Native

  @Column({ nullable: true })
  certificateType: string; // e.g. Goethe, TestDaF, TELC, IELTS, TOEFL

  @Column({ nullable: true })
  certificateNumber: string;

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
