import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('cvs')
export class CV {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, (u) => u.cvs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({ default: 'My German CV' })
  title: string;

  @Column({ default: 'Germany_EU_Clean' }) // Professional, Modern, Germany_EU_Clean
  templateName: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ default: false })
  isSummaryAiGenerated: boolean;

  @Column({ type: 'jsonb' })
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    birthDate?: string;
    nationality?: string;
    linkedIn?: string;
  };

  @Column({ type: 'jsonb' })
  educationData: Array<{
    institution: string;
    degree: string;
    field: string;
    period: string;
    grade?: string;
    provenance?: string;
  }>;

  @Column({ type: 'jsonb' })
  employmentData: Array<{
    company: string;
    role: string;
    period: string;
    responsibilities?: string;
    provenance?: string;
  }>;

  @Column({ type: 'jsonb' })
  skillsData: Array<{
    name: string;
    category?: string;
    level?: string;
  }>;

  @Column({ type: 'jsonb' })
  languagesData: Array<{
    language: string;
    level: string;
    certificate?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  customSections: Array<{
    title: string;
    content: string;
    isAiGenerated?: boolean;
  }>;

  @Column({ nullable: true })
  storageKey: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
