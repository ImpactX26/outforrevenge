import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AgentExecutionStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('agent_executions')
export class AgentExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agentType: string; // ORCHESTRATOR, PROFILE, DOCUMENT, CONSISTENCY, VIDEO, MISSING_INFO, QUALIFICATION, OPPORTUNITY, ROUTING, JOURNEY, CV, COVER_LETTER, INTERVIEW

  @Column({ nullable: true })
  applicantId: string;

  @ManyToOne(() => User, (u) => u.agentExecutions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({
    type: 'enum',
    enum: AgentExecutionStatus,
    default: AgentExecutionStatus.PENDING,
  })
  status: AgentExecutionStatus;

  @Column({ nullable: true })
  inputReference: string;

  @Column({ type: 'jsonb', nullable: true })
  output: Record<string, any>;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ nullable: true })
  parentExecutionId: string;

  @Column({ default: 'SYSTEM_EVENT' })
  triggeredBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
