import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JourneyStepStatus } from '../../common/enums';
import { Journey } from './journey.entity';

@Entity('journey_steps')
export class JourneyStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journeyId: string;

  @ManyToOne(() => Journey, (j) => j.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journeyId' })
  journey: Journey;

  @Column({ type: 'int' })
  stepOrder: number;

  @Column()
  code: string; // e.g. "COMPLETE_PROFILE", "UPLOAD_DOCUMENTS", "QUALIFICATION_ASSESSMENT", etc.

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: JourneyStepStatus,
    default: JourneyStepStatus.PENDING,
  })
  status: JourneyStepStatus;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  actionPayload: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
