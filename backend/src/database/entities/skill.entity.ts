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

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => ApplicantProfile, (p) => p.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: ApplicantProfile;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  proficiencyLevel: string;

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
