import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GoalType } from '../../common/enums';
import { User } from './user.entity';

@Entity('interview_sessions')
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicantId: string;

  @ManyToOne(() => User, (u) => u.interviewSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  pathway: GoalType;

  @Column()
  targetRole: string; // e.g. "Software Engineer Ausbildung", "Data Science Master"

  @Column({ type: 'jsonb' })
  questions: Array<{
    id: string;
    question: string;
    category: string;
    tips: string;
  }>;

  @Column({ type: 'jsonb', default: [] })
  answers: Array<{
    questionId: string;
    answerText: string;
    submittedAt: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  feedback: Array<{
    questionId: string;
    relevance: number; // 0-100
    clarity: number; // 0-100
    structure: number; // 0-100
    missingPoints: string[];
    improvements: string[];
    summary: string;
  }>;

  @Column({ type: 'int', nullable: true })
  overallScore: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
