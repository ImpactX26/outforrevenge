import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('video_analyses')
export class VideoAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  videoId: string;

  @OneToOne(() => Video, (vid) => vid.analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video: Video;

  @Column({ type: 'text', nullable: true })
  backgroundSummary: string;

  @Column({ type: 'text', nullable: true })
  educationSummary: string;

  @Column({ type: 'text', nullable: true })
  experienceSummary: string;

  @Column({ type: 'text', nullable: true })
  motivationSummary: string;

  @Column({ type: 'text', nullable: true })
  careerGoals: string;

  @Column({ type: 'text', nullable: true })
  germanyMotivation: string;

  @Column({ type: 'simple-array', nullable: true })
  relevantSkills: string[];

  @Column({ type: 'jsonb', nullable: true })
  proposedUpdates: Record<string, any>;

  @Column({ type: 'float', default: 0.9 })
  confidence: number;

  @Column({ default: false })
  applicantApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
