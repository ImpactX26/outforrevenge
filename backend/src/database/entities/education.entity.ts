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

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => ApplicantProfile, (p) => p.educations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: ApplicantProfile;

  @Column()
  institution: string;

  @Column()
  degree: string;

  @Column()
  fieldOfStudy: string;

  @Column({ nullable: true })
  graduationDate: string;

  @Column({ nullable: true })
  gradeOrCgpa: string;

  @Column({ nullable: true })
  division: string;

  @Column({ type: 'text', nullable: true })
  marksDetails: string;

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
